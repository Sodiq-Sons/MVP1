import { getAdminDb, getAdminMessaging } from "@/lib/firebaseAdmin";

/**
 * Send an FCM push notification to a single user.
 * Silently no-ops if the user has no token or the token is stale.
 */
export async function sendPushAdmin(recipientId, { title, body, url = "/" }) {
    if (!recipientId) return;
    try {
        const adminDb = getAdminDb();
        const userSnap = await adminDb.collection("users").doc(recipientId).get();
        if (!userSnap.exists) return;
        const fcmToken = userSnap.data().fcmToken;
        if (!fcmToken) return;

        await getAdminMessaging().send({
            token: fcmToken,
            notification: { title, body },
            data: { url },
            webpush: {
                fcmOptions: { link: url },
                notification: {
                    icon:     "/icons/icon-192x192.webp",
                    badge:    "/icons/icon-72x72.webp",
                    tag:      "camp-connect",
                    renotify: "true",
                },
            },
        });
    } catch (err) {
        if (
            err?.errorInfo?.code === "messaging/registration-token-not-registered" ||
            err?.code === "messaging/registration-token-not-registered"
        ) {
            // Stale token — clear it so we stop trying
            getAdminDb()
                .collection("users")
                .doc(recipientId)
                .update({ fcmToken: null })
                .catch(() => {});
        }
    }
}
