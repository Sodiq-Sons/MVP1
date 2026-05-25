"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    serverTimestamp,
    where,
    addDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const STATUS_COLORS = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    reviewed: "bg-blue-100 text-blue-700 border-blue-200",
    dismissed: "bg-gray-100 text-gray-500 border-gray-200",
    actioned: "bg-red-100 text-red-700 border-red-200",
};

const CAT_EMOJI = {
    emergency: "🚨", food: "🍛", gist: "💬", poll: "🗳️",
    issue: "⚠️", announcement: "📢", other: "📋",
};

export default function AdminDashboard() {
    const router = useRouter();
    const [authed, setAuthed] = useState(null);
    const [tab, setTab] = useState("reports");

    // Reports
    const [reports, setReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    // Emergency posts
    const [emergencies, setEmergencies] = useState([]);
    const [emergencyTitle, setEmergencyTitle] = useState("");
    const [emergencyBody, setEmergencyBody] = useState("");
    const [posting, setPosting] = useState(false);
    const [postDone, setPostDone] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editBody, setEditBody] = useState("");
    const [saving, setSaving] = useState(false);

    // All posts
    const [allPosts, setAllPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [postSearch, setPostSearch] = useState("");

    // Shared delete/flag state
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [flaggingId, setFlaggingId] = useState(null);

    // ── Auth guard ──────────────────────────────────────────────────────────
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user || user.isAnonymous) { router.replace("/"); return; }
            try {
                const snap = await getDoc(doc(db, "users", user.uid));
                if (!snap.exists() || !snap.data().isAdmin) { router.replace("/"); return; }
                setAuthed(user.uid);
            } catch {
                router.replace("/");
            }
        });
        return () => unsub();
    }, [router]);

    // ── Reports subscription ────────────────────────────────────────────────
    useEffect(() => {
        if (!authed) return;
        const q = query(collection(db, "reports"), orderBy("reportedAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setReportsLoading(false);
        });
        return () => unsub();
    }, [authed]);

    // ── Emergency posts subscription ────────────────────────────────────────
    useEffect(() => {
        if (!authed) return;
        const q = query(
            collection(db, "issues"),
            where("type", "==", "emergency"),
            orderBy("createdAt", "desc")
        );
        const unsub = onSnapshot(q, (snap) => {
            setEmergencies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [authed]);

    // ── All posts subscription (lazy — only when tab is active) ─────────────
    useEffect(() => {
        if (!authed || tab !== "posts") return;
        setPostsLoading(true);
        const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setAllPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setPostsLoading(false);
        });
        return () => unsub();
    }, [authed, tab]);

    // ── Report actions ──────────────────────────────────────────────────────
    const setReportStatus = async (reportId, status) => {
        setUpdating(reportId);
        try {
            await updateDoc(doc(db, "reports", reportId), { status, reviewedAt: serverTimestamp() });
        } finally { setUpdating(null); }
    };

    const deletePostFromReport = async (report) => {
        setUpdating(report.id);
        try {
            if (report.issueId) await deleteDoc(doc(db, "issues", report.issueId));
            await updateDoc(doc(db, "reports", report.id), { status: "actioned", reviewedAt: serverTimestamp() });
        } finally { setUpdating(null); }
    };

    // ── Emergency post actions ──────────────────────────────────────────────
    const postEmergency = async (e) => {
        e.preventDefault();
        if (!emergencyTitle.trim() || !emergencyBody.trim()) return;
        setPosting(true);
        try {
            await addDoc(collection(db, "issues"), {
                type: "emergency",
                title: emergencyTitle.trim(),
                description: emergencyBody.trim(),
                author: { uid: authed, name: "Camp Command", isAnonymous: false },
                createdAt: serverTimestamp(),
                upvotes: 0, downvotes: 0, totalVotes: 0, commentCount: 0,
                isPinned: true,
            });
            setEmergencyTitle("");
            setEmergencyBody("");
            setPostDone(true);
            setTimeout(() => setPostDone(false), 3000);
        } finally { setPosting(false); }
    };

    const startEdit = (post) => {
        setEditingId(post.id);
        setEditTitle(post.title || "");
        setEditBody(post.description || "");
        setConfirmDeleteId(null);
    };

    const cancelEdit = () => { setEditingId(null); setEditTitle(""); setEditBody(""); };

    const saveEdit = async (id) => {
        if (!editTitle.trim()) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "issues", id), {
                title: editTitle.trim(),
                description: editBody.trim(),
                updatedAt: serverTimestamp(),
            });
            cancelEdit();
        } finally { setSaving(false); }
    };

    const togglePin = async (id, currentlyPinned) => {
        await updateDoc(doc(db, "issues", id), { isPinned: !currentlyPinned });
    };

    // ── Generic delete (two-tap confirm) ────────────────────────────────────
    const requestDelete = (id) => {
        setConfirmDeleteId(id);
        setEditingId(null);
    };

    const confirmDelete = async (id) => {
        setDeletingId(id);
        try {
            await deleteDoc(doc(db, "issues", id));
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    // ── Flag toggle ─────────────────────────────────────────────────────────
    const toggleFlag = async (id, currently) => {
        setFlaggingId(id);
        try {
            await updateDoc(doc(db, "issues", id), {
                isFlagged: !currently,
                flaggedAt: !currently ? serverTimestamp() : null,
                flaggedBy: !currently ? authed : null,
            });
        } finally { setFlaggingId(null); }
    };

    const filteredPosts = postSearch.trim().length < 1
        ? allPosts
        : allPosts.filter((p) => {
            const q = postSearch.toLowerCase();
            return (
                (p.title || "").toLowerCase().includes(q) ||
                (p.author?.name || "").toLowerCase().includes(q) ||
                (p.category || "").toLowerCase().includes(q)
            );
        });

    if (authed === null) {
        return (
            <div className="min-h-screen bg-page flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-muted border-t-cp animate-spin" />
            </div>
        );
    }

    const pendingReports = reports.filter((r) => r.status === "pending").length;

    return (
        <div className="min-h-screen bg-page">
            {/* Header */}
            <header className="bg-card border-b border-subtle px-4 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cp flex items-center justify-center">
                    <span className="text-white text-sm font-bold">⚡</span>
                </div>
                <div>
                    <h1 className="text-base font-bold text-gray-900" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                        Camp Command Centre
                    </h1>
                    <p className="text-xs text-gray-400">Admin dashboard · Restricted access</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex border-b border-subtle bg-card overflow-x-auto">
                {[
                    { id: "reports",   label: "🚩 Reports",   badge: pendingReports },
                    { id: "emergency", label: "🚨 Emergency",  badge: null },
                    { id: "posts",     label: "📋 All Posts",  badge: null },
                ].map(({ id, label, badge }) => (
                    <button
                        key={id}
                        onClick={() => { setTab(id); setConfirmDeleteId(null); }}
                        className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${tab === id ? "border-cp text-cp" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                    >
                        {label}
                        {badge != null && badge > 0 && (
                            <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{badge}</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

                {/* ══════════════════════════════════════════════════════════
                    REPORTS TAB
                ══════════════════════════════════════════════════════════ */}
                {tab === "reports" && (
                    reportsLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-7 h-7 rounded-full border-2 border-muted border-t-cp animate-spin" />
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 text-sm">No reports yet.</div>
                    ) : (
                        reports.map((r) => (
                            <div key={r.id} className="bg-card rounded-2xl border border-subtle shadow-sm p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{r.issueTitle || "Unknown post"}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Reason: <span className="font-semibold text-gray-700">{r.reason}</span>
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Reporter: <span className="font-medium">{r.reportedBy || "Anonymous"}</span>
                                        </p>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border shrink-0 ${STATUS_COLORS[r.status] || STATUS_COLORS.pending}`}>
                                        {r.status || "pending"}
                                    </span>
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    <a
                                        href={`/issue/${r.issueId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs bg-muted border border-subtle text-gray-700 px-3 py-1.5 rounded-lg font-medium hover:border-cp/40 transition-colors"
                                    >
                                        View Post ↗
                                    </a>
                                    {r.status === "pending" && (
                                        <>
                                            <button
                                                disabled={updating === r.id}
                                                onClick={() => setReportStatus(r.id, "dismissed")}
                                                className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:border-gray-400 transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                Dismiss
                                            </button>
                                            <button
                                                disabled={updating === r.id}
                                                onClick={() => setReportStatus(r.id, "reviewed")}
                                                className="text-xs bg-blue-50 border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:border-blue-400 transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                Mark Reviewed
                                            </button>
                                            <button
                                                disabled={updating === r.id}
                                                onClick={() => deletePostFromReport(r)}
                                                className="text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg font-medium hover:border-red-400 transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                {updating === r.id ? "Deleting…" : "🗑 Delete Post"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )
                )}

                {/* ══════════════════════════════════════════════════════════
                    EMERGENCY TAB
                ══════════════════════════════════════════════════════════ */}
                {tab === "emergency" && (
                    <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
                            <strong>🚨 Emergency posts</strong> are pinned to the top of the feed for all users. Use only for genuine camp emergencies.
                        </div>

                        {/* New alert form */}
                        <form onSubmit={postEmergency} className="bg-card rounded-2xl border border-subtle shadow-sm p-4 space-y-3">
                            <h2 className="text-sm font-bold text-gray-900">Post New Alert</h2>
                            <input
                                type="text"
                                placeholder="Alert headline (e.g. Parade postponed)"
                                value={emergencyTitle}
                                onChange={(e) => setEmergencyTitle(e.target.value)}
                                maxLength={120}
                                className="w-full px-4 py-3 rounded-xl border border-subtle bg-muted text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cp/50 focus:ring-2 focus:ring-cp/10"
                            />
                            <textarea
                                placeholder="Full message to camp members…"
                                value={emergencyBody}
                                onChange={(e) => setEmergencyBody(e.target.value)}
                                rows={4}
                                maxLength={800}
                                className="w-full px-4 py-3 rounded-xl border border-subtle bg-muted text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cp/50 focus:ring-2 focus:ring-cp/10 resize-none"
                            />
                            <button
                                type="submit"
                                disabled={posting || !emergencyTitle.trim() || !emergencyBody.trim()}
                                className="w-full bg-red-600 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 cursor-pointer transition-opacity"
                            >
                                {posting ? "Posting…" : postDone ? "✓ Posted!" : "🚨 Post Emergency Alert"}
                            </button>
                        </form>

                        {/* Existing alerts — edit / pin / delete */}
                        {emergencies.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Existing Alerts ({emergencies.length})</h3>
                                {emergencies.map((post) => (
                                    <div key={post.id} className="bg-card rounded-2xl border border-subtle shadow-sm overflow-hidden">

                                        {editingId === post.id ? (
                                            /* Inline edit form */
                                            <div className="p-4 space-y-3">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Editing Alert</p>
                                                <input
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    maxLength={120}
                                                    className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-muted text-sm text-gray-800 focus:outline-none focus:border-cp/50"
                                                />
                                                <textarea
                                                    value={editBody}
                                                    onChange={(e) => setEditBody(e.target.value)}
                                                    rows={4}
                                                    maxLength={800}
                                                    className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-muted text-sm text-gray-800 focus:outline-none focus:border-cp/50 resize-none"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        disabled={saving || !editTitle.trim()}
                                                        onClick={() => saveEdit(post.id)}
                                                        className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50 cursor-pointer transition-opacity"
                                                        style={{ background: "var(--cp)" }}
                                                    >
                                                        {saving ? "Saving…" : "Save Changes"}
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="px-4 py-2.5 rounded-xl border border-subtle text-sm font-medium text-gray-600 cursor-pointer hover:border-gray-400 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Alert card */
                                            <div className="p-4">
                                                <div className="flex items-start gap-2 mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            {post.isPinned && (
                                                                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">PINNED</span>
                                                            )}
                                                            {post.updatedAt && (
                                                                <span className="text-[10px] text-gray-400">edited</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-bold text-gray-900">{post.title}</p>
                                                        {post.description && (
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.description}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {confirmDeleteId === post.id ? (
                                                    <div className="flex gap-2 items-center bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                                                        <p className="text-xs text-red-600 font-semibold flex-1">Delete this alert permanently?</p>
                                                        <button
                                                            disabled={deletingId === post.id}
                                                            onClick={() => confirmDelete(post.id)}
                                                            className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer disabled:opacity-50 shrink-0"
                                                        >
                                                            {deletingId === post.id ? "Deleting…" : "Yes, Delete"}
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDeleteId(null)}
                                                            className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium cursor-pointer shrink-0"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2 flex-wrap">
                                                        <button
                                                            onClick={() => startEdit(post)}
                                                            className="text-xs bg-blue-50 border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg font-medium cursor-pointer hover:border-blue-400 transition-colors"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button
                                                            onClick={() => togglePin(post.id, post.isPinned)}
                                                            className={`text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer border transition-colors ${post.isPinned ? "bg-amber-50 border-amber-200 text-amber-600 hover:border-amber-400" : "bg-green-50 border-green-200 text-green-600 hover:border-green-400"}`}
                                                        >
                                                            {post.isPinned ? "📌 Unpin" : "📌 Pin"}
                                                        </button>
                                                        <button
                                                            onClick={() => requestDelete(post.id)}
                                                            className="text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg font-medium cursor-pointer hover:border-red-400 transition-colors"
                                                        >
                                                            🗑 Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    ALL POSTS TAB
                ══════════════════════════════════════════════════════════ */}
                {tab === "posts" && (
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={postSearch}
                            onChange={(e) => setPostSearch(e.target.value)}
                            placeholder="Search by title, author or category…"
                            className="w-full px-4 py-3 rounded-xl border border-subtle bg-card text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 shadow-sm"
                            style={{ "--tw-ring-color": "var(--cp-border)" }}
                        />

                        {postsLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-7 h-7 rounded-full border-2 border-muted border-t-cp animate-spin" />
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 text-sm">No posts found.</div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xs text-gray-400">{filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""}</p>
                                {filteredPosts.map((post) => (
                                    <div
                                        key={post.id}
                                        className={`bg-card rounded-2xl border shadow-sm p-4 space-y-3 transition-colors ${post.isFlagged ? "border-amber-300 bg-amber-50/60" : "border-subtle"}`}
                                    >
                                        {/* Post info */}
                                        <div className="flex items-start gap-2">
                                            <span className="text-base shrink-0 mt-0.5">{CAT_EMOJI[post.category] || "📋"}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{post.title || "Untitled"}</p>
                                                    {post.isFlagged && (
                                                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">⚑ FLAGGED</span>
                                                    )}
                                                    {post.type === "emergency" && (
                                                        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full shrink-0">🚨 EMERGENCY</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    <span className="font-medium text-gray-600">{post.author?.name || "Unknown"}</span>
                                                    {post.author?.platoon ? ` · ${post.author.platoon}` : ""}
                                                    {" · "}{post.upvotes || 0} likes
                                                    {" · "}{post.commentCount || 0} comments
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {confirmDeleteId === post.id ? (
                                            <div className="flex gap-2 items-center bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                                                <p className="text-xs text-red-600 font-semibold flex-1">Delete this post permanently?</p>
                                                <button
                                                    disabled={deletingId === post.id}
                                                    onClick={() => confirmDelete(post.id)}
                                                    className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer disabled:opacity-50 shrink-0"
                                                >
                                                    {deletingId === post.id ? "Deleting…" : "Yes, Delete"}
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium cursor-pointer shrink-0"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 flex-wrap">
                                                <a
                                                    href={`/issue/${post.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs bg-muted border border-subtle text-gray-700 px-3 py-1.5 rounded-lg font-medium hover:border-cp/40 transition-colors"
                                                >
                                                    View ↗
                                                </a>
                                                <button
                                                    disabled={flaggingId === post.id}
                                                    onClick={() => toggleFlag(post.id, post.isFlagged)}
                                                    className={`text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer border transition-colors disabled:opacity-50 ${post.isFlagged ? "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-400" : "bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-400"}`}
                                                >
                                                    {flaggingId === post.id ? "…" : post.isFlagged ? "Remove Flag" : "⚑ Flag"}
                                                </button>
                                                <button
                                                    onClick={() => requestDelete(post.id)}
                                                    className="text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg font-medium cursor-pointer hover:border-red-400 transition-colors"
                                                >
                                                    🗑 Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
