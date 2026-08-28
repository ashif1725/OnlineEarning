// ==========================================
// SkillEarn Hub - Referral System
// ==========================================

const db = firebase.firestore();
const auth = firebase.auth();


// ==========================================
// GET REFERRAL CODE FROM URL
// Example:
// register.html?ref=ABC123
// ==========================================

function getReferralCodeFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("ref");
}


// ==========================================
// SAVE REFERRAL CODE IN BROWSER
// ==========================================

function saveReferralFromURL() {

    const referralCode = getReferralCodeFromURL();

    if (referralCode) {
        localStorage.setItem(
            "skillEarnReferralCode",
            referralCode
        );

        console.log(
            "Referral code saved:",
            referralCode
        );
    }
}


// ==========================================
// GET SAVED REFERRAL CODE
// ==========================================

function getSavedReferralCode() {

    return localStorage.getItem(
        "skillEarnReferralCode"
    );
}


// ==========================================
// CLEAR REFERRAL CODE
// ==========================================

function clearSavedReferralCode() {

    localStorage.removeItem(
        "skillEarnReferralCode"
    );
}


// ==========================================
// CREATE REFERRAL CODE FOR USER
// ==========================================

function createReferralCode(uid) {

    return "SEH-" + uid.substring(0, 8).toUpperCase();

}


// ==========================================
// CREATE USER PROFILE WITH REFERRAL
// ==========================================

async function createUserProfileWithReferral(
    user,
    name = ""
) {

    if (!user) {
        throw new Error("User is not logged in.");
    }

    const userRef = db
        .collection("users")
        .doc(user.uid);

    const existing = await userRef.get();

    if (existing.exists) {

        console.log(
            "User profile already exists."
        );

        return existing.data();
    }


    const myReferralCode =
        createReferralCode(user.uid);

    const referredBy =
        getSavedReferralCode();


    // Prevent obvious self-referral
    const isSelfReferral =
        referredBy &&
        referredBy === myReferralCode;


    const userData = {

        uid: user.uid,

        name:
            name ||
            user.displayName ||
            "Member",

        email:
            user.email || "",

        photoURL:
            user.photoURL || "",

        referralCode:
            myReferralCode,

        referredBy:
            isSelfReferral
                ? null
                : referredBy || null,

        referralCount: 0,

        referralEarnings: 0,

        totalEarnings: 0,

        createdAt:
            firebase.firestore.FieldValue.serverTimestamp(),

        updatedAt:
            firebase.firestore.FieldValue.serverTimestamp()
    };


    await userRef.set(userData);

    // ======================================
    // IF REFERRED BY SOMEONE
    // ======================================

    if (referredBy && !isSelfReferral) {

        const referrerQuery = await db
            .collection("users")
            .where(
                "referralCode",
                "==",
                referredBy
            )
            .limit(1)
            .get();


        if (!referrerQuery.empty) {

            const referrerDoc =
                referrerQuery.docs[0];


            // Don't refer yourself
            if (
                referrerDoc.id !== user.uid
            ) {

                await db
                    .collection("users")
                    .doc(referrerDoc.id)
                    .update({

                        referralCount:
                            firebase.firestore.FieldValue.increment(1),

                        updatedAt:
                            firebase.firestore.FieldValue.serverTimestamp()
                    });


                await db
                    .collection("referrals")
                    .add({

                        referrerId:
                            referrerDoc.id,

                        referredUserId:
                            user.uid,

                        referralCode:
                            referredBy,

                        status:
                            "registered",

                        createdAt:
                            firebase.firestore.FieldValue.serverTimestamp()
                    });


                console.log(
                    "Referral registered successfully."
                );
            }
        }
    }


    clearSavedReferralCode();

    return userData;
}


// ==========================================
// SHOW REFERRAL LINK
// ==========================================

async function loadReferralLink() {

    const user = auth.currentUser;

    if (!user) {
        return;
    }


    const userDoc = await db
        .collection("users")
        .doc(user.uid)
        .get();


    if (!userDoc.exists) {
        return;
    }


    const data = userDoc.data();

    const referralCode =
        data.referralCode;


    if (!referralCode) {
        return;
    }


    const referralLink =
        window.location.origin +
        "/register.html?ref=" +
        encodeURIComponent(referralCode);


    const linkElement =
        document.getElementById(
            "referralLink"
        );


    if (linkElement) {

        linkElement.value =
            referralLink;
    }


    const codeElement =
        document.getElementById(
            "referralCode"
        );


    if (codeElement) {

        codeElement.textContent =
            referralCode;
    }
}


// ==========================================
// COPY REFERRAL LINK
// ==========================================

async function copyReferralLink() {

    const linkElement =
        document.getElementById(
            "referralLink"
        );


    if (!linkElement) {
        return;
    }


    try {

        await navigator.clipboard.writeText(
            linkElement.value
        );


        const message =
            document.getElementById(
                "copyMessage"
            );


        if (message) {

            message.textContent =
                "Referral link copied!";
        }


    } catch (error) {

        linkElement.select();

        document.execCommand("copy");

        alert(
            "Referral link copied!"
        );
    }
}


// ==========================================
// LOAD REFERRAL STATISTICS
// ==========================================

async function loadReferralStats() {

    const user = auth.currentUser;

    if (!user) {
        return;
    }


    const userDoc = await db
        .collection("users")
        .doc(user.uid)
        .get();


    if (!userDoc.exists) {
        return;
    }


    const data = userDoc.data();


    const countElement =
        document.getElementById(
            "referralCount"
        );


    const earningsElement =
        document.getElementById(
            "referralEarnings"
        );


    if (countElement) {

        countElement.textContent =
            data.referralCount || 0;
    }


    if (earningsElement) {

        earningsElement.textContent =
            "₹" +
            Number(
                data.referralEarnings || 0
            ).toFixed(2);
    }
}


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // Capture ?ref=xxxx
        saveReferralFromURL();


        auth.onAuthStateChanged(
            async function (user) {

                if (!user) {
                    return;
                }


                await loadReferralLink();

                await loadReferralStats();
            }
        );
    }
);
