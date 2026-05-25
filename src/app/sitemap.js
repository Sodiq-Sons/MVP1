const BASE = "https://mvp-1-pi.vercel.app";

export default function sitemap() {
    return [
        { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
        { url: `${BASE}/trending`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
        { url: `${BASE}/create-issue`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
        { url: `${BASE}/search-users`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
        { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE}/privacy-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
        { url: `${BASE}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
        { url: `${BASE}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    ];
}
