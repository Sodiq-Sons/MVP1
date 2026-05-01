"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useNotifications } from "@/hooks/useNotifications";

// ── Icons (self-contained, no external deps) ─────────────────────────────
const XIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="w-3 h-3"
    >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const UpvoteIcon = () => (
    <svg viewBox="0 0 24 24" fill="#16A34A" className="w-4 h-4">
        <polyline
            points="18 15 12 9 6 15"
            stroke="#16A34A"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
        />
    </svg>
);
const CommentIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
);
const ReplyIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
);
const LikeIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);
const VoteIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
);
const CheckIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const StarIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);
const MegaphoneIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
);
const AlertIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

// ── Type config ───────────────────────────────────────────────────────────
const typeConfig = {
    upvote: {
        bg: "bg-green-50",
        color: "text-green-600",
        border: "border-green-200",
        label: "Upvote",
        icon: <UpvoteIcon />,
        accent: "#16A34A",
    },
    comment: {
        bg: "bg-blue-50",
        color: "text-blue-600",
        border: "border-blue-200",
        label: "Comment",
        icon: <CommentIcon />,
        accent: "#2563EB",
    },
    reply: {
        bg: "bg-indigo-50",
        color: "text-indigo-600",
        border: "border-indigo-200",
        label: "Reply",
        icon: <ReplyIcon />,
        accent: "#4F46E5",
    },
    like_comment: {
        bg: "bg-pink-50",
        color: "text-pink-600",
        border: "border-pink-200",
        label: "Like",
        icon: <LikeIcon />,
        accent: "#DB2777",
    },
    vote: {
        bg: "bg-purple-50",
        color: "text-purple-600",
        border: "border-purple-200",
        label: "Vote",
        icon: <VoteIcon />,
        accent: "#7C3AED",
    },
    resolved: {
        bg: "bg-emerald-50",
        color: "text-emerald-600",
        border: "border-emerald-200",
        label: "Resolved",
        icon: <CheckIcon />,
        accent: "#059669",
    },
    mention: {
        bg: "bg-purple-50",
        color: "text-purple-600",
        border: "border-purple-200",
        label: "Mention",
        icon: <MegaphoneIcon />,
        accent: "#7C3AED",
    },
    milestone: {
        bg: "bg-amber-50",
        color: "text-amber-500",
        border: "border-amber-200",
        label: "Milestone",
        icon: <StarIcon />,
        accent: "#F59E0B",
    },
    update: {
        bg: "bg-orange-50",
        color: "text-orange-500",
        border: "border-orange-200",
        label: "Update",
        icon: <AlertIcon />,
        accent: "#F97316",
    },
};

const TOAST_DURATION = 5000; // 5 seconds

// ── Single Toast ──────────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
    const cfg = typeConfig[toast.type] || typeConfig.update;
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [progress, setProgress] = useState(100);
    const timerRef = useRef(null);
    const progressRef = useRef(null);
    const startTimeRef = useRef(null);
    const pausedRef = useRef(false);
    const remainingRef = useRef(TOAST_DURATION);

    const dismiss = useCallback(() => {
        if (leaving) return;
        setLeaving(true);
        clearInterval(timerRef.current);
        clearInterval(progressRef.current);
        setTimeout(() => onDismiss(toast.id), 320);
    }, [leaving, onDismiss, toast.id]);

    // Start progress countdown
    const startCountdown = useCallback(() => {
        startTimeRef.current = Date.now();
        timerRef.current = setTimeout(dismiss, remainingRef.current);
        progressRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const left = Math.max(0, remainingRef.current - elapsed);
            setProgress((left / TOAST_DURATION) * 100);
        }, 30);
    }, [dismiss]);

    const pauseCountdown = () => {
        if (pausedRef.current) return;
        pausedRef.current = true;
        const elapsed = Date.now() - startTimeRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
        clearTimeout(timerRef.current);
        clearInterval(progressRef.current);
    };

    const resumeCountdown = () => {
        if (!pausedRef.current) return;
        pausedRef.current = false;
        startTimeRef.current = Date.now();
        timerRef.current = setTimeout(dismiss, remainingRef.current);
        progressRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const left = Math.max(0, remainingRef.current - elapsed);
            setProgress((left / TOAST_DURATION) * 100);
        }, 30);
    };

    useEffect(() => {
        // Slight delay so the enter animation fires
        const enterTimer = setTimeout(() => setVisible(true), 20);
        startCountdown();
        return () => {
            clearTimeout(enterTimer);
            clearTimeout(timerRef.current);
            clearInterval(progressRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div
            onMouseEnter={pauseCountdown}
            onMouseLeave={resumeCountdown}
            style={{
                transform:
                    visible && !leaving
                        ? "translateX(0)"
                        : "translateX(calc(100% + 24px))",
                opacity: visible && !leaving ? 1 : 0,
                transition: leaving
                    ? "transform 0.3s cubic-bezier(0.4,0,1,1), opacity 0.3s ease"
                    : "transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease",
                fontFamily: "DM Sans, sans-serif",
            }}
            className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden pointer-events-auto"
        >
            {/* Progress bar */}
            <div className="h-1 w-full bg-gray-100 rounded-t-2xl overflow-hidden">
                <div
                    className="h-full rounded-t-2xl transition-none"
                    style={{
                        width: `${progress}%`,
                        background: cfg.accent,
                        transition: "none",
                    }}
                />
            </div>

            <div className="flex items-start gap-3 p-3.5 pr-3">
                {/* Icon badge */}
                <div
                    className={`w-9 h-9 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0 mt-0.5`}
                >
                    {cfg.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                            className={`text-[10px] font-bold uppercase tracking-wide ${cfg.color}`}
                        >
                            {cfg.label}
                        </span>
                        <span className="text-[10px] text-gray-400">
                            • just now
                        </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-snug">
                        <span className="font-semibold text-gray-900">
                            {toast.actor}
                        </span>{" "}
                        {toast.message}{" "}
                        <span
                            className="font-semibold"
                            style={{ color: cfg.accent }}
                        >
                            &quot;{toast.issue}&quot;
                        </span>
                    </p>
                    {toast.commentPreview && (
                        <p className="text-[11px] text-gray-400 mt-1 italic truncate">
                            &ldquo;{toast.commentPreview}&rdquo;
                        </p>
                    )}
                </div>

                {/* Dismiss */}
                <button
                    onClick={dismiss}
                    className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0 cursor-pointer active:scale-95"
                >
                    <XIcon />
                </button>
            </div>
        </div>
    );
}

// ── Toast Container — renders in top-right corner ─────────────────────────
function ToastContainer({ toasts, onDismiss }) {
    return (
        <div
            className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none"
            aria-live="polite"
        >
            {toasts.map((t) => (
                <Toast key={t.id} toast={t} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

// ── Main hook — tracks new notifications and fires toasts ─────────────────
// Export this so you can use it at the layout/root level
export function usePushToasts() {
    const [currentUser, setCurrentUser] = useState(null);
    const [toasts, setToasts] = useState([]);
    const seenIdsRef = useRef(new Set());
    const isFirstLoadRef = useRef(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user && !user.isAnonymous ? user : null);
        });
        return () => unsub();
    }, []);

    const { notifications } = useNotifications(currentUser?.uid);

    useEffect(() => {
        if (!notifications || notifications.length === 0) return;

        // On first load, mark all existing as seen — don't toast them
        if (isFirstLoadRef.current) {
            notifications.forEach((n) => seenIdsRef.current.add(n.id));
            isFirstLoadRef.current = false;
            return;
        }

        // Find genuinely new ones
        const newOnes = notifications.filter(
            (n) => !seenIdsRef.current.has(n.id),
        );

        if (newOnes.length === 0) return;

        newOnes.forEach((n) => seenIdsRef.current.add(n.id));

        setToasts((prev) =>
            [
                ...newOnes.map((n) => ({
                    ...n,
                    _toastId: `toast-${n.id}-${Date.now()}`,
                })),
                ...prev,
            ].slice(0, 5),
        ); // cap at 5 visible toasts
    }, [notifications]);

    const dismissToast = useCallback((toastId) => {
        setToasts((prev) => prev.filter((t) => t._toastId !== toastId));
    }, []);

    // Each toast needs a stable id for the Toast component
    const toastsWithId = toasts.map((t) => ({ ...t, id: t._toastId }));

    return { toasts: toastsWithId, dismissToast };
}

// ── Drop-in Provider component ────────────────────────────────────────────
// Wrap your root layout with this, or place it anywhere near the root.
export default function PushNotificationProvider({ children }) {
    const { toasts, dismissToast } = usePushToasts();

    return (
        <>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </>
    );
}
