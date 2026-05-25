export const CATEGORY_META = {
    infrastructure: {
        emoji: "🏗️",
        color: "text-amber-700",
        bg: "bg-amber-50",
        label: "Infrastructure",
    },
    education: {
        emoji: "📚",
        color: "text-blue-700",
        bg: "bg-blue-50",
        label: "Education",
    },
    healthcare: {
        emoji: "❤️",
        color: "text-rose-700",
        bg: "bg-rose-50",
        label: "Healthcare",
    },
    water: {
        emoji: "💧",
        color: "text-cyan-700",
        bg: "bg-cyan-50",
        label: "Water",
    },
    security: {
        emoji: "🔒",
        color: "text-purple-700",
        bg: "bg-purple-50",
        label: "Security",
    },
    electricity: {
        emoji: "⚡",
        color: "text-yellow-700",
        bg: "bg-yellow-50",
        label: "Electricity",
    },
    environment: {
        emoji: "🌿",
        color: "text-green-700",
        bg: "bg-green-50",
        label: "Environment",
    },
    gist: {
        emoji: "💬",
        color: "text-pink-700",
        bg: "bg-pink-50",
        label: "Gist",
    },
    polls: {
        emoji: "🗳️",
        color: "text-violet-700",
        bg: "bg-violet-50",
        label: "Poll",
    },
    poll: {
        emoji: "🗳️",
        color: "text-violet-700",
        bg: "bg-violet-50",
        label: "Poll",
    },
    food: {
        emoji: "🍛",
        color: "text-amber-700",
        bg: "bg-amber-50",
        label: "Food",
    },
    issue: {
        emoji: "🚨",
        color: "text-red-700",
        bg: "bg-red-50",
        label: "Issue",
    },
    other: {
        emoji: "📌",
        color: "text-gray-700",
        bg: "bg-muted",
        label: "Other",
    },
};

export const FILTER_MAP = {
    gist: { field: "category", values: ["gist", "gossip", "discussion"] },
    polls: { field: "category", values: ["poll", "polls"] },
    food: { field: "category", values: ["food"] },
    issues: {
        field: "category",
        values: [
            "issue",
            "infrastructure",
            "education",
            "healthcare",
            "water",
            "security",
            "electricity",
            "environment",
        ],
    },
};

export const UPVOTE_MILESTONES = [10, 25, 50, 100, 250, 500];
