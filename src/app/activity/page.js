import dynamic from "next/dynamic";

const ActivityPage = dynamic(() => import("@/components/ActivityPage"), {
    loading: () => (
        <div
            className="min-h-screen bg-page flex items-center justify-center"
            role="status"
            aria-label="Loading activity…"
        >
            <div className="w-8 h-8 rounded-full border-2 border-muted border-t-cp animate-spin" />
        </div>
    ),
});

export const metadata = {
    title: "Activity — Notifications & Updates",
    description:
        "Your camp activity feed — new votes, comments, and updates on posts you've engaged with.",
    robots: { index: false },
};

export default function Page() {
    return (
        <main id="main-content">
            <ActivityPage />
        </main>
    );
}
