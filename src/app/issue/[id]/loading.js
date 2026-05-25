export default function IssueLoading() {
    return (
        <div className="min-h-screen bg-page" role="status" aria-label="Loading post">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-card border-b border-subtle px-4 py-3">
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    <div className="skeleton w-8 h-8 rounded-xl" />
                    <div className="skeleton h-5 w-24 rounded" />
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
                {/* Post card skeleton */}
                <div className="bg-card rounded-2xl border border-subtle p-4 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="skeleton w-10 h-10 rounded-full" />
                        <div className="space-y-1.5 flex-1">
                            <div className="skeleton h-4 w-32 rounded" />
                            <div className="skeleton h-3 w-24 rounded" />
                        </div>
                    </div>
                    <div className="skeleton h-6 w-3/4 rounded" />
                    <div className="space-y-2">
                        <div className="skeleton h-3 w-full rounded" />
                        <div className="skeleton h-3 w-full rounded" />
                        <div className="skeleton h-3 w-2/3 rounded" />
                    </div>
                    <div className="flex gap-3">
                        <div className="skeleton h-9 w-24 rounded-xl" />
                        <div className="skeleton h-9 w-24 rounded-xl" />
                    </div>
                </div>

                {/* Comments skeleton */}
                <div className="space-y-3">
                    <div className="skeleton h-4 w-28 rounded" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-card rounded-2xl border border-subtle p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="skeleton w-8 h-8 rounded-full" />
                                <div className="skeleton h-3 w-24 rounded" />
                            </div>
                            <div className="skeleton h-3 w-full rounded" />
                            <div className="skeleton h-3 w-4/5 rounded" />
                        </div>
                    ))}
                </div>
            </div>
            <span className="sr-only">Loading post…</span>
        </div>
    );
}
