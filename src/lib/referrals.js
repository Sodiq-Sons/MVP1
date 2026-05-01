import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    increment,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { awardPoints } from "@/lib/gamification";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";

// ─── Referral Configuration ──

export const REFERRAL_CONFIG = {
    INVITER_POINTS: 15,
    INVITEE_POINTS: 5,
    REFERRAL_WINDOW_DAYS: 30,
};

// ─── Initialize Referral System for New User ──

export async function initializeUserReferralSystem(userId, email) {
    if (!userId) return null;

    try {
        const referralCode = userId.slice(0, 8).toUpperCase();

        const referralRef = doc(db, "referrals", userId);
        await setDoc(
            referralRef,
            {
                userId,
                email,
                referralCode,
                totalReferralsCount: 0,
                completedReferralsCount: 0,
                pointsEarned: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            },
            { merge: true },
        );

        const statsRef = doc(db, "referrals", userId, "stats", "overview");
        await setDoc(
            statsRef,
            {
                userId,
                totalSentInvitations: 0,
                acceptedInvitations: 0,
                completedReferrals: 0,
                totalPointsEarned: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            },
            { merge: true },
        );

        return { userId, referralCode, email };
    } catch (error) {
        console.error("Error initializing referral system:", error);
        return null;
    }
}

// ─── Validate Referral Code ──

export async function validateReferralCode(referralCode) {
    if (!referralCode || referralCode.length === 0) {
        return { valid: false };
    }

    try {
        const q = query(
            collection(db, "referrals"),
            where("referralCode", "==", referralCode.toUpperCase()),
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { valid: false };
        }

        const referralDoc = snapshot.docs[0];
        const referralData = referralDoc.data();

        const userRef = doc(db, "users", referralData.userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return { valid: false };
        }

        const userData = userSnap.data();

        return {
            valid: true,
            referrerId: referralData.userId,
            referrerName: userData.fullName || userData.displayName || "Friend",
            referrerEmail: referralData.email,
            referralCode: referralCode.toUpperCase(),
        };
    } catch (error) {
        console.error("Error validating referral code:", error);
        return { valid: false };
    }
}

// ─── Register Referral (when invitee signs up) ──

export async function registerReferral(referralCode, inviteeId, inviteeEmail) {
    if (!referralCode || !inviteeId || !inviteeEmail) {
        return null;
    }

    try {
        const validation = await validateReferralCode(referralCode);

        if (!validation.valid) {
            return null;
        }

        const referrerId = validation.referrerId;

        if (referrerId === inviteeId) {
            return null;
        }

        const inviteeRef = doc(db, "referrals", inviteeId);
        const inviteeSnap = await getDoc(inviteeRef);

        if (inviteeSnap.exists() && inviteeSnap.data().referrerId) {
            return null;
        }

        const referralRecordRef = doc(
            collection(db, "referrals", referrerId, "referrals"),
        );

        await setDoc(referralRecordRef, {
            referrerId,
            refereeId: inviteeId,
            refereeEmail: inviteeEmail,
            status: "signed_up",
            signupAt: serverTimestamp(),
            completedAt: null,
            pointsAwarded: false,
        });

        await setDoc(
            inviteeRef,
            {
                userId: inviteeId,
                email: inviteeEmail,
                referrerId,
                referralCode: validation.referralCode,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            },
            { merge: true },
        );

        // FIX (Bug 2): was "REFERRAL_SIGNUP" — key does not exist in POINTS_CONFIG.
        // Correct key is "REFERRAL_BONUS" which maps to 5 points for the invitee.
        await awardPoints(inviteeId, "REFERRAL_BONUS", {
            referrerId,
            referrerName: validation.referrerName,
        });

        await createNotification({
            type: NOTIFICATION_TYPES.REFERRAL_SIGNUP,
            recipientId: inviteeId,
            actorId: referrerId,
            actorName: validation.referrerName,
            issueTitle: "Referral Bonus",
            meta: {
                type: "referral_signup",
                referrerName: validation.referrerName,
                pointsAwarded: REFERRAL_CONFIG.INVITEE_POINTS,
            },
        });

        await updateDoc(doc(db, "referrals", referrerId), {
            totalReferralsCount: increment(1),
            updatedAt: serverTimestamp(),
        });

        const referrerStatsRef = doc(
            db,
            "referrals",
            referrerId,
            "stats",
            "overview",
        );
        await updateDoc(referrerStatsRef, {
            totalSentInvitations: increment(1),
            acceptedInvitations: increment(1),
            updatedAt: serverTimestamp(),
        });

        return {
            success: true,
            referralRecordId: referralRecordRef.id,
            referrerId,
            referreeId: inviteeId,
        };
    } catch (error) {
        console.error("Error registering referral:", error);
        return null;
    }
}

// ─── Complete Referral (when invitee posts first issue) ──

export async function completeReferral(inviteeId, referrerId) {
    if (!inviteeId || !referrerId) {
        return null;
    }

    try {
        const q = query(
            collection(db, "referrals", referrerId, "referrals"),
            where("refereeId", "==", inviteeId),
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const referralRecordId = snapshot.docs[0].id;
        const referralRecord = snapshot.docs[0].data();

        if (referralRecord.status === "completed") {
            return null;
        }

        const inviteeRef = doc(db, "users", inviteeId);
        const inviteeSnap = await getDoc(inviteeRef);
        const invitefullName = inviteeSnap.exists()
            ? inviteeSnap.data().fullName
            : "Friend";

        await updateDoc(
            doc(db, "referrals", referrerId, "referrals", referralRecordId),
            {
                status: "completed",
                completedAt: serverTimestamp(),
                pointsAwarded: true,
            },
        );

        await awardPoints(referrerId, "REFERRAL_COMPLETION", {
            inviteeId,
            invitefullName,
        });

        await createNotification({
            type: NOTIFICATION_TYPES.REFERRAL_COMPLETE,
            recipientId: referrerId,
            actorId: inviteeId,
            actorName: invitefullName,
            issueTitle: "Referral Completed",
            meta: {
                type: "referral_complete",
                inviteeName: invitefullName,
                pointsAwarded: REFERRAL_CONFIG.INVITER_POINTS,
            },
        });

        await updateDoc(doc(db, "referrals", referrerId), {
            completedReferralsCount: increment(1),
            pointsEarned: increment(REFERRAL_CONFIG.INVITER_POINTS),
            updatedAt: serverTimestamp(),
        });

        const referrerStatsRef = doc(
            db,
            "referrals",
            referrerId,
            "stats",
            "overview",
        );
        await updateDoc(referrerStatsRef, {
            completedReferrals: increment(1),
            totalPointsEarned: increment(REFERRAL_CONFIG.INVITER_POINTS),
            updatedAt: serverTimestamp(),
        });

        return {
            success: true,
            referrerId,
            inviteeId,
            pointsAwarded: REFERRAL_CONFIG.INVITER_POINTS,
        };
    } catch (error) {
        console.error("Error completing referral:", error);
        return null;
    }
}

// ─── Get Referral Stats ──

export async function getReferralStats(userId) {
    if (!userId) return null;

    try {
        const referralRef = doc(db, "referrals", userId);
        const referralSnap = await getDoc(referralRef);

        if (!referralSnap.exists()) {
            return null;
        }

        const referralData = referralSnap.data();

        const referralsCollection = collection(
            db,
            "referrals",
            userId,
            "referrals",
        );
        const referralsSnap = await getDocs(referralsCollection);

        const referrals = referralsSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        }));

        const completedReferrals = referrals.filter(
            (r) => r.status === "completed",
        );

        return {
            userId,
            referralCode: referralData.referralCode,
            totalReferralsCount: referralData.totalReferralsCount || 0,
            completedReferralsCount: referralData.completedReferralsCount || 0,
            pointsEarned: referralData.pointsEarned || 0,
            referrals,
            completedCount: completedReferrals.length,
        };
    } catch (error) {
        console.error("Error getting referral stats:", error);
        return null;
    }
}

// ─── Get Referral Leaderboard ──

export async function getReferralLeaderboard(limit = 10) {
    try {
        const q = query(collection(db, "referrals"));
        const snapshot = await getDocs(q);

        const leaderboard = [];

        // FIX (Bug 1): was `for (const doc of snapshot.docs)` which shadowed
        // the Firestore `doc` import, causing a runtime crash when calling
        // doc(db, "users", doc.id) inside the loop.
        for (const refDoc of snapshot.docs) {
            const referralData = refDoc.data();

            const userRef = doc(db, "users", refDoc.id);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();

                leaderboard.push({
                    userId: refDoc.id,
                    userName: userData.fullName || userData.displayName,
                    referralCode: referralData.referralCode,
                    completedReferralsCount:
                        referralData.completedReferralsCount || 0,
                    pointsEarned: referralData.pointsEarned || 0,
                });
            }
        }

        return leaderboard
            .sort((a, b) => b.pointsEarned - a.pointsEarned)
            .slice(0, limit);
    } catch (error) {
        console.error("Error getting referral leaderboard:", error);
        return [];
    }
}
