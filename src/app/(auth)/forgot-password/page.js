// app/forgot-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
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

export default function ForgotPasswordPage() {
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

    // ── Form State ──────────────────────────────────────────────────────────────
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // ── Validation ──────────────────────────────────────────────────────────────
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const formValid = isValidEmail(email);

    // ── Submit Handler ───────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formValid || loading) return;

        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch (err) {
            console.error("Password reset error:", err);
            let errorMessage = "Failed to send reset email. Please try again.";

            switch (err.code) {
                case "auth/user-not-found":
                    // Don't reveal if user doesn't exist for security
                    setSuccess(true);
                    setLoading(false);
                    return;
                case "auth/invalid-email":
                    errorMessage = "Please enter a valid email address.";
                    break;
                case "auth/too-many-requests":
                    errorMessage = "Too many requests. Please try again later.";
                    break;
                case "auth/network-request-failed":
                    errorMessage =
                        "Network error. Please check your connection.";
                    break;
                default:
                    errorMessage = err.message || "Something went wrong.";
            }

            setError(errorMessage);
        } finally {
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
                        onClick={() => router.push("/login")}
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
                            Reset Password
                        </h1>
                        <p
                            className="text-orange-100 text-xs"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            We&apos;ll send you a reset link
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 md:px-6">
                {/* Hero */}
                <div className="flex flex-col items-center pt-8 pb-6">
                    <div className="w-24 h-24 bg-[#FFF7F2] rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md">
                        <span className="text-4xl">🔐</span>
                    </div>
                    <h2
                        className="text-xl font-bold text-gray-900 text-center"
                        style={{
                            fontFamily: "Plus Jakarta Sans, sans-serif",
                        }}
                    >
                        Forgot Password?
                    </h2>
                    <p
                        className="text-gray-500 text-sm text-center mt-1 max-w-xs"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        Enter your email and we&apos;ll send you instructions to
                        reset your password
                    </p>
                </div>

                {/* Success State */}
                {success ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-50 p-6 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#22c55e"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    className="w-10 h-10"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                        </div>
                        <h3
                            className="text-lg font-bold text-gray-900 mb-2"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            Check Your Email
                        </h3>
                        <p
                            className="text-sm text-gray-500 mb-6"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            We&apos;ve sent password reset instructions to{" "}
                            <span className="font-semibold text-gray-700">
                                {email}
                            </span>
                            . Please check your inbox and follow the link to
                            reset your password.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push("/login")}
                                className="w-full py-3 rounded-2xl font-bold text-sm bg-[#F97316] text-white hover:bg-[#C2410C] transition-all cursor-pointer"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Back to Login
                            </button>
                            <button
                                onClick={() => {
                                    setSuccess(false);
                                    setEmail("");
                                }}
                                className="w-full py-3 rounded-2xl font-semibold text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                                style={{ fontFamily: "DM Sans, sans-serif" }}
                            >
                                Use a different email
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
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
                        <form
                            onSubmit={handleSubmit}
                            className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden"
                        >
                            <div className="px-4 py-4 flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                    <EmailIcon />
                                </div>
                                <div className="flex-1">
                                    <label
                                        className="block text-sm font-semibold text-black mb-1"
                                        style={{
                                            fontFamily: "DM Sans, sans-serif",
                                        }}
                                    >
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        placeholder="your@email.com"
                                        autoComplete="email"
                                        className="w-full text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                        style={{
                                            fontFamily: "DM Sans, sans-serif",
                                        }}
                                    />
                                </div>
                            </div>
                        </form>

                        {/* Helper Text */}
                        <p
                            className="text-xs text-gray-400 mt-3 px-1"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Make sure to check your spam folder if you
                            don&apos;t see the email in your inbox.
                        </p>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
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
                                    <SpinnerIcon /> Sending...
                                </>
                            ) : (
                                <>
                                    Send Reset Link
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        className="w-4 h-4"
                                    >
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                </>
                            )}
                        </button>

                        {/* Back to Login */}
                        <p
                            className="text-sm text-center mt-6 text-gray-500"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Remember your password?{" "}
                            <Link
                                href="/login"
                                className="text-[#F97316] font-semibold hover:underline"
                            >
                                Sign in
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
