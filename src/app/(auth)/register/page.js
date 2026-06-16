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
import { finalizeAlias, usernameToEmail } from "@/lib/campAliases";
import { authErrorMessage } from "@/lib/authErrors";
import AuthErrorBanner from "@/components/AuthErrorBanner";
import Link from "next/link";
import { toast } from "sonner";

// ─── Icons ───────────────────────────────────────────────────────────────────

const BackIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const UserIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const TentIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4">
        <path d="M12 2L2 22h20L12 2z" />
        <path d="M12 2v20" />
    </svg>
);

const LockIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="w-4 h-4">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const SpinnerIcon = () => (
    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
);

const MapPinIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

// ─── Data ────────────────────────────────────────────────────────────────────

const platoons = [
    "Platoon 1", "Platoon 2", "Platoon 3", "Platoon 4", "Platoon 5",
    "Platoon 6", "Platoon 7", "Platoon 8", "Platoon 9", "Platoon 10",
];

const nigerianStates = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
    "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti",
    "Enugu", "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
    "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
    "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
    "Taraba", "Yobe", "Zamfara",
];

// ─── Field Error Badge ────────────────────────────────────────────────────────

function FieldRow({ touched, valid, children, className = "" }) {
    const showError = touched && !valid;
    return (
        <div className={`relative transition-all duration-200 ${showError ? "rounded-xl ring-2 ring-red-300" : ""} ${className}`}>
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

function SignupLoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
            <div className="text-center">
                <SpinnerIcon />
                <p className="text-gray-500 mt-2">Loading...</p>
            </div>
        </div>
    );
}

function SignupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const referralCodeParam = searchParams.get("ref");

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

    const [username, setUsername] = useState("");
    const [platoon, setPlatoon] = useState("");
    const [gender, setGender] = useState("");
    const [stateOfOrigin, setStateOfOrigin] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [referralCode, setReferralCode] = useState(referralCodeParam || "");
    const [referrerInfo, setReferrerInfo] = useState(null);

    const [touched, setTouched] = useState({
        username: false,
        platoon: false,
        gender: false,
        stateOfOrigin: false,
        password: false,
        confirmPassword: false,
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showPlatoonModal, setShowPlatoonModal] = useState(false);
    const [showStateModal, setShowStateModal] = useState(false);

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

    // Prefill the username chosen during onboarding so it isn't re-entered.
    useEffect(() => {
        try {
            const a = localStorage.getItem("onboardingAlias");
            if (a) setUsername(a);
        } catch {
            /* ignore */
        }
    }, []);

    const isValidPassword = (pwd) => pwd.length >= 6;

    const formValid =
        username.trim().length >= 2 &&
        platoon.length > 0 &&
        gender.length > 0 &&
        stateOfOrigin.length > 0 &&
        isValidPassword(password) &&
        password === confirmPassword;

    const touchAll = () =>
        setTouched({
            username: true, platoon: true, gender: true,
            stateOfOrigin: true, password: true, confirmPassword: true,
        });

    const handleSubmit = async () => {
        touchAll();
        if (!formValid || saving) return;

        setSaving(true);
        setError(null);

        // Identity = the username chosen in onboarding (prefilled below) or
        // typed here. usernameToEmail() makes the username the account identity,
        // so its uniqueness is enforced by Firebase Auth (no real names collected).
        const onboardingCamp =
            typeof window !== "undefined"
                ? localStorage.getItem("onboardingCamp")
                : null;
        const displayName = username.trim();
        const campEmail = usernameToEmail(username);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, campEmail, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName });

            await setDoc(doc(db, "users", user.uid), {
                username: username.trim(),
                fullName: username.trim(),
                displayName,
                email: campEmail,
                campLocation: onboardingCamp || "",
                platoon,
                gender,
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

            // Permanently assign the claimed username to this user
            await finalizeAlias(username.trim(), user.uid).catch(() => {});
            localStorage.removeItem("onboardingAlias");
            localStorage.removeItem("onboardingAliasSession");
            localStorage.removeItem("onboardingCamp");

            await initializeUserReferralSystem(user.uid, campEmail);

            if (referralCode && referralCode.length > 0) {
                const referralResult = await registerReferral(referralCode, user.uid, campEmail);
                if (referralResult) {
                    toast.success(`Welcome! 🎉 You earned 5 points for joining via ${referrerInfo?.referrerName}'s referral`);
                } else {
                    toast.info("Welcome to camp! 🏕️");
                }
            } else {
                toast.success("Welcome to camp! 🏕️");
            }

            router.push("/");
        } catch (err) {
            console.error("Signup error:", err);
            setError(authErrorMessage(err.code));
            setSaving(false);
        }
    };

    if (checkingAuth) return <SignupLoadingFallback />;

    return (
        <div className="min-h-screen pb-24 md:pb-8" style={{ background: "var(--bg)" }}>
            {/* Header */}
            <header className="sticky top-0 z-40 px-4 pt-6 md:pt-4 pb-3" style={{ background: "var(--cp)" }}>
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
                            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                        >
                            Join Camp 🏕️
                        </h1>
                        <p
                            className="text-xs"
                            style={{ fontFamily: "DM Sans, sans-serif", color: "rgba(255,255,255,0.8)" }}
                        >
                            Create your camp identity
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 md:px-6">
                {/* Hero */}
                <div className="flex flex-col items-center pt-6 pb-4">
                    <div
                        className="w-28 h-28 rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md"
                        style={{ background: "var(--cp-tint)" }}
                    >
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
                        Your platoon is your family here. Let&apos;s get you set up!
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
                            <div className="font-semibold text-green-900">Referral Bonus Available!</div>
                            <div className="text-green-700 text-xs mt-0.5">
                                Invited by{" "}
                                <span className="font-bold">{referrerInfo.referrerName}</span>. You&apos;ll earn{" "}
                                <span className="font-bold">5 points</span> for signing up!
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                <AuthErrorBanner title={error?.title} message={error?.message} />

                {/* Form */}
                <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-visible divide-y divide-subtle">
                    {/* Full Name */}
                    <FieldRow touched={touched.username} valid={username.trim().length >= 2} className="rounded-t-2xl">
                        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                            <div className="w-8 h-8 bg-subtle rounded-lg flex items-center justify-center shrink-0">
                                <UserIcon />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-black mb-1" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                    Username <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                                    placeholder="Pick a username"
                                    className="w-full text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                    style={{ fontFamily: "DM Sans, sans-serif" }}
                                />
                            </div>
                        </div>
                    </FieldRow>

                    {/* Platoon */}
                    <FieldRow touched={touched.platoon} valid={platoon.length > 0}>
                        <button
                            onClick={() => { setTouched((t) => ({ ...t, platoon: true })); setShowPlatoonModal(true); }}
                            className="w-full px-4 pt-3 pb-3 flex items-center gap-3 hover:bg-subtle/50 transition-colors text-left cursor-pointer"
                        >
                            <div className="w-8 h-8 bg-subtle rounded-lg flex items-center justify-center shrink-0">
                                <TentIcon />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-black mb-0.5" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                    Your Platoon <span className="text-red-400">*</span>
                                </div>
                                <div className={`text-sm ${platoon ? "text-gray-800" : "text-gray-400"}`} style={{ fontFamily: "DM Sans, sans-serif" }}>
                                    {platoon || "Which platoon are you in?"}
                                </div>
                            </div>
                            <ChevronRightIcon />
                        </button>
                    </FieldRow>

                    {/* Gender */}
                    <FieldRow touched={touched.gender} valid={gender.length > 0}>
                        <div className="px-4 pt-3 pb-3">
                            <label className="block text-sm font-semibold text-black mb-2" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                Gender <span className="text-red-400">*</span>
                            </label>
                            <div className="flex gap-2">
                                {["Male", "Female"].map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => { setGender(g); setTouched((t) => ({ ...t, gender: true })); }}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border cursor-pointer ${
                                            gender === g ? "option-selected" : "border-subtle bg-subtle text-gray-600"
                                        }`}
                                        style={{ fontFamily: "DM Sans, sans-serif" }}
                                    >
                                        {g === "Male" && "👨 "}
                                        {g === "Female" && "👩 "}
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </FieldRow>

                    {/* State of Origin */}
                    <FieldRow touched={touched.stateOfOrigin} valid={stateOfOrigin.length > 0}>
                        <button
                            onClick={() => { setTouched((t) => ({ ...t, stateOfOrigin: true })); setShowStateModal(true); }}
                            className="w-full px-4 pt-3 pb-3 flex items-center gap-3 hover:bg-subtle/50 transition-colors text-left cursor-pointer"
                        >
                            <div className="w-8 h-8 bg-subtle rounded-lg flex items-center justify-center shrink-0">
                                <MapPinIcon />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-black mb-0.5" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                    State of Origin <span className="text-red-400">*</span>
                                </div>
                                <div className={`text-sm ${stateOfOrigin ? "text-gray-800" : "text-gray-400"}`} style={{ fontFamily: "DM Sans, sans-serif" }}>
                                    {stateOfOrigin || "Which state are you from?"}
                                </div>
                            </div>
                            <ChevronRightIcon />
                        </button>
                    </FieldRow>

                    {/* Password */}
                    <FieldRow touched={touched.password} valid={isValidPassword(password)}>
                        <div className="px-4 pt-3 pb-3 flex items-center gap-3">
                            <div className="w-8 h-8 bg-subtle rounded-lg flex items-center justify-center shrink-0">
                                <LockIcon />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-black mb-1" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                    Password <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                                    placeholder="Min 6 characters"
                                    className="w-full text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                    style={{ fontFamily: "DM Sans, sans-serif" }}
                                />
                                {password.length > 0 && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        {password.length >= 6 ? "✓ Password looks good" : "Password must be at least 6 characters"}
                                    </p>
                                )}
                            </div>
                        </div>
                    </FieldRow>

                    {/* Confirm Password */}
                    <FieldRow
                        touched={touched.confirmPassword}
                        valid={confirmPassword.length > 0 && password === confirmPassword}
                        className="rounded-b-2xl"
                    >
                        <div className="px-4 pt-3 pb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-subtle rounded-lg flex items-center justify-center shrink-0">
                                <LockIcon />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-black mb-1" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                    Confirm Password <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                                    placeholder="Re-enter password"
                                    className="w-full text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                    style={{ fontFamily: "DM Sans, sans-serif" }}
                                />
                                {confirmPassword.length > 0 && password !== confirmPassword && (
                                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
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
                            showPassword ? "checkbox-cp" : "border-gray-300"
                        }`}
                    >
                        {showPassword && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        )}
                    </button>
                    <span className="text-sm text-gray-600" style={{ fontFamily: "DM Sans, sans-serif" }}>
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
                    {formValid ? "✓ All set — welcome to camp!" : "Fill all fields to join the camp"}
                </p>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!formValid || saving}
                    className={`w-full mt-4 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                        formValid && !saving
                            ? "btn-primary shadow-lg cursor-pointer"
                            : "bg-muted text-gray-400 cursor-not-allowed"
                    }`}
                    style={{
                        fontFamily: "DM Sans, sans-serif",
                        boxShadow: formValid && !saving ? "0 4px 20px var(--cp-glow)" : undefined,
                    }}
                >
                    {saving ? (
                        <><SpinnerIcon /> Creating Account...</>
                    ) : (
                        <><CheckIcon /> Join Camp</>
                    )}
                </button>

                {/* Login Link */}
                <p className="text-sm text-center mt-4 text-gray-500" style={{ fontFamily: "DM Sans, sans-serif" }}>
                    Already in camp?{" "}
                    <Link href="/login" className="text-cp font-semibold hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>

            {/* ── PLATOON MODAL ── */}
            {showPlatoonModal && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setShowPlatoonModal(false)} />
                    <div className="relative w-full md:max-w-md bg-card rounded-t-3xl md:rounded-2xl p-5 z-10 max-h-[70vh] overflow-y-auto">
                        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4 md:hidden" />
                        <h3 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            Select Your Platoon
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {platoons.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => { setPlatoon(p); setShowPlatoonModal(false); }}
                                    className={`p-3 rounded-xl text-left text-sm font-medium transition-all border cursor-pointer ${
                                        platoon === p ? "option-selected" : "border-subtle bg-subtle text-gray-600"
                                    }`}
                                    style={{ fontFamily: "DM Sans, sans-serif" }}
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
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setShowStateModal(false)} />
                    <div className="relative w-full md:max-w-md bg-card rounded-t-3xl md:rounded-2xl p-5 z-10 max-h-[70vh] overflow-y-auto">
                        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4 md:hidden" />
                        <h3 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            Select Your State
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {nigerianStates.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => { setStateOfOrigin(s); setShowStateModal(false); }}
                                    className={`p-3 rounded-xl text-left text-sm font-medium transition-all border cursor-pointer ${
                                        stateOfOrigin === s ? "option-selected" : "border-subtle bg-subtle text-gray-600"
                                    }`}
                                    style={{ fontFamily: "DM Sans, sans-serif" }}
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
