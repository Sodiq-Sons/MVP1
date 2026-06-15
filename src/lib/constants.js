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

// ─── Canonical post taxonomy ────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH. Every surface (Create flow, Home filters, Trending
// filters) must derive its categories from here. Do not hard-code category
// lists anywhere else. `id` is the value stored on each post's `category`
// field; `filterKey` is the chip key used by the filter bars.

export const FILTER_MAP = {
    gist: { field: "category", values: ["gist", "gossip", "discussion"] },
    polls: { field: "category", values: ["poll", "polls"] },
    food: { field: "category", values: ["food"] },
    lost_found: { field: "category", values: ["lost_found", "lost", "found"] },
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
            "other",
        ],
    },
};

// Content-type filter chips shared by Home and Trending. Each page may prepend
// its own special chips (e.g. "All", "Trending") and append sentiment chips
// (e.g. "Disliked"), but the content-type set itself lives only here.
export const CATEGORY_FILTERS = [
    { key: "gist", label: "💬 Gist" },
    { key: "polls", label: "🗳️ Polls" },
    { key: "food", label: "🍛 Food" },
    { key: "lost_found", label: "🔍 Lost & Found" },
    { key: "issues", label: "🚨 Issues" },
];

export const UPVOTE_MILESTONES = [10, 25, 50, 100, 250, 500];

// Minimum responses in a demographic segment before percentages are shown.
// Below this we show raw counts so we never display "100%" on a single vote.
export const MIN_DEMOGRAPHIC_SAMPLE = 20;

// localStorage flag: set once a visitor has reached the onboarding splash, so
// the root EntryGate sends them to the feed on subsequent visits instead of
// re-onboarding them. (Hybrid routing: first-timers onboard, everyone else
// lands on the feed.)
export const ONBOARDING_SEEN_KEY = "cc_seen_onboarding";
