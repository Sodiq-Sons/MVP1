"use client";

// app/create-issue/page.tsx
// CHANGES from original:
// 1. On mount, check if profile is complete. If not, show ProfileIncompleteModal and block.
// 2. All other logic is unchanged from the original.

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import Link from "next/link";
import { toast } from "sonner";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { awardPointsViaApi } from "@/lib/gamification";
import Image from "next/image";
import ProfileIncompleteModal from "@/components/ProfileIncompleteModal";
import { isProfileComplete } from "@/lib/profileCompletion";
import { uploadImage } from "@/lib/uploadImage";

// ─── Post Types ───────────────────────────────────────────────────────────────
const POST_TYPES = [
    {
        id: "lost_found",
        emoji: "🔍",
        label: "Lost & Found",
        description: "Post about a lost or found item in camp",
        color: "#059669",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        titleLabel: "Item name",
        titlePlaceholder: "What was lost or found?",
        descLabel: "More details",
        descPlaceholder: "Where was it lost/found? Any identifying features?",
    },
    {
        id: "gist",
        emoji: "💬",
        label: "Gist",
        description: "Share camp gossip, updates, or random thoughts",
        color: "#3B82F6",
        bg: "bg-blue-50",
        border: "border-blue-200",
        titleLabel: "What's the gist?",
        titlePlaceholder: "Spill the tea...",
        descLabel: "Tell us more",
        descPlaceholder: "Give us the full story...",
    },
    {
        id: "poll",
        emoji: "🗳️",
        label: "Poll",
        description: "Ask the camp a question and get votes",
        color: "#8B5CF6",
        bg: "bg-purple-50",
        border: "border-purple-200",
        titleLabel: "Your question",
        titlePlaceholder: "What do you want to ask the camp?",
        descLabel: "Add context (optional)",
        descPlaceholder: "Tell us why you're asking...",
    },
    {
        id: "food",
        emoji: "🍛",
        label: "Food",
        description: "Rate camp food or share about meals",
        color: "var(--cp)",
        bg: "bg-cp-tint",
        border: "border-theme",
        titleLabel: "Food name",
        titlePlaceholder: "What did you eat?",
        descLabel: "Your review",
        descPlaceholder: "How was it? Portion size? Worth the money?",
    },
    {
        id: "issue",
        emoji: "🚨",
        label: "Problem",
        description: "Report problems or concerns in camp",
        color: "#EF4444",
        bg: "bg-red-50",
        border: "border-red-200",
        titleLabel: "What's the problem?",
        titlePlaceholder: "Brief title of the problem",
        descLabel: "Describe in detail",
        descPlaceholder: "Give us all the details...",
    },
];

const ISSUE_SUBCATEGORIES = [
    {
        id: "security",
        emoji: "🔒",
        label: "Security",
        description: "Theft, safety concerns, unauthorized access",
        color: "#7C3AED",
        bg: "bg-purple-50",
        border: "border-purple-200",
        selectedBg: "bg-purple-50",
        selectedText: "text-purple-700",
        selectedBorder: "border-purple-500",
        dotColor: "#7C3AED",
    },
    {
        id: "infrastructure",
        emoji: "🏗️",
        label: "Infrastructure",
        description: "Roads, buildings, facilities, repairs needed",
        color: "var(--cp-deeper)",
        bg: "bg-cp-tint",
        border: "border-theme",
        selectedBg: "bg-cp-tint",
        selectedText: "text-cp",
        selectedBorder: "border-cp",
        dotColor: "var(--cp-deeper)",
    },
    {
        id: "healthcare",
        emoji: "🏥",
        label: "Healthcare",
        description: "Medical concerns, sick bay, first aid issues",
        color: "#DC2626",
        bg: "bg-red-50",
        border: "border-red-200",
        selectedBg: "bg-red-50",
        selectedText: "text-red-700",
        selectedBorder: "border-red-500",
        dotColor: "#DC2626",
    },
    {
        id: "water",
        emoji: "💧",
        label: "Water Supply",
        description: "Water shortages, contamination, pipe issues",
        color: "#0284C7",
        bg: "bg-sky-50",
        border: "border-sky-200",
        selectedBg: "bg-sky-50",
        selectedText: "text-sky-700",
        selectedBorder: "border-sky-500",
        dotColor: "#0284C7",
    },
    {
        id: "electricity",
        emoji: "⚡",
        label: "Electricity",
        description: "Power outages, faulty wiring, lighting issues",
        color: "#CA8A04",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        selectedBg: "bg-yellow-50",
        selectedText: "text-yellow-700",
        selectedBorder: "border-yellow-500",
        dotColor: "#CA8A04",
    },
    {
        id: "environment",
        emoji: "🌿",
        label: "Environment",
        description: "Sanitation, waste disposal, hygiene concerns",
        color: "#16A34A",
        bg: "bg-green-50",
        border: "border-green-200",
        selectedBg: "bg-green-50",
        selectedText: "text-green-700",
        selectedBorder: "border-green-500",
        dotColor: "#16A34A",
    },
    {
        id: "other",
        emoji: "❓",
        label: "Other",
        description: "Anything else that doesn't fit above",
        color: "#4B5563",
        bg: "bg-subtle",
        border: "border-theme",
        selectedBg: "bg-subtle",
        selectedText: "text-gray-700",
        selectedBorder: "border-gray-500",
        dotColor: "#4B5563",
    },
];

const RESPONSE_TYPES = [
    {
        id: "agreement",
        emoji: "📊",
        label: "Agreement Scale",
        description: "Strongly Disagree → Strongly Agree (5-point scale)",
        options: [
            "Strongly Disagree",
            "Disagree",
            "Neutral",
            "Agree",
            "Strongly Agree",
        ],
    },
    {
        id: "yesno",
        emoji: "✅",
        label: "Yes / No",
        description: "Simple binary choice",
        options: ["Yes", "No"],
    },
    {
        id: "custom",
        emoji: "📝",
        label: "Custom Options",
        description: "Create your own response options",
        options: [],
    },
];

const DEMOGRAPHIC_OPTIONS = [
    {
        id: "gender",
        emoji: "⚧️",
        label: "Gender",
        description: "Breakdown by Male, Female, and Other",
    },
    {
        id: "stateOfOrigin",
        emoji: "📍",
        label: "State of Origin",
        description: "See voting patterns by state",
    },
    {
        id: "platoon",
        emoji: "👥",
        label: "Platoon",
        description: "Breakdown by NYSC platoon numbers",
    },
];

const MAX_DESC = 2000;
const MAX_TITLE = 100;
const MAX_CUSTOM_OPTION = 60;
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
];

// ─── Icons ─────────────────────────────────────────────────────────────────────
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
const CampIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-5 h-5"
    >
        <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 012-2h4a2 2 0 012 2v9" />
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
        <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
);
const StarIcon = ({ filled }) => (
    <svg
        viewBox="0 0 24 24"
        fill={filled ? "#FBBF24" : "none"}
        stroke={filled ? "#FBBF24" : "#D1D5DB"}
        strokeWidth="2"
        strokeLinecap="round"
        className="w-8 h-8 cursor-pointer"
    >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);
const AnonymousIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);
const EyeIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
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
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
);
const ScaleIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-5 h-5"
    >
        <path d="M3 6h18M3 12h18M3 18h18" />
        <circle cx="6" cy="6" r="2" fill="currentColor" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <circle cx="18" cy="18" r="2" fill="currentColor" />
    </svg>
);
const YesNoIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-5 h-5"
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l2 2 4-4" />
    </svg>
);
const CustomIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-5 h-5"
    >
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
const ImageUploadIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-8 h-8"
    >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
    </svg>
);
const XIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

function charCountColor(current, max) {
    const pct = current / max;
    if (pct >= 0.95) return "text-red-500 font-bold";
    if (pct >= 0.8) return "text-amber-500 font-semibold";
    return "text-gray-400";
}

function StepIndicator({ step, totalSteps }) {
    return (
        <div className="flex items-center justify-center gap-2 py-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === i + 1 ? "bg-cp text-white shadow-md " : step > i + 1 ? "bg-green-500 text-white" : "bg-muted text-gray-400"}`}
                    >
                        {step > i + 1 ? "✓" : i + 1}
                    </div>
                    {i < totalSteps - 1 && (
                        <div
                            className={`w-8 h-0.5 rounded-full transition-all duration-500 ${step > i + 1 ? "bg-green-400" : "bg-muted"}`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

function IssueSubcategoryCard({ subcategory, selected, onSelect }) {
    return (
        <button
            onClick={() => onSelect(subcategory.id)}
            className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative ${selected ? `${subcategory.selectedBg} ${subcategory.selectedBorder}` : "border-subtle bg-white hover:border-theme"}`}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl transition-colors ${selected ? "bg-white shadow-sm" : "bg-subtle"}`}
                >
                    {subcategory.emoji}
                </div>
                <div className="flex-1 min-w-0">
                    <span
                        className={`font-bold text-sm block ${selected ? subcategory.selectedText : "text-gray-900"}`}
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        {subcategory.label}
                    </span>
                    <p
                        className="text-xs text-gray-400 mt-0.5 leading-tight"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        {subcategory.description}
                    </p>
                </div>
                {selected && (
                    <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: subcategory.dotColor }}
                    >
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
                    </div>
                )}
            </div>
        </button>
    );
}

function ImageUploadSection({ images, onImagesChange, maxImages = 3 }) {
    const fileInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFiles = (files) => {
        const validFiles = Array.from(files).filter((f) => {
            if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
                toast.error(`${f.name}: Only JPG, PNG, WebP, GIF allowed`);
                return false;
            }
            if (f.size > MAX_IMAGE_SIZE_BYTES) {
                toast.error(`${f.name}: Max ${MAX_IMAGE_SIZE_MB}MB per image`);
                return false;
            }
            return true;
        });
        const remaining = maxImages - images.length;
        const toAdd = validFiles
            .slice(0, remaining)
            .map((file) => ({
                file,
                preview: URL.createObjectURL(file),
                id: `${Date.now()}-${Math.random()}`,
            }));
        onImagesChange([...images, ...toAdd]);
    };

    const removeImage = (id) => {
        const img = images.find((i) => i.id === id);
        if (img?.preview) URL.revokeObjectURL(img.preview);
        onImagesChange(images.filter((i) => i.id !== id));
    };

    return (
        <div className="bg-card rounded-2xl border border-subtle p-4">
            <label
                className="block text-sm font-semibold text-gray-800 mb-3"
                style={{ fontFamily: "DM Sans, sans-serif" }}
            >
                📷 Add Photos{" "}
                <span className="text-xs font-normal text-gray-400">
                    (optional, max {maxImages})
                </span>
            </label>
            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {images.map((img) => (
                        <div
                            key={img.id}
                            className="relative aspect-square rounded-xl overflow-hidden bg-muted"
                        >
                            <Image
                                src={img.preview}
                                alt="preview"
                                width={1200}
                                height={480}
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={() => removeImage(img.id)}
                                className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer"
                            >
                                <XIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {images.length < maxImages && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        handleFiles(e.dataTransfer.files);
                    }}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${dragOver ? "border-cp bg-cp-tint" : "border-theme hover:border-cp/40 hover:bg-cp-tint/30"}`}
                >
                    <div
                        className={`${dragOver ? "text-cp" : "text-gray-300"} transition-colors`}
                    >
                        <ImageUploadIcon />
                    </div>
                    <p
                        className="text-sm font-semibold text-gray-500"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        {dragOver ? "Drop to add photo" : "Tap to upload photo"}
                    </p>
                    <p className="text-xs text-gray-400">
                        JPG, PNG, WebP · Max {MAX_IMAGE_SIZE_MB}MB each
                    </p>
                    <p className="text-xs text-gray-300">
                        {images.length}/{maxImages} added
                    </p>
                </div>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
        </div>
    );
}

function DemographicCard({ option, selected, onToggle }) {
    return (
        <button
            onClick={() => onToggle(option.id)}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative ${selected ? "border-cp bg-cp-tint" : "border-subtle bg-white hover:border-cp/30"}`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-cp" : "bg-muted"}`}
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
                            className={`font-bold text-sm ${selected ? "text-cp" : "text-gray-900"}`}
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
        </button>
    );
}

function ResponseTypeCard({ type, selected, onSelect }) {
    const icons = {
        agreement: <ScaleIcon />,
        yesno: <YesNoIcon />,
        custom: <CustomIcon />,
    };
    return (
        <button
            onClick={() => onSelect(type.id)}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${selected ? "border-cp bg-cp-tint ring-2 ring-gray-200" : "border-subtle bg-white hover:border-cp/30"}`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-cp text-white" : "bg-muted text-gray-500"}`}
                >
                    {icons[type.id]}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className={`font-bold text-sm ${selected ? "text-cp" : "text-gray-900"}`}
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            {type.label}
                        </span>
                    </div>
                    <p
                        className="text-xs text-gray-400 mb-2"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        {type.description}
                    </p>
                    {type.options.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {type.options.map((opt, i) => (
                                <span
                                    key={i}
                                    className={`text-[10px] px-2 py-0.5 rounded-full ${selected ? "bg-cp-tint text-cp" : "bg-muted text-gray-500"}`}
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

function AuthErrorPrompt({ error, onRetry }) {
    return (
        <div className="min-h-screen bg-page flex items-center justify-center px-4">
            <div className="bg-card rounded-3xl shadow-lg border border-red-100 p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🔒</span>
                </div>
                <h2
                    className="text-2xl font-bold text-gray-900 mb-2"
                    style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                    Authentication Error
                </h2>
                <p
                    className="text-gray-500 text-sm mb-6"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    {error || "Unable to authenticate."}
                </p>
                <button
                    onClick={onRetry}
                    className="w-full py-3.5 rounded-2xl font-bold text-base bg-cp text-white cursor-pointer mb-3"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    Retry
                </button>
                <p
                    className="text-xs text-gray-400"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    If the problem persists, try{" "}
                    <Link
                        href="/login"
                        className="text-cp font-semibold hover:underline cursor-pointer"
                    >
                        signing in manually
                    </Link>
                </p>
            </div>
        </div>
    );
}

function LoginPrompt({ onLogin }) {
    return (
        <div className="min-h-screen bg-page flex items-center justify-center px-4">
            <div className="bg-card rounded-3xl shadow-lg border border-subtle p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-cp-tint rounded-full flex items-center justify-center mx-auto mb-4">
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
                    Please sign in to post and join the camp conversation.
                </p>
                <button
                    onClick={onLogin}
                    className="w-full py-3.5 rounded-2xl font-bold text-base bg-cp text-white cursor-pointer"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
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
                        className="text-cp font-semibold hover:underline cursor-pointer"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CreatePostPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [profileComplete, setProfileComplete] = useState(null); // null = loading
    const [showIncompleteModal, setShowIncompleteModal] = useState(false);

    const authSucceededRef = useRef(false);
    const timeoutRef = useRef(null);

    const initAuth = useCallback(async () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        authSucceededRef.current = false;
        setIsInitializing(true);
        setAuthError(null);
        setAuthReady(false);

        timeoutRef.current = setTimeout(() => {
            if (!authSucceededRef.current) {
                setIsInitializing(false);
                setAuthError(
                    "Authentication timeout. Please check your internet connection and try again.",
                );
            }
        }, 10000);

        try {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    authSucceededRef.current = true;
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }
                    setCurrentUser(user);
                    setAuthReady(true);
                    setIsInitializing(false);

                    // Check profile completion
                    if (!user.isAnonymous) {
                        try {
                            const snap = await getDoc(
                                doc(db, "users", user.uid),
                            );
                            if (snap.exists()) {
                                setProfileComplete(
                                    isProfileComplete(snap.data()),
                                );
                            } else {
                                setProfileComplete(false);
                            }
                        } catch {
                            setProfileComplete(false);
                        }
                    }
                } else {
                    try {
                        await signInAnonymously(auth);
                    } catch (anonErr) {
                        authSucceededRef.current = true;
                        if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current);
                            timeoutRef.current = null;
                        }
                        setAuthError(
                            `Anonymous sign-in failed: ${anonErr.message}`,
                        );
                        setAuthReady(true);
                        setIsInitializing(false);
                    }
                }
            });
            return () => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                unsubscribe();
            };
        } catch (err) {
            authSucceededRef.current = true;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            setAuthError(err.message);
            setAuthReady(true);
            setIsInitializing(false);
        }
    }, []);

    useEffect(() => {
        const cleanup = initAuth();
        return () => {
            if (typeof cleanup === "function") cleanup();
        };
    }, [initAuth]);

    // Show incomplete modal when we know profile is not complete and user is logged in non-anon
    useEffect(() => {
        if (
            profileComplete === false &&
            currentUser &&
            !currentUser.isAnonymous
        ) {
            setShowIncompleteModal(true);
        }
    }, [profileComplete, currentUser]);

    const handleLoginClick = () =>
        router.push(
            `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
        );
    const handleRetryAuth = () => initAuth();

    if (isInitializing && !authReady) {
        return (
            <div className="min-h-screen bg-page flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <SpinnerIcon />
                    <p
                        className="text-sm text-gray-500"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        Connecting...
                    </p>
                </div>
            </div>
        );
    }
    if (authError)
        return <AuthErrorPrompt error={authError} onRetry={handleRetryAuth} />;
    if (!currentUser) return <LoginPrompt onLogin={handleLoginClick} />;

    return (
        <>
            <ProfileIncompleteModal
                isOpen={showIncompleteModal}
                onClose={() => {
                    setShowIncompleteModal(false);
                    router.back();
                }}
                action="create posts"
            />
            <CreatePostForm
                currentUser={currentUser}
                router={router}
                profileComplete={profileComplete}
                onProfileIncomplete={() => setShowIncompleteModal(true)}
            />
        </>
    );
}

async function uploadImages(images) {
    const uploads = images.map(async (img) => {
        const url = await uploadImage(img.file);
        return url;
    });

    return Promise.all(uploads);
}

function CreatePostForm({
    currentUser,
    router,
    profileComplete,
    onProfileIncomplete,
}) {
    const [postType, setPostType] = useState("");
    const [issueSubcategory, setIssueSubcategory] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [foodRating, setFoodRating] = useState(0);
    const [pollOptions, setPollOptions] = useState(["", ""]);
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [responseType, setResponseType] = useState("");
    const [customOptions, setCustomOptions] = useState(["", ""]);
    const [selectedDemographics, setSelectedDemographics] = useState([]);
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [uploadProgress, setUploadProgress] = useState("");
    const [pollTimerEnabled, setPollTimerEnabled] = useState(false);
    const [pollTimerHours, setPollTimerHours] = useState(24);
    const [pollTimerUnit, setPollTimerUnit] = useState("hours");
    const [pollTimerCustomVal, setPollTimerCustomVal] = useState("");
    const [images, setImages] = useState([]);
    const [locationLabel, setLocationLabel] = useState("");
    const [locationCoords, setLocationCoords] = useState(null);
    const [locating, setLocating] = useState(false);
    const preUploadRef = useRef(null);
    const preUploadedUrlsRef = useRef(null);
    const preUploadImagesRef = useRef([]);

    // Start uploading images in the background as soon as they are selected
    useEffect(() => {
        const shouldUpload = images.length > 0 && (postType === "food" || postType === "issue" || postType === "lost_found");
        if (!shouldUpload) {
            preUploadRef.current = null;
            preUploadedUrlsRef.current = null;
            preUploadImagesRef.current = [];
            return;
        }
        // Don't re-upload if the same set of images is already pending/done
        if (preUploadImagesRef.current === images) return;
        preUploadImagesRef.current = images;
        preUploadedUrlsRef.current = null;
        const promise = uploadImages(images).then((urls) => {
            if (preUploadImagesRef.current === images) {
                preUploadedUrlsRef.current = urls;
            }
            return urls;
        }).catch(() => null);
        preUploadRef.current = promise;
    }, [images, postType]);

    const selectedType = POST_TYPES.find((t) => t.id === postType);
    const selectedResponseType = RESPONSE_TYPES.find(
        (t) => t.id === responseType,
    );
    const selectedSubcategory = ISSUE_SUBCATEGORIES.find(
        (s) => s.id === issueSubcategory,
    );
    const step1Valid = postType.length > 0;

    // Polls and lost & found skip the response-type step: a poll's options ARE
    // its responses (entered in step 2), and lost & found has no vote at all.
    const skipsResponseType =
        postType === "poll" || postType === "lost_found";

    const totalSteps = skipsResponseType ? 3 : 4;
    // Internal step state keeps 1, 2, 4 for skipped flows (step 3 is bypassed);
    // displayStep renumbers them to 1, 2, 3 for the indicator and header.
    const displayStep = skipsResponseType && step === 4 ? 3 : step;

    const step2Valid = () => {
        const baseValid = title.trim().length > 0;
        switch (postType) {
            case "gist":
                return baseValid;
            case "poll":
                return (
                    baseValid && pollOptions.filter((o) => o.trim()).length >= 2
                );
            case "food":
                return baseValid && foodRating > 0;
            case "issue":
                return (
                    baseValid &&
                    description.trim().length > 0 &&
                    issueSubcategory.length > 0
                );
            case "lost_found":
                return baseValid && description.trim().length > 0;
            default:
                return false;
        }
    };

    const step3Valid = () => {
        // lost_found and poll don't use the response-type step
        if (postType === "lost_found" || postType === "poll") return true;
        if (!responseType) return false;
        if (responseType === "custom")
            return customOptions.filter((o) => o.trim()).length >= 2;
        return true;
    };

    const step4Valid = selectedDemographics.length > 0;

    const updatePollOption = (i, val) => {
        const next = [...pollOptions];
        next[i] = val;
        setPollOptions(next);
    };
    const addPollOption = () => {
        if (pollOptions.length < 4) setPollOptions([...pollOptions, ""]);
    };
    const removePollOption = (i) => {
        if (pollOptions.length > 2)
            setPollOptions(pollOptions.filter((_, idx) => idx !== i));
    };

    const updateCustomOption = (i, val) => {
        const next = [...customOptions];
        next[i] = val;
        setCustomOptions(next);
    };
    const addCustomOption = () => {
        if (customOptions.length < 6) setCustomOptions([...customOptions, ""]);
    };
    const removeCustomOption = (i) => {
        if (customOptions.length > 2)
            setCustomOptions(customOptions.filter((_, idx) => idx !== i));
    };

    const toggleDemographic = (id) =>
        setSelectedDemographics((prev) =>
            prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
        );

    const getVoteOptions = () => {
        // A poll's vote options are the options typed in step 2.
        if (postType === "poll") return pollOptions.filter((o) => o.trim());
        switch (responseType) {
            case "agreement":
                return [
                    "Strongly Disagree",
                    "Disagree",
                    "Neutral",
                    "Agree",
                    "Strongly Agree",
                ];
            case "yesno":
                return ["Yes", "No"];
            case "custom":
                return customOptions.filter((o) => o.trim());
            default:
                return [];
        }
    };

    const handleSubmit = async () => {
        if (!step2Valid() || !step3Valid() || !step4Valid || saving) return;

        // Gate: must have complete profile
        if (!profileComplete) {
            onProfileIncomplete();
            return;
        }

        setSaving(true);
        setSaveError("");
        setUploadProgress("");

        try {
            let userPlatoon = null;
            let userName = currentUser.displayName || "Corper";
            try {
                const userSnap = await getDoc(
                    doc(db, "users", currentUser.uid),
                );
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    userPlatoon = userData?.platoon ?? null;
                    if (userData?.fullName) userName = userData.fullName;
                    else if (userData?.displayName)
                        userName = userData.displayName;
                }
            } catch (profileErr) {
                console.warn("Could not fetch user profile:", profileErr);
            }

            let finalDescription = description;
            let finalTitle = title;
            if (postType === "food") {
                const stars = "⭐".repeat(foodRating);
                finalDescription = `${stars}\n\n${description}`;
            }

            const voteOptions = getVoteOptions();
            const tempRef = doc(collection(db, "issues"));
            const postId = tempRef.id;

            let imageUrls = [];
            if (images.length > 0 && (postType === "food" || postType === "issue" || postType === "lost_found")) {
                if (preUploadedUrlsRef.current) {
                    // Already uploaded in background — instant!
                    imageUrls = preUploadedUrlsRef.current;
                } else if (preUploadRef.current) {
                    // Upload is in progress — just await it
                    setUploadProgress("Finalizing images…");
                    imageUrls = (await preUploadRef.current) ?? [];
                    setUploadProgress("");
                } else {
                    // Fallback: upload now
                    setUploadProgress(`Uploading ${images.length} image${images.length > 1 ? "s" : ""}…`);
                    imageUrls = await uploadImages(images);
                    setUploadProgress("");
                }
            }

            let issueData = {
                type: postType,
                category: postType === "issue" ? issueSubcategory : postType,
                subcategory: postType === "issue" ? issueSubcategory : null,
                title: finalTitle.trim(),
                description: finalDescription.trim(),
                images: imageUrls,
                author: {
                    uid: currentUser.uid,
                    name: isAnonymous ? null : userName,
                    photoURL: isAnonymous ? null : (currentUser.photoURL || null),
                    isAnonymous,
                    showDetails: !isAnonymous && showDetails,
                    platoon: userPlatoon,
                },
                locationTag: locationLabel.trim()
                    ? { label: locationLabel.trim(), lat: locationCoords?.lat || null, lng: locationCoords?.lng || null }
                    : null,
                reactions: {},
                commentCount: 0,
                voteOptions,
                responseType: postType === "poll" ? "custom" : responseType,
                demographics: selectedDemographics,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                votes: {},
                totalVotes: 0,
                upvotes: 0,
                status: "new",
                pollDeadline:
                    postType === "poll" && pollTimerEnabled
                        ? new Date(Date.now() + pollTimerHours * 60 * 60 * 1000)
                        : null,
                pollTimerEnabled:
                    postType === "poll" ? pollTimerEnabled : false,
            };

            switch (postType) {
                case "poll":
                    issueData.pollOptions = pollOptions.filter((o) => o.trim());
                    issueData.pollVotes = {};
                    break;
                case "food":
                    issueData.foodRating = foodRating;
                    break;
            }

            const { setDoc } = await import("firebase/firestore");
            await setDoc(tempRef, issueData);
            const issueRef = tempRef;

            await createNotification({
                type: NOTIFICATION_TYPES.ISSUE_CREATED,
                recipientId: currentUser.uid,
                actorId: "system",
                actorName: "Camp Voice",
                issueId: issueRef.id,
                issueTitle: finalTitle.trim(),
                meta: `Your ${selectedType?.label} "${finalTitle.trim()}" is now live! 🎉`,
            });

            const userRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.exists() ? userDoc.data() : null;
            const batch = writeBatch(db);
            const now = serverTimestamp();

            if (userData) {
                batch.update(userRef, {
                    postsCount: (userData.postsCount || 0) + 1,
                    lastActive: now,
                });
            } else {
                batch.set(userRef, {
                    uid: currentUser.uid,
                    displayName: currentUser.displayName || "User",
                    email: currentUser.email,
                    photoURL: currentUser.photoURL || null,
                    createdAt: now,
                    postsCount: 1,
                    isOnline: true,
                });
            }
            await batch.commit();
            // Fire-and-forget — don't let gamification errors block the post
            awardPointsViaApi(currentUser, currentUser.uid, "CREATE_ISSUE", {
                issueId: issueRef.id,
                issueTitle: finalTitle.trim(),
            });

            toast.success("Posted to camp! 🔥");
            router.push("/");
        } catch (err) {
            console.error("Firestore error:", err);
            if (err.code === "permission-denied") {
                setSaveError(
                    "Permission denied. Please make sure you're signed in and try again.",
                );
            } else {
                setSaveError(
                    err.message || "Something went wrong. Please try again.",
                );
            }
            setSaving(false);
            setUploadProgress("");
        }
    };

    const showImageUpload = postType === "food" || postType === "issue" || postType === "lost_found";

    return (
        <div className="min-h-screen bg-page pb-24 md:pb-8">
            <header className="sticky top-0 z-40 bg-cp px-4 pt-6 md:pt-4 pb-3">
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
                                ? "What do you want to drop?"
                                : step === 2
                                  ? `Drop a ${selectedType?.label}`
                                  : step === 3
                                    ? "Response Type"
                                    : "Demographics"}
                        </h1>
                        <p
                            className="text-white/80 text-xs"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Step {displayStep} of {totalSteps}
                        </p>
                    </div>
                </div>
                <div className="max-w-2xl mx-auto">
                    <StepIndicator step={displayStep} totalSteps={totalSteps} />
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 md:px-6">
                {/* Profile incomplete warning banner */}
                {profileComplete === false && (
                    <div className="mt-4 mb-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                        <span className="text-xl">🔒</span>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-red-700">
                                Profile incomplete
                            </p>
                            <p className="text-xs text-red-500">
                                Complete your profile to create posts
                            </p>
                        </div>
                        <Link
                            href="/profile/edit"
                            className="text-xs font-bold text-white bg-red-500 px-3 py-1.5 rounded-lg"
                        >
                            Fix it
                        </Link>
                    </div>
                )}

                {/* ══ STEP 1 ══ */}
                {step === 1 && (
                    <>
                        <div className="flex flex-col items-center pt-6 pb-6">
                            <div className="w-24 h-24 bg-cp-tint rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md">
                                <span className="text-4xl">🎯</span>
                            </div>
                            <h2
                                className="text-xl font-bold text-gray-900 text-center"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                Choose your vibe
                            </h2>
                            <p
                                className="text-gray-500 text-sm text-center mt-1 max-w-xs"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                What are you sharing with the camp today?
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {POST_TYPES.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setPostType(type.id)}
                                    className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer ${postType === type.id ? `${type.bg} ${type.border} ring-2 ring-offset-2` : "bg-white border-subtle hover:border-theme"}`}
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    <div className="text-3xl mb-2">
                                        {type.emoji}
                                    </div>
                                    <div
                                        className={`font-bold text-sm mb-1 ${postType === type.id ? "text-gray-900" : "text-gray-700"}`}
                                    >
                                        {type.label}
                                    </div>
                                    <div className="text-xs text-gray-500 leading-tight">
                                        {type.description}
                                    </div>
                                    {postType === type.id && (
                                        <div className="mt-2 flex justify-end">
                                            <div
                                                className="w-5 h-5 rounded-full flex items-center justify-center"
                                                style={{
                                                    backgroundColor: type.color,
                                                }}
                                            >
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
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                if (!profileComplete) {
                                    onProfileIncomplete();
                                    return;
                                }
                                step1Valid && setStep(2);
                            }}
                            disabled={!step1Valid}
                            className={`w-full mt-6 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${step1Valid ? "btn-primary shadow-lg active:scale-[0.98]" : "bg-muted text-gray-400 cursor-not-allowed"}`}
                            style={{
                                fontFamily: "DM Sans, sans-serif",
                                boxShadow: step1Valid
                                    ? "0 4px 20px var(--cp-glow)"
                                    : undefined,
                            }}
                        >
                            Continue
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
                    </>
                )}

                {/* ══ STEP 2 ══ */}
                {step === 2 && selectedType && (
                    <>
                        <div className="flex flex-col items-center pt-6 pb-4">
                            <div
                                className={`w-20 h-20 ${selectedType.bg} rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md`}
                            >
                                <span className="text-3xl">
                                    {selectedType.emoji}
                                </span>
                            </div>
                            <h2
                                className="text-lg font-bold text-gray-900 text-center"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                Drop your {selectedType.label}
                            </h2>
                        </div>

                        {postType === "poll" && (
                            <div className="bg-card rounded-2xl border border-subtle p-4 mb-3">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">⏱️</span>
                                        <span
                                            className="text-sm font-semibold text-gray-800"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            Set voting deadline
                                        </span>
                                    </div>
                                    <div
                                        onClick={() =>
                                            setPollTimerEnabled(
                                                !pollTimerEnabled,
                                            )
                                        }
                                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${pollTimerEnabled ? "bg-cp" : "bg-gray-200"}`}
                                    >
                                        <div
                                            className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${pollTimerEnabled ? "translate-x-5" : "translate-x-0.5"}`}
                                        />
                                    </div>
                                </div>
                                {pollTimerEnabled && (
                                    <div className="mt-4">
                                        <p
                                            className="text-xs font-semibold text-gray-500 mb-2"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            Duration presets
                                        </p>
                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                            {[
                                                { label: "1 hour", hours: 1 },
                                                { label: "3 hours", hours: 3 },
                                                { label: "6 hours", hours: 6 },
                                                {
                                                    label: "12 hours",
                                                    hours: 12,
                                                },
                                                { label: "1 day", hours: 24 },
                                                { label: "3 days", hours: 72 },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.hours}
                                                    onClick={() =>
                                                        setPollTimerHours(
                                                            opt.hours,
                                                        )
                                                    }
                                                    className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${pollTimerHours === opt.hours ? "border-cp bg-cp-tint text-cp" : "border-subtle bg-subtle text-gray-500 hover:border-cp/30"}`}
                                                    style={{
                                                        fontFamily:
                                                            "DM Sans, sans-serif",
                                                    }}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                value={pollTimerCustomVal}
                                                placeholder="e.g. 2"
                                                className="flex-1 px-3 py-2 rounded-xl border border-subtle bg-subtle text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-300"
                                                style={{
                                                    fontFamily:
                                                        "DM Sans, sans-serif",
                                                }}
                                                onChange={(e) => {
                                                    const v = parseInt(
                                                        e.target.value,
                                                    );
                                                    setPollTimerCustomVal(
                                                        e.target.value,
                                                    );
                                                    if (v > 0)
                                                        setPollTimerHours(
                                                            pollTimerUnit ===
                                                                "days"
                                                                ? v * 24
                                                                : v,
                                                        );
                                                }}
                                            />
                                            <select
                                                value={pollTimerUnit}
                                                onChange={(e) => {
                                                    setPollTimerUnit(
                                                        e.target.value,
                                                    );
                                                    const v =
                                                        parseInt(
                                                            pollTimerCustomVal,
                                                        );
                                                    if (v > 0)
                                                        setPollTimerHours(
                                                            e.target.value ===
                                                                "days"
                                                                ? v * 24
                                                                : v,
                                                        );
                                                }}
                                                className="px-3 py-2 rounded-xl border border-subtle bg-subtle text-sm text-gray-700 focus:outline-none focus:border-gray-300"
                                                style={{
                                                    fontFamily:
                                                        "DM Sans, sans-serif",
                                                }}
                                            >
                                                <option value="hours">
                                                    hours
                                                </option>
                                                <option value="days">
                                                    days
                                                </option>
                                            </select>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-cp-tint rounded-xl border border-cp/20">
                                            <span className="text-sm">⏳</span>
                                            <span
                                                className="text-xs font-semibold text-cp"
                                                style={{
                                                    fontFamily:
                                                        "DM Sans, sans-serif",
                                                }}
                                            >
                                                Voting closes in{" "}
                                                {pollTimerHours < 24
                                                    ? `${pollTimerHours}h`
                                                    : `${pollTimerHours / 24}d`}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {postType === "issue" && (
                            <div className="mb-4">
                                <div className="bg-card rounded-2xl border border-subtle p-4">
                                    <label
                                        className="block text-sm font-semibold text-gray-800 mb-3"
                                        style={{
                                            fontFamily: "DM Sans, sans-serif",
                                        }}
                                    >
                                        Issue Category{" "}
                                        <span className="text-red-400">*</span>
                                        <span className="text-xs font-normal text-gray-400 ml-1">
                                            (pick one)
                                        </span>
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {ISSUE_SUBCATEGORIES.map((sub) => (
                                            <IssueSubcategoryCard
                                                key={sub.id}
                                                subcategory={sub}
                                                selected={
                                                    issueSubcategory === sub.id
                                                }
                                                onSelect={setIssueSubcategory}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-card rounded-2xl border border-subtle p-4 mb-3">
                            <label
                                className="block text-sm font-semibold text-gray-800 mb-2"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {selectedType.titleLabel}{" "}
                                <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={selectedType.titlePlaceholder}
                                maxLength={MAX_TITLE}
                                className="w-full p-3 bg-subtle rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            />
                            <div
                                className={`text-right text-xs mt-1 ${charCountColor(title.length, MAX_TITLE)}`}
                            >
                                {title.length}/{MAX_TITLE}
                            </div>
                        </div>

                        {postType === "food" && (
                            <div className="bg-card rounded-2xl border border-subtle p-4 mb-3">
                                <label
                                    className="block text-sm font-semibold text-gray-800 mb-3"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    Rating{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <div className="flex items-center gap-2 justify-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setFoodRating(star)}
                                            className="transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                                        >
                                            <StarIcon
                                                filled={star <= foodRating}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <div className="text-center text-xs text-gray-500 mt-2">
                                    {foodRating === 0
                                        ? "Tap to rate"
                                        : foodRating === 1
                                          ? "Terrible 💀"
                                          : foodRating === 2
                                            ? "Not great 😕"
                                            : foodRating === 3
                                              ? "Okay 😐"
                                              : foodRating === 4
                                                ? "Good 😋"
                                                : "Amazing! 🤤"}
                                </div>
                            </div>
                        )}

                        {postType === "poll" && (
                            <div className="bg-card rounded-2xl border border-subtle p-4 mb-3">
                                <label
                                    className="block text-sm font-semibold text-gray-800 mb-2"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    Poll Options{" "}
                                    <span className="text-red-400">*</span>
                                    <span className="text-xs font-normal text-gray-400 ml-1">
                                        (min 2, max 4)
                                    </span>
                                </label>
                                <div className="space-y-2">
                                    {pollOptions.map((opt, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
                                                {String.fromCharCode(65 + i)}
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
                                                className="flex-1 px-3 py-2 rounded-xl border border-subtle bg-subtle text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-300"
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
                                {pollOptions.length < 4 && (
                                    <button
                                        onClick={addPollOption}
                                        className="mt-3 w-full py-2 rounded-xl border-2 border-dashed border-purple-200 text-purple-500 text-sm flex items-center justify-center gap-1.5 hover:border-purple-400 hover:text-purple-600 transition-colors cursor-pointer"
                                        style={{
                                            fontFamily: "DM Sans, sans-serif",
                                        }}
                                    >
                                        <PlusIcon /> Add option (
                                        {pollOptions.length}/4)
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="bg-card rounded-2xl border border-subtle p-4 mb-3">
                            <label
                                className="block text-sm font-semibold text-gray-800 mb-2"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {selectedType.descLabel}
                                {postType === "issue" && (
                                    <span className="text-red-400">*</span>
                                )}
                                {(postType === "gist" ||
                                    postType === "poll") && (
                                    <span className="text-xs font-normal text-gray-400">
                                        {" "}
                                        (optional)
                                    </span>
                                )}
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={selectedType.descPlaceholder}
                                rows={postType === "gist" ? 8 : 5}
                                maxLength={MAX_DESC}
                                className="w-full p-3 bg-subtle rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            />
                            <div
                                className={`text-right text-xs mt-1 ${charCountColor(description.length, MAX_DESC)}`}
                            >
                                {description.length}/{MAX_DESC}
                            </div>
                        </div>

                        {/* Location tag (optional) */}
                        <div className="bg-card rounded-2xl border border-subtle p-4 mb-3">
                            <label className="block text-sm font-semibold text-gray-800 mb-2" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                📍 Location Tag <span className="text-xs font-normal text-gray-400">(optional)</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={locationLabel}
                                    onChange={(e) => setLocationLabel(e.target.value)}
                                    placeholder="e.g. Near Mammy Market, Block C"
                                    maxLength={60}
                                    className="flex-1 p-3 bg-subtle rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                    style={{ fontFamily: "DM Sans, sans-serif" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!navigator.geolocation) return;
                                        setLocating(true);
                                        navigator.geolocation.getCurrentPosition(
                                            (pos) => {
                                                setLocationCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                                                if (!locationLabel.trim()) setLocationLabel("Current location");
                                                setLocating(false);
                                            },
                                            () => setLocating(false),
                                            { timeout: 8000 }
                                        );
                                    }}
                                    className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                                    title="Use current GPS location"
                                >
                                    {locating ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg> : "📡"}
                                    {locating ? "" : "GPS"}
                                </button>
                            </div>
                            {locationCoords && (
                                <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                                    ✓ GPS coordinates captured
                                    <button type="button" onClick={() => setLocationCoords(null)} className="text-gray-400 hover:text-red-400 ml-1 cursor-pointer">✕</button>
                                </p>
                            )}
                        </div>

                        {showImageUpload && (
                            <div className="mb-3">
                                <ImageUploadSection
                                    images={images}
                                    onImagesChange={setImages}
                                    maxImages={3}
                                />
                            </div>
                        )}

                        <div className="bg-card rounded-2xl border border-subtle p-4 mt-1 space-y-3">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <AnonymousIcon />
                                    <span
                                        className="text-sm font-medium text-gray-700"
                                        style={{
                                            fontFamily: "DM Sans, sans-serif",
                                        }}
                                    >
                                        Post anonymously 🕶️
                                    </span>
                                </div>
                                <div
                                    className={`w-11 h-6 rounded-full transition-colors ${isAnonymous ? "bg-cp" : "bg-gray-200"} relative cursor-pointer`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isAnonymous}
                                        onChange={(e) => {
                                            setIsAnonymous(e.target.checked);
                                            if (e.target.checked)
                                                setShowDetails(false);
                                        }}
                                        className="sr-only"
                                    />
                                    <div
                                        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${isAnonymous ? "translate-x-5" : "translate-x-0.5"}`}
                                    />
                                </div>
                            </label>
                            {!isAnonymous && (
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <EyeIcon />
                                        <span
                                            className="text-sm font-medium text-gray-700"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            Show my details
                                        </span>
                                    </div>
                                    <div
                                        className={`w-11 h-6 rounded-full transition-colors ${showDetails ? "bg-cp" : "bg-gray-200"} relative cursor-pointer`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={showDetails}
                                            onChange={(e) =>
                                                setShowDetails(e.target.checked)
                                            }
                                            className="sr-only"
                                        />
                                        <div
                                            className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${showDetails ? "translate-x-5" : "translate-x-0.5"}`}
                                        />
                                    </div>
                                </label>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-4 rounded-2xl font-bold text-sm text-gray-500 hover:text-gray-700 border-2 border-theme hover:border-gray-300 transition-all duration-200 cursor-pointer"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                ← Back
                            </button>
                            <button
                                onClick={() => step2Valid() && setStep(skipsResponseType ? 4 : 3)}
                                disabled={!step2Valid()}
                                className={`flex-[3] py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${step2Valid() ? "btn-primary shadow-lg active:scale-[0.98]" : "bg-muted text-gray-400 cursor-not-allowed"}`}
                                style={{
                                    fontFamily: "DM Sans, sans-serif",
                                    boxShadow: step2Valid()
                                        ? "0 4px 20px var(--cp-glow)"
                                        : undefined,
                                }}
                            >
                                {skipsResponseType
                                    ? "Next — Demographics"
                                    : "Next — Response Type"}
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
                    </>
                )}

                {/* ══ STEP 3 ══ */}
                {step === 3 && (
                    <>
                        <div className="flex flex-col items-center pt-6 pb-5">
                            <div className="w-20 h-20 bg-cp-tint rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md">
                                <span className="text-3xl">📊</span>
                            </div>
                            <h2
                                className="text-lg font-bold text-gray-900 text-center"
                                style={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                            >
                                How should people respond?
                            </h2>
                            <p
                                className="text-gray-500 text-sm text-center mt-1 max-w-xs"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Choose the response format for your post
                            </p>
                        </div>
                        <div className="space-y-3 mb-4">
                            {RESPONSE_TYPES.map((type) => (
                                <ResponseTypeCard
                                    key={type.id}
                                    type={type}
                                    selected={responseType === type.id}
                                    onSelect={setResponseType}
                                />
                            ))}
                        </div>
                        {responseType === "custom" && (
                            <div className="bg-card rounded-2xl border border-subtle p-4 mb-4">
                                <label
                                    className="block text-sm font-semibold text-gray-800 mb-2"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    Custom Options{" "}
                                    <span className="text-red-400">*</span>
                                    <span className="text-xs font-normal text-gray-400 ml-1">
                                        (min 2, max 6)
                                    </span>
                                </label>
                                <div className="space-y-2">
                                    {customOptions.map((opt, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-cp-tint text-cp flex items-center justify-center text-xs font-bold shrink-0">
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) =>
                                                    updateCustomOption(
                                                        i,
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={`Option ${i + 1}`}
                                                maxLength={MAX_CUSTOM_OPTION}
                                                className="flex-1 px-3 py-2 rounded-xl border border-subtle bg-subtle text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-300"
                                                style={{
                                                    fontFamily:
                                                        "DM Sans, sans-serif",
                                                }}
                                            />
                                            {customOptions.length > 2 && (
                                                <button
                                                    onClick={() =>
                                                        removeCustomOption(i)
                                                    }
                                                    className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {customOptions.length < 6 && (
                                    <button
                                        onClick={addCustomOption}
                                        className="mt-3 w-full py-2 rounded-xl border-2 border-dashed border-theme text-cp text-sm flex items-center justify-center gap-1.5 hover:border-gray-400 hover:text-cp transition-colors cursor-pointer"
                                        style={{
                                            fontFamily: "DM Sans, sans-serif",
                                        }}
                                    >
                                        <PlusIcon /> Add option (
                                        {customOptions.length}/6)
                                    </button>
                                )}
                            </div>
                        )}
                        {responseType && (
                            <div className="bg-cp-tint rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm">👀</span>
                                    <span
                                        className="text-sm font-bold text-gray-800"
                                        style={{
                                            fontFamily:
                                                "Plus Jakarta Sans, sans-serif",
                                        }}
                                    >
                                        Preview
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {getVoteOptions().map((opt, i) => (
                                        <span
                                            key={i}
                                            className="text-xs px-3 py-1.5 bg-white rounded-lg border border-theme text-gray-700"
                                        >
                                            {opt}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 py-4 rounded-2xl font-bold text-sm text-gray-500 hover:text-gray-700 border-2 border-theme hover:border-gray-300 transition-all duration-200 cursor-pointer"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                ← Back
                            </button>
                            <button
                                onClick={() => step3Valid() && setStep(4)}
                                disabled={!step3Valid()}
                                className={`flex-[3] py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${step3Valid() ? "btn-primary shadow-lg active:scale-[0.98]" : "bg-muted text-gray-400 cursor-not-allowed"}`}
                                style={{
                                    fontFamily: "DM Sans, sans-serif",
                                    boxShadow: step3Valid()
                                        ? "0 4px 20px var(--cp-glow)"
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
                    </>
                )}

                {/* ══ STEP 4 ══ */}
                {step === 4 && (
                    <>
                        <div className="flex flex-col items-center pt-6 pb-5">
                            <div className="w-20 h-20 bg-cp-tint rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md">
                                <span className="text-3xl">📊</span>
                            </div>
                            <h2
                                className="text-lg font-bold text-gray-900 text-center"
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
                                Select which demographics to show in results
                            </p>
                        </div>

                        <div className="bg-white rounded-xl px-4 py-3 mb-4 border border-cp/20">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">
                                    {postType === "issue" && selectedSubcategory
                                        ? selectedSubcategory.emoji
                                        : selectedType?.emoji}
                                </span>
                                <p
                                    className="text-sm text-gray-700 font-medium truncate"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    {title || "Untitled Post"}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                                <span>{selectedType?.emoji}</span>
                                <span>{selectedType?.label}</span>
                                {postType === "issue" &&
                                    selectedSubcategory && (
                                        <>
                                            <span>•</span>
                                            <span
                                                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                                style={{
                                                    backgroundColor: `${selectedSubcategory.dotColor}15`,
                                                    color: selectedSubcategory.dotColor,
                                                }}
                                            >
                                                {selectedSubcategory.label}
                                            </span>
                                        </>
                                    )}
                                {postType === "food" && foodRating > 0 && (
                                    <>
                                        <span>•</span>
                                        <span>{"⭐".repeat(foodRating)}</span>
                                    </>
                                )}
                                {images.length > 0 && (
                                    <>
                                        <span>•</span>
                                        <span>
                                            📷 {images.length} photo
                                            {images.length > 1 ? "s" : ""}
                                        </span>
                                    </>
                                )}
                                <span>•</span>
                                <span>{selectedResponseType?.label}</span>
                                <span>•</span>
                                <span>
                                    {isAnonymous ? "Anonymous" : "Public"}
                                </span>
                                {postType === "poll" && pollTimerEnabled && (
                                    <>
                                        <span>•</span>
                                        <span>
                                            ⏱️{" "}
                                            {pollTimerHours < 24
                                                ? `${pollTimerHours}h`
                                                : `${pollTimerHours / 24}d`}{" "}
                                            deadline
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

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

                        <div className="bg-cp-tint rounded-xl p-4 mb-4">
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
                                    ? "Select at least one demographic to see how different groups engage with your post"
                                    : `You'll see breakdowns by: ${selectedDemographics.map((id) => DEMOGRAPHIC_OPTIONS.find((o) => o.id === id)?.label).join(", ")}`}
                            </p>
                        </div>

                        {saveError && (
                            <div
                                className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-500"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {saveError}
                            </div>
                        )}
                        {uploadProgress && (
                            <div
                                className="mb-4 px-4 py-3 bg-cp-tint border border-cp/20 rounded-xl text-sm text-cp flex items-center gap-2"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                <svg
                                    className="w-4 h-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    />
                                </svg>
                                {uploadProgress}
                            </div>
                        )}

                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setStep(skipsResponseType ? 2 : 3)}
                                disabled={saving}
                                className="flex-1 py-4 rounded-2xl font-bold text-sm text-gray-500 hover:text-gray-700 border-2 border-theme hover:border-gray-300 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!step4Valid || saving}
                                className={`flex-[3] py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${step4Valid && !saving ? "btn-primary shadow-lg active:scale-[0.98]" : "bg-muted text-gray-400 cursor-not-allowed"}`}
                                style={{
                                    fontFamily: "DM Sans, sans-serif",
                                    boxShadow:
                                        step4Valid && !saving
                                            ? "0 4px 20px var(--cp-glow)"
                                            : undefined,
                                }}
                            >
                                {saving ? (
                                    <>
                                        <SpinnerIcon />{" "}
                                        {uploadProgress
                                            ? "Uploading..."
                                            : "Dropping..."}
                                    </>
                                ) : (
                                    <>
                                        <CampIcon /> Drop to Camp 🏕️
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
