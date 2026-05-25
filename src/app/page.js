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
            <HomePage />
        </main>
    );
}
