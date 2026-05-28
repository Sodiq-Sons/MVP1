import { getAdminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

const POINTS_CONFIG = {
    UPVOTE_ISSUE:    1,
    VOTE_ON_ISSUE:   2,
    RECEIVE_UPVOTE:  1,
    RECEIVE_VOTE:    2,
    COMMENT_ON_ISSUE: 3,
    RECEIVE_COMMENT: 3,
    REPLY_TO_COMMENT: 2,
    RECEIVE_REPLY:   1,
    LIKE_COMMENT:    1,
    RECEIVE_LIKE:    1,
    CREATE_ISSUE:    10,
    ISSUE_RESOLVED:  10,
    ISSUE_TRENDING:  5,
    ISSUE_VIRAL:     7,
};

const LEVELS = [
    { level: 1, name: "New Voice",        minPoints: 0 },
    { level: 2, name: "Active Camper",    minPoints: 100 },
    { level: 3, name: "Camp Voice",       minPoints: 300 },
    { level: 4, name: "Local Leader",     minPoints: 600 },
    { level: 5, name: "Change Maker",     minPoints: 1000 },
    { level: 6, name: "Camp Champion",    minPoints: 1500 },
    { level: 7, name: "City Influencer",  minPoints: 2500 },
    { level: 8, name: "State Ambassador", minPoints: 4000 },
    { level: 9, name: "National Voice",   minPoints: 6000 },
    { level: 10, name: "Camp Legend",     minPoints: 9000 },
];

const STATS_MAP = {
    UPVOTE_ISSUE:     { upvotesGiven:     1 },
    VOTE_ON_ISSUE:    { votesCast:        1 },
    RECEIVE_UPVOTE:   { upvotesReceived:  1 },
    RECEIVE_VOTE:     { votesReceived:    1 },
    COMMENT_ON_ISSUE: { commentsPosted:   1 },
    RECEIVE_COMMENT:  { commentsReceived: 1 },
    REPLY_TO_COMMENT: { repliesPosted:    1 },
    RECEIVE_REPLY:    { repliesReceived:  1 },
    LIKE_COMMENT:     { likesGiven:       1 },
    RECEIVE_LIKE:     { likesReceived:    1 },
};

function getLevelForPoints(pts) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (pts >= LEVELS[i].minPoints) return LEVELS[i];
    }
    return LEVELS[0];
}

export async function awardPointsAdmin(userId, action, metadata = {}) {
    if (!userId || !POINTS_CONFIG[action]) return;
    const adminDb = getAdminDb();
    const points = POINTS_CONFIG[action];

    try {
        const userRef = adminDb.collection("users").doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) return;

        const current = userSnap.data().impactScore || 0;
        const next = current + points;
        const oldLevel = getLevelForPoints(current);
        const newLevel = getLevelForPoints(next);
        const leveledUp = newLevel.level > oldLevel.level;

        await userRef.update({
            impactScore: FieldValue.increment(points),
            ...(leveledUp && { level: newLevel.level, levelName: newLevel.name }),
            updatedAt: FieldValue.serverTimestamp(),
        });

        // Stats subcollection
        const statFields = STATS_MAP[action];
        if (statFields) {
            const updates = {};
            for (const [k, v] of Object.entries(statFields)) {
                updates[k] = FieldValue.increment(v);
            }
            await userRef.collection("stats").doc("overview").set(updates, { merge: true });
        }

        // Level-up notification
        if (leveledUp) {
            await adminDb.collection("notifications").add({
                type: "milestone",
                userId,
                recipientId: userId,
                actorId: "system",
                actorName: "Camp Voice",
                issueId: metadata.issueId || null,
                issueTitle: "Level Up! 🎉",
                meta: JSON.stringify({
                    type: "level_up",
                    oldLevel: oldLevel.level,
                    newLevel: newLevel.level,
                    newLevelName: newLevel.name,
                    points: next,
                }),
                read: false,
                createdAt: FieldValue.serverTimestamp(),
            });
        }
    } catch (err) {
        console.error(`awardPointsAdmin(${userId}, ${action}) failed:`, err);
    }
}
