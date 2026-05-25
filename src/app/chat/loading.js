export default function ChatLoading() {
    return (
        <div className="min-h-screen bg-page" role="status" aria-label="Loading chats">
            <div className="sticky top-0 z-30 bg-card border-b border-subtle px-4 py-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="skeleton h-5 w-28 rounded" />
                    <div className="skeleton h-8 w-24 rounded-xl" />
                </div>
            </div>
            <div className="max-w-2xl mx-auto px-4 py-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-subtle p-4 flex items-center gap-3">
                        <div className="skeleton w-12 h-12 rounded-2xl shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="skeleton h-4 w-40 rounded" />
                            <div className="skeleton h-3 w-56 rounded" />
                        </div>
                    </div>
                ))}
            </div>
            <span className="sr-only">Loading chats…</span>
        </div>
    );
}
