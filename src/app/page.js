import dynamic from "next/dynamic";

const HomePage = dynamic(() => import("@/components/HomePage"), {
    loading: () => (
        <div
            className="min-h-screen bg-page flex items-center justify-center"
            role="status"
            aria-label="Loading feed…"
        >
            <div className="w-8 h-8 rounded-full border-2 border-muted border-t-cp animate-spin" />
        </div>
    ),
});

function StaticCrawlerContent() {
    return (
        <section className="sr-only" aria-hidden="true">
            <h1>Camp Connect — NYSC Camp Social Feed</h1>
            <p>
                The real-time social platform for NYSC corp members. Share gists,
                raise issues, run polls, and connect with your platoon — all in
                one place.
            </p>
            <ul>
                <li>Browse camp gists and trending issues from your camp</li>
                <li>Vote on community polls and see live results</li>
                <li>Join group chats with fellow corp members</li>
                <li>Report lost items and find what you need at camp</li>
                <li>Track your daily engagement streak</li>
            </ul>
        </section>
    );
}

export const metadata = {
    title: "Camp Feed — Gists, Issues & Polls",
    description:
        "See what's happening at NYSC camp right now. Browse gists, vote on issues, and join your platoon's conversation in real time.",
    openGraph: {
        title: "Camp Feed — Gists, Issues & Polls",
        description:
            "See what's happening at NYSC camp right now. Browse gists, vote on issues, and join your platoon's conversation in real time.",
    },
};

export default function Page() {
    return (
        <main id="main-content">
            <StaticCrawlerContent />
            <HomePage />
        </main>
    );
}
