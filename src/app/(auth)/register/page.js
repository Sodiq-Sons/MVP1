"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import {
    initializeUserReferralSystem,
    registerReferral,
    validateReferralCode,
} from "@/lib/referrals";
import Link from "next/link";
import { toast } from "sonner";

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

const TentIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M12 2L2 22h20L12 2z" />
        <path d="M12 2v20" />
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

const CalendarIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const MapPinIcon = () => (
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

// ─── Data ────────────────────────────────────────────────────────────────────

const platoons = [
    "Platoon 1",
    "Platoon 2",
    "Platoon 3",
    "Platoon 4",
    "Platoon 5",
    "Platoon 6",
    "Platoon 7",
    "Platoon 8",
    "Platoon 9",
    "Platoon 10",
];

const nigerianStates = [
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
    "FCT (Abuja)",
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

// ─── Loading fallback shown while useSearchParams resolves ───────────────────

function SignupLoadingFallback() {
    return (
        <div className="min-h-screen bg-[#FDF6EF] flex items-center justify-center px-4">
            <div className="text-center">
                <SpinnerIcon />
                <p className="text-gray-500 mt-2">Loading...</p>
            </div>
        </div>
    );
}

// ─── Inner component — uses useSearchParams, must be inside Suspense ─────────
//
// FIX: Next.js App Router requires that any component calling useSearchParams()
// is wrapped in a <Suspense> boundary, or the entire route will fail to render
// (showing a 404 or blank page) when the URL contains query params like ?ref=...
// The fix is to split the page into this inner component (which reads params)
// and a default export that wraps it in <Suspense>.

function SignupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const referralCodeParam = searchParams.get("ref");

    // ── Auth State ────────────────────────────────────────────────────────────
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && !user.isAnonymous) {
                router.push("/");
            } else {
                setCheckingAuth(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    // ── Form State ────────────────────────────────────────────────────────────
    const [fullName, setFullName] = useState("");
    const [platoon, setPlatoon] = useState("");
    const [gender, setGender] = useState("");
    const [age, setAge] = useState("");
    const [stateOfOrigin, setStateOfOrigin] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [referralCode, setReferralCode] = useState(referralCodeParam || "");
    const [referrerInfo, setReferrerInfo] = useState(null);

    const [touched, setTouched] = useState({
        fullName: false,
        platoon: false,
        gender: false,
        age: false,
        stateOfOrigin: false,
        password: false,
        confirmPassword: false,
    });

    // ── UI State ──────────────────────────────────────────────────────────────
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showPlatoonModal, setShowPlatoonModal] = useState(false);
    const [showStateModal, setShowStateModal] = useState(false);

    // Validate referral code on mount
    useEffect(() => {
        const validateCode = async () => {
            if (referralCode && referralCode.length > 0) {
                const validation = await validateReferralCode(referralCode);
                if (validation.valid) {
                    setReferrerInfo(validation);
                } else {
                    setReferralCode("");
                    setReferrerInfo(null);
                }
            }
        };
        validateCode();
    }, [referralCode]);

    // ── Validation ────────────────────────────────────────────────────────────
    const isValidPassword = (pwd) => pwd.length >= 6;
    const isValidAge = (a) => {
        const n = parseInt(a, 10);
        return !isNaN(n) && n >= 13 && n <= 100;
    };

    const formValid =
        fullName.trim().length >= 2 &&
        platoon.length > 0 &&
        gender.length > 0 &&
        isValidAge(age) &&
        stateOfOrigin.length > 0 &&
        isValidPassword(password) &&
        password === confirmPassword;

    const touchAll = () =>
        setTouched({
            fullName: true,
            platoon: true,
            gender: true,
            age: true,
            stateOfOrigin: true,
            password: true,
            confirmPassword: true,
        });

    // ── Create Account ────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        touchAll();
        if (!formValid || saving) return;

        setSaving(true);
        setError("");

        const campEmail = `${fullName.toLowerCase().replace(/\s+/g, ".")}@camp.local`;

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                campEmail,
                password,
            );
            const user = userCredential.user;

            await updateProfile(user, { displayName: fullName.trim() });

            await setDoc(doc(db, "users", user.uid), {
                fullName: fullName.trim(),
                email: campEmail,
                platoon,
                gender,
                age: parseInt(age, 10),
                stateOfOrigin,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                role: "camper",
                badge: "🏕️ Official Camp Explorer",
                isActive: true,
                impactScore: 0,
                level: 1,
                levelName: "New Voice",
            });

            await initializeUserReferralSystem(user.uid, campEmail);

            if (referralCode && referralCode.length > 0) {
                const referralResult = await registerReferral(
                    referralCode,
                    user.uid,
                    campEmail,
                );
                if (referralResult) {
                    toast.success(
                        `Welcome! 🎉 You earned 5 points for joining via ${referrerInfo?.referrerName}'s referral`,
                    );
                } else {
                    toast.info("Welcome to camp! 🏕️");
                }
            } else {
                toast.success("Welcome to camp! 🏕️");
            }

            router.push("/");
        } catch (err) {
            console.error("Signup error:", err);
            let errorMessage = "Something went wrong. Please try again.";
            switch (err.code) {
                case "auth/email-already-in-use":
                    errorMessage =
                        "This name is already taken. Try adding a number.";
                    break;
                case "auth/weak-password":
                    errorMessage =
                        "Password is too weak. Use at least 6 characters.";
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

    if (checkingAuth) {
        return <SignupLoadingFallback />;
    }

    return (
        <div className="min-h-screen bg-[#FDF6EF] pb-24 md:pb-8">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#F97316] px-4 pt-6 md:pt-4 pb-3">
                <div className="flex items-center gap-3 max-w-2xl mx-auto">
                    <button
                        onClick={() => router.back()}
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
                            Join Camp 🏕️
                        </h1>
                        <p
                            className="text-orange-100 text-xs"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Create your camp identity
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 md:px-6">
                {/* Hero */}
                <div className="flex flex-col items-center pt-6 pb-4">
                    <div className="w-28 h-28 bg-[#FFF7F2] rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md">
                        <span className="text-5xl">🏕️</span>
                    </div>
                    <h2
                        className="text-xl font-bold text-gray-900 text-center"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Welcome to Camp!
                    </h2>
                    <p
                        className="text-gray-500 text-sm text-center mt-1 max-w-xs"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        Your platoon is your family here. Let&apos;s get you set
                        up!
                    </p>
                </div>

                {/* Referral Bonus Banner */}
                {referrerInfo && (
                    <div
                        className="mb-4 px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-sm flex items-start gap-3"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        <div className="text-xl shrink-0">🎁</div>
                        <div>
                            <div className="font-semibold text-green-900">
                                Referral Bonus Available!
                            </div>
                            <div className="text-green-700 text-xs mt-0.5">
                                Invited by{" "}
                                <span className="font-bold">
                                    {referrerInfo.referrerName}
                                </span>
                                . You&apos;ll earn{" "}
                                <span className="font-bold">5 points</span> for
                                signing up!
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div
                        className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-500"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        {error}
                    </div>
                )}

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-visible divide-y divide-gray-50">
                    {/* Full Name */}
                    <FieldRow
                        touched={touched.fullName}
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
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    Your Name{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) =>
                                        setFullName(e.target.value)
                                    }
                                    onBlur={() =>
                                        setTouched((t) => ({
                                            ...t,
                                            fullName: true,
                                        }))
                                    }
                                    placeholder="e.g. Ada, Chidi, Fatima"
                                    className="w-full text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                />
                            </div>
                        </div>
                    </FieldRow>

                    {/* Platoon */}
                    <FieldRow
                        touched={touched.platoon}
                        valid={platoon.length > 0}
                    >
                        <button
                            onClick={() => {
                                setTouched((t) => ({ ...t, platoon: true }));
                                setShowPlatoonModal(true);
                            }}
                            className="w-full px-4 pt-3 pb-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
                        >
                            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                <TentIcon />
                            </div>
                            <div className="flex-1">
                                <div
                                    className="text-sm font-semibold text-black mb-0.5"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    Your Platoon{" "}
                                    <span className="text-red-400">*</span>
                                </div>
                                <div
                                    className={`text-sm ${platoon ? "text-gray-800" : "text-gray-400"}`}
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    {platoon || "Which platoon are you in?"}
                                </div>
                            </div>
                            <ChevronRightIcon />
                        </button>
                    </FieldRow>

                    {/* Gender */}
                    <FieldRow
                        touched={touched.gender}
                        valid={gender.length > 0}
                    >
                        <div className="px-4 pt-3 pb-3">
                            <label
                                className="block text-sm font-semibold text-black mb-2"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Gender <span className="text-red-400">*</span>
                            </label>
                            <div className="flex gap-2">
                                {["Male", "Female"].map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => {
                                            setGender(g);
                                            setTouched((t) => ({
                                                ...t,
                                                gender: true,
                                            }));
                                        }}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                                            gender === g
                                                ? "border-[#F97316] bg-[#FFF7F2] text-[#F97316]"
                                                : "border-gray-100 bg-gray-50 text-gray-600 hover:border-[#F97316]/30"
                                        }`}
                                        style={{
                                            fontFamily: "DM Sans, sans-serif",
                                        }}
                                    >
                                        {g === "Male" && "👨 "}
                                        {g === "Female" && "👩 "}
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </FieldRow>

                    {/* Age */}
                    <FieldRow touched={touched.age} valid={isValidAge(age)}>
                        <div className="px-4 pt-3 pb-3 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                <CalendarIcon />
                            </div>
                            <div className="flex-1">
                                <label
                                    className="block text-sm font-semibold text-black mb-1"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    Age <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    onBlur={() =>
                                        setTouched((t) => ({ ...t, age: true }))
                                    }
                                    placeholder="e.g. 25"
                                    min="13"
                                    max="100"
                                    className="w-full text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                />
                                {age.length > 0 && !isValidAge(age) && (
                                    <p className="text-xs text-red-400 mt-1">
                                        Please enter a valid age (13-100)
                                    </p>
                                )}
                            </div>
                        </div>
                    </FieldRow>

                    {/* State of Origin */}
                    <FieldRow
                        touched={touched.stateOfOrigin}
                        valid={stateOfOrigin.length > 0}
                    >
                        <button
                            onClick={() => {
                                setTouched((t) => ({
                                    ...t,
                                    stateOfOrigin: true,
                                }));
                                setShowStateModal(true);
                            }}
                            className="w-full px-4 pt-3 pb-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
                        >
                            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                <MapPinIcon />
                            </div>
                            <div className="flex-1">
                                <div
                                    className="text-sm font-semibold text-black mb-0.5"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    State of Origin{" "}
                                    <span className="text-red-400">*</span>
                                </div>
                                <div
                                    className={`text-sm ${stateOfOrigin ? "text-gray-800" : "text-gray-400"}`}
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    {stateOfOrigin ||
                                        "Which state are you from?"}
                                </div>
                            </div>
                            <ChevronRightIcon />
                        </button>
                    </FieldRow>

                    {/* Password */}
                    <FieldRow
                        touched={touched.password}
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
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    Password{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    onBlur={() =>
                                        setTouched((t) => ({
                                            ...t,
                                            password: true,
                                        }))
                                    }
                                    placeholder="Min 6 characters"
                                    className="w-full text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
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
                        touched={touched.confirmPassword}
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
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    Confirm Password{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    onBlur={() =>
                                        setTouched((t) => ({
                                            ...t,
                                            confirmPassword: true,
                                        }))
                                    }
                                    placeholder="Re-enter password"
                                    className="w-full text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
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
                        color: formValid ? "#22c55e" : "#9ca3af",
                    }}
                >
                    {formValid
                        ? "✓ All set — welcome to camp!"
                        : "Fill all fields to join the camp"}
                </p>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!formValid || saving}
                    className={`w-full mt-4 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                        formValid && !saving
                            ? "bg-[#F97316] text-white hover:bg-[#C2410C] shadow-lg active:scale-[0.98] cursor-pointer"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    style={{
                        fontFamily: "DM Sans, sans-serif",
                        boxShadow:
                            formValid && !saving
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
                            <CheckIcon /> Join Camp
                        </>
                    )}
                </button>

                {/* Login Link */}
                <p
                    className="text-sm text-center mt-4 text-gray-500"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    Already in camp?{" "}
                    <Link
                        href="/login"
                        className="text-[#F97316] font-semibold hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </div>

            {/* ── PLATOON MODAL ── */}
            {showPlatoonModal && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        onClick={() => setShowPlatoonModal(false)}
                    />
                    <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-2xl p-5 z-10 max-h-[70vh] overflow-y-auto">
                        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4 md:hidden" />
                        <h3
                            className="text-base font-bold text-gray-900 mb-4"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            Select Your Platoon
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {platoons.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => {
                                        setPlatoon(p);
                                        setShowPlatoonModal(false);
                                    }}
                                    className={`p-3 rounded-xl text-left text-sm font-medium transition-all border cursor-pointer ${
                                        platoon === p
                                            ? "border-[#F97316] bg-[#FFF7F2] text-[#F97316]"
                                            : "border-gray-100 bg-gray-50 text-gray-600 hover:border-[#F97316]/30"
                                    }`}
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    🏕️ {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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
                            Select Your State
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {nigerianStates.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => {
                                        setStateOfOrigin(s);
                                        setShowStateModal(false);
                                    }}
                                    className={`p-3 rounded-xl text-left text-sm font-medium transition-all border cursor-pointer ${
                                        stateOfOrigin === s
                                            ? "border-[#F97316] bg-[#FFF7F2] text-[#F97316]"
                                            : "border-gray-100 bg-gray-50 text-gray-600 hover:border-[#F97316]/30"
                                    }`}
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                >
                                    📍 {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<SignupLoadingFallback />}>
            <SignupForm />
        </Suspense>
    );
}
