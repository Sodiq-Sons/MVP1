import admin from "firebase-admin";

if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_B64 ?? "";
    const serviceAccount = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export const adminDb        = admin.firestore();
export const adminMessaging = admin.messaging();
export default admin;
