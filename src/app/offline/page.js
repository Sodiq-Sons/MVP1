"use client";

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-[#F97316] flex flex-col items-center justify-center px-6 text-center">
            <div className="text-6xl mb-6">📡</div>
            <h1
                className="text-white font-extrabold text-2xl sm:text-3xl mb-3 leading-tight"
                style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
                You&apos;re offline
            </h1>
            <p
                className="text-white/80 text-sm sm:text-base max-w-xs leading-relaxed mb-8"
                style={{ fontFamily: "DM Sans, sans-serif" }}
            >
                Camp gists need signal. Check your connection and try again.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="bg-white text-[#F97316] font-bold text-sm sm:text-[15px] px-8 py-3.5 rounded-2xl hover:bg-[#FFF5EF] active:scale-[0.98] transition-all cursor-pointer"
                style={{ fontFamily: "DM Sans, sans-serif" }}
            >
                Try again →
            </button>
        </div>
    );
}
