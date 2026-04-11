"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
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

const EyeOpenIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-5 h-5"
    >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeClosedIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-5 h-5"
    >
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LoginPage() {
    const router = useRouter();

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

    // ── Form State ──────────────────────────────────────────────────────────────
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ── Validation ──────────────────────────────────────────────────────────────
    const formValid = fullName.trim().length >= 2 && password.length >= 6;

    // ── Login Handler ───────────────────────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!formValid || loading) return;

        setLoading(true);
        setError("");

        // Generate camp email from name
        const campEmail = `${fullName.toLowerCase().replace(/\s+/g, ".")}@camp.local`;

        try {
            await signInWithEmailAndPassword(auth, campEmail, password);
        } catch (err) {
            console.error("Login error:", err);
            let errorMessage = "Login failed. Try again.";

            switch (err.code) {
                case "auth/user-not-found":
                    errorMessage =
                        "No camper found with that name. Check your name or sign up.";
                    break;
                case "auth/wrong-password":
                case "auth/invalid-credential":
                    errorMessage = "Wrong password. Try again.";
                    break;
                case "auth/too-many-requests":
                    errorMessage = "Too many tries. Chill for a bit.";
                    break;
                default:
                    errorMessage = err.message || "Failed to sign in.";
            }

            setError(errorMessage);
            setLoading(false);
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

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#FDF6EF] pb-24 md:pb-8">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#F97316] px-4 pt-6 md:pt-4 pb-3">
                <div className="flex items-center gap-3 max-w-2xl mx-auto">
                    <button
                        onClick={() => router.push("/")}
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
                            Welcome Back 🏕️
                        </h1>
                        <p
                            className="text-orange-100 text-xs"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Sign in to your camp
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 md:px-6">
                {/* Hero */}
                <div className="flex flex-col items-center pt-8 pb-6">
                    <div className="w-24 h-24 bg-[#FFF7F2] rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md">
                        <span className="text-4xl">🏕️</span>
                    </div>
                    <h2
                        className="text-xl font-bold text-gray-900 text-center"
                        style={{
                            fontFamily: "Plus Jakarta Sans, sans-serif",
                        }}
                    >
                        Camp Life
                    </h2>
                    <p
                        className="text-gray-500 text-sm text-center mt-1 max-w-xs"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        Drop something. Rate the food. Vote on polls.
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

                {/* Login Form */}
                <form
                    onSubmit={handleLogin}
                    className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden divide-y divide-gray-50"
                >
                    {/* Name */}
                    <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                            <UserIcon />
                        </div>
                        <div className="flex-1">
                            <label
                                className="block text-sm font-semibold text-black mb-1"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="e.g. Ada, Chidi, Fatima"
                                className="w-full text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="px-4 pt-3 pb-4 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                            <LockIcon />
                        </div>
                        <div className="flex-1">
                            <label
                                className="block text-sm font-semibold text-black mb-1"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Password
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Your camp password"
                                    className="flex-1 text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                    style={{
                                        fontFamily: "DM Sans, sans-serif",
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                >
                                    {showPassword ? (
                                        <EyeOpenIcon />
                                    ) : (
                                        <EyeClosedIcon />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Login Button */}
                <button
                    onClick={handleLogin}
                    disabled={!formValid || loading}
                    className={`w-full mt-6 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                        formValid && !loading
                            ? "bg-[#F97316] text-white hover:bg-[#C2410C] shadow-lg active:scale-[0.98] cursor-pointer"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    style={{
                        fontFamily: "DM Sans, sans-serif",
                        boxShadow:
                            formValid && !loading
                                ? "0 4px 20px rgba(232,97,26,0.35)"
                                : undefined,
                    }}
                >
                    {loading ? (
                        <>
                            <SpinnerIcon /> Signing in...
                        </>
                    ) : (
                        <>
                            Enter Camp
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
                        </>
                    )}
                </button>

                {/* Sign Up Link */}
                <p
                    className="text-sm text-center mt-6 text-gray-500"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    New to camp?{" "}
                    <Link
                        href="/register"
                        className="text-[#F97316] font-semibold hover:underline"
                    >
                        Join now
                    </Link>
                </p>

                {/* Guest Access */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p
                        className="text-xs text-center text-gray-400 mb-3"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        Or just look around
                    </p>
                    <button
                        onClick={() => router.push("/")}
                        className="w-full py-3 rounded-2xl font-semibold text-sm border-2 border-gray-200 text-gray-700 hover:border-[#F97316]/40 hover:text-[#F97316] transition-all cursor-pointer"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        Browse as Visitor 🕵️
                    </button>
                </div>
            </div>
        </div>
    );
}
