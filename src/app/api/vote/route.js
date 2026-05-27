import admin from "firebase-admin";
import { adminDb } from "@/lib/firebaseAdmin";

async function verifyToken(request) {
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return null;
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        return decoded.uid;
    } catch {
        return null;
    }
}

export async function POST(request) {
    const uid = await verifyToken(request);
    if (!uid) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { issueId, type, option } = body;
    if (!issueId || !["up", "down", "poll"].includes(type)) {
        return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    if (type === "poll" && !option) {
        return Response.json({ error: "option required for poll votes" }, { status: 400 });
    }

    // Read user demographics for denormalization (single read, not per-vote)
    const userSnap = await adminDb.collection("users").doc(uid).get();
    const userData = userSnap.exists ? userSnap.data() : {};
    const demographics = {
        age: userData.age ?? null,
        gender: userData.gender ?? null,
        stateOfOrigin: userData.stateOfOrigin ?? null,
        platoon: userData.platoon ?? null,
    };

    const issueRef = adminDb.collection("issues").doc(issueId);
    const voteRef = issueRef.collection("votes").doc(uid);
    const ts = admin.firestore.FieldValue.serverTimestamp();

    try {
        const result = await adminDb.runTransaction(async (tx) => {
            const [issueSnap, voteSnap] = await Promise.all([
                tx.get(issueRef),
                tx.get(voteRef),
            ]);
            if (!issueSnap.exists) throw new Error("Issue not found");
            const issueData = issueSnap.data();

            if (type === "up" || type === "down") {
                const existing = voteSnap.exists ? voteSnap.data() : null;
                const existingType = existing?.voteType;
                const field = type === "up" ? "upvotes" : "downvotes";
                const otherField = type === "up" ? "downvotes" : "upvotes";

                if (existingType === type) {
                    // Toggle off — remove the vote
                    tx.delete(voteRef);
                    tx.update(issueRef, { [field]: Math.max(0, (issueData[field] || 0) - 1) });
                    return { action: "removed", type };
                }

                const updates = { [field]: (issueData[field] || 0) + 1 };
                if (existingType) {
                    updates[otherField] = Math.max(0, (issueData[otherField] || 0) - 1);
                }
                tx.set(voteRef, { voteType: type, userId: uid, ...demographics, votedAt: ts });
                tx.update(issueRef, updates);
                return { action: existingType ? "switched" : "added", type, previousType: existingType ?? null };
            }

            // type === "poll"
            if (!issueData.voteOptions?.includes(option)) {
                throw new Error("Invalid poll option");
            }
            const existing = voteSnap.exists ? voteSnap.data() : null;
            const prevOption = existing?.option ?? null;
            const wasSameVote = prevOption === option;
            const cv = { ...(issueData.votes || {}) };
            let ct = issueData.totalVotes || 0;

            if (wasSameVote) {
                cv[option] = Math.max(0, (cv[option] || 0) - 1);
                ct = Math.max(0, ct - 1);
                tx.delete(voteRef);
            } else {
                if (prevOption) {
                    cv[prevOption] = Math.max(0, (cv[prevOption] || 0) - 1);
                } else {
                    ct += 1;
                }
                cv[option] = (cv[option] || 0) + 1;
                tx.set(voteRef, {
                    voteType: "poll",
                    userId: uid,
                    option,
                    ...demographics,
                    votedAt: ts,
                });
            }
            tx.update(issueRef, { votes: cv, totalVotes: ct });
            return {
                action: wasSameVote ? "removed" : prevOption ? "switched" : "added",
                option,
                previousOption: prevOption,
            };
        });

        return Response.json({ success: true, ...result });
    } catch (err) {
        const msg = err.message || "Vote failed";
        const status = msg === "Issue not found" || msg === "Invalid poll option" ? 400 : 500;
        return Response.json({ error: msg }, { status });
    }
}
