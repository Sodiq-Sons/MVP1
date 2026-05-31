import { getAdminDb, getAdminMessaging } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function todayStr() {
    return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

export async function GET(request) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = getAdminDb();
    const adminMessaging = getAdminMessaging();
    const today = todayStr();
    const yesterday = yesterdayStr();

    // ── Step 1: Reset streaks for users who missed yesterday ──────────────────
    // A streak is alive only if lastActivityDate is today OR yesterday.
    // Anyone with lastActivityDate < yesterday has broken their streak.
    const allStreakSnap = await adminDb
        .collection("users")
        .where("streak", ">", 0)
        .get();

    const resets = [];
    const toNotify = [];

    for (const d of allStreakSnap.docs) {
        const u = { uid: d.id, ref: d.ref, ...d.data() };
        const last = u.lastActivityDate ?? null;

        if (!last || (last !== today && last !== yesterday)) {
            // Streak is dead — reset it
            resets.push(d.ref);
        } else if (last !== today && u.fcmToken) {
            // Active streak, hasn't logged in yet today — send reminder
            toNotify.push(u);
        }
    }

    // Commit resets in batches of 500
    for (let i = 0; i < resets.length; i += 500) {
        const batch = adminDb.batch();
        resets.slice(i, i + 500).forEach((ref) => batch.update(ref, { streak: 0 }));
        await batch.commit();
    }

    // ── Step 2: Send streak-reminder push to at-risk users ────────────────────
    let sent = 0;
    for (let i = 0; i < toNotify.length; i += 500) {
        const chunk = toNotify.slice(i, i + 500);
        const messages = chunk.map((u) => ({
            token: u.fcmToken,
            notification: {
                title: "🔥 Keep your streak alive!",
                body: `You're on a ${u.streak}-day streak. Log in today before midnight!`,
            },
            data: { type: "streak_reminder", url: "/" },
            webpush: {
                fcmOptions: { link: "/" },
                notification: {
                    icon:     "/icons/icon-192x192.webp",
                    badge:    "/icons/icon-72x72.webp",
                    tag:      "streak-reminder",
                    renotify: "true",
                },
            },
        }));

        const result = await adminMessaging.sendEach(messages);
        sent += result.successCount;

        // Clear stale tokens
        result.responses.forEach((resp, idx) => {
            if (resp.error?.code === "messaging/registration-token-not-registered") {
                adminDb
                    .collection("users")
                    .doc(chunk[idx].uid)
                    .update({ fcmToken: null })
                    .catch(() => {});
            }
        });
    }

    return NextResponse.json({
        reset: resets.length,
        reminded: toNotify.length,
        sent,
    });
}
