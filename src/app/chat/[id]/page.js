import dynamic from "next/dynamic";
import { use } from "react";

const GroupChatRoom = dynamic(() => import("@/components/GroupChatRoom"), {
    loading: () => (
        <div className="min-h-screen bg-page flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-muted border-t-cp animate-spin" />
        </div>
    ),
});

export const metadata = {
    title: "Group Chat",
    robots: { index: false },
};

export default function Page({ params }) {
    const { id } = use(params);
    return (
        <main id="main-content">
            <GroupChatRoom chatId={id} />
        </main>
    );
}
