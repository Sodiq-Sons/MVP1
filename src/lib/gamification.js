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
};

// ─── Levels Configuration
export const LEVELS = [
    { level: 1, name: "New Voice", minPoints: 0, maxPoints: 100 },
    { level: 2, name: "Active Citizen", minPoints: 100, maxPoints: 300 },
    { level: 3, name: "Community Voice", minPoints: 300, maxPoints: 600 },
    { level: 4, name: "Local Leader", minPoints: 600, maxPoints: 1000 },
    { level: 5, name: "Change Maker", minPoints: 1000, maxPoints: 1500 },
    { level: 6, name: "Community Champion", minPoints: 1500, maxPoints: 2500 },
    { level: 7, name: "City Influencer", minPoints: 2500, maxPoints: 4000 },
    { level: 8, name: "State Ambassador", minPoints: 4000, maxPoints: 6000 },
    { level: 9, name: "National Voice", minPoints: 6000, maxPoints: 10000 },
    {
        level: 10,
        name: "Legendary Citizen",
        minPoints: 10000,
        maxPoints: Infinity,
    },
];

// ─── Badges Configuration
export const BADGES = {
    // Issue badges
    FIRST_ISSUE: {
        id: "first_issue",
        emoji: "📝",
        label: "First Steps",
        description: "Posted your first issue",
        condition: (stats) => stats.issuesCount >= 1,
    },
    PRO_REPORTER: {
        id: "pro_reporter",
        emoji: "📋",
        label: "Pro Reporter",
        description: "Posted 5 issues",
        condition: (stats) => stats.issuesCount >= 5,
    },
    COMMUNITY_WATCH: {
        id: "community_watch",
        emoji: "👁️",
        label: "Community Watch",
        description: "Posted 10 issues",
        condition: (stats) => stats.issuesCount >= 10,
    },
    LOCAL_HERO: {
        id: "local_hero",
        emoji: "🏆",
        label: "Local Hero",
        description: "Posted 25 issues",
        condition: (stats) => stats.issuesCount >= 25,
    },

    // Engagement badges
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

    // Discussion badges
    CONVERSATION_STARTER: {
        id: "conversation_starter",
        emoji: "💬",
        label: "Conversation Starter",
        description: "Received 5 comments on your issues",
        condition: (stats) => stats.commentsReceived >= 5,
    },
    DISCUSSION_LEADER: {
        id: "discussion_leader",
        emoji: "🗣️",
        label: "Discussion Leader",
        description: "Received 20 comments on your issues",
        condition: (stats) => stats.commentsReceived >= 20,
    },

    // Voting badges
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

    // Engagement badges
    ENGAGED_CITIZEN: {
        id: "engaged_citizen",
        emoji: "🤝",
        label: "Engaged Citizen",
        description: "Upvoted 10 issues",
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

    // Streak/milestone badges
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

    const points = POINTS_CONFIG[action];
    if (!points) return null;

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return null;

        const currentData = userSnap.data();
        const currentPoints = currentData.impactScore || 0;
        const newPoints = currentPoints + points;

        // Check for level up
        const oldLevel = getLevelForPoints(currentPoints);
        const newLevel = getLevelForPoints(newPoints);
        const leveledUp = newLevel.level > oldLevel.level;

        // Update user document
        await updateDoc(userRef, {
            impactScore: increment(points),
            ...(leveledUp && {
                level: newLevel.level,
                levelName: newLevel.name,
            }),
            updatedAt: serverTimestamp(),
        });

        // Create level up notification if applicable
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

        // Update stats document
        await updateUserStats(userId, action, metadata);

        // Check for new badges
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

    // Map actions to stat fields
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
    }

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

// ─── Badge Management ────

export async function checkAndAwardBadges(userId) {
    try {
        // Get current stats
        const statsRef = doc(db, "users", userId, "stats", "overview");
        const statsSnap = await getDoc(statsRef);
        const stats = statsSnap.exists() ? statsSnap.data() : {};

        // Get current badges
        const badgesQuery = query(collection(db, "users", userId, "badges"));
        const badgesSnap = await getDocs(badgesQuery);
        const currentBadgeIds = new Set(
            badgesSnap.docs.map((d) => d.data().badgeId),
        );

        // Check each badge
        const newBadges = [];
        for (const [key, badge] of Object.entries(BADGES)) {
            if (currentBadgeIds.has(badge.id)) continue;

            if (badge.condition(stats)) {
                newBadges.push(badge);
            }
        }

        // Award new badges
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

                // Create notification for badge
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

            // Update badge count in stats
            await updateDoc(statsRef, {
                badgesCount: increment(newBadges.length),
                updatedAt: serverTimestamp(),
            });
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

    // Check for trending (e.g., 10 upvotes in 24 hours)
    if (issueData.upvotes >= 10 && issueData.status !== "trending") {
        updates.status = "trending";
        // Award trending badge to creator
        if (issueData.author?.uid) {
            await awardPoints(issueData.author.uid, "ISSUE_TRENDING", {
                issueId,
                issueTitle: issueData.title,
            });
        }
    }

    // Check for viral (e.g., 50 upvotes)
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
