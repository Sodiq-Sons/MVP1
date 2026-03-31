"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const SearchIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
    </svg>
);

const ChevronDownIcon = ({ open }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const MessageIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-5 h-5"
    >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
);

const ExternalIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4"
    >
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
    </svg>
);

// ── FAQ Data ─────────────────────────────────────────────────────────────────
const faqCategories = [
    {
        title: "Getting Started",
        items: [
            {
                q: "How do I report an issue?",
                a: "Tap the '+' button on the home screen, select a category, add a photo and description of the problem, then submit. Your issue will be reviewed and routed to the appropriate authority.",
            },
            {
                q: "Do I need an account to use the app?",
                a: "You can browse issues anonymously, but you'll need an account to report issues, earn badges, and track your impact. Anonymous users can sign up anytime to claim their history.",
            },
            {
                q: "What areas does the app cover?",
                a: "Currently focused on Nigeria. We're expanding to other African countries soon. Issues are organized by state and local government area.",
            },
        ],
    },
    {
        title: "Issues & Reporting",
        items: [
            {
                q: "What types of issues can I report?",
                a: "Infrastructure (roads, bridges), Healthcare, Education, Security, Environment, Transportation, Electricity, and Water supply. Choose the category that best fits your report.",
            },
            {
                q: "How long until my issue is resolved?",
                a: "Resolution times vary based on issue type and local authority response. You can track status updates in real-time: Under Review → In Progress → Resolved.",
            },
            {
                q: "Can I edit or delete my issue?",
                a: "Yes, go to your profile, find the issue under 'My Issues', and tap to edit. You can update details or delete within 24 hours of posting.",
            },
        ],
    },
    {
        title: "Points & Badges",
        items: [
            {
                q: "How do I earn points?",
                a: "Post issues (10 pts), get upvotes (5 pts each), receive comments (2 pts), and when your issue is marked resolved (50 pts). Quality reports earn bonus points.",
            },
            {
                q: "What are badges?",
                a: "Badges recognize your contributions: First Report, Trending Reporter, Community Voice, Problem Solver, and more. Collect them to unlock special features.",
            },
            {
                q: "What are levels?",
                a: "Levels show your community standing. Start as 'New Voice' and progress to 'Community Leader' as you earn points. Higher levels get priority issue routing.",
            },
        ],
    },
    {
        title: "Account & Privacy",
        items: [
            {
                q: "Is my data safe?",
                a: "Yes. We use industry-standard encryption, never sell your data, and you control what's public. See Privacy Settings to manage your visibility.",
            },
            {
                q: "How do I delete my account?",
                a: "Go to Profile → Privacy & Security → Delete Account. Note: This permanently removes all your data and cannot be undone.",
            },
        ],
    },
];

// ── Main Component ───────────────────────────────────────────────────────────
export default function HelpPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [openItems, setOpenItems] = useState({});

    const toggleItem = (catIdx, itemIdx) => {
        const key = `${catIdx}-${itemIdx}`;
        setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const filteredCategories = faqCategories
        .map((cat) => ({
            ...cat,
            items: cat.items.filter(
                (item) =>
                    item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.a.toLowerCase().includes(searchQuery.toLowerCase()),
            ),
        }))
        .filter((cat) => cat.items.length > 0);

    return (
        <div className="min-h-screen pb-24" style={{ background: "#FDF6EF" }}>
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#F97316] px-4 pt-4 pb-4">
                <div className="flex items-center gap-3 mb-3">
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
                        Help & FAQ
                    </h1>
                </div>

                {/* Search */}
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/20 text-white placeholder-white/60 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:bg-white/30"
                    />
                </div>
            </header>

            <div className="px-4 space-y-4 mt-4">
                {/* Contact Support Card */}
                <div className="bg-[#EA580C] rounded-2xl p-4 text-white relative overflow-hidden">
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage:
                                "radial-gradient(circle, #fff 1px, transparent 1px)",
                            backgroundSize: "20px 20px",
                        }}
                    />
                    <div className="relative z-10">
                        <h3
                            className="font-bold text-sm mb-1"
                            style={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                        >
                            Still need help?
                        </h3>
                        <p className="text-xs text-white/80 mb-3">
                            Our support team typically responds within 24 hours
                        </p>
                        <button
                            onClick={() =>
                                toast.success("Opening support chat...")
                            }
                            className="flex items-center gap-2 bg-white text-[#EA580C] px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/90 transition-colors"
                        >
                            <MessageIcon />
                            Contact Support
                        </button>
                    </div>
                </div>

                {/* FAQ Categories */}
                {filteredCategories.map((category, catIdx) => (
                    <div
                        key={catIdx}
                        className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden"
                    >
                        <div className="px-4 pt-3 pb-2">
                            <span className="text-[10px] font-bold text-[#F97316] uppercase tracking-wider">
                                {category.title}
                            </span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {category.items.map((item, itemIdx) => {
                                const isOpen =
                                    openItems[`${catIdx}-${itemIdx}`];
                                return (
                                    <div key={itemIdx} className="px-4">
                                        <button
                                            onClick={() =>
                                                toggleItem(catIdx, itemIdx)
                                            }
                                            className="w-full flex items-center justify-between py-3.5 text-left"
                                        >
                                            <span
                                                className="text-sm font-semibold text-gray-800 pr-4"
                                                style={{
                                                    fontFamily:
                                                        "DM Sans, sans-serif",
                                                }}
                                            >
                                                {item.q}
                                            </span>
                                            <ChevronDownIcon open={isOpen} />
                                        </button>
                                        {isOpen && (
                                            <div className="pb-3.5 text-xs text-gray-500 leading-relaxed">
                                                {item.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {filteredCategories.length === 0 && (
                    <div className="text-center py-10">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="text-sm text-gray-500">
                            No results found
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Try different keywords
                        </p>
                    </div>
                )}

                {/* Quick Links */}
                <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
                    <div className="px-4 pt-3 pb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Resources
                        </span>
                    </div>
                    <a
                        href="#"
                        className="flex items-center gap-3 px-4 py-3.5 border-t border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-[#F97316] shrink-0">
                            <ExternalIcon />
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-800">
                                Community Guidelines
                            </div>
                            <div className="text-[11px] text-gray-400">
                                Learn about our standards
                            </div>
                        </div>
                        <ChevronDownIcon />
                    </a>
                    <a
                        href="#"
                        className="flex items-center gap-3 px-4 py-3.5 border-t border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-[#F97316] shrink-0">
                            <ExternalIcon />
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-800">
                                Terms of Service
                            </div>
                            <div className="text-[11px] text-gray-400">
                                Read our legal terms
                            </div>
                        </div>
                        <ChevronDownIcon />
                    </a>
                </div>

                <p className="text-center text-[10px] text-gray-400">
                    Version 1.0.0 · Last updated March 2026
                </p>
            </div>
        </div>
    );
}
