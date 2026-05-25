import dynamic from "next/dynamic";

const PlatoonLeaderboard = dynamic(() => import("@/components/PlatoonLeaderboard"), {
    loading: () => (
        <div className="min-h-screen bg-page flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-muted border-t-cp animate-spin" />
        </div>
    ),
});

export const metadata = {
    title: "Platoon Leaderboard",
    description: "See which platoon is leading Camp Connect this week.",
};

export default function Page() {
    return (
        <main id="main-content">
            <PlatoonLeaderboard />
        </main>
    );
}
