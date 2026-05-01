// hooks/usePresence.ts
import { useEffect, useState } from "react";
import {
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const PRESENCE_TIMEOUT = 2 * 60 * 1000; // 2 minutes

export function usePresence() {
    const [onlineCount, setOnlineCount] = useState(0);

    useEffect(() => {
        let unsubscribeAuth;
        let intervalId;
        let presenceRef;

        const setupPresence = async (userId) => {
            // Reference to this user's presence
            presenceRef = doc(db, "presence", userId);

            // Set online status
            await setDoc(presenceRef, {
                online: true,
                lastSeen: serverTimestamp(),
                uid: userId,
            });

            // Heartbeat to keep online status fresh
            intervalId = setInterval(async () => {
                await setDoc(
                    presenceRef,
                    {
                        online: true,
                        lastSeen: serverTimestamp(),
                        uid: userId,
                    },
                    { merge: true },
                );
            }, 30000); // Update every 30 seconds

            // Cleanup on disconnect (this works best with onDisconnect in Realtime DB,
            // but for Firestore we use window events)
            const handleBeforeUnload = () => {
                deleteDoc(presenceRef);
            };
            window.addEventListener("beforeunload", handleBeforeUnload);

            return () => {
                window.removeEventListener("beforeunload", handleBeforeUnload);
            };
        };

        unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setupPresence(user.uid);
            }
        });

        // Subscribe to online count
        const unsubscribeSnapshot = onSnapshot(
            doc(db, "stats", "online"),
            (snap) => {
                setOnlineCount(snap.data()?.count || 0);
            },
        );

        return () => {
            unsubscribeAuth?.();
            unsubscribeSnapshot?.();
            clearInterval(intervalId);
            if (presenceRef) deleteDoc(presenceRef).catch(() => {});
        };
    }, []);

    return onlineCount;
}
