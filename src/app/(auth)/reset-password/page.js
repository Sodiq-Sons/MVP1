"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { authErrorMessage } from "@/lib/authErrors";
import AuthErrorBanner from "@/components/AuthErrorBanner";
import Link from "next/link";

// ─── Icons ───────────────────────────────────────────────────────────────────

const LockIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);

const EyeOpenIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeClosedIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
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

// ─── Main Component Wrapper ───────────────────────────────────────────────────

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
                    <SpinnerIcon />
                </div>
            }
        >
            <ResetPasswordContent />
        </Suspense>
    );
}

// ─── Actual Content Component ─────────────────────────────────────────────────

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const oobCode = searchParams.get("oobCode");
    const mode = searchParams.get("mode");

    const [verifying, setVerifying] = useState(true);
    const [codeValid, setCodeValid] = useState(false);
    const [error, setError] = useState(null);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Email verification links come through the same action URL — forward them
        if (mode === "verifyEmail" && oobCode) {
            router.replace(`/verify-email?mode=verifyEmail&oobCode=${oobCode}`);
            return;
        }
        if (!oobCode || mode !== "resetPassword") {
            setVerifying(false);
            setError({
                title: "Invalid link",
                message: "This password reset link is invalid or has expired. Please request a new one.",
            });
            return;
        }

        const verifyCode = async () => {
            try {
                await verifyPasswordResetCode(auth, oobCode);
                setCodeValid(true);
            } catch (err) {
                console.error("Verify code error:", err);
                setError({
                    title: "Link expired",
                    message: "This password reset link has expired or is invalid. Please request a new one.",
                });
            } finally {
                setVerifying(false);
            }
        };

        verifyCode();
    }, [oobCode, mode]);

    const isValidPassword = (pwd) => pwd.length >= 6;
    const formValid = isValidPassword(password) && password === confirmPassword && password.length > 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formValid || loading || !codeValid || !oobCode) return;

        setLoading(true);
        setError(null);

        try {
            await confirmPasswordReset(auth, oobCode, password);
            setSuccess(true);
        } catch (err) {
            console.error("Reset password error:", err);
            setError(authErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pb-24 md:pb-8" style={{ background: "var(--bg)" }}>
            {/* Header */}
            <header className="sticky top-0 z-40 px-4 pt-6 md:pt-4 pb-3" style={{ background: "var(--cp)" }}>
                <div className="flex items-center gap-3 max-w-2xl mx-auto">
                    <button
                        onClick={() => router.push("/login")}
                        className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer text-white"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-white font-bold text-base leading-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            New Password
                        </h1>
                        <p className="text-xs" style={{ fontFamily: "DM Sans, sans-serif", color: "rgba(255,255,255,0.8)" }}>
                            Create a new secure password
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 md:px-6">
                {/* Verifying State */}
                {verifying && (
                    <div className="flex flex-col items-center pt-12">
                        <SpinnerIcon />
                        <p className="text-gray-500 mt-4" style={{ fontFamily: "DM Sans, sans-serif" }}>
                            Verifying reset link...
                        </p>
                    </div>
                )}

                {/* Invalid/Expired Link State */}
                {!verifying && error && !codeValid && (
                    <div className="flex flex-col items-center pt-8">
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="w-12 h-12">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 text-center mb-2" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            {error.title}
                        </h2>
                        <p className="text-gray-500 text-sm text-center max-w-xs mb-6" style={{ fontFamily: "DM Sans, sans-serif" }}>
                            {error.message}
                        </p>
                        <Link
                            href="/forgot-password"
                            className="w-full max-w-xs py-4 rounded-2xl font-bold text-base btn-primary text-center transition-all cursor-pointer"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Request New Link
                        </Link>
                    </div>
                )}

                {/* Success State */}
                {!verifying && success && (
                    <div className="flex flex-col items-center pt-8">
                        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" className="w-12 h-12">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 text-center mb-2" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            Password Reset!
                        </h2>
                        <p className="text-gray-500 text-sm text-center max-w-xs mb-6" style={{ fontFamily: "DM Sans, sans-serif" }}>
                            Your password has been successfully reset. You can now sign in with your new password.
                        </p>
                        <button
                            onClick={() => router.push("/login")}
                            className="w-full max-w-xs py-4 rounded-2xl font-bold text-base btn-primary transition-all cursor-pointer shadow-lg"
                            style={{ fontFamily: "DM Sans, sans-serif" }}
                        >
                            Sign In Now
                        </button>
                    </div>
                )}

                {/* Reset Form */}
                {!verifying && codeValid && !success && (
                    <>
                        {/* Hero */}
                        <div className="flex flex-col items-center pt-8 pb-6">
                            <div
                                className="w-24 h-24 rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md"
                                style={{ background: "var(--cp-tint)" }}
                            >
                                <span className="text-4xl">🔑</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 text-center" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                Create New Password
                            </h2>
                            <p className="text-gray-500 text-sm text-center mt-1 max-w-xs" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                Your new password must be at least 6 characters long
                            </p>
                        </div>

                        {/* Error Banner */}
                        <AuthErrorBanner title={error?.title} message={error?.message} />

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden divide-y divide-subtle"
                        >
                            {/* New Password */}
                            <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                                <div className="w-8 h-8 bg-subtle rounded-lg flex items-center justify-center shrink-0">
                                    <LockIcon />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-black mb-1" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                        New Password
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min 6 characters"
                                            autoComplete="new-password"
                                            className="flex-1 text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                            style={{ fontFamily: "DM Sans, sans-serif" }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                        >
                                            {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                                        </button>
                                    </div>
                                    {password.length > 0 && (
                                        <p className={`text-xs mt-1 ${isValidPassword(password) ? "text-green-500" : "text-gray-400"}`}>
                                            {isValidPassword(password) ? "✓ Password looks good" : "Password must be at least 6 characters"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="px-4 pt-3 pb-4 flex items-center gap-3">
                                <div className="w-8 h-8 bg-subtle rounded-lg flex items-center justify-center shrink-0">
                                    <LockIcon />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-black mb-1" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                        Confirm Password
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter password"
                                            autoComplete="new-password"
                                            className="flex-1 text-sm text-black placeholder-gray-300 focus:outline-none bg-transparent"
                                            style={{ fontFamily: "DM Sans, sans-serif" }}
                                        />
                                    </div>
                                    {confirmPassword.length > 0 && password !== confirmPassword && (
                                        <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                                    )}
                                </div>
                            </div>
                        </form>

                        {/* Password Requirements */}
                        <div className="mt-4 bg-white rounded-xl border border-subtle p-4">
                            <p className="text-xs font-semibold text-gray-700 mb-2" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                Password requirements:
                            </p>
                            <ul className="space-y-1.5">
                                {[
                                    { label: "At least 6 characters", valid: password.length >= 6 },
                                    { label: "Passwords match", valid: password === confirmPassword && password.length > 0 },
                                ].map((req, i) => (
                                    <li
                                        key={i}
                                        className={`flex items-center gap-2 text-xs ${req.valid ? "text-green-600" : "text-gray-400"}`}
                                        style={{ fontFamily: "DM Sans, sans-serif" }}
                                    >
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center ${req.valid ? "bg-green-500" : "bg-gray-200"}`}>
                                            {req.valid && (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-2.5 h-2.5">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </span>
                                        {req.label}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!formValid || loading}
                            className={`w-full mt-6 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                                formValid && !loading
                                    ? "btn-primary shadow-lg cursor-pointer"
                                    : "bg-muted text-gray-400 cursor-not-allowed"
                            }`}
                            style={{
                                fontFamily: "DM Sans, sans-serif",
                                boxShadow: formValid && !loading ? "0 4px 20px var(--cp-glow)" : undefined,
                            }}
                        >
                            {loading ? (
                                <><SpinnerIcon /> Resetting...</>
                            ) : (
                                <><CheckIcon /> Reset Password</>
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
