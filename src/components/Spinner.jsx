/**
 * Accessible loading spinner.
 * size: "sm" | "md" | "lg"  (default: "md")
 * label: screen-reader text (default: "Loading…")
 */
export default function Spinner({ size = "md", label = "Loading…", className = "" }) {
    const dim = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" }[size] ?? "w-8 h-8";

    return (
        <span role="status" aria-label={label} className={`inline-flex items-center justify-center ${className}`}>
            <span
                className={`${dim} rounded-full border-2 border-muted border-t-cp animate-spin no-theme-transition block`}
            />
            <span className="sr-only">{label}</span>
        </span>
    );
}

/** Full-screen centered loading state */
export function PageSpinner({ label = "Loading…" }) {
    return (
        <div className="min-h-screen bg-page flex items-center justify-center" role="status">
            <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" label={label} />
                <p className="text-sm text-muted font-medium" aria-hidden="true">{label}</p>
            </div>
        </div>
    );
}
