"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { applyActionCode, onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";

const SpinnerIcon = () => (
    <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
);

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
                    <SpinnerIcon />
                </div>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    );
}

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const oobCode = searchParams.get("oobCode");
    const mode = searchParams.get("mode");

    const isValidLink = oobCode && mode === "verifyEmail";
    const [status, setStatus] = useState(isValidLink ? "verifying" : "error");
    const [errorMsg, setErrorMsg] = useState(
        isValidLink ? "" : "This verification link is invalid. Please request a new one from your profile settings."
    );

    useEffect(() => {
        if (!isValidLink) return;

        const verify = async () => {
            try {
                await applyActionCode(auth, oobCode);

                // Update Firestore email field if user is still signed in
                const user = auth.currentUser;
                if (user) {
                    await user.reload();
                    try {
                        await updateDoc(doc(db, "users", user.uid), {
                            email: user.email,
                            emailVerified: true,
                        });
                    } catch (_) {
                        // Firestore update is best-effort; the Auth email is already updated
                    }
                }

                setStatus("success");
            } catch (err) {
                console.error("Email verification error:", err);
                if (err.code === "auth/expired-action-code") {
                    setErrorMsg("This verification link has expired. Please go to your profile settings and request a new one.");
                } else if (err.code === "auth/invalid-action-code") {
                    setErrorMsg("This link has already been used or is invalid. If your email is already verified, you're good to go!");
                } else if (err.code === "auth/user-disabled") {
                    setErrorMsg("This account has been disabled. Please contact support.");
                } else {
                    setErrorMsg("Something went wrong. Please try again or request a new verification link from your profile settings.");
                }
                setStatus("error");
            }
        };

        verify();
    // isValidLink is derived from oobCode + mode; listing those is sufficient
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [oobCode, mode]);

    return (
        <div className="min-h-screen pb-24 md:pb-8" style={{ background: "var(--bg)" }}>
            {/* Header */}
            <header className="sticky top-0 z-40 px-4 pt-6 md:pt-4 pb-3" style={{ background: "var(--cp)" }}>
                <div className="flex items-center gap-3 max-w-2xl mx-auto">
                    <button
                        onClick={() => router.push("/")}
                        className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer text-white"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-white font-bold text-base leading-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            Email Verification
                        </h1>
                        <p className="text-xs" style={{ fontFamily: "DM Sans, sans-serif", color: "rgba(255,255,255,0.8)" }}>
                            Confirming your email address
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center pt-12">

                    {/* Verifying */}
                    {status === "verifying" && (
                        <>
                            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md" style={{ background: "var(--cp-tint)" }}>
                                <SpinnerIcon />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 text-center mb-2" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                Verifying your email…
                            </h2>
                            <p className="text-gray-500 text-sm text-center max-w-xs" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                Please wait while we confirm your email address.
                            </p>
                        </>
                    )}

                    {/* Success */}
                    {status === "success" && (
                        <>
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" className="w-12 h-12">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 text-center mb-2" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                Email Verified! 🎉
                            </h2>
                            <p className="text-gray-500 text-sm text-center max-w-xs mb-8" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                Your email address has been successfully verified and updated on your profile.
                            </p>
                            <div className="w-full max-w-xs space-y-3">
                                <button
                                    onClick={() => router.push("/profile/edit")}
                                    className="w-full py-4 rounded-2xl font-bold text-base btn-primary transition-all cursor-pointer shadow-lg"
                                    style={{ fontFamily: "DM Sans, sans-serif", boxShadow: "0 4px 20px var(--cp-glow)" }}
                                >
                                    Go to Profile
                                </button>
                                <button
                                    onClick={() => router.push("/")}
                                    className="w-full py-3 rounded-2xl font-semibold text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                                    style={{ fontFamily: "DM Sans, sans-serif" }}
                                >
                                    Back to Home
                                </button>
                            </div>
                        </>
                    )}

                    {/* Error */}
                    {status === "error" && (
                        <>
                            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" className="w-12 h-12">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 text-center mb-2" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                Verification Failed
                            </h2>
                            <p className="text-gray-500 text-sm text-center max-w-xs mb-8" style={{ fontFamily: "DM Sans, sans-serif" }}>
                                {errorMsg}
                            </p>
                            <div className="w-full max-w-xs space-y-3">
                                <button
                                    onClick={() => router.push("/profile/edit")}
                                    className="w-full py-4 rounded-2xl font-bold text-base btn-primary transition-all cursor-pointer shadow-lg"
                                    style={{ fontFamily: "DM Sans, sans-serif", boxShadow: "0 4px 20px var(--cp-glow)" }}
                                >
                                    Go to Profile Settings
                                </button>
                                <button
                                    onClick={() => router.push("/")}
                                    className="w-full py-3 rounded-2xl font-semibold text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                                    style={{ fontFamily: "DM Sans, sans-serif" }}
                                >
                                    Back to Home
                                </button>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
