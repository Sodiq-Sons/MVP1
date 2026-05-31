import { getAdminAuth } from "@/lib/firebaseAdmin";
import { sendPushAdmin } from "@/lib/pushAdmin";

const PUSH_TEMPLATES = {
    comment: (actor, title) => ({
        title: "💬 New comment on your post",
        body: `${actor} commented on "${title}"`,
    }),
    reply: (actor, title) => ({
        title: "↩️ New reply",
        body: `${actor} replied to your comment on "${title}"`,
    }),
    mention: (actor, title) => ({
        title: "📢 You were mentioned",
        body: `${actor} mentioned you in "${title}"`,
    }),
    like_comment: (actor, title) => ({
        title: "❤️ Someone liked your comment",
        body: `${actor} liked your comment on "${title}"`,
    }),
};

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

    const { recipientId, type, actorName, issueId, issueTitle } = body;

    // Never push to yourself
    if (!recipientId || recipientId === callerUid) {
        return Response.json({ ok: true });
    }

    const template = PUSH_TEMPLATES[type];
    if (!template) return Response.json({ ok: true });

    const { title, body: pushBody } = template(actorName || "Someone", issueTitle || "a post");
    await sendPushAdmin(recipientId, { title, body: pushBody, url: `/issue/${issueId}` });

    return Response.json({ ok: true });
}
