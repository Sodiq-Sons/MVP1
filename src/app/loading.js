export default function Loading() {
    return (
        <div
            className="min-h-screen flex items-center justify-center bg-page"
            aria-label="Loading page content"
            role="status"
        >
            <div className="flex flex-col items-center gap-3">
                <div className="w-9 h-9 rounded-full border-[3px] border-muted border-t-cp animate-spin no-theme-transition" />
                <p className="text-sm text-muted font-medium">Loading…</p>
            </div>
        </div>
    );
}
