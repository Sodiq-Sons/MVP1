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

export default function AdminDashboard() {
    const router = useRouter();
    const [authed, setAuthed] = useState(null);
    const [tab, setTab] = useState("reports");
    const [reports, setReports] = useState([]);
    const [emergencies, setEmergencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [emergencyTitle, setEmergencyTitle] = useState("");
    const [emergencyBody, setEmergencyBody] = useState("");
    const [posting, setPosting] = useState(false);
    const [postDone, setPostDone] = useState(false);

    // Auth guard — check Firestore isAdmin field; cannot be spoofed
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user || user.isAnonymous) { router.replace("/"); return; }
            try {
                const snap = await getDoc(doc(db, "users", user.uid));
                if (!snap.exists() || !snap.data().isAdmin) {
                    router.replace("/");
                    return;
                }
                setAuthed(user.uid);
            } catch {
                router.replace("/");
            }
        });
        return () => unsub();
    }, [router]);

    // Reports subscription
    useEffect(() => {
        if (!authed) return;
        const q = query(collection(db, "reports"), orderBy("reportedAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, [authed]);

    // Emergency posts subscription
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

    const setReportStatus = async (reportId, status) => {
        setUpdating(reportId);
        try {
            await updateDoc(doc(db, "reports", reportId), { status, reviewedAt: serverTimestamp() });
        } finally {
            setUpdating(null);
        }
    };

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
                upvotes: 0,
                downvotes: 0,
                totalVotes: 0,
                isPinned: true,
            });
            setEmergencyTitle("");
            setEmergencyBody("");
            setPostDone(true);
            setTimeout(() => setPostDone(false), 3000);
        } finally {
            setPosting(false);
        }
    };

    if (authed === null) {
        return (
            <div className="min-h-screen bg-page flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-muted border-t-cp animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-page">
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
            <div className="flex border-b border-subtle bg-card">
                {[
                    { id: "reports", label: "🚩 Reports", count: reports.filter(r => r.status === "pending").length },
                    { id: "emergency", label: "🚨 Emergency Post", count: null },
                ].map(({ id, label, count }) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${tab === id ? "border-cp text-cp" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                    >
                        {label}
                        {count != null && count > 0 && (
                            <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{count}</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

                {/* Reports Tab */}
                {tab === "reports" && (
                    <>
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-7 h-7 rounded-full border-2 border-muted border-t-cp animate-spin" />
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 text-sm">No reports yet.</div>
                        ) : (
                            reports.map((r) => (
                                <div key={r.id} className="bg-card rounded-2xl border border-subtle shadow-sm p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{r.issueTitle || "Unknown post"}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Reason: <span className="font-semibold text-gray-700">{r.reason}</span>
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Reporter: <span className="font-medium">{r.reportedBy || "Anonymous"}</span>
                                            </p>
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${STATUS_COLORS[r.status] || STATUS_COLORS.pending}`}>
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
                                                    onClick={() => setReportStatus(r.id, "actioned")}
                                                    className="text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg font-medium hover:border-red-400 transition-colors cursor-pointer disabled:opacity-50"
                                                >
                                                    Action Taken
                                                </button>
                                                <button
                                                    disabled={updating === r.id}
                                                    onClick={() => setReportStatus(r.id, "reviewed")}
                                                    className="text-xs bg-blue-50 border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:border-blue-400 transition-colors cursor-pointer disabled:opacity-50"
                                                >
                                                    Mark Reviewed
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}

                {/* Emergency Post Tab */}
                {tab === "emergency" && (
                    <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
                            <strong>🚨 Emergency posts</strong> are pinned to the top of the feed for all users. Use only for genuine camp emergencies.
                        </div>

                        <form onSubmit={postEmergency} className="bg-card rounded-2xl border border-subtle shadow-sm p-4 space-y-3">
                            <h2 className="text-sm font-bold text-gray-900">Post Emergency Alert</h2>
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
                                className="w-full bg-red-600 text-white font-bold py-3 rounded-xl text-sm  disabled:opacity-50 cursor-pointer"
                            >
                                {posting ? "Posting…" : postDone ? "✓ Posted!" : "🚨 Post Emergency Alert"}
                            </button>
                        </form>

                        {emergencies.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Recent Alerts</h3>
                                <div className="space-y-2">
                                    {emergencies.slice(0, 5).map((e) => (
                                        <div key={e.id} className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                                            <p className="text-sm font-bold text-red-700">{e.title}</p>
                                            <p className="text-xs text-red-500 mt-1 line-clamp-2">{e.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
