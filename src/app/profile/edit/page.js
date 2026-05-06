"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
    onAuthStateChanged,
    updateProfile,
    verifyBeforeUpdateEmail,
    reload,
    EmailAuthProvider,
    reauthenticateWithCredential,
} from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import {
    computeProfileCompletion,
    isProfileComplete,
} from "@/lib/profileCompletion";
import { awardPoints, checkAndAwardBadges } from "@/lib/gamification";

// ─── Nigerian States ───────────────────────────────────────────────────────────
const NIGERIAN_STATES = [
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
    "FCT - Abuja",
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

const INSTITUTION_TYPES = [
    "Public University",
    "Private University",
    "Polytechnic",
    "College of Education",
    "Monotechnic",
    "Other",
];

const RELIGIONS = ["Christianity", "Islam", "Traditional", "Other"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

// ─── Icons ─────────────────────────────────────────────────────────────────────
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
const CheckCircleIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
    >
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
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
        className="w-4 h-4"
    >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);
const LockIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
    >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);

// ─── Re-authenticate Modal ─────────────────────────────────────────────────────
function ReauthModal({ isOpen, onConfirm, onCancel, onSkip }) {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await onConfirm(password);
        } catch (err) {
            if (err.code === "auth/wrong-password") {
                setError("Incorrect password. Please try again.");
            } else if (err.code === "auth/too-many-requests") {
                setError("Too many attempts. Please try again later.");
            } else {
                setError("Authentication failed. Please try again.");
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl">
                <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
                    <LockIcon />
                </div>
                <h2 className="text-lg font-bold text-slate-900 text-center mb-1">
                    Confirm Your Identity
                </h2>
                <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
                    For security, please enter your current password to change
                    your email address.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Current password"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all pr-10"
                            required
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                    {error && (
                        <p className="text-xs text-red-500 font-medium">
                            {error}
                        </p>
                    )}
                    <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
                    >
                        Confirm & Send Verification
                    </button>
                </form>

                <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                    <button
                        onClick={onSkip}
                        className="text-xs text-slate-400 hover:text-orange-500 font-medium transition-colors"
                    >
                        Skip for now — save email to profile only
                    </button>
                    <button
                        onClick={onCancel}
                        className="block w-full mt-2 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Email Verification Modal ──────────────────────────────────────────────────
function EmailVerificationModal({ isOpen, newEmail, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl text-center">
                <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
                    <MailIcon />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                    Verify Your New Email
                </h2>
                <p className="text-xs text-slate-500 mb-3">
                    You are about to change your email to:
                </p>
                <p className="text-sm font-bold text-orange-600 bg-orange-50 rounded-lg py-2 px-3 mb-4 break-all">
                    {newEmail}
                </p>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    A verification link will be sent to this address. You must
                    click the link to confirm the change. Your current email
                    will remain active until verified.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-500/25 hover:bg-orange-600 transition-all"
                    >
                        Send Verification
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {label}
                {required && <span className="text-orange-500 ml-0.5">*</span>}
            </label>
            {children}
            {hint && (
                <p className="text-xs text-slate-400 mt-1.5 ml-1">{hint}</p>
            )}
        </div>
    );
}

// ─── Completion bar ────────────────────────────────────────────────────────────
function CompletionBar({ pct }) {
    const color =
        pct < 40
            ? "#EF4444"
            : pct < 70
              ? "#F59E0B"
              : pct < 100
                ? "#3B82F6"
                : "#22C55E";
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">
                    Profile Completion
                </span>
                <span className="text-sm font-bold" style={{ color }}>
                    {pct}%
                </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
            {pct === 100 && (
                <div className="flex items-center gap-2 mt-3 text-green-600 text-sm font-semibold">
                    <CheckCircleIcon /> Profile complete! You&apos;re verified ✓
                </div>
            )}
            {pct < 100 && (
                <p className="text-xs text-slate-400 mt-2">
                    Complete all fields to unlock voting, posting & earn the{" "}
                    <span className="text-orange-500 font-semibold">
                        Verified Corper
                    </span>{" "}
                    badge 🏅
                </p>
            )}
        </div>
    );
}

// ─── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ icon, title, children }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                        {title}
                    </h3>
                </div>
            </div>
            <div className="p-6 space-y-5">{children}</div>
        </div>
    );
}

const inputCls =
    "w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400 text-sm";
const selectCls =
    "w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm appearance-none cursor-pointer";

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function EditProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [completionPct, setCompletionPct] = useState(0);
    const [wasComplete, setWasComplete] = useState(false);
    const [pendingEmail, setPendingEmail] = useState(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showReauthModal, setShowReauthModal] = useState(false);
    const [emailToConfirm, setEmailToConfirm] = useState("");

    const emptyForm = {
        displayName: "",
        bio: "",
        location: "",
        phoneNumber: "",
        email: "",
        stateOfOrigin: "",
        gender: "",
        institutionType: "",
        campLocation: "",
        religion: "",
    };

    const [formData, setFormData] = useState(emptyForm);
    const [originalData, setOriginalData] = useState(emptyForm);

    useEffect(() => {
        const checkVerifiedEmail = async () => {
            if (auth.currentUser) {
                await reload(auth.currentUser);
                if (
                    auth.currentUser.email !== originalData.email &&
                    auth.currentUser.emailVerified
                ) {
                    setPendingEmail(null);
                    setOriginalData((prev) => ({
                        ...prev,
                        email: auth.currentUser.email,
                    }));
                    toast.success("Email verified and updated successfully!");
                }
            }
        };
        checkVerifiedEmail();
    }, [originalData.email]);

    useEffect(() => {
        const mapped = {
            email: formData.email,
            phone: formData.phoneNumber,
            stateOfOrigin: formData.stateOfOrigin,
            gender: formData.gender,
            institutionType: formData.institutionType,
            campLocation: formData.campLocation,
            religion: formData.religion,
            bio: formData.bio,
        };
        setCompletionPct(computeProfileCompletion(mapped));
    }, [formData]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && !user.isAnonymous) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    let data;
                    if (userDoc.exists()) {
                        const d = userDoc.data();
                        data = {
                            displayName:
                                d.displayName || user.displayName || "",
                            bio: d.bio || "",
                            location:
                                typeof d.location === "object"
                                    ? [
                                          d.location.city,
                                          d.location.state,
                                          d.location.country,
                                      ]
                                          .filter(Boolean)
                                          .join(", ")
                                    : d.location || "",
                            phoneNumber: d.phoneNumber || d.phone || "",
                            email: user.email || d.email || "",
                            stateOfOrigin: d.stateOfOrigin || "",
                            gender: d.gender || "",
                            institutionType: d.institutionType || "",
                            campLocation: d.campLocation || "",
                            religion: d.religion || "",
                        };
                        setWasComplete(
                            isProfileComplete({
                                email: user.email || d.email,
                                phone: d.phoneNumber || d.phone,
                                stateOfOrigin: d.stateOfOrigin,
                                gender: d.gender,
                                institutionType: d.institutionType,
                                campLocation: d.campLocation,
                                religion: d.religion,
                                bio: d.bio,
                            }),
                        );
                    } else {
                        data = {
                            ...emptyForm,
                            email: user.email || "",
                            displayName: user.displayName || "",
                        };
                    }
                    setFormData(data);
                    setOriginalData(data);
                } catch {
                    toast.error("Failed to load profile data");
                }
                setLoading(false);
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        setHasChanges(
            JSON.stringify(formData) !== JSON.stringify(originalData),
        );
    }, [formData, originalData]);

    const handleChange = (field, value) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const doSendVerification = async () => {
        await verifyBeforeUpdateEmail(auth.currentUser, emailToConfirm);
        setPendingEmail(emailToConfirm);
        toast.success(
            "Verification email sent! Check your inbox and click the link to confirm.",
        );
        await saveProfileData(emailToConfirm, true);
    };

    const handleEmailConfirm = async () => {
        setShowEmailModal(false);
        setSaving(true);
        try {
            await doSendVerification();
        } catch (error) {
            if (error.code === "auth/requires-recent-login") {
                setShowReauthModal(true);
            } else if (error.code === "auth/email-already-in-use") {
                toast.error("This email is already in use by another account.");
            } else if (error.code === "auth/invalid-email") {
                toast.error("Please enter a valid email address.");
            } else {
                toast.error("Failed to send verification email.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleReauth = async (password) => {
        const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            password,
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
        setShowReauthModal(false);
        setSaving(true);
        try {
            await doSendVerification();
        } finally {
            setSaving(false);
        }
    };

    const handleSkipReauth = async () => {
        setShowReauthModal(false);
        setSaving(true);
        try {
            // Save email to Firestore only, skip Firebase Auth update
            await saveProfileData(emailToConfirm, false);
            toast.success(
                "Profile saved. Email updated in your profile only — sign in again to verify.",
            );
            router.push("/profile");
        } catch (error) {
            toast.error("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const saveProfileData = async (emailValue, isPending = false) => {
        await updateProfile(auth.currentUser, {
            displayName: formData.displayName,
        });

        let locationData = formData.location;
        if (formData.location.includes(",")) {
            const parts = formData.location.split(",").map((p) => p.trim());
            locationData = {
                city: parts[0] || "",
                state: parts[1] || "",
                country: parts[2] || "Nigeria",
            };
        }

        const updatePayload = {
            displayName: formData.displayName,
            bio: formData.bio,
            location: locationData,
            phoneNumber: formData.phoneNumber,
            phone: formData.phoneNumber,
            email: emailValue,
            stateOfOrigin: formData.stateOfOrigin,
            gender: formData.gender,
            institutionType: formData.institutionType,
            campLocation: formData.campLocation,
            religion: formData.religion,
            updatedAt: serverTimestamp(),
        };

        const nowComplete = isProfileComplete({
            email: emailValue,
            phone: formData.phoneNumber,
            stateOfOrigin: formData.stateOfOrigin,
            gender: formData.gender,
            institutionType: formData.institutionType,
            campLocation: formData.campLocation,
            religion: formData.religion,
            bio: formData.bio,
        });

        if (nowComplete && !wasComplete) {
            updatePayload.isVerified = true;
            updatePayload.verifiedAt = serverTimestamp();
        }

        await updateDoc(doc(db, "users", auth.currentUser.uid), updatePayload);

        if (nowComplete && !wasComplete) {
            await awardPoints(auth.currentUser.uid, "PROFILE_COMPLETE", {});
            await checkAndAwardBadges(auth.currentUser.uid);
            toast.success(
                "🎉 Profile complete! You've earned the Verified Corper badge!",
            );
        } else if (!isPending) {
            toast.success("Profile updated successfully!");
        }

        setOriginalData((prev) => ({
            ...prev,
            ...formData,
            email: isPending ? prev.email : emailValue,
        }));
        setWasComplete(nowComplete);

        if (!isPending) router.push("/profile");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!auth.currentUser || !hasChanges) return;

        if (formData.email !== originalData.email && formData.email) {
            setEmailToConfirm(formData.email);
            setShowEmailModal(true);
            return;
        }

        setSaving(true);
        try {
            await saveProfileData(formData.email, false);
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (
            hasChanges &&
            !window.confirm(
                "You have unsaved changes. Are you sure you want to leave?",
            )
        )
            return;
        router.push("/profile");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-orange-500" />
                    <p className="text-slate-500 text-sm font-medium">
                        Loading profile...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <EmailVerificationModal
                isOpen={showEmailModal}
                newEmail={emailToConfirm}
                onConfirm={handleEmailConfirm}
                onCancel={() => setShowEmailModal(false)}
            />
            <ReauthModal
                isOpen={showReauthModal}
                onConfirm={handleReauth}
                onCancel={() => setShowReauthModal(false)}
                onSkip={handleSkipReauth}
            />

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
                            <div>
                                <h1 className="text-lg font-semibold text-slate-900">
                                    Edit Profile
                                </h1>
                                <p className="text-xs text-slate-500">
                                    {completionPct}% complete
                                </p>
                            </div>
                        </div>
                        {hasChanges && (
                            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                                Unsaved changes
                            </span>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                                <span className="text-2xl font-bold">
                                    {formData.displayName
                                        .charAt(0)
                                        .toUpperCase() || "U"}
                                </span>
                            </div>
                            {completionPct === 100 && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
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
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                {formData.displayName || "Your Profile"}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {completionPct === 100
                                    ? "✓ Verified Corper"
                                    : "Update your personal information"}
                            </p>
                        </div>
                    </div>
                </div>

                <CompletionBar pct={completionPct} />

                {pendingEmail && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                <MailIcon />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-blue-900">
                                    Verification email sent
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    We sent a verification link to{" "}
                                    <span className="font-medium">
                                        {pendingEmail}
                                    </span>
                                    . Click the link in that email to confirm
                                    the change.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <SectionCard
                        icon={
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-5 h-5"
                            >
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        }
                        title="Personal Information"
                    >
                        <Field label="Display Name" required>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) =>
                                    handleChange("displayName", e.target.value)
                                }
                                className={inputCls}
                                placeholder="Enter your full name"
                                required
                            />
                        </Field>
                        <Field label="Gender" required>
                            <select
                                value={formData.gender}
                                onChange={(e) =>
                                    handleChange("gender", e.target.value)
                                }
                                className={selectCls}
                            >
                                <option value="">Select gender</option>
                                {GENDERS.map((g) => (
                                    <option key={g} value={g}>
                                        {g}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Religion" required>
                            <select
                                value={formData.religion}
                                onChange={(e) =>
                                    handleChange("religion", e.target.value)
                                }
                                className={selectCls}
                            >
                                <option value="">Select religion</option>
                                {RELIGIONS.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="State of Origin" required>
                            <select
                                value={formData.stateOfOrigin}
                                onChange={(e) =>
                                    handleChange(
                                        "stateOfOrigin",
                                        e.target.value,
                                    )
                                }
                                className={selectCls}
                            >
                                <option value="">Select state</option>
                                {NIGERIAN_STATES.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Bio">
                            <textarea
                                value={formData.bio}
                                onChange={(e) =>
                                    handleChange("bio", e.target.value)
                                }
                                rows={3}
                                className={`${inputCls} resize-none`}
                                placeholder="Tell us a little about yourself..."
                                maxLength={160}
                            />
                            <div className="flex justify-between mt-1.5">
                                <p className="text-xs text-slate-400">
                                    Brief description for your profile
                                </p>
                                <p className="text-xs text-slate-400 font-medium">
                                    {formData.bio.length}/160
                                </p>
                            </div>
                        </Field>
                    </SectionCard>

                    <SectionCard
                        icon={
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-5 h-5"
                            >
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                        }
                        title="Education"
                    >
                        <Field label="Institution Type" required>
                            <select
                                value={formData.institutionType}
                                onChange={(e) =>
                                    handleChange(
                                        "institutionType",
                                        e.target.value,
                                    )
                                }
                                className={selectCls}
                            >
                                <option value="">
                                    Select institution type
                                </option>
                                {INSTITUTION_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </SectionCard>

                    <SectionCard
                        icon={
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-5 h-5"
                            >
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                        }
                        title="Camp & Contact"
                    >
                        <Field
                            label="Camp Location"
                            required
                            hint="e.g. NYSC Camp, Sagamu, Ogun State"
                        >
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-4 h-4 text-slate-400"
                                    >
                                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={formData.campLocation}
                                    onChange={(e) =>
                                        handleChange(
                                            "campLocation",
                                            e.target.value,
                                        )
                                    }
                                    className={`${inputCls} pl-11`}
                                    placeholder="Your NYSC camp location"
                                />
                            </div>
                        </Field>
                        <Field label="Phone Number" required>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-4 h-4 text-slate-400"
                                    >
                                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                                    </svg>
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
                                    className={`${inputCls} pl-11`}
                                    placeholder="+234 800 000 0000"
                                />
                            </div>
                        </Field>
                        <Field
                            label="Location"
                            hint="Format: City, State, Country (e.g., Lagos, Lagos State, Nigeria)"
                        >
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-4 h-4 text-slate-400"
                                    >
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) =>
                                        handleChange("location", e.target.value)
                                    }
                                    className={`${inputCls} pl-11`}
                                    placeholder="City, State, Country"
                                />
                            </div>
                        </Field>
                        <Field label="Email Address" required>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <MailIcon />
                                </div>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        handleChange("email", e.target.value)
                                    }
                                    className={`${inputCls} pl-11`}
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                            {pendingEmail && (
                                <p className="text-xs text-orange-600 mt-1.5 ml-1 font-medium">
                                    Verification pending: check {pendingEmail}{" "}
                                    for confirmation link
                                </p>
                            )}
                        </Field>
                    </SectionCard>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-8">
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
                            className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
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
