import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * Returns the current Firebase Auth user (or null while loading / signed out).
 * `loading` is true for the brief period before the first auth state is known.
 * `isAnonymous` is true for guest sessions.
 *
 * All components share the same Firebase listener under the hood — Firebase
 * deduplicates multiple onAuthStateChanged calls on the same auth instance.
 */
export function useAuth() {
    const [user, setUser]       = useState(undefined); // undefined = still loading
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u ?? null);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    return {
        user,
        uid: user?.uid ?? null,
        loading,
        isAnonymous: user?.isAnonymous ?? true,
        isSignedIn: !!user && !user.isAnonymous,
    };
}
