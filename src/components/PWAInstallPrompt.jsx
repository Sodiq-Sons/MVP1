"use client";

import { useState, useEffect } from "react";

const DISMISSED_KEY = "pwa_install_dismissed";

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [show, setShow] = useState(false);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        // Don't show if already dismissed in the last 14 days
        const dismissed = localStorage.getItem(DISMISSED_KEY);
        if (dismissed && Date.now() - Number(dismissed) < 14 * 24 * 60 * 60 * 1000) return;

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show after a short delay so the page has loaded
            setTimeout(() => setShow(true), 3000);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    // Hide once installed
    useEffect(() => {
        const handler = () => setShow(false);
        window.addEventListener("appinstalled", handler);
        return () => window.removeEventListener("appinstalled", handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        setInstalling(true);
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setInstalling(false);
        setDeferredPrompt(null);
        setShow(false);
        if (outcome === "dismissed") {
            localStorage.setItem(DISMISSED_KEY, String(Date.now()));
        }
    };

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    };

    if (!show) return null;

    return (
        <div
            role="dialog"
            aria-label="Install Camp Connect"
            className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 animate-in slide-in-from-bottom-4 duration-300"
        >
            <div
                className="rounded-2xl shadow-xl overflow-hidden border border-white/10"
                style={{ background: "var(--cp)", boxShadow: "0 8px 32px rgba(249,115,22,0.4)" }}
            >
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0 text-2xl">
                            🏕️
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm leading-tight">
                                Add Camp Connect to your home screen
                            </p>
                            <p className="text-white/70 text-xs mt-0.5 leading-relaxed">
                                Get instant access and offline support — no app store needed.
                            </p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-white/50 hover:text-white/80 shrink-0 transition-colors mt-0.5"
                            aria-label="Dismiss install prompt"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={handleInstall}
                            disabled={installing}
                            className="flex-1 py-2.5 rounded-xl bg-white font-bold text-sm transition-all active:scale-95 disabled:opacity-70"
                            style={{ color: "var(--cp)" }}
                        >
                            {installing ? "Installing…" : "Install App"}
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm transition-all active:scale-95"
                        >
                            Not now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
