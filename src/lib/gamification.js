import {
    doc,
    getDoc,
    updateDoc,
    setDoc,
    increment,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotification, NOTIFICATION_TYPES } from "./notifications";

// ─── Points Configuration
export const POINTS_CONFIG = {
    // Action points
    CREATE_ISSUE: 10,
    RECEIVE_UPVOTE: 1,
    RECEIVE_VOTE: 2,
    RECEIVE_COMMENT: 3,
    RECEIVE_REPLY: 1,
    RECEIVE_LIKE: 1,

    // Engagement points
    UPVOTE_ISSUE: 1,
    VOTE_ON_ISSUE: 2,
    COMMENT_ON_ISSUE: 3,
    REPLY_TO_COMMENT: 2,
    LIKE_COMMENT: 1,

    // Milestones
    ISSUE_RESOLVED: 10,
    ISSUE_TRENDING: 5,
    ISSUE_VIRAL: 7,

    // Referral points
    REFERRAL_BONUS: 5, // Points for invitee
    REFERRAL_COMPLETION: 15, // Points for inviter
};

// ─── Levels Configuration
export const LEVELS = [
    { level: 1, name: "New Voice", minPoints: 0, maxPoints: 100 },
    { level: 2, name: "Active Camper", minPoints: 100, maxPoints: 300 },
    { level: 3, name: "Camp Voice", minPoints: 300, maxPoints: 600 },
    { level: 4, name: "Local Leader", minPoints: 600, maxPoints: 1000 },
    { level: 5, name: "Change Maker", minPoints: 1000, maxPoints: 1500 },
    { level: 6, name: "Camp Champion", minPoints: 1500, maxPoints: 2500 },
    { level: 7, name: "City Influencer", minPoints: 2500, maxPoints: 4000 },
    { level: 8, name: "State Ambassador", minPoints: 4000, maxPoints: 6000 },
    { level: 9, name: "National Voice", minPoints: 6000, maxPoints: 10000 },
    {
        level: 10,
        name: "Legendary Camper",
        minPoints: 10000,
        maxPoints: Infinity,
    },
];

// ─── Badges Configuration
export const BADGES = {
    FIRST_ISSUE: {
        id: "first_issue",
        emoji: "📝",
        label: "First Steps",
        description: "Dropped first post",
        condition: (stats) => stats.issuesCount >= 1,
    },
    PRO_REPORTER: {
        id: "pro_reporter",
        emoji: "📋",
        label: "Pro Reporter",
        description: "Dropped 5 posts",
        condition: (stats) => stats.issuesCount >= 5,
    },
    COMMUNITY_WATCH: {
        id: "community_watch",
        emoji: "👁️",
        label: "Community Watch",
        description: "Dropped 10 posts",
        condition: (stats) => stats.issuesCount >= 10,
    },
    LOCAL_HERO: {
        id: "local_hero",
        emoji: "🏆",
        label: "Local Hero",
        description: "Dropped 25 posts",
        condition: (stats) => stats.issuesCount >= 25,
    },
    VOICE_HEARD: {
        id: "voice_heard",
        emoji: "📢",
        label: "Voice Heard",
        description: "Received 10 upvotes total",
        condition: (stats) => stats.upvotesReceived >= 10,
    },
    CROWD_FAVORITE: {
        id: "crowd_favorite",
        emoji: "⭐",
        label: "Crowd Favorite",
        description: "Received 50 upvotes total",
        condition: (stats) => stats.upvotesReceived >= 50,
    },
    VIRAL_SENSATION: {
        id: "viral_sensation",
        emoji: "🔥",
        label: "Viral Sensation",
        description: "Received 100 upvotes total",
        condition: (stats) => stats.upvotesReceived >= 100,
    },
    CONVERSATION_STARTER: {
        id: "conversation_starter",
        emoji: "💬",
        label: "Conversation Starter",
        description: "Received 5 comments on your post",
        condition: (stats) => stats.commentsReceived >= 5,
    },
    DISCUSSION_LEADER: {
        id: "discussion_leader",
        emoji: "🗣️",
        label: "Discussion Leader",
        description: "Received 20 comments on your post",
        condition: (stats) => stats.commentsReceived >= 20,
    },
    POLL_MASTER: {
        id: "poll_master",
        emoji: "📊",
        label: "Poll Master",
        description: "Created an issue with 10+ votes",
        condition: (stats) => stats.maxVotesOnIssue >= 10,
    },
    POPULAR_VOTE: {
        id: "popular_vote",
        emoji: "🗳️",
        label: "Popular Vote",
        description: "Created an issue with 50+ votes",
        condition: (stats) => stats.maxVotesOnIssue >= 50,
    },
    ENGAGED_CITIZEN: {
        id: "engaged_citizen",
        emoji: "🤝",
        label: "Engaged Citizen",
        description: "Upvoted 10 posts",
        condition: (stats) => stats.upvotesGiven >= 10,
    },
    ACTIVE_VOTER: {
        id: "active_voter",
        emoji: "✅",
        label: "Active Voter",
        description: "Voted on 10 polls",
        condition: (stats) => stats.votesCast >= 10,
    },
    HELPFUL_COMMENTER: {
        id: "helpful_commenter",
        emoji: "💡",
        label: "Helpful Commenter",
        description: "Posted 10 comments",
        condition: (stats) => stats.commentsPosted >= 10,
    },
    COMMUNITY_BUILDER: {
        id: "community_builder",
        emoji: "🌱",
        label: "Community Builder",
        description: "Invited 1 friend who completed signup",
        condition: (stats) => stats.completedReferrals >= 1,
    },
    GROWTH_HACKER: {
        id: "growth_hacker",
        emoji: "📈",
        label: "Growth Hacker",
        description: "Invited 5 friends who completed signup",
        condition: (stats) => stats.completedReferrals >= 5,
    },
    RESOLUTION_CHAMPION: {
        id: "resolution_champion",
        emoji: "✨",
        label: "Resolution Champion",
        description: "Had an issue marked as resolved",
        condition: (stats) => stats.resolvedIssues >= 1,
    },
    TRENDING_CREATOR: {
        id: "trending_creator",
        emoji: "📈",
        label: "Trending Creator",
        description: "Had an issue reach trending status",
        condition: (stats) => stats.trendingIssues >= 1,
    },
};

// ─── Helper Functions ────

export function getLevelForPoints(points) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (points >= LEVELS[i].minPoints) {
            return LEVELS[i];
        }
    }
    return LEVELS[0];
}

export function getPointsToNextLevel(currentPoints) {
    const currentLevel = getLevelForPoints(currentPoints);
    if (currentLevel.maxPoints === Infinity) {
        return 0;
    }
    return currentLevel.maxPoints - currentPoints;
}

// ─── Core Points Function

export async function awardPoints(userId, action, metadata = {}) {
    if (!userId) return null;

    // FIX (Bug 3): Previously, the function did `let points = POINTS_CONFIG[action]`
    // then checked `if (!points && action !== "REFERRAL_BONUS" && action !== "REFERRAL_COMPLETION")`
    // but never actually resolved the points value for those two action strings —
    // POINTS_CONFIG["REFERRAL_BONUS"] and POINTS_CONFIG["REFERRAL_COMPLETION"] are
    // defined, so the simple lookup below works for all actions including referrals.
    // The special-case guard is no longer needed.
    let points = POINTS_CONFIG[action] ?? null;

    // Allow callers to override with an explicit points value in metadata
    if (metadata.points) {
        points = metadata.points;
    }

    if (!points) return null;

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return null;

        const currentData = userSnap.data();
        const currentPoints = currentData.impactScore || 0;
        const newPoints = currentPoints + points;

        const oldLevel = getLevelForPoints(currentPoints);
        const newLevel = getLevelForPoints(newPoints);
        const leveledUp = newLevel.level > oldLevel.level;

        await updateDoc(userRef, {
            impactScore: increment(points),
            ...(leveledUp && {
                level: newLevel.level,
                levelName: newLevel.name,
            }),
            updatedAt: serverTimestamp(),
        });

        if (leveledUp) {
            await createNotification({
                type: NOTIFICATION_TYPES.MILESTONE,
                recipientId: userId,
                actorId: "system",
                actorName: "Camp Voice",
                issueId: metadata.issueId || null,
                issueTitle: metadata.issueTitle || "Level Up!",
                meta: {
                    type: "level_up",
                    oldLevel: oldLevel.level,
                    newLevel: newLevel.level,
                    newLevelName: newLevel.name,
                    points: newPoints,
                },
            });
        }

        if (action === "REFERRAL_BONUS") {
            await createNotification({
                type: NOTIFICATION_TYPES.MILESTONE,
                recipientId: userId,
                actorId: "system",
                actorName: "Camp Voice",
                issueId: null,
                issueTitle: "Welcome Bonus!",
                meta: {
                    type: "referral_bonus",
                    points,
                    message: `You earned ${points} points for joining via referral!`,
                },
            });
        } else if (action === "REFERRAL_COMPLETION") {
            await createNotification({
                type: NOTIFICATION_TYPES.MILESTONE,
                recipientId: userId,
                actorId: "system",
                actorName: "Camp Voice",
                issueId: null,
                issueTitle: "Referral Bonus!",
                meta: {
                    type: "referral_completion",
                    points,
                    message: `Your friend posted their first issue! You earned ${points} points!`,
                },
            });
        }

        await updateUserStats(userId, action, metadata);
        await checkAndAwardBadges(userId);

        return {
            pointsAwarded: points,
            newTotal: newPoints,
            leveledUp,
            newLevel: leveledUp ? newLevel : null,
        };
    } catch (error) {
        console.error("Error awarding points:", error);
        return null;
    }
}

// ─── Stats Management ────

export async function updateUserStats(userId, action, metadata = {}) {
    const statsRef = doc(db, "users", userId, "stats", "overview");
    const statsSnap = await getDoc(statsRef);

    const updates = {};

    switch (action) {
        case "CREATE_ISSUE":
            updates.issuesCount = increment(1);
            break;
        case "RECEIVE_UPVOTE":
            updates.upvotesReceived = increment(1);
            break;
        case "RECEIVE_VOTE":
            updates.votesReceived = increment(1);
            break;
        case "RECEIVE_COMMENT":
            updates.commentsReceived = increment(1);
            break;
        case "RECEIVE_REPLY":
            updates.repliesReceived = increment(1);
            break;
        case "RECEIVE_LIKE":
            updates.likesReceived = increment(1);
            break;
        case "UPVOTE_ISSUE":
            updates.upvotesGiven = increment(1);
            break;
        case "VOTE_ON_ISSUE":
            updates.votesCast = increment(1);
            break;
        case "COMMENT_ON_ISSUE":
            updates.commentsPosted = increment(1);
            break;
        case "REPLY_TO_COMMENT":
            updates.repliesPosted = increment(1);
            break;
        case "LIKE_COMMENT":
            updates.likesGiven = increment(1);
            break;
        case "ISSUE_RESOLVED":
            updates.resolvedIssues = increment(1);
            break;
        case "ISSUE_TRENDING":
            updates.trendingIssues = increment(1);
            break;
        // FIX (Bug 4): ISSUE_VIRAL was missing entirely, so going viral never
        // updated the viralIssues stat, which blocked the TRENDING_CREATOR badge.
        case "ISSUE_VIRAL":
            updates.viralIssues = increment(1);
            break;
        case "REFERRAL_BONUS":
        case "REFERRAL_COMPLETION":
            // Handled by the referral system directly
            break;
        default:
            break;
    }

    if (Object.keys(updates).length > 0) {
        if (statsSnap.exists()) {
            await updateDoc(statsRef, {
                ...updates,
                updatedAt: serverTimestamp(),
            });
        } else {
            await setDoc(statsRef, {
                ...updates,
                userId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }
    }
}

// ─── Badge Management ────

export async function checkAndAwardBadges(userId) {
    try {
        const statsRef = doc(db, "users", userId, "stats", "overview");
        const statsSnap = await getDoc(statsRef);
        const stats = statsSnap.exists() ? statsSnap.data() : {};

        const referralStatsRef = doc(
            db,
            "referrals",
            userId,
            "stats",
            "overview",
        );
        const referralStatsSnap = await getDoc(referralStatsRef);
        const referralStats = referralStatsSnap.exists()
            ? referralStatsSnap.data()
            : {};

        const combinedStats = {
            ...stats,
            completedReferrals: referralStats.completedReferrals || 0,
        };

        const badgesQuery = query(collection(db, "users", userId, "badges"));
        const badgesSnap = await getDocs(badgesQuery);
        const currentBadgeIds = new Set(
            badgesSnap.docs.map((d) => d.data().badgeId),
        );

        const newBadges = [];
        for (const [, badge] of Object.entries(BADGES)) {
            if (currentBadgeIds.has(badge.id)) continue;
            if (badge.condition(combinedStats)) {
                newBadges.push(badge);
            }
        }

        if (newBadges.length > 0) {
            const batch = writeBatch(db);

            for (const badge of newBadges) {
                const badgeRef = doc(collection(db, "users", userId, "badges"));
                batch.set(badgeRef, {
                    badgeId: badge.id,
                    emoji: badge.emoji,
                    label: badge.label,
                    description: badge.description,
                    earnedAt: serverTimestamp(),
                });

                await createNotification({
                    type: NOTIFICATION_TYPES.MILESTONE,
                    recipientId: userId,
                    actorId: "system",
                    actorName: "Camp Voice",
                    issueId: null,
                    issueTitle: "New Badge Earned!",
                    meta: {
                        type: "badge_earned",
                        badge: badge,
                    },
                });
            }

            await batch.commit();

            if (statsSnap.exists()) {
                await updateDoc(statsRef, {
                    badgesCount: increment(newBadges.length),
                    updatedAt: serverTimestamp(),
                });
            }
        }

        return newBadges;
    } catch (error) {
        console.error("Error checking badges:", error);
        return [];
    }
}

// ─── Issue Status Check ──

export async function checkIssueMilestones(issueId, issueData) {
    const updates = {};

    if (issueData.upvotes >= 10 && issueData.status !== "trending") {
        updates.status = "trending";
        if (issueData.author?.uid) {
            await awardPoints(issueData.author.uid, "ISSUE_TRENDING", {
                issueId,
                issueTitle: issueData.title,
            });
        }
    }

    if (issueData.upvotes >= 50 && !issueData.viralAt) {
        updates.viralAt = serverTimestamp();
        if (issueData.author?.uid) {
            await awardPoints(issueData.author.uid, "ISSUE_VIRAL", {
                issueId,
                issueTitle: issueData.title,
            });
        }
    }

    if (Object.keys(updates).length > 0) {
        const issueRef = doc(db, "issues", issueId);
        await updateDoc(issueRef, updates);
    }
}
