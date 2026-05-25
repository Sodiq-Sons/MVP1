import dynamic from "next/dynamic";

const GroupChatList = dynamic(() => import("@/components/GroupChatList"), {
    loading: () => (
        <div className="min-h-screen bg-page flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-muted border-t-cp animate-spin" />
        </div>
    ),
});

export const metadata = {
    title: "Group Chats",
    description: "Chat with fellow NYSC corps members in group conversations.",
    robots: { index: false },
};

export default function Page() {
    return (
        <main id="main-content">
            <GroupChatList />
        </main>
    );
}
