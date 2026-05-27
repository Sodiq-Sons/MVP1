import { v2 as cloudinary } from "cloudinary";
import admin from "firebase-admin";
import "@/lib/firebaseAdmin"; // ensure admin is initialised

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request) {
    // Require a valid Firebase ID token to prevent billing abuse
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        await admin.auth().verifyIdToken(token);
    } catch {
        return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || typeof file === "string") {
            return Response.json({ error: "No file provided" }, { status: 400 });
        }

        if (!ALLOWED_TYPES.has(file.type)) {
            return Response.json(
                { error: "Only JPG, PNG, WebP, and GIF images are allowed" },
                { status: 400 },
            );
        }

        if (file.size > MAX_BYTES) {
            return Response.json(
                { error: "Image must be 5 MB or smaller" },
                { status: 400 },
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader
                .upload_stream(
                    {
                        folder: "camp-connect/uploads",
                        resource_type: "image",
                        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
                        // Auto-compress and serve in the best format for the browser
                        transformation: [
                            { quality: "auto", fetch_format: "auto" },
                        ],
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    },
                )
                .end(buffer);
        });

        return Response.json({
            url: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        return Response.json({ error: "Upload failed. Please try again." }, { status: 500 });
    }
}
