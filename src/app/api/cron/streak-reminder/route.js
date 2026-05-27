import { getAdminDb, getAdminMessaging } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

export async function GET(request) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = getAdminDb();
    const adminMessaging = getAdminMessaging();
    const today = todayStr();

    // Fetch users with an active streak
    const snap = await adminDb.collection("users").where("streak", ">", 0).get();

    const toNotify = snap.docs
        .map((d) => ({ uid: d.id, ...d.data() }))
        .filter((u) => u.fcmToken && u.lastActivityDate !== today);

    if (toNotify.length === 0) {
        return NextResponse.json({ sent: 0, total: 0 });
    }

    // FCM sendEach limit is 500
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

        // Remove stale tokens
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

    return NextResponse.json({ sent, total: toNotify.length });
}
