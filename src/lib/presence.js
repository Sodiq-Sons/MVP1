// lib/presence.js
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    setDoc,
    serverTimestamp,
    getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

// Update online count periodically
export async function updateOnlineCount() {
    try {
        const q = query(
            collection(db, "presence"),
            where(
                "lastSeen",
                ">",
                new Date(Date.now() - 2 * 60 * 1000), // Online if seen in last 2 mins
            ),
        );

        const snapshot = await getDocs(q);
        const count = snapshot.size;

        await setDoc(doc(db, "stats", "online"), {
            count,
            updatedAt: serverTimestamp(),
        });

        return count;
    } catch (error) {
        console.error("Error updating online count:", error);
        return 0;
    }
}

// Subscribe to online count
export function subscribeToOnlineCount(callback) {
    return onSnapshot(doc(db, "stats", "online"), (snap) => {
        const data = snap.data();
        callback(data?.count || 0);
    });
}
