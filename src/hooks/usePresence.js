// hooks/usePresence.js
// Presence WRITING is handled by Navbar (runs on all pages).
// This hook only READS the live count for display.
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const CUTOFF_MS = 3 * 60 * 1000;

export function usePresence() {
    const [onlineCount, setOnlineCount] = useState(0);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "presence"), (snap) => {
            const now = Date.now();
            const count = snap.docs.filter((d) => {
                const ts = d.data().lastSeen?.toMillis?.();
                return ts && now - ts < CUTOFF_MS;
            }).length;
            setOnlineCount(count);
        }, () => setOnlineCount(0));

        return () => unsub();
    }, []);

    return onlineCount;
}
