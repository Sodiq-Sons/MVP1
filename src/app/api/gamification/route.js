import { getAdminDb, getAdminAuth } from "@/lib/firebaseAdmin";
import { awardPointsAdmin } from "@/lib/gamificationAdmin";

// Actions a user may award to themselves (their own engagement)
const SELF_ACTIONS = new Set([
    "CREATE_ISSUE",
    "COMMENT_ON_ISSUE",
    "REPLY_TO_COMMENT",
    "LIKE_COMMENT",
    "UPVOTE_ISSUE",
    "VOTE_ON_ISSUE",
]);

// Actions a user may award to another user (must differ from caller)
const RECEIVE_ACTIONS = new Set([
    "RECEIVE_COMMENT",
    "RECEIVE_REPLY",
    "RECEIVE_LIKE",
]);

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
    const callerUid = await verifyToken(request);
    if (!callerUid) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { recipientId, action, issueId, issueTitle } = body;

    if (!recipientId || !action) {
        return Response.json({ error: "recipientId and action are required" }, { status: 400 });
    }

    const isSelf = recipientId === callerUid;

    if (isSelf && !SELF_ACTIONS.has(action)) {
        return Response.json({ error: "Action not permitted for self" }, { status: 403 });
    }
    if (!isSelf && !RECEIVE_ACTIONS.has(action)) {
        return Response.json({ error: "Action not permitted for other users" }, { status: 403 });
    }

    const adminDb = getAdminDb();
    const recipientSnap = await adminDb.collection("users").doc(recipientId).get();
    if (!recipientSnap.exists) {
        return Response.json({ error: "Recipient not found" }, { status: 404 });
    }

    await awardPointsAdmin(recipientId, action, { issueId, issueTitle });
    return Response.json({ success: true });
}
