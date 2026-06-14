import { getAdminDb, getAdminAuth } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { awardPointsAdmin } from "@/lib/gamificationAdmin";
import { sendPushAdmin } from "@/lib/pushAdmin";
import { after } from "next/server";

async function verifyToken(request) {
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return null;
    try {
        const decoded = await getAdminAuth().verifyIdToken(token);
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

    const adminDb = getAdminDb();
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
    const actorName = userData.fullName || userData.displayName || "Someone";
    // Only include fields that are actually stored on the user profile doc.
    // age is not stored — omit it so vote docs don't have null age entries.
    const demographics = {
        gender:        userData.gender        ?? null,
        stateOfOrigin: userData.stateOfOrigin ?? null,
        platoon:       userData.platoon       ?? null,
    };

    const issueRef = adminDb.collection("issues").doc(issueId);
    const voteRef = issueRef.collection("votes").doc(uid);
    const aggRef = issueRef.collection("aggregates").doc("demographics");
    const ts = FieldValue.serverTimestamp();

    try {
        const result = await adminDb.runTransaction(async (tx) => {
            const reads = [tx.get(issueRef), tx.get(voteRef)];
            if (type === "poll") reads.push(tx.get(aggRef));
            const [issueSnap, voteSnap, aggSnap] = await Promise.all(reads);
            if (!issueSnap.exists) throw new Error("Issue not found");
            const issueData = issueSnap.data();

            const authorUid = issueData.author?.uid ?? null;

            const issueTitle = issueData.title ?? null;

            if (type === "up" || type === "down") {
                const existing = voteSnap.exists ? voteSnap.data() : null;
                const existingType = existing?.voteType;
                const field = type === "up" ? "upvotes" : "downvotes";
                const otherField = type === "up" ? "downvotes" : "upvotes";

                if (existingType === type) {
                    // Toggle off — remove the vote
                    tx.delete(voteRef);
                    tx.update(issueRef, { [field]: Math.max(0, (issueData[field] || 0) - 1) });
                    return { action: "removed", type, authorUid, issueTitle };
                }

                const updates = { [field]: (issueData[field] || 0) + 1 };
                if (existingType) {
                    updates[otherField] = Math.max(0, (issueData[otherField] || 0) - 1);
                }
                tx.set(voteRef, { voteType: type, userId: uid, ...demographics, votedAt: ts });
                tx.update(issueRef, updates);
                return { action: existingType ? "switched" : "added", type, previousType: existingType ?? null, authorUid, issueTitle };
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

            // Maintained demographic aggregate: counts[dimension][group][option].
            // Read-modify-write inside the transaction, so concurrent votes retry
            // and stay consistent. The voter's demographics are denormalized on
            // their vote doc, so decrements use the OLD vote's demographics.
            const counts = (aggSnap?.exists ? aggSnap.data().counts : null) || {};
            const applyDelta = (demoVals, opt, delta) => {
                for (const dim of ["gender", "stateOfOrigin", "platoon"]) {
                    const group = demoVals?.[dim];
                    if (group === undefined || group === null || group === "") continue;
                    counts[dim] = counts[dim] || {};
                    counts[dim][group] = counts[dim][group] || {};
                    const next = (counts[dim][group][opt] || 0) + delta;
                    if (next > 0) {
                        counts[dim][group][opt] = next;
                    } else {
                        delete counts[dim][group][opt];
                        if (Object.keys(counts[dim][group]).length === 0) {
                            delete counts[dim][group];
                        }
                    }
                }
            };

            if (wasSameVote) {
                cv[option] = Math.max(0, (cv[option] || 0) - 1);
                ct = Math.max(0, ct - 1);
                tx.delete(voteRef);
                applyDelta(existing, option, -1);
            } else {
                if (prevOption) {
                    cv[prevOption] = Math.max(0, (cv[prevOption] || 0) - 1);
                    applyDelta(existing, prevOption, -1);
                } else {
                    ct += 1;
                }
                cv[option] = (cv[option] || 0) + 1;
                applyDelta(demographics, option, 1);
                tx.set(voteRef, {
                    voteType: "poll",
                    userId: uid,
                    option,
                    ...demographics,
                    votedAt: ts,
                });
            }
            tx.update(issueRef, { votes: cv, totalVotes: ct });
            tx.set(aggRef, { counts, updatedAt: ts });
            return {
                action: wasSameVote ? "removed" : prevOption ? "switched" : "added",
                option,
                previousOption: prevOption,
                authorUid,
                issueTitle,
            };
        });

        // Award points + send push after the response is sent (non-blocking)
        if (result.action !== "removed") {
            const meta = { issueId };
            const voterAction  = type === "up" ? "UPVOTE_ISSUE"   : type === "poll" ? "VOTE_ON_ISSUE"  : null;
            const authorAction = type === "up" ? "RECEIVE_UPVOTE" : type === "poll" ? "RECEIVE_VOTE"   : null;
            after(async () => {
                if (voterAction)  await awardPointsAdmin(uid, voterAction, meta);
                if (authorAction && result.authorUid && result.authorUid !== uid) {
                    await awardPointsAdmin(result.authorUid, authorAction, meta);
                    // Push notification to post author
                    const title = type === "up" ? "👍 Someone liked your post" : "🗳️ New vote on your poll";
                    const body  = type === "up"
                        ? `${actorName} liked "${result.issueTitle ?? "your post"}"`
                        : `${actorName} voted on "${result.issueTitle ?? "your poll"}"`;
                    await sendPushAdmin(result.authorUid, { title, body, url: `/issue/${issueId}` });
                }
            });
        }

        const { authorUid: _drop, ...publicResult } = result;
        return Response.json({ success: true, ...publicResult });
    } catch (err) {
        const msg = err.message || "Vote failed";
        const status = msg === "Issue not found" || msg === "Invalid poll option" ? 400 : 500;
        return Response.json({ error: msg }, { status });
    }
}
