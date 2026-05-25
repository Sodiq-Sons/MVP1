import dynamic from "next/dynamic";

const PlatoonFight = dynamic(() => import("@/components/PlatoonFight"), {
    loading: () => (
        <div className="min-h-screen bg-page flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-muted border-t-cp animate-spin" />
        </div>
    ),
});

export const metadata = {
    title: "Platoon Battle",
    description: "Head-to-head platoon comparison on Camp Connect.",
};

export default function Page() {
    return (
        <main id="main-content">
            <PlatoonFight />
        </main>
    );
}
