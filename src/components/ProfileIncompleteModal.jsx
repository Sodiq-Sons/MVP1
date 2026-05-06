"use client";
import { useRouter } from "next/navigation";

export default function ProfileIncompleteModal({
    isOpen,
    onClose,
    action = "do this",
}) {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(4px)",
                padding: "16px",
            }}
        >
            <div
                style={{
                    background: "#fff",
                    borderRadius: "20px",
                    padding: "28px 24px",
                    maxWidth: "360px",
                    width: "100%",
                    textAlign: "center",
                    fontFamily: "DM Sans, sans-serif",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                }}
            >
                <div
                    style={{
                        width: "64px",
                        height: "64px",
                        background: "#FFF7F2",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px",
                        fontSize: "32px",
                    }}
                >
                    🔒
                </div>
                <h2
                    style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#111827",
                        margin: "0 0 8px",
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                    }}
                >
                    Complete Your Profile First
                </h2>
                <p
                    style={{
                        fontSize: "13px",
                        color: "#6B7280",
                        margin: "0 0 6px",
                        lineHeight: 1.5,
                    }}
                >
                    You need a complete profile to {action}.
                </p>
                <p
                    style={{
                        fontSize: "12px",
                        color: "#9CA3AF",
                        margin: "0 0 20px",
                    }}
                >
                    Fill in your email, phone, camp location and other details
                    to unlock voting and posting.
                </p>

                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: "11px",
                            border: "1.5px solid #E5E7EB",
                            borderRadius: "12px",
                            background: "#fff",
                            color: "#6B7280",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "DM Sans, sans-serif",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onClose();
                            window.location.href = "/profile/edit";
                        }}
                        style={{
                            flex: 1,
                            padding: "11px",
                            border: "none",
                            borderRadius: "12px",
                            background: "#F97316",
                            color: "#fff",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "DM Sans, sans-serif",
                            boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
                        }}
                    >
                        Complete Profile
                    </button>
                </div>
            </div>
        </div>
    );
}
