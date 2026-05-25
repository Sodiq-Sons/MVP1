import dynamic from "next/dynamic";

const CreateIssuePage = dynamic(() => import("@/components/CreateIssuePage"), {
    loading: () => (
        <div
            className="min-h-screen bg-page flex items-center justify-center"
            role="status"
            aria-label="Loading editor…"
        >
            <div className="w-8 h-8 rounded-full border-2 border-muted border-t-cp animate-spin" />
        </div>
    ),
});

export const metadata = {
    title: "Post to Camp",
    description:
        "Share a gist, report an issue, or start a poll. Let your voice be heard across camp.",
    robots: { index: false },
};

export default function Page() {
    return (
        <main id="main-content">
            <CreateIssuePage />
        </main>
    );
}
