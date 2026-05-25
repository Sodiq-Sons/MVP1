"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const QUESTIONS = [
    "What was your best experience at camp today?",
    "What would you change about today?",
    "Rate your overall camp day (1–5 ⭐)",
    "Any shoutouts to fellow corpers?",
];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const LS_KEY = "camp_questionnaire_last";

export default function WeeklyQuestionnaire() {
    const [show, setShow] = useState(false);
    const [uid, setUid] = useState(null);
    const [answers, setAnswers] = useState(["", "", "", ""]);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (!user || user.isAnonymous) return;
            setUid(user.uid);
            const last = Number(localStorage.getItem(LS_KEY) || 0);
            if (Date.now() - last >= SEVEN_DAYS_MS) {
                // Wait 4 seconds after login before showing popup
                const t = setTimeout(() => setShow(true), 4000);
                return () => clearTimeout(t);
            }
        });
        return () => unsub();
    }, []);

    const dismiss = () => {
        localStorage.setItem(LS_KEY, String(Date.now()));
        setShow(false);
    };

    const handleSubmit = async () => {
        if (!uid) return;
        setSubmitting(true);
        try {
            // Store answers as a sub-document path via user doc metadata
            // (A real app would use a `questionnaires` collection)
            await updateDoc(doc(db, "users", uid), {
                lastQuestionnaire: {
                    answeredAt: serverTimestamp(),
                    answers: QUESTIONS.map((q, i) => ({ question: q, answer: answers[i] })),
                },
            });
            setSubmitted(true);
            localStorage.setItem(LS_KEY, String(Date.now()));
            setTimeout(dismiss, 2000);
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Weekly questionnaire"
        >
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 text-center" style={{ background: "linear-gradient(135deg, var(--cp-tint), var(--cp-tint))" }}>
                    <div className="text-3xl mb-2">📋</div>
                    <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                        Weekly Check-In
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Quick 4-question survey — takes 30 seconds</p>
                </div>

                {submitted ? (
                    <div className="px-6 py-8 text-center">
                        <div className="text-4xl mb-3">🎉</div>
                        <p className="text-sm font-bold text-gray-800">Thanks for sharing!</p>
                        <p className="text-xs text-gray-400 mt-1">See you next week</p>
                    </div>
                ) : (
                    <div className="px-6 py-5 space-y-4">
                        {/* Progress dots */}
                        <div className="flex justify-center gap-1.5">
                            {QUESTIONS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-cp" : i < step ? "w-3 bg-cp/40" : "w-3 bg-gray-200"}`}
                                />
                            ))}
                        </div>

                        <p className="text-sm font-semibold text-gray-800 text-center">
                            {QUESTIONS[step]}
                        </p>

                        <textarea
                            key={step}
                            autoFocus
                            value={answers[step]}
                            onChange={(e) => {
                                const next = [...answers];
                                next[step] = e.target.value;
                                setAnswers(next);
                            }}
                            rows={3}
                            maxLength={300}
                            placeholder="Your answer…"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cp/50 focus:ring-2 focus:ring-cp/10 resize-none"
                        />

                        <div className="flex gap-2">
                            {step > 0 && (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-colors cursor-pointer"
                                >
                                    Back
                                </button>
                            )}
                            {step < QUESTIONS.length - 1 ? (
                                <button
                                    onClick={() => setStep(step + 1)}
                                    className="flex-[3] py-2.5 rounded-xl bg-cp text-white text-sm font-bold  transition-colors cursor-pointer"
                                >
                                    Next →
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-[3] py-2.5 rounded-xl bg-cp text-white text-sm font-bold  disabled:opacity-60 cursor-pointer"
                                >
                                    {submitting ? "Submitting…" : "Submit ✓"}
                                </button>
                            )}
                        </div>
                        <button
                            onClick={dismiss}
                            className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1 cursor-pointer"
                        >
                            Skip for now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
