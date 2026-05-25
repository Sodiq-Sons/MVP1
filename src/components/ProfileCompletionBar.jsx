"use client";

// components/ProfileCompletionBar.jsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    computeProfileCompletion,
    getMissingFields,
    isProfileComplete,
} from "@/lib/profileCompletion";

export default function ProfileCompletionBar() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [dismissed, setDismissed] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user && !user.isAnonymous) {
                setCurrentUser(user);
            } else {
                setCurrentUser(null);
                setUserData(null);
            }
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!currentUser) return;
        const unsub = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
            if (snap.exists()) setUserData(snap.data());
        });
        return () => unsub();
    }, [currentUser]);

    // Check session-level dismissal
    useEffect(() => {
        const wasDismissed = sessionStorage.getItem("profile_bar_dismissed");
        if (wasDismissed === "true") setDismissed(true);
    }, []);

    // Show/hide based on completion
    useEffect(() => {
        if (!currentUser || !userData || dismissed) {
            setVisible(false);
            return;
        }
        const pct = computeProfileCompletion(userData);
        setVisible(pct < 100);
    }, [currentUser, userData, dismissed]);

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem("profile_bar_dismissed", "true");
        setVisible(false);
    };

    if (!visible || !userData) return null;

    const pct = computeProfileCompletion(userData);
    const missing = getMissingFields(userData);

    return (
        <div
            style={{
                position: "fixed",
                right: "16px",
                bottom: "80px",
                zIndex: 999,
                width: "280px",
                background: "#fff",
                borderRadius: "16px",
                border: "1px solid #FED7AA",
                boxShadow: "0 8px 32px rgba(249,115,22,0.15)",
                overflow: "hidden",
                fontFamily: "DM Sans, sans-serif",
            }}
        >
            {/* Orange top bar */}
            <div
                style={{
                    background: "var(--cp)",
                    padding: "10px 14px 8px",
                    position: "relative",
                }}
            >
                <button
                    onClick={handleDismiss}
                    style={{
                        position: "absolute",
                        top: "8px",
                        right: "10px",
                        background: "rgba(255,255,255,0.25)",
                        border: "none",
                        borderRadius: "8px",
                        width: "22px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#fff",
                        fontSize: "14px",
                        lineHeight: 1,
                    }}
                    aria-label="Dismiss"
                >
                    ×
                </button>
                <p
                    style={{
                        margin: 0,
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                    }}
                >
                    Profile completion
                </p>
                <p
                    style={{
                        margin: "2px 0 0",
                        color: "rgba(255,255,255,0.85)",
                        fontSize: "11px",
                    }}
                >
                    Complete your profile to vote &amp; post
                </p>
            </div>

            <div style={{ padding: "12px 14px" }}>
                {/* Percentage + bar */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "10px",
                    }}
                >
                    <div
                        style={{
                            flex: 1,
                            height: "8px",
                            background: "#FED7AA",
                            borderRadius: "99px",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                width: `${pct}%`,
                                height: "100%",
                                background:
                                    pct < 40
                                        ? "#EF4444"
                                        : pct < 70
                                          ? "#F59E0B"
                                          : "#22C55E",
                                borderRadius: "99px",
                                transition: "width 0.5s ease",
                            }}
                        />
                    </div>
                    <span
                        style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#1F2937",
                            minWidth: "36px",
                            textAlign: "right",
                        }}
                    >
                        {pct}%
                    </span>
                </div>

                {/* Your profile is X% complete */}
                <p
                    style={{
                        margin: "0 0 8px",
                        fontSize: "12px",
                        color: "#6B7280",
                    }}
                >
                    Your profile is{" "}
                    <span style={{ fontWeight: 700, color: "var(--cp)" }}>
                        {pct}% complete
                    </span>
                </p>

                {/* Missing fields (show max 3) */}
                {missing.length > 0 && (
                    <div style={{ marginBottom: "10px" }}>
                        {missing.slice(0, 3).map((f) => (
                            <div
                                key={f.key}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    marginBottom: "4px",
                                }}
                            >
                                <span
                                    style={{
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "50%",
                                        background: "var(--cp)",
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: "11px",
                                        color: "#9CA3AF",
                                    }}
                                >
                                    Missing: {f.label}
                                </span>
                            </div>
                        ))}
                        {missing.length > 3 && (
                            <p
                                style={{
                                    fontSize: "11px",
                                    color: "#9CA3AF",
                                    margin: "2px 0 0",
                                }}
                            >
                                +{missing.length - 3} more fields
                            </p>
                        )}
                    </div>
                )}

                <button
                    onClick={() => router.push("/profile/edit")}
                    style={{
                        width: "100%",
                        padding: "8px",
                        background: "var(--cp)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "DM Sans, sans-serif",
                    }}
                >
                    Complete Profile →
                </button>
            </div>
        </div>
    );
}
