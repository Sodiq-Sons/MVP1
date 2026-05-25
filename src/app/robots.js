const BASE = "https://mvp-1-pi.vercel.app";

export default function robots() {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/api/",
                    "/admin",
                    "/onboarding",
                    "/chat",
                    "/activity",
                    "/wrap",
                    "/profile/edit",
                    "/profile/privacy",
                    "/profile/help",
                    "/profile/invite",
                    "/profile/achievements",
                ],
            },
        ],
        sitemap: `${BASE}/sitemap.xml`,
    };
}
