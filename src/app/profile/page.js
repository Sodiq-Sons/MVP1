import dynamic from "next/dynamic";

const ProfilePage = dynamic(() => import("@/components/ProfilePage"), {
    loading: () => (
        <div
            className="min-h-screen bg-page flex items-center justify-center"
            role="status"
            aria-label="Loading profile…"
        >
            <div className="w-8 h-8 rounded-full border-2 border-muted border-t-cp animate-spin" />
        </div>
    ),
});

export const metadata = {
    title: "My Profile",
    description:
        "Your Camp Connect profile — posts, earned badges, impact score, and account settings.",
    robots: { index: false },
};

export default function Page() {
    return (
        <main id="main-content">
            <ProfilePage />
        </main>
    );
}
