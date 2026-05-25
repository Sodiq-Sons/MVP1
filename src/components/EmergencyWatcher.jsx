"use client";

import { useEffect, useRef } from "react";
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const STORAGE_KEY = "camp_notified_emergencies";
const CUTOFF_MS = 24 * 60 * 60 * 1000; // 24 hours

function getNotifiedSet() {
    try {
        return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {
        return new Set();
    }
}

function markNotified(id) {
    try {
        const set = getNotifiedSet();
        set.add(id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
    } catch {}
}

export default function EmergencyWatcher() {
    const permRef = useRef(
        typeof Notification !== "undefined" ? Notification.permission : "denied"
    );

    // Request permission proactively once
    useEffect(() => {
        if (typeof Notification === "undefined") return;
        if (Notification.permission === "default") {
            Notification.requestPermission().then((p) => {
                permRef.current = p;
            });
        } else {
            permRef.current = Notification.permission;
        }
    }, []);

    // Listen for emergency posts and fire browser notifications
    useEffect(() => {
        const q = query(
            collection(db, "issues"),
            where("type", "==", "emergency"),
            orderBy("createdAt", "desc"),
            limit(10)
        );

        const unsub = onSnapshot(q, (snap) => {
            const notified = getNotifiedSet();
            const now = Date.now();

            snap.docs.forEach((docSnap) => {
                const id = docSnap.id;
                if (notified.has(id)) return;

                const d = docSnap.data();
                const createdMs = d.createdAt?.toMillis?.() ?? 0;
                if (now - createdMs > CUTOFF_MS) return;

                markNotified(id);

                if (
                    typeof Notification !== "undefined" &&
                    permRef.current === "granted"
                ) {
                    try {
                        new Notification("🚨 Camp Alert", {
                            body: d.title || "Emergency notice from Camp Command",
                            icon: "/icons/icon-192x192.png",
                            badge: "/icons/icon-192x192.png",
                            tag: `emergency-${id}`,
                            requireInteraction: true,
                        });
                    } catch {}
                }
            });
        }, () => {});

        return () => unsub();
    }, []);

    return null;
}
