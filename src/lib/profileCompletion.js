export const PROFILE_FIELDS = [
    { key: "email", label: "Email address", weight: 15 },
    { key: "phone", label: "Phone number", weight: 10 },
    { key: "stateOfOrigin", label: "State of origin", weight: 10 },
    { key: "gender", label: "Gender", weight: 10 },
    { key: "institutionType", label: "Institution type", weight: 20 },
    { key: "campLocation", label: "Camp location", weight: 15 },
    { key: "religion", label: "Religion", weight: 10 },
    { key: "bio", label: "Bio", weight: 10 },
];

// Returns 0-100
export function computeProfileCompletion(userData) {
    if (!userData) return 0;
    let total = 0;
    for (const field of PROFILE_FIELDS) {
        const val = userData[field.key];
        if (val && String(val).trim().length > 0) {
            total += field.weight;
        }
    }
    return Math.min(100, total);
}

export function getMissingFields(userData) {
    if (!userData) return PROFILE_FIELDS;
    return PROFILE_FIELDS.filter((f) => {
        const val = userData[f.key];
        return !val || String(val).trim().length === 0;
    });
}

export function isProfileComplete(userData) {
    return computeProfileCompletion(userData) === 100;
}

// Minimum fields required to vote or post. Everything else in PROFILE_FIELDS is
// optional enrichment, surfaced as a gentle nudge (ProfileCompletionBar) rather
// than a hard wall. These three are also exactly what poll demographics reads,
// and all three are collected during registration — so a freshly registered
// corper can participate immediately.
export const PARTICIPATION_FIELDS = ["gender", "stateOfOrigin", "platoon"];

export function canParticipate(userData) {
    if (!userData) return false;
    return PARTICIPATION_FIELDS.every((key) => {
        const val = userData[key];
        return val && String(val).trim().length > 0;
    });
}

// Actions that require the minimum participation set (see canParticipate)
export const GATED_ACTIONS = ["vote", "create_post"];
