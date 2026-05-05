"use client";

import { useEffect, useState } from "react";

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [show, setShow] = useState(false);

    // ✅ compute instead of state
    const isIOS =
        typeof window !== "undefined" &&
        /iphone|ipad|ipod/i.test(navigator.userAgent) &&
        !window.navigator.standalone;

    useEffect(() => {
        if (isIOS) {
            const timer = setTimeout(() => setShow(true), 3000);
            return () => clearTimeout(timer);
        }

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShow(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, [isIOS]); // ✅ dependency added

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === "accepted") {
            setShow(false);
        }

        setDeferredPrompt(null);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
            <div className="bg-white rounded-2xl shadow-xl border border-black/8 p-4 flex gap-3 items-start">
                <div className="w-10 h-10 bg-[#FFF0E6] rounded-[13px] flex items-center justify-center text-xl shrink-0">
                    🛡️
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 mb-0.5">
                        Add to Home Screen
                    </p>

                    {isIOS ? (
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Tap the Share button then “Add to Home Screen” to
                            install Naija Connect.
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Get camp gists instantly — even offline.
                        </p>
                    )}

                    {!isIOS && (
                        <button
                            onClick={handleInstall}
                            className="mt-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold px-4 py-2 rounded-xl"
                        >
                            Install →
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setShow(false)}
                    className="text-gray-300 hover:text-gray-500 text-lg"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
