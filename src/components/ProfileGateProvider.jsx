"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { isProfileComplete } from "@/lib/profileCompletion";
import ProfileIncompleteModal from "./ProfileIncompleteModal";

const ProfileGateContext = createContext();

export function useProfileGate() {
    return useContext(ProfileGateContext);
}

export default function ProfileGateProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [action, setAction] = useState("continue");

    // 🔐 Auth listener
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u && !u.isAnonymous) {
                setUser(u);
            } else {
                setUser(null);
                setUserData(null);
            }
        });

        return () => unsub();
    }, []);

    // 📦 User data listener
    useEffect(() => {
        if (!user) return;

        const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
            if (snap.exists()) {
                setUserData(snap.data());
            }
        });

        return () => unsub();
    }, [user]);

    // 🧠 Smart modal trigger (ONLY once per session)
    useEffect(() => {
        if (!user || !userData) return;

        const complete = isProfileComplete(userData);
        const seen = sessionStorage.getItem("profile_modal_seen");

        if (!complete && seen !== "true") {
            setModalOpen(true);
            sessionStorage.setItem("profile_modal_seen", "true");
        }
    }, [user, userData]);

    // Function to gate actions
    const requireCompleteProfile = (actionName, callback) => {
        if (!userData) return;

        const complete = isProfileComplete(userData);

        if (!complete) {
            setAction(actionName);
            setModalOpen(true);
            return false;
        }

        if (callback) callback();
        return true;
    };

    return (
        <ProfileGateContext.Provider value={{ requireCompleteProfile }}>
            {children}

            <ProfileIncompleteModal
                isOpen={modalOpen}
                action={action}
                onClose={() => setModalOpen(false)}
            />
        </ProfileGateContext.Provider>
    );
}
