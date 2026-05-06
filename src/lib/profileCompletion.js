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

// Actions that require a complete profile
export const GATED_ACTIONS = ["vote", "create_post"];
