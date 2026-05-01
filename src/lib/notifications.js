import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    getDocs,
    writeBatch,
    deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const NOTIFICATION_TYPES = {
    UPVOTE: "upvote",
    COMMENT: "comment",
    REPLY: "reply",
    LIKE_COMMENT: "like_comment",
    VOTE: "vote",
    MILESTONE: "milestone",
    RESOLVED: "resolved",
    MENTION: "mention",
    ISSUE_CREATED: "issue_created",
    REFERRAL_SIGNUP: "referral_signup",
    REFERRAL_COMPLETE: "referral_complete",
};

function getInitials(name) {
    if (!name) return "U";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function getUserColor(uid) {
    const colors = [
        "bg-red-500",
        "bg-blue-500",
        "bg-green-500",
        "bg-purple-500",
        "bg-pink-500",
        "bg-indigo-500",
        "bg-orange-500",
        "bg-teal-500",
        "bg-cyan-500",
        "bg-lime-500",
    ];
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
        hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

// Serialize meta to string for consistent storage
function serializeMeta(meta) {
    if (!meta) return null;
    if (typeof meta === "string") return meta;
    if (typeof meta === "object" && !meta?.toDate) return JSON.stringify(meta);
    return String(meta);
}

const MESSAGES = {
    upvote: "upvoted your post",
    comment: "commented on your post",
    reply: "replied to your comment",
    like_comment: "liked your comment",
    vote: "voted on your poll",
    milestone: "your post reached a milestone",
    resolved: "marked your post as resolved",
    mention: "mentioned you",
    issue_created: "your post is now live",
    referral_signup: "joined through your referral link",
    referral_complete: "completed their first post - you earned 15 points!",
};

export async function createNotification({
    type,
    recipientId,
    actorId,
    actorName,
    actorPhotoURL = null,
    issueId,
    issueTitle,
    commentId = null,
    commentPreview = null,
    meta = null,
}) {
    if (recipientId === actorId && actorId !== "system") return null;

    try {
        const docRef = await addDoc(collection(db, "notifications"), {
            type,
            userId: recipientId,
            actorId,
            actorName: actorName || "Someone",
            actorPhotoURL,
            actorInitial: getInitials(actorName),
            actorColor:
                actorId === "system" ? "bg-orange-500" : getUserColor(actorId),
            issueId,
            issueTitle: issueTitle || "Untitled",
            commentId,
            commentPreview: commentPreview?.substring(0, 100) || null,
            message: MESSAGES[type] || "interacted with your post",
            meta: serializeMeta(meta),
            read: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating notification:", error);
        return null;
    }
}

export async function createNotificationsBatch(notifications) {
    const batch = writeBatch(db);
    const createdIds = [];

    for (const notif of notifications) {
        if (notif.recipientId === notif.actorId && notif.actorId !== "system")
            continue;

        const docRef = doc(collection(db, "notifications"));
        batch.set(docRef, {
            type: notif.type,
            userId: notif.recipientId,
            actorId: notif.actorId,
            actorName: notif.actorName || "Someone",
            actorPhotoURL: notif.actorPhotoURL || null,
            actorInitial: getInitials(notif.actorName),
            actorColor:
                notif.actorId === "system"
                    ? "bg-orange-500"
                    : getUserColor(notif.actorId),
            issueId: notif.issueId,
            issueTitle: notif.issueTitle || "Untitled",
            commentId: notif.commentId || null,
            commentPreview: notif.commentPreview?.substring(0, 100) || null,
            message: MESSAGES[notif.type] || "interacted with your post",
            meta: serializeMeta(notif.meta),
            read: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        createdIds.push(docRef.id);
    }

    await batch.commit();
    return createdIds;
}

export async function markNotificationAsRead(notificationId) {
    try {
        await updateDoc(doc(db, "notifications", notificationId), {
            read: true,
            updatedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return false;
    }
}

export async function markAllNotificationsAsRead(userId) {
    try {
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", userId),
            where("read", "==", false),
        );
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach((d) => {
            batch.update(d.ref, { read: true, updatedAt: serverTimestamp() });
        });
        await batch.commit();
        return snapshot.docs.length;
    } catch (error) {
        console.error("Error marking all as read:", error);
        return 0;
    }
}

export async function deleteNotification(notificationId) {
    try {
        await deleteDoc(doc(db, "notifications", notificationId));
        return true;
    } catch (error) {
        console.error("Error deleting notification:", error);
        return false;
    }
}

export function subscribeToNotifications(userId, callback) {
    const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
    );
    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(notifications);
    });
}

export function subscribeToUnreadCount(userId, callback) {
    const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("read", "==", false),
    );
    return onSnapshot(q, (snapshot) => callback(snapshot.size));
}

export async function getUnreadNotificationCount(userId) {
    try {
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", userId),
            where("read", "==", false),
        );
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error("Error getting unread count:", error);
        return 0;
    }
}
