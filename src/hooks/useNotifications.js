import { useState, useEffect, useCallback } from "react";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    getDocs,
    writeBatch,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ✅ Safely parse meta - handles both legacy object meta and new string meta
function parseMeta(meta) {
    if (!meta) return null;
    if (typeof meta === "string") {
        try {
            return JSON.parse(meta);
        } catch {
            return meta;
        }
    }
    return meta;
}

// ✅ Safely render meta as a display string
export function formatMetaDisplay(meta) {
    if (!meta) return null;
    const parsed =
        typeof meta === "string"
            ? (() => {
                  try {
                      return JSON.parse(meta);
                  } catch {
                      return meta;
                  }
              })()
            : meta;

    if (typeof parsed === "string") return parsed;
    if (parsed?.type === "level_up")
        return `🎉 Level up! You reached Level ${parsed.newLevel}: ${parsed.newLevelName}`;
    if (parsed?.type === "badge_earned")
        return `🏅 Badge earned: ${parsed.badge?.label || "New Badge"}`;
    return null; // don't render unknown object shapes
}

export function useNotifications(userId) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        setLoading(true);

        const q = query(
            collection(db, "notifications"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const notifs = snapshot.docs.map((d) => {
                    const data = d.data();
                    return {
                        id: d.id,
                        ...data,
                        // ✅ Normalize all fields to safe primitives
                        actor:
                            typeof data.actorName === "string"
                                ? data.actorName
                                : "Someone",
                        message:
                            typeof data.message === "string"
                                ? data.message
                                : "",
                        issue:
                            typeof data.issueTitle === "string"
                                ? data.issueTitle
                                : "",
                        commentPreview:
                            typeof data.commentPreview === "string"
                                ? data.commentPreview
                                : null,
                        meta: data.meta ?? null, // keep as-is; formatMetaDisplay handles it
                    };
                });
                setNotifications(notifs);
                setUnreadCount(notifs.filter((n) => !n.read).length);
                setLoading(false);
            },
            (error) => {
                console.error("Error in notifications subscription:", error);
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, [userId]);

    const markAsRead = useCallback(async (notificationId) => {
        try {
            await updateDoc(doc(db, "notifications", notificationId), {
                read: true,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        if (!userId) return;
        try {
            const q = query(
                collection(db, "notifications"),
                where("userId", "==", userId),
                where("read", "==", false),
            );
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            snapshot.docs.forEach((d) => {
                batch.update(d.ref, {
                    read: true,
                    updatedAt: serverTimestamp(),
                });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    }, [userId]);

    const getNotificationsByType = useCallback(
        (type) => notifications.filter((n) => n.type === type),
        [notifications],
    );

    const getUnreadNotifications = useCallback(
        () => notifications.filter((n) => !n.read),
        [notifications],
    );

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        getNotificationsByType,
        getUnreadNotifications,
    };
}
