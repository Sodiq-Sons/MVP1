"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
    useEffect(() => {
        // Log to your error reporting service here (e.g. Sentry)
    }, [error]);

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-page px-4"
            role="alert"
        >
            <div className="text-center max-w-sm">
                <div className="text-5xl mb-4" aria-hidden="true">😕</div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                    Something went wrong
                </h1>
                <p className="text-sm text-muted mb-6">
                    An unexpected error occurred. Please try again.
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
