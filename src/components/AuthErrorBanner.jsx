export default function AuthErrorBanner({ title, message }) {
    if (!title) return null;
    return (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex gap-3 items-start">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="w-4 h-4"
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            </div>
            <div>
                <p
                    className="text-sm font-semibold text-red-700"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                    {title}
                </p>
                {message && (
                    <p
                        className="text-xs text-red-500 mt-0.5"
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
