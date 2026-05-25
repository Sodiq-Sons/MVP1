export default function TrendingLoading() {
    return (
        <div className="min-h-screen bg-page pb-24 md:pb-8">
            {/* Header skeleton */}
            <div className="sticky top-0 z-20 bg-card border-b border-subtle px-4 py-3">
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    <div className="skeleton h-6 w-28 rounded-lg" />
                    <div className="flex-1" />
                    <div className="skeleton h-8 w-20 rounded-xl" />
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3" aria-label="Loading content" role="status">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-subtle p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="skeleton h-4 w-3/4 rounded" />
                                <div className="skeleton h-3 w-1/2 rounded" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="skeleton h-3 w-full rounded" />
                            <div className="skeleton h-3 w-5/6 rounded" />
                        </div>
                        <div className="flex gap-2">
                            <div className="skeleton h-8 w-20 rounded-xl" />
                            <div className="skeleton h-8 w-20 rounded-xl" />
                        </div>
                    </div>
                ))}
                <span className="sr-only">Loading trending posts…</span>
            </div>
        </div>
    );
}
