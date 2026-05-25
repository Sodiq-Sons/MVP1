import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
    fallbacks: { document: "/offline" },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    turbopack: {},
    compress: true,
    images: {
        formats: ["image/avif", "image/webp"],
        minimumCacheTTL: 86400,
        remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
    },
    async headers() {
        const securityHeaders = [
            // Prevent browsers from guessing MIME types
            { key: "X-Content-Type-Options", value: "nosniff" },
            // Block clickjacking
            { key: "X-Frame-Options", value: "SAMEORIGIN" },
            // Reduce referrer leakage
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            // DNS prefetch for performance
            { key: "X-DNS-Prefetch-Control", value: "on" },
            // Disable harmful browser features
            {
                key: "Permissions-Policy",
                value: "camera=(), microphone=(), geolocation=(), payment=()",
            },
            // HSTS — only enable once you are sure you'll always use HTTPS
            {
                key: "Strict-Transport-Security",
                value: "max-age=63072000; includeSubDomains; preload",
            },
        ];

        return [
            {
                // Apply security headers to all routes
                source: "/(.*)",
                headers: securityHeaders,
            },
            {
                // Cache static assets aggressively
                source: "/icons/(.*)",
                headers: [
                    { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
                ],
            },
            {
                source: "/audio/(.*)",
                headers: [
                    { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
                ],
            },
        ];
    },
};

export default withPWA(nextConfig);
