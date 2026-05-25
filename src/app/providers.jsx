"use client";

import { useEffect } from "react";

// next-pwa (configured in next.config.mjs) already registers /sw.js
// automatically. This component exists only to add the "updatefound" listener
// so users get a heads-up when a new version is available.
export function SwRegistration() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        navigator.serviceWorker.ready.then((reg) => {
            reg.addEventListener("updatefound", () => {
                const newWorker = reg.installing;
                if (!newWorker) return;
                newWorker.addEventListener("statechange", () => {
                    if (
                        newWorker.state === "installed" &&
                        navigator.serviceWorker.controller
                    ) {
                        // A new version is installed. The page will use it on next reload.
                        // Optionally show a toast here: e.g. toast("Update available — refresh to get the latest.")
                    }
                });
            });
        }).catch(() => {
            // SW not supported or blocked — fail silently
        });
    }, []);

    return null;
}
