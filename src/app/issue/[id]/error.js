"use client";

export default function IssueError({ reset }) {
    return (
        <div className="min-h-screen bg-page flex items-center justify-center px-4" role="alert">
            <div className="text-center max-w-sm">
                <div className="text-5xl mb-4" aria-hidden="true">🔎</div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Post not found</h1>
                <p className="text-sm text-muted mb-6">
                    This post may have been removed or you don&apos;t have permission to view it.
                </p>
                <button
                    onClick={reset}
                    className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
