import Link from "next/link";

export const metadata = {
    title: "Page Not Found",
    robots: { index: false },
};

export default function NotFound() {
    return (
        <main
            className="min-h-screen bg-page flex items-center justify-center px-4"
            id="main-content"
        >
            <div className="text-center max-w-sm">
                <div className="text-6xl mb-4" aria-hidden="true">🏕️</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Lost in camp?
                </h1>
                <p className="text-sm text-muted mb-8">
                    This page doesn&apos;t exist or may have been moved.
                </p>
                <Link
                    href="/"
                    className="btn-primary inline-block px-8 py-3 rounded-xl text-sm font-bold"
                >
                    Back to Camp
                </Link>
            </div>
        </main>
    );
}
