import { getAdminDb, getAdminAuth } from "@/lib/firebaseAdmin";
import { awardPointsAdmin } from "@/lib/gamificationAdmin";

// Only these actions can be awarded to another user via this endpoint.
// Self-award actions (COMMENT_ON_ISSUE, VOTE_ON_ISSUE, etc.) stay client-side.
const ALLOWED_RECEIVE_ACTIONS = new Set([
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
    if (!ALLOWED_RECEIVE_ACTIONS.has(action)) {
        return Response.json({ error: "Action not permitted via this endpoint" }, { status: 403 });
    }
    // Don't award points to yourself via this endpoint
    if (recipientId === callerUid) {
        return Response.json({ error: "Cannot award receive-points to yourself" }, { status: 400 });
    }

    // Verify the recipient exists
    const adminDb = getAdminDb();
    const recipientSnap = await adminDb.collection("users").doc(recipientId).get();
    if (!recipientSnap.exists) {
        return Response.json({ error: "Recipient not found" }, { status: 404 });
    }

    await awardPointsAdmin(recipientId, action, { issueId, issueTitle });
    return Response.json({ success: true });
}
