import dynamic from "next/dynamic";

const CampWrap = dynamic(() => import("@/components/CampWrap"), {
    loading: () => (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
    ),
});

export const metadata = {
    title: "My Camp Wrap",
    description: "Your NYSC camp experience summarised — posts, impact, best moments.",
    robots: { index: false },
};

export default function Page() {
    return (
        <main id="main-content">
            <CampWrap />
        </main>
    );
}
