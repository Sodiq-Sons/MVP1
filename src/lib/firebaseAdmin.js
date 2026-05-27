import admin from "firebase-admin";

function getAdmin() {
    if (!admin.apps.length) {
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
        if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_B64 is not set");
        const serviceAccount = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    return admin;
}

export function getAdminDb()        { return getAdmin().firestore(); }
export function getAdminMessaging() { return getAdmin().messaging(); }
export function getAdminAuth()      { return getAdmin().auth(); }
export default admin;
