import dynamic from "next/dynamic";

const TrendingPage = dynamic(() => import("@/components/TrendingPage"), {
    loading: () => (
        <div
            className="min-h-screen bg-page flex items-center justify-center"
            role="status"
            aria-label="Loading trending posts…"
        >
            <div className="w-8 h-8 rounded-full border-2 border-muted border-t-cp animate-spin" />
        </div>
    ),
});

export const metadata = {
    title: "Trending in Camp",
    description:
        "The hottest gists, most-voted issues, and trending polls across NYSC camps right now. Don't miss what's blowing up.",
    openGraph: {
        title: "Trending in Camp",
        description:
            "The hottest gists, most-voted issues, and trending polls across NYSC camps right now.",
    },
};

export default function Page() {
    return (
        <main id="main-content">
            <TrendingPage />
        </main>
    );
}
