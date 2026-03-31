// app/signup/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import Link from "next/link";

// ─── Icons ───────────────────────────────────────────────────────────────────

const BackIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
    >
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const UserIcon = () => (
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

const EmailIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
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
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);

const LocationIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
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

const SpinnerIcon = () => (
    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
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
);

// ─── Data ────────────────────────────────────────────────────────────────────

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

const educationLevels = [
    "No Formal Education",
    "Primary Education",
    "Secondary Education",
    "NCE/OND",
    "HND/Bachelor's Degree",
    "Master's Degree",
    "PhD/Doctorate",
];

const maritalStatuses = [
    "Single",
    "Married",
    "Divorced",
    "Widowed",
    "Separated",
];

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }) {
    return (
        <div className="flex items-center justify-center gap-2 py-3">
            {[1, 2].map((s) => (
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
                        {step > s ? <CheckIcon /> : s}
                    </div>
                    {s < 2 && (
                        <div
                            className={`w-12 h-0.5 rounded-full transition-all duration-500 ${
                                step > s ? "bg-green-400" : "bg-gray-100"
                            }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Field Error Badge ────────────────────────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SignupPage() {
    const router = useRouter();

    // ── Auth State ────────────────────────────────────────────────────────────
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            // Only redirect if properly authenticated (NOT anonymous)
            if (user && !user.isAnonymous) {
                router.push("/");
            } else {
                setCheckingAuth(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    // ── Step 1: Account Info ──────────────────────────────────────────────────
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [step1Touched, setStep1Touched] = useState({
        fullName: false,
        email: false,
        password: false,
        confirmPassword: false,
    });

    // ── Step 2: Profile Info ──────────────────────────────────────────────────
    const [state, setState] = useState("");
    const [gender, setGender] = useState("");
    const [education, setEducation] = useState("");
    const [maritalStatus, setMaritalStatus] = useState("");
    const [age, setAge] = useState("");
    const [step2Touched, setStep2Touched] = useState({
        state: false,
        gender: false,
        education: false,
        maritalStatus: false,
        age: false,
    });

    // ── UI State ──────────────────────────────────────────────────────────────
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showStateModal, setShowStateModal] = useState(false);
    const [showEducationModal, setShowEducationModal] = useState(false);
    const [showMaritalModal, setShowMaritalModal] = useState(false);

    // ── Validation ──────────────────────────────────────────────────────────────
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidPassword = (pwd) => pwd.length >= 6;

    const step1Valid =
        fullName.trim().length >= 2 &&
        isValidEmail(email) &&
        isValidPassword(password) &&
        password === confirmPassword;

    const step2Valid =
        state.length > 0 &&
        gender.length > 0 &&
        education.length > 0 &&
        maritalStatus.length > 0 &&
        age.length > 0 &&
        parseInt(age) >= 13 &&
        parseInt(age) <= 120;

    const touchAllStep1 = () =>
        setStep1Touched({
            fullName: true,
            email: true,
            password: true,
            confirmPassword: true,
        });

    const touchAllStep2 = () =>
        setStep2Touched({
            state: true,
            gender: true,
            education: true,
            maritalStatus: true,
            age: true,
        });

    // ── Navigation ──────────────────────────────────────────────────────────────
    const goToStep2 = () => {
        touchAllStep1();
        if (step1Valid) {
            setStep(2);
            setError("");
        }
    };

    const goBack = () => {
        setStep(1);
        setError("");
    };

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

    // ── Create Account ──────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        touchAllStep2();
        if (!step1Valid || !step2Valid || saving) return;

        setSaving(true);
        setError("");

        try {
            // 1. Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password,
            );
            const user = userCredential.user;

            // 2. Update profile with full name
            await updateProfile(user, {
                displayName: fullName.trim(),
            });

            // 3. Store additional data in Firestore
            await setDoc(doc(db, "users", user.uid), {
                fullName: fullName.trim(),
                email: email.toLowerCase().trim(),
                state,
                gender,
                education,
                maritalStatus,
                age: parseInt(age),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                role: "citizen",
                isActive: true,
            });

            // 4. Redirect to home
            router.push("/");
        } catch (err) {
            console.error("Signup error:", err);
            let errorMessage = "Something went wrong. Please try again.";

            switch (err.code) {
                case "auth/email-already-in-use":
                    errorMessage =
                        "This email is already registered. Please sign in instead.";
                    break;
                case "auth/invalid-email":
                    errorMessage = "Please enter a valid email address.";
                    break;
                case "auth/weak-password":
                    errorMessage =
                        "Password is too weak. Please use at least 6 characters.";
                    break;
                case "auth/network-request-failed":
                    errorMessage =
                        "Network error. Please check your connection.";
                    break;
                default:
                    errorMessage = err.message || "Failed to create account.";
            }

            setError(errorMessage);
            setSaving(false);
        }
    };

    // ── Loading State ───────────────────────────────────────────────────────────
    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-[#FDF6EF] flex items-center justify-center px-4">
                <div className="text-center">
                    <SpinnerIcon />
                    <p className="text-gray-500 mt-2">Loading...</p>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[#FDF6EF] pb-24 md:pb-8">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#F97316] px-4 pt-6 md:pt-4 pb-3">
                <div className="flex items-center gap-3 max-w-2xl mx-auto">
                    <button
                        onClick={() =>
                            step === 2 ? setStep(1) : router.back()
                        }
                        className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer text-white"
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
                            {step === 1 ? "Create Account" : "Complete Profile"}
                        </h1>
                        <p
                            className="text-orange-100 text-xs"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Step {step} of 2
                        </p>
                    </div>
                </div>
                <div className="max-w-2xl mx-auto">
                    <StepIndicator step={step} />
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 md:px-6">
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
                        Join We The People NG
                    </h2>
                    <p
                        className="text-gray-500 text-sm text-center mt-1 max-w-xs"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        {step === 1
                            ? "Create your account to start making a difference"
                            : "Tell us a bit more about yourself"}
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div
                        className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-500"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        {error}
                    </div>
                )}

                {/* ══ STEP 1: Account Information ════════════════════════════════ */}
                {step === 1 && (
                    <>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-visible divide-y divide-gray-50">
                            {/* Full Name */}
                            <FieldRow
                                touched={step1Touched.fullName}
                                valid={fullName.trim().length >= 2}
                                className="rounded-t-2xl"
                            >
                                <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                        <UserIcon />
                                    </div>
                                    <div className="flex-1">
                                        <label
                                            className="block text-sm font-semibold text-black mb-1"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            Full Name{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) =>
                                                setFullName(e.target.value)
                                            }
                                            onBlur={() =>
                                                setStep1Touched((t) => ({
                                                    ...t,
                                                    fullName: true,
                                                }))
                                            }
                                            placeholder="e.g. Adaobi Okonkwo"
                                            className="w-full text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        />
                                    </div>
                                </div>
                            </FieldRow>

                            {/* Email */}
                            <FieldRow
                                touched={step1Touched.email}
                                valid={isValidEmail(email)}
                            >
                                <div className="px-4 pt-3 pb-3 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                        <EmailIcon />
                                    </div>
                                    <div className="flex-1">
                                        <label
                                            className="block text-sm font-semibold text-black mb-1"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            Email Address{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            onBlur={() =>
                                                setStep1Touched((t) => ({
                                                    ...t,
                                                    email: true,
                                                }))
                                            }
                                            placeholder="your@email.com"
                                            className="w-full text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        />
                                    </div>
                                </div>
                            </FieldRow>

                            {/* Password */}
                            <FieldRow
                                touched={step1Touched.password}
                                valid={isValidPassword(password)}
                            >
                                <div className="px-4 pt-3 pb-3 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                        <LockIcon />
                                    </div>
                                    <div className="flex-1">
                                        <label
                                            className="block text-sm font-semibold text-black mb-1"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            Password{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            onBlur={() =>
                                                setStep1Touched((t) => ({
                                                    ...t,
                                                    password: true,
                                                }))
                                            }
                                            placeholder="Min 6 characters"
                                            className="w-full text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        />
                                        {password.length > 0 && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                {password.length >= 6
                                                    ? "✓ Password looks good"
                                                    : "Password must be at least 6 characters"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </FieldRow>

                            {/* Confirm Password */}
                            <FieldRow
                                touched={step1Touched.confirmPassword}
                                valid={
                                    confirmPassword.length > 0 &&
                                    password === confirmPassword
                                }
                                className="rounded-b-2xl"
                            >
                                <div className="px-4 pt-3 pb-4 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                        <LockIcon />
                                    </div>
                                    <div className="flex-1">
                                        <label
                                            className="block text-sm font-semibold text-black mb-1"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            Confirm Password{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={confirmPassword}
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value,
                                                )
                                            }
                                            onBlur={() =>
                                                setStep1Touched((t) => ({
                                                    ...t,
                                                    confirmPassword: true,
                                                }))
                                            }
                                            placeholder="Re-enter password"
                                            className="w-full text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        />
                                        {confirmPassword.length > 0 &&
                                            password !== confirmPassword && (
                                                <p className="text-xs text-red-400 mt-1">
                                                    Passwords do not match
                                                </p>
                                            )}
                                    </div>
                                </div>
                            </FieldRow>
                        </div>

                        {/* Show Password Toggle */}
                        <div className="flex items-center gap-2 mt-3 px-1">
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    showPassword
                                        ? "bg-[#F97316] border-[#F97316]"
                                        : "border-gray-300"
                                }`}
                            >
                                {showPassword && (
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="3"
                                        className="w-3 h-3"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </button>
                            <span
                                className="text-sm text-gray-600"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Show password
                            </span>
                        </div>

                        {/* Helper Text */}
                        <p
                            className="text-xs text-center mt-4 px-1"
                            style={{
                                fontFamily: "DM Sans, sans-serif",
                                color: step1Valid ? "#22c55e" : "#9ca3af",
                            }}
                        >
                            {step1Valid
                                ? "✓ All fields complete — continue to next step!"
                                : "Please fill all fields correctly to continue"}
                        </p>

                        {/* Next Button */}
                        <button
                            onClick={goToStep2}
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

                        {/* Sign In Link */}
                        <p
                            className="text-sm text-center mt-4 text-gray-500"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="text-[#F97316] font-semibold hover:underline"
                            >
                                Sign in
                            </Link>
                        </p>
                    </>
                )}

                {/* ══ STEP 2: Profile Information ════════════════════════════════════ */}
                {step === 2 && (
                    <>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-visible divide-y divide-gray-50">
                            {/* State */}
                            <FieldRow
                                touched={step2Touched.state}
                                valid={state.length > 0}
                                className="rounded-t-2xl"
                            >
                                <button
                                    onClick={() => {
                                        setStep2Touched((t) => ({
                                            ...t,
                                            state: true,
                                        }));
                                        setShowStateModal(true);
                                    }}
                                    className="w-full px-4 pt-4 pb-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
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
                                            State of Residence{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </div>
                                        <div
                                            className={`text-sm ${state ? "text-gray-800" : "text-gray-400"}`}
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            {state || "Select your state"}
                                        </div>
                                    </div>
                                    <ChevronRightIcon />
                                </button>
                            </FieldRow>

                            {/* Gender */}
                            <FieldRow
                                touched={step2Touched.gender}
                                valid={gender.length > 0}
                            >
                                <div className="px-4 pt-3 pb-3">
                                    <label
                                        className="block text-sm font-semibold text-black mb-2"
                                        style={{
                                            fontFamily: "DM Sans, sans-serif",
                                        }}
                                    >
                                        Gender{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        {["Male", "Female", "Other"].map(
                                            (g) => (
                                                <button
                                                    key={g}
                                                    onClick={() => {
                                                        setGender(g);
                                                        setStep2Touched(
                                                            (t) => ({
                                                                ...t,
                                                                gender: true,
                                                            }),
                                                        );
                                                    }}
                                                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                                                        gender === g
                                                            ? "border-[#F97316] bg-[#FFF7F2] text-[#F97316]"
                                                            : "border-gray-100 bg-gray-50 text-gray-600 hover:border-[#F97316]/30"
                                                    }`}
                                                    style={{
                                                        fontFamily:
                                                            "DM Sans, sans-serif",
                                                    }}
                                                >
                                                    {g === "Male" && "👨 "}
                                                    {g === "Female" && "👩 "}
                                                    {g === "Other" && "🧑 "}
                                                    {g}
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </FieldRow>

                            {/* Age */}
                            <FieldRow
                                touched={step2Touched.age}
                                valid={
                                    age.length > 0 &&
                                    parseInt(age) >= 13 &&
                                    parseInt(age) <= 120
                                }
                            >
                                <div className="px-4 pt-3 pb-3 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 text-gray-600 font-bold text-sm">
                                        🎂
                                    </div>
                                    <div className="flex-1">
                                        <label
                                            className="block text-sm font-semibold text-black mb-1"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            Age{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            min="13"
                                            max="120"
                                            value={age}
                                            onChange={(e) =>
                                                setAge(e.target.value)
                                            }
                                            onBlur={() =>
                                                setStep2Touched((t) => ({
                                                    ...t,
                                                    age: true,
                                                }))
                                            }
                                            placeholder="13+"
                                            className="w-full text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        />
                                        {age.length > 0 &&
                                            (parseInt(age) < 13 ||
                                                parseInt(age) > 120) && (
                                                <p className="text-xs text-red-400 mt-1">
                                                    Age must be between 13 and
                                                    120
                                                </p>
                                            )}
                                    </div>
                                </div>
                            </FieldRow>

                            {/* Education Level */}
                            <FieldRow
                                touched={step2Touched.education}
                                valid={education.length > 0}
                            >
                                <button
                                    onClick={() => {
                                        setStep2Touched((t) => ({
                                            ...t,
                                            education: true,
                                        }));
                                        setShowEducationModal(true);
                                    }}
                                    className="w-full px-4 pt-3 pb-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
                                >
                                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="text-sm">🎓</span>
                                    </div>
                                    <div className="flex-1">
                                        <div
                                            className="text-sm font-semibold text-black mb-0.5"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            Education Level{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </div>
                                        <div
                                            className={`text-sm ${education ? "text-gray-800" : "text-gray-400"}`}
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            {education ||
                                                "Select education level"}
                                        </div>
                                    </div>
                                    <ChevronRightIcon />
                                </button>
                            </FieldRow>

                            {/* Marital Status */}
                            <FieldRow
                                touched={step2Touched.maritalStatus}
                                valid={maritalStatus.length > 0}
                                className="rounded-b-2xl"
                            >
                                <button
                                    onClick={() => {
                                        setStep2Touched((t) => ({
                                            ...t,
                                            maritalStatus: true,
                                        }));
                                        setShowMaritalModal(true);
                                    }}
                                    className="w-full px-4 pt-3 pb-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
                                >
                                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="text-sm">💍</span>
                                    </div>
                                    <div className="flex-1">
                                        <div
                                            className="text-sm font-semibold text-black mb-0.5"
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            Marital Status{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </div>
                                        <div
                                            className={`text-sm ${maritalStatus ? "text-gray-800" : "text-gray-400"}`}
                                            style={{
                                                fontFamily:
                                                    "DM Sans, sans-serif",
                                            }}
                                        >
                                            {maritalStatus ||
                                                "Select marital status"}
                                        </div>
                                    </div>
                                    <ChevronRightIcon />
                                </button>
                            </FieldRow>
                        </div>

                        {/* Helper Text */}
                        <p
                            className="text-xs text-center mt-4 px-1"
                            style={{
                                fontFamily: "DM Sans, sans-serif",
                                color: step2Valid ? "#22c55e" : "#9ca3af",
                            }}
                        >
                            {step2Valid
                                ? "✓ All fields complete — create your account!"
                                : "Please fill all fields to complete registration"}
                        </p>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!step2Valid || saving}
                            className={`w-full mt-4 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                                step2Valid && !saving
                                    ? "bg-[#F97316] text-white hover:bg-[#C2410C] shadow-lg active:scale-[0.98] cursor-pointer"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                            style={{
                                fontFamily: "DM Sans, sans-serif",
                                boxShadow:
                                    step2Valid && !saving
                                        ? "0 4px 20px rgba(232,97,26,0.35)"
                                        : undefined,
                            }}
                        >
                            {saving ? (
                                <>
                                    <SpinnerIcon /> Creating Account...
                                </>
                            ) : (
                                <>
                                    <CheckIcon /> Create Account
                                </>
                            )}
                        </button>

                        {/* Back Button */}
                        <button
                            onClick={goBack}
                            disabled={saving}
                            className="w-full mt-2 py-3 rounded-2xl font-semibold text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            ← Back to Step 1
                        </button>
                    </>
                )}
            </div>

            {/* ── STATE MODAL ── */}
            {showStateModal && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        onClick={() => setShowStateModal(false)}
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
                            {states.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => {
                                        setState(s);
                                        setShowStateModal(false);
                                    }}
                                    className={`p-2.5 rounded-xl text-left text-sm font-medium transition-all border cursor-pointer ${
                                        state === s
                                            ? "border-[#F97316] bg-[#FFF7F2] text-[#F97316]"
                                            : "border-gray-100 bg-gray-50 text-gray-600 hover:border-[#F97316]/30"
                                    }`}
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── EDUCATION MODAL ── */}
            {showEducationModal && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        onClick={() => setShowEducationModal(false)}
                    />
                    <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-2xl p-5 z-10 max-h-[70vh] overflow-y-auto">
                        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4 md:hidden" />
                        <h3
                            className="text-base font-bold text-gray-900 mb-4"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            Select Education Level
                        </h3>
                        <div className="flex flex-col gap-2">
                            {educationLevels.map((edu) => (
                                <button
                                    key={edu}
                                    onClick={() => {
                                        setEducation(edu);
                                        setShowEducationModal(false);
                                    }}
                                    className={`p-3 rounded-xl text-left text-sm font-medium transition-all border cursor-pointer ${
                                        education === edu
                                            ? "border-[#F97316] bg-[#FFF7F2] text-[#F97316]"
                                            : "border-gray-100 bg-gray-50 text-gray-600 hover:border-[#F97316]/30"
                                    }`}
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    {edu}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MARITAL STATUS MODAL ── */}
            {showMaritalModal && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        onClick={() => setShowMaritalModal(false)}
                    />
                    <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-2xl p-5 z-10">
                        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4 md:hidden" />
                        <h3
                            className="text-base font-bold text-gray-900 mb-4"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            Select Marital Status
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {maritalStatuses.map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setMaritalStatus(status);
                                        setShowMaritalModal(false);
                                    }}
                                    className={`p-3 rounded-xl text-left text-sm font-medium transition-all border cursor-pointer ${
                                        maritalStatus === status
                                            ? "border-[#F97316] bg-[#FFF7F2] text-[#F97316]"
                                            : "border-gray-100 bg-gray-50 text-gray-600 hover:border-[#F97316]/30"
                                    }`}
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    {status === "Single" && "💃 "}
                                    {status === "Married" && "💑 "}
                                    {status === "Divorced" && "💔 "}
                                    {status === "Widowed" && "🕯️ "}
                                    {status === "Separated" && "↔️ "}
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
