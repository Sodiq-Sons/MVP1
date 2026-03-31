// app/profile/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import Link from "next/link";

const ArrowLeftIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
    >
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

const UserIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
    >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const SaveIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
    >
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

const MapPinIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 text-gray-400"
    >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const PhoneIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 text-gray-400"
    >
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
);

const MailIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 text-gray-400"
    >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const InfoIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 text-gray-400"
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

export default function EditProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const [formData, setFormData] = useState({
        displayName: "",
        bio: "",
        location: "",
        phoneNumber: "",
        email: "",
    });

    const [originalData, setOriginalData] = useState({
        displayName: "",
        bio: "",
        location: "",
        phoneNumber: "",
        email: "",
    });

    // Auth states
    const [currentUser, setCurrentUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(true);

    // Auth check
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                setIsAnonymous(user.isAnonymous);
                setAuthReady(true);

                if (!user.isAnonymous) {
                    try {
                        const userDoc = await getDoc(
                            doc(db, "users", user.uid),
                        );
                        let data;
                        if (userDoc.exists()) {
                            const docData = userDoc.data();
                            data = {
                                displayName: docData.displayName || "",
                                bio: docData.bio || "",
                                location:
                                    typeof docData.location === "object"
                                        ? [
                                              docData.location.city,
                                              docData.location.state,
                                              docData.location.country,
                                          ]
                                              .filter(Boolean)
                                              .join(", ")
                                        : docData.location || "",
                                phoneNumber: docData.phoneNumber || "",
                                email: user.email || "",
                            };
                        } else {
                            data = {
                                displayName: user.displayName || "",
                                bio: "",
                                location: "",
                                phoneNumber: "",
                                email: user.email || "",
                            };
                        }
                        setFormData(data);
                        setOriginalData(data);
                        setLoading(false);
                    } catch (error) {
                        console.error("Error fetching user profile:", error);
                        toast.error("Failed to load profile data");
                        setLoading(false);
                    }
                } else {
                    router.push("/login");
                }
            } else {
                router.push("/login");
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Track changes
    useEffect(() => {
        const changed =
            JSON.stringify(formData) !== JSON.stringify(originalData);
        setHasChanges(changed);
    }, [formData, originalData]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!auth.currentUser || !hasChanges) return;

        try {
            setSaving(true);

            // Update Firebase Auth profile
            await updateProfile(auth.currentUser, {
                displayName: formData.displayName,
            });

            // Parse location string into object if it contains commas
            let locationData = formData.location;
            if (formData.location.includes(",")) {
                const parts = formData.location.split(",").map((p) => p.trim());
                locationData = {
                    city: parts[0] || "",
                    state: parts[1] || "",
                    country: parts[2] || "Nigeria",
                };
            }

            // Update Firestore
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
                displayName: formData.displayName,
                bio: formData.bio,
                location: locationData,
                phoneNumber: formData.phoneNumber,
                updatedAt: serverTimestamp(),
            });

            setOriginalData(formData);
            toast.success("Profile updated successfully!");
            router.push("/profile");
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (hasChanges) {
            const confirmed = window.confirm(
                "You have unsaved changes. Are you sure you want to leave?",
            );
            if (!confirmed) return;
        }
        router.push("/profile");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-orange-500"></div>
                    <p className="text-slate-500 text-sm font-medium">
                        Loading profile...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleCancel}
                                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
                            >
                                <ArrowLeftIcon />
                            </button>
                            <h1 className="text-lg font-semibold text-slate-900">
                                Edit Profile
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            {hasChanges && (
                                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                                    Unsaved changes
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                            <span className="text-2xl font-bold">
                                {formData.displayName.charAt(0).toUpperCase() ||
                                    "U"}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                {formData.displayName || "Your Profile"}
                            </h2>
                            <p className="text-sm text-slate-500">
                                Update your personal information
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <UserIcon />
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                                    Personal Information
                                </h3>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Display Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) =>
                                        handleChange(
                                            "displayName",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Bio
                                </label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) =>
                                        handleChange("bio", e.target.value)
                                    }
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none placeholder:text-slate-400"
                                    placeholder="Tell us about yourself, your interests, or what you do..."
                                    maxLength={160}
                                />
                                <div className="flex justify-between mt-2">
                                    <p className="text-xs text-slate-400">
                                        Brief description for your profile
                                    </p>
                                    <p className="text-xs text-slate-400 font-medium">
                                        {formData.bio.length}/160
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <PhoneIcon />
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                                    Contact Information
                                </h3>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Location
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                        <MapPinIcon />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) =>
                                            handleChange(
                                                "location",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                                        placeholder="City, State, Country"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-2 ml-1">
                                    Format: City, State, Country (e.g., Lagos,
                                    Lagos State, Nigeria)
                                </p>
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                        <PhoneIcon />
                                    </div>
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) =>
                                            handleChange(
                                                "phoneNumber",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                                        placeholder="+234 800 000 0000"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                        <MailIcon />
                                    </div>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-medium cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 mt-2 ml-1">
                                    <InfoIcon />
                                    <p className="text-xs text-slate-400">
                                        Email cannot be changed. Contact support
                                        if needed.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 px-6 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !hasChanges}
                            className="flex-1 px-6 py-3.5 rounded-xl bg-linear-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <SaveIcon />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
