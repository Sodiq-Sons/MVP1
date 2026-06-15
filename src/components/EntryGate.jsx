"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ONBOARDING_SEEN_KEY } from "@/lib/constants";

// Hybrid entry routing for "/":
//   • Returning visitor (seen the onboarding splash before) → feed.
//   • Logged-in member → feed (and flag them so it's instant next time).
//   • Truly first-time visitor → /onboarding.
//
// This runs client-side only, so the server-rendered SEO content on the root
// page (metadata + StaticCrawlerContent) is untouched and crawlers still index
// the feed. Children (the feed) render once we've decided to keep the user here.
export default function EntryGate({ children }) {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Fast path: been through the entry once → straight to the feed, no
        // need to wait on auth.
        let seen = false;
        try {
            seen = localStorage.getItem(ONBOARDING_SEEN_KEY) === "true";
        } catch {
            seen = false;
        }
        if (seen) {
            setReady(true);
            return;
        }

        // No flag yet: only a logged-in member skips onboarding. Wait for auth
        // to resolve so we don't bounce a returning member who cleared storage.
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user && !user.isAnonymous) {
                try {
                    localStorage.setItem(ONBOARDING_SEEN_KEY, "true");
                } catch {
                    /* ignore */
                }
                setReady(true);
            } else {
                router.replace("/onboarding");
            }
        });
        return () => unsub();
    }, [router]);

    if (!ready) {
        return (
            <div
                className="min-h-screen bg-page flex items-center justify-center"
                role="status"
                aria-label="Loading…"
            >
                <div className="w-8 h-8 rounded-full border-2 border-muted border-t-cp animate-spin" />
            </div>
        );
    }

    return children;
}
