import {
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const PREFIXES = [
    "Silent", "Ghost", "Bold", "Sharp", "Quiet", "Brave", "Wise", "Cool", "Hot", "Fierce",
    "Calm", "Wild", "Naija", "Camp", "Khaki", "Parade", "Barracks", "Platoon", "Hostel", "Delta",
    "Night", "Dawn", "Fire", "Storm", "Thunder", "Flash", "Blaze", "Shadow", "Echo", "Phantom",
    "Iron", "Steel", "Gold", "Bronze", "Swift", "Steady", "Loyal", "Proud", "Daring", "Mighty",
    "Noble", "Royal", "Rustic", "Yaba", "Lagos", "Abuja", "Sokoto", "Enugu", "Kano", "River",
];

const SUFFIXES = [
    "Corper", "Ranger", "Scout", "Chief", "Boss", "King", "Voice", "Guard", "Hero", "Champ",
    "Legend", "Warrior", "Ace", "Star", "Pro", "Maverick", "Rider", "Hawk", "Fox", "Wolf",
];

// 50 × 20 = 1000 aliases
export const ALL_ALIASES = PREFIXES.flatMap((p) => SUFFIXES.map((s) => `${p}${s}`));

export function pickRandom(arr, n) {
    const copy = [...arr];
    const result = [];
    while (result.length < n && copy.length > 0) {
        const idx = Math.floor(Math.random() * copy.length);
        result.push(copy.splice(idx, 1)[0]);
    }
    return result;
}

/** Returns a Set of alias strings that are already claimed. */
export async function fetchTakenAliases() {
    const snap = await getDocs(collection(db, "campAliases"));
    const taken = new Set();
    snap.forEach((d) => taken.add(d.id));
    return taken;
}

/** Marks an alias as pending for this session. Safe to call without auth. */
export async function claimAlias(alias, sessionId) {
    await setDoc(doc(db, "campAliases", alias), {
        takenBy: `pending:${sessionId}`,
        takenAt: serverTimestamp(),
    });
}

/** Removes a pending claim so the alias returns to the pool. */
export async function releaseAlias(alias) {
    await deleteDoc(doc(db, "campAliases", alias));
}

/** Called after registration to permanently assign the alias to a user. */
export async function finalizeAlias(alias, uid) {
    await setDoc(doc(db, "campAliases", alias), {
        takenBy: uid,
        takenAt: serverTimestamp(),
    });
}

/**
 * Derive the synthetic login email from a username. The username's uniqueness
 * IS the account identity — no real names are collected. Same slug rule used by
 * both register and login so a username always maps to the same email.
 */
export function usernameToEmail(username) {
    return `${String(username || "").trim().toLowerCase().replace(/\s+/g, ".")}@camp.local`;
}
