"use client";

import { Component } from "react";

/**
 * Catches client-side render errors and shows a recovery UI.
 * Use around any component tree that might fail at runtime.
 *
 * Usage:
 *   <ErrorBoundary fallback={<p>Failed to load.</p>}>
 *     <SomeUnstableComponent />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // Forward to external error service (e.g. Sentry) here
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div
                    role="alert"
                    className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center"
                >
                    <span className="text-3xl" aria-hidden="true">⚠️</span>
                    <p className="text-sm font-semibold text-gray-700">
                        Something went wrong loading this section.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="text-sm font-semibold px-4 py-2 rounded-xl border border-subtle hover:border-cp transition-colors cursor-pointer"
                        style={{ color: "var(--cp)" }}
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
