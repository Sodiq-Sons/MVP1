// app/create-issue/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import Link from "next/link";
import { toast } from "sonner";

// ─── Icons ───────────────────────────────────────────────────────────────────

const BackIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
    >
        <polyline points="15 18 9 12 15 6" />
    </svg>
);
const PenIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
const DescIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="7" y1="8" x2="17" y2="8" />
        <line x1="7" y1="12" x2="17" y2="12" />
        <line x1="7" y1="16" x2="11" y2="16" />
    </svg>
);
const LocationIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);
const CategoryIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </svg>
);
const ChevronRightIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <polyline points="9 18 15 12 9 6" />
    </svg>
);
const SendIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-5 h-5"
    >
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);
const LockIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9CA3AF"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-3.5 h-3.5"
    >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);
const PlusIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const TrashIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
);
const SpinnerIcon = () => (
    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="white"
            strokeWidth="4"
        />
        <path
            className="opacity-75"
            fill="white"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
    </svg>
);
const ChartIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
    </svg>
);
const CheckIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const UsersIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
);

// ─── Data ────────────────────────────────────────────────────────────────────

const categories = [
    { value: "infrastructure", label: "🏗️ Infrastructure" },
    { value: "education", label: "📚 Education" },
    { value: "healthcare", label: "❤️ Healthcare" },
    { value: "water", label: "💧 Water & Sanitation" },
    { value: "security", label: "🔒 Security" },
    { value: "electricity", label: "⚡ Electricity" },
    { value: "environment", label: "🌿 Environment" },
    { value: "other", label: "📌 Other" },
];

const states = [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "FCT Abuja",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
];

const RESPONSE_TYPES = [
    {
        id: "yes_no",
        emoji: "👍",
        label: "Yes / No",
        description: "Simple binary vote — great for clear decisions",
        preview: ["✅ Yes", "❌ No"],
    },
    {
        id: "likert",
        emoji: "📊",
        label: "Agreement Scale",
        description: "Strongly Agree to Strongly Disagree",
        preview: [
            "Strongly Agree",
            "Agree",
            "Neutral",
            "Disagree",
            "Strongly Disagree",
        ],
    },
    {
        id: "poll",
        emoji: "🗳️",
        label: "Custom Poll",
        description: "Define your own answer choices (up to 6)",
        preview: null,
    },
];

// Demographic options for results filtering - REMOVED state
const DEMOGRAPHIC_OPTIONS = [
    {
        id: "age",
        emoji: "🎂",
        label: "Age Groups",
        description:
            "See how different age groups voted (Teens, Youth, Adults)",
    },
    {
        id: "gender",
        emoji: "⚧️",
        label: "Gender",
        description: "Breakdown by Male, Female, and Other",
    },
    {
        id: "maritalStatus",
        emoji: "💍",
        label: "Marital Status",
        description: "Single, Married, Divorced, Widowed, Separated",
    },
    {
        id: "education",
        emoji: "🎓",
        label: "Education Level",
        description: "From Primary to PhD/Doctorate",
    },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }) {
    return (
        <div className="flex items-center justify-center gap-2 py-3">
            {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                    <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            step === s
                                ? "bg-[#F97316] text-white shadow-md shadow-orange-200"
                                : step > s
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-100 text-gray-400"
                        }`}
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        {step > s ? "✓" : s}
                    </div>
                    {s < 3 && (
                        <div
                            className={`w-12 h-0.5 rounded-full transition-all duration-500 ${step > s ? "bg-green-400" : "bg-gray-100"}`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Response type card ───────────────────────────────────────────────────────

function ResponseTypeCard({ type, selected, onSelect }) {
    return (
        <button
            onClick={() => onSelect(type.id)}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                selected
                    ? "border-[#F97316] bg-[#FFF7F2]"
                    : "border-gray-100 bg-white hover:border-orange-200"
            }`}
        >
            <div className="flex items-start gap-3">
                <span className="text-2xl">{type.emoji}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span
                            className={`font-bold text-sm ${selected ? "text-[#F97316]" : "text-gray-900"}`}
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            {type.label}
                        </span>
                        {selected && (
                            <span className="ml-auto w-5 h-5 bg-[#F97316] rounded-full flex items-center justify-center shrink-0">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    className="w-3 h-3"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </span>
                        )}
                    </div>
                    <p
                        className="text-xs text-gray-400 mb-2"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        {type.description}
                    </p>
                    {type.preview && (
                        <div className="flex flex-wrap gap-1.5">
                            {type.preview.map((opt) => (
                                <span
                                    key={opt}
                                    className={`px-2 py-0.5 rounded-full text-xs border ${selected ? "border-orange-200 bg-orange-50 text-orange-600" : "border-gray-100 bg-gray-50 text-gray-500"}`}
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    {opt}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
}

// ─── Demographic Card Component ───────────────────────────────────────────────

function DemographicCard({ option, selected, onToggle }) {
    return (
        <button
            onClick={() => onToggle(option.id)}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative ${
                selected
                    ? "border-[#F97316] bg-[#FFF7F2]"
                    : "border-gray-100 bg-white hover:border-orange-200"
            }`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        selected ? "bg-[#F97316]" : "bg-gray-100"
                    }`}
                >
                    {selected ? (
                        <CheckIcon />
                    ) : (
                        <span className="text-xs text-gray-400">☐</span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xl">{option.emoji}</span>
                        <span
                            className={`font-bold text-sm ${selected ? "text-[#F97316]" : "text-gray-900"}`}
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            {option.label}
                        </span>
                    </div>
                    <p
                        className="text-xs text-gray-400"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        {option.description}
                    </p>
                </div>
            </div>
            {selected && (
                <div className="absolute top-3 right-3">
                    <span className="w-5 h-5 bg-[#F97316] rounded-full flex items-center justify-center">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            className="w-3 h-3"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </span>
                </div>
            )}
        </button>
    );
}

// ─── Field error badge ────────────────────────────────────────────────────────

function FieldRow({ touched, valid, children, className = "" }) {
    const showError = touched && !valid;
    return (
        <div
            className={`relative transition-all duration-200 ${showError ? "rounded-xl ring-2 ring-red-300" : ""} ${className}`}
        >
            {children}
            {showError && (
                <span
                    className="absolute -top-2 right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    Required
                </span>
            )}
        </div>
    );
}

// ─── Login Prompt Component ────────────────────────────────────────────────────

function LoginPrompt({ onLogin }) {
    return (
        <div className="min-h-screen bg-[#FDF6EF] flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🔒</span>
                </div>
                <h2
                    className="text-2xl font-bold text-gray-900 mb-2"
                    style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                    Login Required
                </h2>
                <p
                    className="text-gray-500 text-sm mb-6"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    Please sign in to create issues and join the conversation.
                </p>
                <button
                    onClick={onLogin}
                    className="w-full py-3.5 rounded-2xl font-bold text-base bg-[#F97316] text-white hover:bg-[#C2410C] shadow-lg active:scale-[0.98] transition-all duration-200 cursor-pointer"
                    style={{
                        fontFamily: "DM Sans, sans-serif",
                        boxShadow: "0 4px 20px rgba(232,97,26,0.35)",
                    }}
                >
                    Sign In
                </button>
                <p
                    className="text-xs text-gray-400 mt-4"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/register"
                        className="text-[#F97316] font-semibold hover:underline"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CreateIssuePage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(true);

    // Auth check - same pattern as home page
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                setIsAnonymous(user.isAnonymous);
            }
            setAuthReady(true);
        });

        return () => unsubscribe();
    }, []);

    const handleLoginClick = () => {
        const currentPath = window.location.pathname;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    };

    // Show loading while checking auth
    if (!authReady) {
        return (
            <div className="min-h-screen bg-[#FDF6EF] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <SpinnerIcon />
                    <p
                        className="text-sm text-gray-500"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    // Show login prompt if not authenticated or anonymous
    if (!currentUser || isAnonymous) {
        return <LoginPrompt onLogin={handleLoginClick} />;
    }

    return <CreateIssueForm currentUser={currentUser} router={router} />;
}

function CreateIssueForm({ currentUser, router }) {
    // Step 1
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [category, setCategory] = useState("");
    const [touched, setTouched] = useState({
        title: false,
        description: false,
        location: false,
        category: false,
    });
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);

    // Step 2
    const [responseType, setResponseType] = useState("yes_no");
    const [pollOptions, setPollOptions] = useState(["", ""]);

    // Step 3 - Demographics
    const [selectedDemographics, setSelectedDemographics] = useState([]);

    // UI
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const selectedCategory = categories.find((c) => c.value === category);

    // ── Validation ────────────────────────────────────────────────────────────
    const step1Valid =
        title.trim().length > 0 &&
        description.trim().length > 0 &&
        location.length > 0 &&
        category.length > 0;

    const step2Valid =
        responseType !== "poll" ||
        pollOptions.filter((o) => o.trim()).length >= 2;

    const step3Valid = selectedDemographics.length > 0;

    const touchAllStep1 = () =>
        setTouched({
            title: true,
            description: true,
            location: true,
            category: true,
        });

    // ── Poll helpers ──────────────────────────────────────────────────────────
    const updatePollOption = (i, val) => {
        const next = [...pollOptions];
        next[i] = val;
        setPollOptions(next);
    };
    const addPollOption = () => {
        if (pollOptions.length < 6) setPollOptions([...pollOptions, ""]);
    };
    const removePollOption = (i) => {
        if (pollOptions.length > 2)
            setPollOptions(pollOptions.filter((_, idx) => idx !== i));
    };

    // ── Demographics helpers ─────────────────────────────────────────────────
    const toggleDemographic = (id) => {
        setSelectedDemographics((prev) =>
            prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
        );
    };

    // ── Save to Firestore ───────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!step1Valid || !step2Valid || !step3Valid || saving) return;
        setSaving(true);
        setSaveError("");

        try {
            let voteOptions = [];
            if (responseType === "yes_no") {
                voteOptions = ["Yes", "No"];
            } else if (responseType === "likert") {
                voteOptions = [
                    "Strongly Agree",
                    "Agree",
                    "Neutral",
                    "Disagree",
                    "Strongly Disagree",
                ];
            } else {
                voteOptions = pollOptions.filter((o) => o.trim());
            }

            const votes = Object.fromEntries(
                voteOptions.map((opt) => [opt, 0]),
            );

            // Create the issue
            const issueRef = await addDoc(collection(db, "issues"), {
                title: title.trim(),
                description: description.trim(),
                location,
                category,
                responseType,
                voteOptions,
                votes,
                totalVotes: 0,
                demographics: selectedDemographics,
                createdAt: serverTimestamp(),
                createdBy: currentUser.uid,
                authorName: currentUser.displayName || "Anonymous",
                status: "under-review",
                commentsCount: 0,
            });

            // Update user stats and impact score
            const userRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userRef);

            const batch = writeBatch(db);
            const now = serverTimestamp();

            let newIssuesCount = 1;
            let newImpactScore = 10;
            let newLevel = 1;
            let newLevelName = "New Voice";
            let pointsToNextLevel = 100;
            let badgesToAward = [];
            let notificationsToCreate = [];

            if (userDoc.exists()) {
                const userData = userDoc.data();
                newIssuesCount = (userData.issuesCount || 0) + 1;
                newImpactScore = (userData.impactScore || 0) + 10;

                // Level progression logic
                if (newImpactScore >= 500) {
                    newLevel = 5;
                    newLevelName = "National Champion";
                    pointsToNextLevel = 1000;
                } else if (newImpactScore >= 250) {
                    newLevel = 4;
                    newLevelName = "Change Maker";
                    pointsToNextLevel = 500;
                } else if (newImpactScore >= 100) {
                    newLevel = 3;
                    newLevelName = "Active Citizen";
                    pointsToNextLevel = 250;
                } else if (newImpactScore >= 50) {
                    newLevel = 2;
                    newLevelName = "Community Voice";
                    pointsToNextLevel = 100;
                }

                // Check for first issue badge
                if (newIssuesCount === 1) {
                    const firstIssueBadgeRef = doc(
                        db,
                        "users",
                        currentUser.uid,
                        "badges",
                        "first_issue",
                    );
                    batch.set(firstIssueBadgeRef, {
                        emoji: "📝",
                        label: "First Issue",
                        description: "Posted your first community issue",
                        earnedAt: now,
                    });
                    badgesToAward.push({
                        emoji: "📝",
                        label: "First Issue",
                        description: "Posted your first community issue",
                    });
                    notificationsToCreate.push({
                        type: "milestone",
                        message: "You earned the First Issue badge!",
                        meta: "Keep posting to unlock more badges",
                    });
                }

                // Check for 5 issues badge
                if (newIssuesCount === 5) {
                    const fiveIssuesBadgeRef = doc(
                        db,
                        "users",
                        currentUser.uid,
                        "badges",
                        "five_issues",
                    );
                    batch.set(fiveIssuesBadgeRef, {
                        emoji: "📊",
                        label: "Regular Reporter",
                        description: "Posted 5 community issues",
                        earnedAt: now,
                    });
                    badgesToAward.push({
                        emoji: "📊",
                        label: "Regular Reporter",
                        description: "Posted 5 community issues",
                    });
                    notificationsToCreate.push({
                        type: "milestone",
                        message: "You earned the Regular Reporter badge!",
                        meta: "5 issues posted",
                    });
                }

                // Check for 10 issues badge
                if (newIssuesCount === 10) {
                    const tenIssuesBadgeRef = doc(
                        db,
                        "users",
                        currentUser.uid,
                        "badges",
                        "ten_issues",
                    );
                    batch.set(tenIssuesBadgeRef, {
                        emoji: "🔥",
                        label: "Top Reporter",
                        description: "Posted 10 community issues",
                        earnedAt: now,
                    });
                    badgesToAward.push({
                        emoji: "🔥",
                        label: "Top Reporter",
                        description: "Posted 10 community issues",
                    });
                    notificationsToCreate.push({
                        type: "milestone",
                        message: "You earned the Top Reporter badge!",
                        meta: "10 issues posted - you're a community leader!",
                    });

                    // Also update user role
                    batch.update(userRef, {
                        role: "top_reporter",
                    });
                }

                // Check for level up notification
                const oldLevel = userData.level || 1;
                if (newLevel > oldLevel) {
                    notificationsToCreate.push({
                        type: "milestone",
                        message: `Level Up! You're now Level ${newLevel} — ${newLevelName}`,
                        meta: `${newImpactScore} impact points earned`,
                    });
                }
            } else {
                // First time user - create user document
                batch.set(userRef, {
                    displayName: currentUser.displayName || "User",
                    email: currentUser.email,
                    photoURL: currentUser.photoURL || null,
                    createdAt: now,
                    bio: "No bio yet",
                    location: "Nigeria",
                    isOnline: true,
                });

                // Award first issue badge
                const firstIssueBadgeRef = doc(
                    db,
                    "users",
                    currentUser.uid,
                    "badges",
                    "first_issue",
                );
                batch.set(firstIssueBadgeRef, {
                    emoji: "📝",
                    label: "First Issue",
                    description: "Posted your first community issue",
                    earnedAt: now,
                });
                badgesToAward.push({
                    emoji: "📝",
                    label: "First Issue",
                    description: "Posted your first community issue",
                });
                notificationsToCreate.push({
                    type: "milestone",
                    message: "Welcome! You earned your First Issue badge!",
                    meta: "Start of your community impact journey",
                });
            }

            // Update user stats
            batch.update(userRef, {
                issuesCount: newIssuesCount,
                impactScore: newImpactScore,
                level: newLevel,
                levelName: newLevelName,
                pointsToNextLevel: pointsToNextLevel,
                lastActive: now,
            });

            // Update stats subcollection for quick access
            const statsRef = doc(
                db,
                "users",
                currentUser.uid,
                "stats",
                "overview",
            );
            batch.set(
                statsRef,
                {
                    issuesCount: newIssuesCount,
                    impactScore: newImpactScore,
                    badgesCount:
                        badgesToAward.length +
                        (userDoc.exists()
                            ? userDoc.data().badgesCount || 0
                            : 0),
                    lastUpdated: now,
                },
                { merge: true },
            );

            // Create notifications
            for (const notif of notificationsToCreate) {
                const notifRef = doc(collection(db, "notifications"));
                batch.set(notifRef, {
                    userId: currentUser.uid,
                    type: notif.type,
                    actorName: "System",
                    actorInitial: "S",
                    actorColor: "bg-[#F97316]",
                    message: notif.message,
                    issueTitle: title.trim(),
                    issueId: issueRef.id,
                    meta: notif.meta,
                    createdAt: now,
                    read: false,
                });
            }

            // Always create a "issue created" notification
            const issueCreatedNotifRef = doc(collection(db, "notifications"));
            batch.set(issueCreatedNotifRef, {
                userId: currentUser.uid,
                type: "milestone",
                actorName: "You",
                actorInitial: "Y",
                actorColor: "bg-[#F97316]",
                message: "posted a new issue",
                issueTitle: title.trim(),
                issueId: issueRef.id,
                meta: `Posted in ${location} • ${category}`,
                createdAt: now,
                read: true, // Auto-mark as read since it's your own action
            });

            // Commit all operations
            await batch.commit();

            // Show success toast for badges
            for (const badge of badgesToAward) {
                toast.success(`🏅 Badge Earned: ${badge.label}!`, {
                    description: badge.description,
                });
            }

            router.push("/");
        } catch (err) {
            console.error("Firestore error:", err);
            setSaveError("Something went wrong. Please try again.");
            setSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[#FDF6EF] pb-24 md:pb-8">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#F97316] px-4 pt-6 md:pt-4 pb-3">
                <div className="flex items-center gap-3 max-w-2xl mx-auto">
                    <button
                        onClick={() =>
                            step === 1 ? router.back() : setStep(step - 1)
                        }
                        className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
                    >
                        <BackIcon />
                    </button>
                    <div>
                        <h1
                            className="text-white font-bold text-base leading-tight"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            {step === 1
                                ? "Post a New Issue"
                                : step === 2
                                  ? "How Should People Respond?"
                                  : "Demographic Insights"}
                        </h1>
                        <p
                            className="text-orange-100 text-xs"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Step {step} of 3
                        </p>
                    </div>
                </div>
                <div className="max-w-2xl mx-auto">
                    <StepIndicator step={step} />
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 md:px-6">
                {/* ══ STEP 1 ══════════════════════════════════════════════════ */}
                {step === 1 && (
                    <>
                        {/* Hero */}
                        <div className="flex flex-col items-center pt-6 pb-4">
                            <div className="w-28 h-28 bg-[#FFF7F2] rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md">
                                <span className="text-5xl">📢</span>
                            </div>
                            <h2
                                className="text-xl font-bold text-gray-900 text-center"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                Your Voice Matters!
                            </h2>
                            <span
                                className="text-gray-500 text-sm text-center mt-1 max-w-xs"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Report issues in your community.
                                <br />
                                Let&apos;s make Nigeria better — together
                            </span>
                        </div>

                        {/* Form card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-visible divide-y divide-gray-50">
                            {/* Title */}
                            <FieldRow
                                touched={touched.title}
                                valid={title.trim().length > 0}
                                className="rounded-t-2xl"
                            >
                                <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                        <PenIcon />
                                    </div>
                                    <div className="flex-1">
                                        <label
                                            className="block text-sm font-semibold text-black mb-1"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            Issue Title{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) =>
                                                setTitle(e.target.value)
                                            }
                                            onBlur={() =>
                                                setTouched((t) => ({
                                                    ...t,
                                                    title: true,
                                                }))
                                            }
                                            placeholder="e.g. Bad road, No water, School problem"
                                            className="w-full text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        />
                                    </div>
                                </div>
                            </FieldRow>

                            {/* Description */}
                            <FieldRow
                                touched={touched.description}
                                valid={description.trim().length > 0}
                            >
                                <div className="px-4 pt-3 pb-3 flex items-start gap-3">
                                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                        <DescIcon />
                                    </div>
                                    <div className="flex-1">
                                        <label
                                            className="block text-sm font-semibold text-black mb-1"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            Describe the Issue{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) =>
                                                setDescription(e.target.value)
                                            }
                                            onBlur={() =>
                                                setTouched((t) => ({
                                                    ...t,
                                                    description: true,
                                                }))
                                            }
                                            placeholder="Tell us what's happening..."
                                            rows={5}
                                            maxLength={1500}
                                            className="w-full text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent resize-none"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        />
                                        {description.length > 0 && (
                                            <p
                                                className="text-xs text-gray-400 text-right"
                                                style={{
                                                    fontFamily:
                                                        "DM Sans, sans-serif",
                                                }}
                                            >
                                                {description.length}/1500
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </FieldRow>

                            {/* Location */}
                            <FieldRow
                                touched={touched.location}
                                valid={location.length > 0}
                            >
                                <button
                                    onClick={() => {
                                        setTouched((t) => ({
                                            ...t,
                                            location: true,
                                        }));
                                        setShowLocationModal(true);
                                    }}
                                    className="w-full px-4 pt-3 pb-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
                                >
                                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                        <LocationIcon />
                                    </div>
                                    <div className="flex-1">
                                        <div
                                            className="text-sm font-semibold text-black mb-0.5"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            Location{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </div>
                                        <div
                                            className={`text-sm ${location ? "text-gray-800" : "text-gray-400"}`}
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            {location || "Select state"}
                                        </div>
                                    </div>
                                    <ChevronRightIcon />
                                </button>
                            </FieldRow>

                            {/* Category */}
                            <FieldRow
                                touched={touched.category}
                                valid={category.length > 0}
                                className="rounded-b-2xl"
                            >
                                <button
                                    onClick={() => {
                                        setTouched((t) => ({
                                            ...t,
                                            category: true,
                                        }));
                                        setShowCategoryModal(true);
                                    }}
                                    className="w-full px-4 pt-3 pb-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
                                >
                                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                        <CategoryIcon />
                                    </div>
                                    <div className="flex-1">
                                        <div
                                            className="text-sm font-semibold text-black mb-0.5"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            Category{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </div>
                                        <div
                                            className={`text-sm ${category ? "text-gray-800" : "text-gray-400"}`}
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            {selectedCategory
                                                ? selectedCategory.label
                                                : "Choose issue type"}
                                        </div>
                                    </div>
                                    <ChevronRightIcon />
                                </button>
                            </FieldRow>
                        </div>

                        {/* Helper text */}
                        <p
                            className="text-xs text-center mt-2 px-1"
                            style={{
                                fontFamily: "DM Sans, sans-serif",
                                color: step1Valid ? "#22c55e" : "#9ca3af",
                            }}
                        >
                            {step1Valid
                                ? "✓ All fields complete — you're good to go!"
                                : "All fields are required to continue"}
                        </p>

                        {/* Next */}
                        <button
                            onClick={() => {
                                touchAllStep1();
                                if (step1Valid) setStep(2);
                            }}
                            className={`w-full mt-4 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                                step1Valid
                                    ? "bg-[#F97316] text-white hover:bg-[#C2410C] shadow-lg active:scale-[0.98] cursor-pointer"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                            style={{
                                fontFamily: "DM Sans, sans-serif",
                                boxShadow: step1Valid
                                    ? "0 4px 20px rgba(232,97,26,0.35)"
                                    : undefined,
                            }}
                        >
                            Next — Choose Response Type
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                className="w-4 h-4"
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>

                        <div className="flex items-center justify-center gap-1.5 mt-3 mb-6">
                            <LockIcon />
                            <span
                                className="text-xs text-gray-500"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Your post will be public &amp; trackable
                            </span>
                        </div>
                    </>
                )}

                {/* ══ STEP 2 ══════════════════════════════════════════════════ */}
                {step === 2 && (
                    <>
                        <div className="flex flex-col items-center pt-6 pb-5">
                            <div className="w-24 h-24 bg-[#FFF7F2] rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md">
                                <span className="text-4xl">🗳️</span>
                            </div>
                            <h2
                                className="text-xl font-bold text-gray-900 text-center"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                Pick a Response Style
                            </h2>
                            <p
                                className="text-gray-500 text-sm text-center mt-1 max-w-xs"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                How should people vote on your issue?
                            </p>
                        </div>

                        {/* Issue recap */}
                        <div className="bg-white rounded-xl px-4 py-3 mb-4 border border-orange-100 flex items-center gap-2">
                            <span className="text-orange-400 text-lg">📢</span>
                            <p
                                className="text-sm text-gray-700 font-medium truncate"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {title}
                            </p>
                        </div>

                        {/* Response type cards */}
                        <div className="flex flex-col gap-3">
                            {RESPONSE_TYPES.map((type) => (
                                <ResponseTypeCard
                                    key={type.id}
                                    type={type}
                                    selected={responseType === type.id}
                                    onSelect={setResponseType}
                                />
                            ))}
                        </div>

                        {/* Custom poll builder */}
                        {responseType === "poll" && (
                            <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-4">
                                <p
                                    className="text-sm font-bold text-gray-800 mb-3"
                                    style={{
                                        fontFamily:
                                            "Plus Jakarta Sans, sans-serif",
                                    }}
                                >
                                    Your poll options{" "}
                                    <span className="text-red-400">*</span>
                                </p>
                                <div className="flex flex-col gap-2">
                                    {pollOptions.map((opt, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xs font-bold shrink-0">
                                                {i + 1}
                                            </div>
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) =>
                                                    updatePollOption(
                                                        i,
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={`Option ${i + 1}`}
                                                maxLength={60}
                                                className="flex-1 px-3 py-2 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-orange-300 transition-colors"
                                                style={{
                                                    fontFamily:
                                                        "DM Sans, sans-serif",
                                                }}
                                            />
                                            {pollOptions.length > 2 && (
                                                <button
                                                    onClick={() =>
                                                        removePollOption(i)
                                                    }
                                                    className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {pollOptions.length < 6 && (
                                    <button
                                        onClick={addPollOption}
                                        className="mt-3 w-full py-2 rounded-xl border-2 border-dashed border-orange-200 text-orange-400 text-sm flex items-center justify-center gap-1.5 hover:border-orange-400 hover:text-orange-500 transition-colors cursor-pointer"
                                        style={{
                                            fontFamily: "DM Sans, sans-serif",
                                        }}
                                    >
                                        <PlusIcon />
                                        Add option ({pollOptions.length}/6)
                                    </button>
                                )}
                                {pollOptions.filter((o) => o.trim()).length <
                                    2 && (
                                    <p
                                        className="text-xs text-orange-400 mt-2"
                                        style={{
                                            fontFamily: "DM Sans, sans-serif",
                                        }}
                                    >
                                        ⚠️ Fill in at least 2 options to submit
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-4 rounded-2xl font-bold text-sm text-gray-500 hover:text-gray-700 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 cursor-pointer"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                ← Back
                            </button>
                            <button
                                onClick={() => {
                                    if (step2Valid) setStep(3);
                                }}
                                className={`flex-2 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                                    step2Valid
                                        ? "bg-[#F97316] text-white hover:bg-[#C2410C] shadow-lg active:scale-[0.98] cursor-pointer"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                                style={{
                                    fontFamily: "DM Sans, sans-serif",
                                    boxShadow: step2Valid
                                        ? "0 4px 20px rgba(232,97,26,0.35)"
                                        : undefined,
                                }}
                            >
                                Next — Demographics
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    className="w-4 h-4"
                                >
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 mt-3 mb-6">
                            <LockIcon />
                            <span
                                className="text-xs text-gray-500"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Your post will be public &amp; trackable
                            </span>
                        </div>
                    </>
                )}

                {/* ══ STEP 3 ══════════════════════════════════════════════════ */}
                {step === 3 && (
                    <>
                        <div className="flex flex-col items-center pt-6 pb-5">
                            <div className="w-24 h-24 bg-[#FFF7F2] rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md">
                                <span className="text-4xl">📊</span>
                            </div>
                            <h2
                                className="text-xl font-bold text-gray-900 text-center"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                Demographic Insights
                            </h2>
                            <p
                                className="text-gray-500 text-sm text-center mt-1 max-w-xs"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Select which demographics to show in voting
                                results
                            </p>
                        </div>

                        {/* Issue recap */}
                        <div className="bg-white rounded-xl px-4 py-3 mb-4 border border-orange-100">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-orange-400 text-lg">
                                    📢
                                </span>
                                <p
                                    className="text-sm text-gray-700 font-medium truncate"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    {title}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>
                                    {
                                        RESPONSE_TYPES.find(
                                            (t) => t.id === responseType,
                                        )?.emoji
                                    }
                                </span>
                                <span>
                                    {
                                        RESPONSE_TYPES.find(
                                            (t) => t.id === responseType,
                                        )?.label
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Demographics selection */}
                        <div className="flex flex-col gap-3 mb-4">
                            {DEMOGRAPHIC_OPTIONS.map((option) => (
                                <DemographicCard
                                    key={option.id}
                                    option={option}
                                    selected={selectedDemographics.includes(
                                        option.id,
                                    )}
                                    onToggle={toggleDemographic}
                                />
                            ))}
                        </div>

                        {/* Selection summary */}
                        <div className="bg-orange-50 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <UsersIcon />
                                <span
                                    className="text-sm font-bold text-gray-800"
                                    style={{
                                        fontFamily:
                                            "Plus Jakarta Sans, sans-serif",
                                    }}
                                >
                                    {selectedDemographics.length} selected
                                </span>
                            </div>
                            <p
                                className="text-xs text-gray-600"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {selectedDemographics.length === 0
                                    ? "Select at least one demographic to see how different groups voted on your issue"
                                    : `You'll see voting breakdowns by: ${selectedDemographics
                                          .map(
                                              (id) =>
                                                  DEMOGRAPHIC_OPTIONS.find(
                                                      (o) => o.id === id,
                                                  )?.label,
                                          )
                                          .join(", ")}`}
                            </p>
                        </div>

                        {/* Save error */}
                        {saveError && (
                            <div
                                className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-500"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {saveError}
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setStep(2)}
                                disabled={saving}
                                className="flex-1 py-4 rounded-2xl font-bold text-sm text-gray-500 hover:text-gray-700 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 cursor-pointer disabled:opacity-50"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!step3Valid || saving}
                                className={`flex-2 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                                    step3Valid && !saving
                                        ? "bg-[#F97316] text-white hover:bg-[#C2410C] shadow-lg active:scale-[0.98] cursor-pointer"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                                style={{
                                    fontFamily: "DM Sans, sans-serif",
                                    boxShadow:
                                        step3Valid && !saving
                                            ? "0 4px 20px rgba(232,97,26,0.35)"
                                            : undefined,
                                }}
                            >
                                {saving ? (
                                    <>
                                        <SpinnerIcon /> Saving...
                                    </>
                                ) : (
                                    <>
                                        <SendIcon /> Submit Issue
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 mt-3 mb-8">
                            <LockIcon />
                            <span
                                className="text-xs text-gray-500"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Your post will be public &amp; trackable
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* ── CATEGORY MODAL ── */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        onClick={() => setShowCategoryModal(false)}
                    />
                    <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-2xl p-5 z-10">
                        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4 md:hidden" />
                        <h3
                            className="text-base font-bold text-gray-900 mb-4"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            Choose Category
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => {
                                        setCategory(cat.value);
                                        setShowCategoryModal(false);
                                    }}
                                    className={`p-3 rounded-xl text-left text-sm font-medium transition-all border cursor-pointer ${
                                        category === cat.value
                                            ? "border-[#F97316] bg-[#FFF7F2] text-[#F97316]"
                                            : "border-gray-100 bg-gray-50 text-black hover:border-[#F97316]/30"
                                    }`}
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── LOCATION MODAL ── */}
            {showLocationModal && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        onClick={() => setShowLocationModal(false)}
                    />
                    <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-2xl p-5 z-10 max-h-[70vh] overflow-y-auto">
                        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4 md:hidden" />
                        <h3
                            className="text-base font-bold text-gray-900 mb-4"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            Select State
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {states.map((state) => (
                                <button
                                    key={state}
                                    onClick={() => {
                                        setLocation(state);
                                        setShowLocationModal(false);
                                    }}
                                    className={`p-2.5 rounded-xl text-left text-sm font-medium transition-all border cursor-pointer ${
                                        location === state
                                            ? "border-[#F97316] bg-[#FFF7F2] text-[#F97316]"
                                            : "border-gray-100 bg-gray-50 text-gray-600 hover:border-[#F97316]/30"
                                    }`}
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    {state}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
