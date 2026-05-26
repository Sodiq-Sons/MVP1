import { getToken } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { db, getFirebaseMessaging } from "@/lib/firebase";

export async function registerFCMToken(uid) {
    if (!uid || typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "denied") return;

    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const messaging = await getFirebaseMessaging();
        if (!messaging) return;

        const params = new URLSearchParams({
            apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? "",
            authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? "",
            projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? "",
            storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? "",
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
            appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? "",
        });

        const registration = await navigator.serviceWorker.register(
            `/firebase-messaging-sw.js?${params}`,
            { scope: "/firebase-cloud-messaging-push-scope" }
        );

        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (token) {
            await updateDoc(doc(db, "users", uid), { fcmToken: token });
        }
    } catch {
        // Permission denied or browser doesn't support — silently ignore
    }
}
