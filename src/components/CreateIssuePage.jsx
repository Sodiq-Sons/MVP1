"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
        stroke="#000000"
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
        stroke="#000000"
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
        stroke="#000000"
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
        stroke="#000000"
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
    "F.C.T (Abuja)",
];

export default function CreateIssuePage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [category, setCategory] = useState("");
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (!title.trim()) return;
        setSubmitted(true);
        setTimeout(() => {
            router.push("/");
        }, 2000);
    };

    const selectedCategory = categories.find((c) => c.value === category);

    if (submitted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDF6EF] p-6 text-center pb-24 md:pb-0">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                    <span className="text-4xl">✅</span>
                </div>
                <h2
                    className="text-2xl font-bold text-gray-900 mb-2"
                    style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                    Issue Submitted!
                </h2>
                <p
                    className="text-gray-500 text-md"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    Your voice matters. Redirecting you home...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDF6EF] pb-24 md:pb-8">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#F97316] px-4 pt-6 md:pt-4 pb-4 md:rounded-none">
                <div className="flex items-center gap-3 max-w-2xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
                    >
                        <BackIcon />
                    </button>
                    <h1
                        className="text-white font-bold text-base"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Post a New Issue
                    </h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 md:px-6">
                {/* Hero illustration */}
                <div className="flex flex-col items-center pt-6 pb-4">
                    <div className="w-28 h-28 bg-[#FFF7F2] rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md">
                        <span className="text-5xl">📢</span>
                    </div>
                    <h2
                        className="text-xl font-bold text-gray-900 text-center"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Your Voice Matters!
                    </h2>
                    <span
                        className="text-gray-500 text-md text-center mt-1 max-w-xs inline-flex items-center justify-center"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        Report issues in your community.
                        <br />
                        Let&apos;s make Nigeria better — together
                    </span>
                </div>

                {/* Form card */}
                <div className="bg-white rounded-2xl shadow-card border border-gray-50 overflow-hidden">
                    {/* Issue Title */}
                    <div className="px-4 pt-4 pb-3 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                <PenIcon />
                            </div>
                            <div className="flex-1">
                                <label
                                    className="block text-md font-medium text-black mb-1"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    Issue Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Bad road, No water, School problem"
                                    className="w-full text-md text-black placeholder-gray-350 focus:outline-none bg-transparent"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="px-4 pt-3 pb-3 border-b border-gray-50">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                <DescIcon />
                            </div>
                            <div className="flex-1">
                                <label
                                    className="block text-md font-medium text-black mb-1"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    Describe the Issue
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Tell us what's happening..."
                                    rows={4}
                                    className="w-full text-md text-black placeholder-gray-350 focus:outline-none bg-transparent resize-none"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <button
                        onClick={() => setShowLocationModal(true)}
                        className="w-full px-4 pt-3 pb-3 border-b border-gray-50 flex items-center gap-3 hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
                    >
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                            <LocationIcon />
                        </div>
                        <div className="flex-1">
                            <div
                                className="text-md font-medium text-black mb-0.5"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Location
                            </div>
                            <div
                                className={`text-md cursor-pointer ${location ? "text-gray-800" : "text-gray-400"}`}
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {location || "Select state / LGA / Area"}
                            </div>
                        </div>
                        <ChevronRightIcon />
                    </button>

                    {/* Category */}
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="w-full px-4 pt-3 pb-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
                    >
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                            <CategoryIcon />
                        </div>
                        <div className="flex-1">
                            <div
                                className="text-md font-medium text-black mb-0.5"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Category
                            </div>
                            <div
                                className={`text-md cursor-pointer ${category ? "text-gray-800" : "text-gray-400"}`}
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                {selectedCategory
                                    ? selectedCategory.label
                                    : "Choose issue type"}
                            </div>
                        </div>
                        <ChevronRightIcon />
                    </button>
                </div>

                {/* Character count hint */}
                {description.length > 0 && (
                    <p
                        className="text-xs text-gray-400 mt-2 px-1"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        {description.length} / 500 characters
                    </p>
                )}

                {/* Submit button */}
                <button
                    onClick={handleSubmit}
                    disabled={!title.trim()}
                    className={`w-full mt-5 py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all ${
                        title.trim()
                            ? "bg-[#F97316] hover:bg-[#C2410C] shadow-lg hover:shadow-xl active:scale-[0.98]"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                    style={{
                        fontFamily: "DM Sans, sans-serif",
                        boxShadow: title.trim()
                            ? "0 4px 20px rgba(232,97,26,0.35)"
                            : undefined,
                    }}
                >
                    <SendIcon />
                    Submit Issue
                </button>

                {/* Privacy note */}
                <div className="flex items-center justify-center gap-1.5 mt-3 mb-6">
                    <LockIcon />
                    <span
                        className="text-xs text-black"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        Your post will be public & trackable
                    </span>
                </div>
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
                                    className={`p-3 rounded-xl text-left text-md font-medium transition-all border cursor-pointer ${
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
                                    className={`p-2.5 rounded-xl text-left text-md font-medium transition-all border cursor-pointer ${
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
