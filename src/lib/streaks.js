import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

function todayStr() {
    return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

/**
 * Call once per session on auth state change.
 * Updates streak, lastActivityDate, maxStreak in the user's Firestore doc.
 * Returns the new streak count (or null if user doc doesn't exist).
 */
export async function updateStreak(uid) {
    if (!uid) return null;
    try {
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;

        const data = snap.data();
        const today = todayStr();
        const last = data.lastActivityDate || null;
        const currentStreak = data.streak || 0;
        const maxStreak = data.maxStreak || 0;

        if (last === today) {
            // Already logged in today — no change
            return currentStreak;
        }

        let newStreak;
        if (last === yesterdayStr()) {
            newStreak = currentStreak + 1;
        } else {
            newStreak = 1;
        }

        await updateDoc(ref, {
            streak: newStreak,
            lastActivityDate: today,
            lastActivityTimestamp: serverTimestamp(),
            maxStreak: Math.max(newStreak, maxStreak),
        });

        return newStreak;
    } catch (err) {
        console.error("updateStreak:", err);
        return null;
    }
}
