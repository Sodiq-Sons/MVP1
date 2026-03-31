"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

// ── Icons ────────────────────────────────────────────────────────────────────
const BackIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-5 h-5"
    >
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

const CopyIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
);

const ShareIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
);

const GiftIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-5 h-5"
    >
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
);

const UsersIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
);

const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.13 1.56 5.909L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const TwitterIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

// ── Main Component ───────────────────────────────────────────────────────────
export default function InvitePage() {
    const router = useRouter();
    const [referralCode, setReferralCode] = useState("WTP2026");
    const [referralCount, setReferralCount] = useState(0);
    const [referralPoints, setReferralPoints] = useState(0);

    useEffect(() => {
        // Generate referral code from user ID if available
        if (auth.currentUser) {
            const code = auth.currentUser.uid.slice(0, 8).toUpperCase();
            setReferralCode(code);
        }
    }, []);

    const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${referralCode}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        toast.success("Link copied to clipboard!");
    };

    const handleShare = async () => {
        const shareData = {
            title: "Join We The People NG",
            text:
                "Help make Nigeria better! Report local issues and track their resolution. Use my code: " +
                referralCode,
            url: referralLink,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // User cancelled
            }
        } else {
            handleCopy();
        }
    };

    const shareOptions = [
        {
            name: "WhatsApp",
            icon: <WhatsAppIcon />,
            color: "bg-green-500",
            action: () => {
                const text = encodeURIComponent(
                    `Join We The People NG! Report issues in your community: ${referralLink}`,
                );
                window.open(`https://wa.me/?text=${text}`, "_blank");
            },
        },
        {
            name: "Twitter",
            icon: <TwitterIcon />,
            color: "bg-black",
            action: () => {
                const text = encodeURIComponent(
                    "Join me on We The People NG — making Nigeria better, one issue at a time 🇳🇬",
                );
                window.open(
                    `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`,
                    "_blank",
                );
            },
        },
        {
            name: "More",
            icon: <ShareIcon />,
            color: "bg-gray-600",
            action: handleShare,
        },
    ];

    return (
        <div className="min-h-screen pb-24" style={{ background: "#FDF6EF" }}>
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#F97316] px-4 pt-4 pb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white"
                    >
                        <BackIcon />
                    </button>
                    <h1
                        className="text-white font-bold text-lg"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                        Invite Friends
                    </h1>
                </div>
            </header>

            <div className="px-4 space-y-4 mt-4">
                {/* Hero Card */}
                <div className="bg-[#EA580C] rounded-2xl p-5 text-white relative overflow-hidden">
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage:
                                "radial-gradient(circle, #fff 1px, transparent 1px)",
                            backgroundSize: "20px 20px",
                        }}
                    />
                    <div className="relative z-10 text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <GiftIcon />
                        </div>
                        <h2
                            className="text-xl font-bold mb-1"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            Invite & Earn
                        </h2>
                        <p className="text-sm text-white/80 mb-4">
                            Get 50 points for every friend who joins and posts
                            their first issue
                        </p>
                        <div className="flex justify-center gap-6 text-center">
                            <div>
                                <div className="text-2xl font-bold">
                                    {referralCount}
                                </div>
                                <div className="text-xs text-white/60">
                                    Friends Joined
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {referralPoints}
                                </div>
                                <div className="text-xs text-white/60">
                                    Points Earned
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Referral Link */}
                <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                        Your Referral Link
                    </label>
                    <div className="flex gap-2">
                        <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-600 truncate font-mono">
                            {referralLink}
                        </div>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 bg-[#F97316] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#EA580C] transition-colors"
                        >
                            <CopyIcon />
                            Copy
                        </button>
                    </div>
                    <div className="mt-3 text-center">
                        <span className="inline-block bg-orange-50 text-[#F97316] text-xs font-bold px-3 py-1.5 rounded-lg">
                            Code: {referralCode}
                        </span>
                    </div>
                </div>

                {/* Share Options */}
                <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">
                        Share via
                    </label>
                    <div className="flex gap-3">
                        {shareOptions.map((option) => (
                            <button
                                key={option.name}
                                onClick={option.action}
                                className={`flex-1 ${option.color} text-white rounded-xl py-3 flex flex-col items-center gap-1.5 hover:opacity-90 transition-opacity`}
                            >
                                {option.icon}
                                <span className="text-xs font-semibold">
                                    {option.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* How It Works */}
                <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
                    <div className="px-4 pt-3 pb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            How It Works
                        </span>
                    </div>
                    <div className="p-4 space-y-3">
                        {[
                            {
                                step: "1",
                                text: "Share your unique link with friends",
                            },
                            {
                                step: "2",
                                text: "They sign up using your referral code",
                            },
                            { step: "3", text: "They post their first issue" },
                            {
                                step: "4",
                                text: "You both earn 50 bonus points!",
                            },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-[#F97316] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                    {item.step}
                                </div>
                                <span className="text-sm text-gray-700">
                                    {item.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Leaderboard Teaser */}
                <div className="bg-linear-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#F97316] rounded-xl flex items-center justify-center text-white">
                            <UsersIcon />
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-bold text-gray-800">
                                Top Referrers
                            </div>
                            <div className="text-xs text-gray-500">
                                See who&apos;s growing the community
                            </div>
                        </div>
                        <button
                            onClick={() =>
                                toast.success("Leaderboard coming soon!")
                            }
                            className="text-xs font-bold text-[#F97316] bg-white px-3 py-1.5 rounded-lg shadow-sm"
                        >
                            View
                        </button>
                    </div>
                </div>

                <p className="text-center text-[10px] text-gray-400 px-4">
                    Referral points are credited after your friend verifies
                    their email and posts their first issue.
                </p>
            </div>
        </div>
    );
}
