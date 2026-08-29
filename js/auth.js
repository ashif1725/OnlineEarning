/* =========================================================
   SkillEarn Hub
   Authentication System
   Firebase Compat Version
   ========================================================= */


/* =========================================================
   FIREBASE SERVICES
   ========================================================= */

const auth = firebase.auth();
const db = firebase.firestore();


/* =========================================================
   SHOW MESSAGE HELPER
   ========================================================= */

function showAuthMessage(message, type = "error") {

    console.log(message);

    const possibleIds = [
        "loginMessage",
        "registerMessage",
        "authMessage",
        "message"
    ];

    let box = null;

    for (const id of possibleIds) {

        const element =
            document.getElementById(id);

        if (element) {
            box = element;
            break;
        }
    }

    if (!box) {
        return;
    }

    box.textContent = message;

    box.className =
        "message " + type;

    box.style.display = "block";
}


/* =========================================================
   ERROR MESSAGE
   ========================================================= */

function getFirebaseErrorMessage(error) {

    if (!error) {
        return "Something went wrong.";
    }

    switch (error.code) {

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/user-not-found":
            return "No account found with this email.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/invalid-credential":
            return "Invalid email or password.";

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/weak-password":
            return "Password should be at least 6 characters.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";

        case "auth/user-disabled":
            return "This account has been disabled.";

        case "auth/operation-not-allowed":
            return "This login method is not enabled in Firebase.";

        default:
            return error.message ||
                "Authentication failed.";
    }
}


/* =========================================================
   GET USER DATA
   ========================================================= */

async function getUserData(uid) {

    if (!uid) {
        return null;
    }

    try {

        const userRef =
            db.collection("users").doc(uid);

        const snapshot =
            await userRef.get();

        if (!snapshot.exists) {
            return null;
        }

        return {
            id: snapshot.id,
            ...snapshot.data()
        };

    } catch (error) {

        console.error(
            "getUserData error:",
            error
        );

        return null;
    }
}


/* =========================================================
   REGISTER USER
   ========================================================= */

async function registerUser(
    name,
    email,
    password
) {

    name =
        String(name || "").trim();

    email =
        String(email || "").trim();

    password =
        String(password || "");


    if (!name) {
        throw new Error(
            "Please enter your name."
        );
    }

    if (!email) {
        throw new Error(
            "Please enter your email."
        );
    }

    if (!password) {
        throw new Error(
            "Please enter your password."
        );
    }

    if (password.length < 6) {
        throw new Error(
            "Password must be at least 6 characters."
        );
    }


    try {

        const result =
            await auth.createUserWithEmailAndPassword(
                email,
                password
            );

        const user =
            result.user;


        /* -----------------------------------------
           Update Firebase Auth profile
           ----------------------------------------- */

        await user.updateProfile({
            displayName: name
        });


        /* -----------------------------------------
           Create Firestore user document
           ----------------------------------------- */

        await db
            .collection("users")
            .doc(user.uid)
            .set({

                uid: user.uid,

                name: name,

                email:
                    user.email || email,

                role: "user",

                status: "active",

                enrolledCourses: 0,

                earnings: 0,

                walletBalance: 0,

                referralCode:
                    createReferralCode(user.uid),

                createdAt:
                    firebase.firestore.FieldValue.serverTimestamp(),

                updatedAt:
                    firebase.firestore.FieldValue.serverTimestamp()

            });


        return {
            user: user,
            userData: await getUserData(user.uid)
        };

    } catch (error) {

        console.error(
            "registerUser error:",
            error
        );

        throw new Error(
            getFirebaseErrorMessage(error)
        );
    }
}


/* =========================================================
   LOGIN USER
   ========================================================= */

async function loginUser(
    email,
    password
) {

    email =
        String(email || "").trim();

    password =
        String(password || "");


    if (!email) {
        throw new Error(
            "Please enter your email."
        );
    }

    if (!password) {
        throw new Error(
            "Please enter your password."
        );
    }


    try {

        const result =
            await auth.signInWithEmailAndPassword(
                email,
                password
            );

        const user =
            result.user;


        /* -----------------------------------------
           Get Firestore profile
           ----------------------------------------- */

        let userData =
            await getUserData(user.uid);


        /* -----------------------------------------
           If profile doesn't exist, create it
           ----------------------------------------- */

        if (!userData) {

            await db
                .collection("users")
                .doc(user.uid)
                .set({

                    uid: user.uid,

                    name:
                        user.displayName ||
                        "Member",

                    email:
                        user.email || email,

                    role: "user",

                    status: "active",

                    enrolledCourses: 0,

                    earnings: 0,

                    walletBalance: 0,

                    referralCode:
                        createReferralCode(user.uid),

                    createdAt:
                        firebase.firestore.FieldValue.serverTimestamp(),

                    updatedAt:
                        firebase.firestore.FieldValue.serverTimestamp()

                }, {
                    merge: true
                });


            userData =
                await getUserData(user.uid);
        }


        return {
            user: user,
            userData: userData
        };

    } catch (error) {

        console.error(
            "loginUser error:",
            error
        );

        throw new Error(
            getFirebaseErrorMessage(error)
        );
    }
}


/* =========================================================
   LOGOUT USER
   ========================================================= */

async function logoutUser() {

    try {

        await auth.signOut();

        return true;

    } catch (error) {

        console.error(
            "logoutUser error:",
            error
        );

        throw new Error(
            getFirebaseErrorMessage(error)
        );
    }
}


/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

async function forgotPassword(email) {

    email =
        String(email || "").trim();


    if (!email) {

        throw new Error(
            "Please enter your email address."
        );
    }


    try {

        await auth.sendPasswordResetEmail(
            email
        );

        return true;

    } catch (error) {

        console.error(
            "forgotPassword error:",
            error
        );

        throw new Error(
            getFirebaseErrorMessage(error)
        );
    }
}


/* =========================================================
   RESET PASSWORD
   ========================================================= */

async function resetPassword(
    code,
    newPassword
) {

    if (!code) {
        throw new Error(
            "Password reset code is missing."
        );
    }

    if (!newPassword) {
        throw new Error(
            "Please enter a new password."
        );
    }

    if (newPassword.length < 6) {
        throw new Error(
            "Password must be at least 6 characters."
        );
    }


    try {

        await auth.confirmPasswordReset(
            code,
            newPassword
        );

        return true;

    } catch (error) {

        console.error(
            "resetPassword error:",
            error
        );

        throw new Error(
            getFirebaseErrorMessage(error)
        );
    }
}


/* =========================================================
   CURRENT USER
   ========================================================= */

function getCurrentUser() {

    return auth.currentUser;
}


/* =========================================================
   AUTH STATE
   ========================================================= */

function onAuthStateChanged(callback) {

    if (
        typeof callback !== "function"
    ) {
        return;
    }

    return auth.onAuthStateChanged(
        callback
    );
}


/* =========================================================
   REQUIRE LOGIN
   ========================================================= */

async function requireAuth(
    redirectPage = "login.html"
) {

    const user =
        auth.currentUser;


    if (!user) {

        window.location.href =
            redirectPage;

        return null;
    }


    const userData =
        await getUserData(
            user.uid
        );


    return {
        user: user,
        userData: userData
    };
}


/* =========================================================
   REQUIRE ADMIN
   ========================================================= */

async function requireAdmin(
    redirectPage = "login.html"
) {

    const user =
        auth.currentUser;


    if (!user) {

        window.location.href =
            redirectPage;

        return null;
    }


    try {

        const userData =
            await getUserData(
                user.uid
            );


        if (!userData) {

            console.error(
                "Admin check: user document not found."
            );

            await auth.signOut();

            window.location.href =
                redirectPage;

            return null;
        }


        if (
            String(userData.role || "")
                .toLowerCase() !== "admin"
        ) {

            console.error(
                "Admin access denied."
            );

            await auth.signOut();

            alert(
                "Access denied. Admin account required."
            );

            window.location.href =
                redirectPage;

            return null;
        }


        return {
            user: user,
            userData: userData
        };

    } catch (error) {

        console.error(
            "requireAdmin error:",
            error
        );

        await auth.signOut();

        window.location.href =
            redirectPage;

        return null;
    }
}


/* =========================================================
   MAKE ADMIN
   ========================================================= */

async function makeAdmin(uid) {

    if (!uid) {

        throw new Error(
            "User UID is required."
        );
    }


    await db
        .collection("users")
        .doc(uid)
        .update({

            role: "admin",

            updatedAt:
                firebase.firestore.FieldValue.serverTimestamp()

        });


    return true;
}


/* =========================================================
   REMOVE ADMIN
   ========================================================= */

async function removeAdmin(uid) {

    if (!uid) {

        throw new Error(
            "User UID is required."
        );
    }


    await db
        .collection("users")
        .doc(uid)
        .update({

            role: "user",

            updatedAt:
                firebase.firestore.FieldValue.serverTimestamp()

        });


    return true;
}


/* =========================================================
   REFERRAL CODE
   ========================================================= */

function createReferralCode(uid) {

    const cleanUid =
        String(uid || "")
            .replace(/[^a-zA-Z0-9]/g, "");

    return (
        "SEH" +
        cleanUid
            .substring(0, 8)
            .toUpperCase()
    );
}


/* =========================================================
   GOOGLE LOGIN
   ========================================================= */

async function loginWithGoogle() {

    try {

        const provider =
            new firebase.auth.GoogleAuthProvider();

        const result =
            await auth.signInWithPopup(
                provider
            );

        const user =
            result.user;


        let userData =
            await getUserData(
                user.uid
            );


        if (!userData) {

            await db
                .collection("users")
                .doc(user.uid)
                .set({

                    uid: user.uid,

                    name:
                        user.displayName ||
                        "Member",

                    email:
                        user.email || "",

                    role: "user",

                    status: "active",

                    enrolledCourses: 0,

                    earnings: 0,

                    walletBalance: 0,

                    referralCode:
                        createReferralCode(
                            user.uid
                        ),

                    createdAt:
                        firebase.firestore.FieldValue.serverTimestamp(),

                    updatedAt:
                        firebase.firestore.FieldValue.serverTimestamp()

                });


            userData =
                await getUserData(
                    user.uid
                );
        }


        return {
            user: user,
            userData: userData
        };

    } catch (error) {

        console.error(
            "Google login error:",
            error
        );

        throw new Error(
            getFirebaseErrorMessage(error)
        );
    }
}


/* =========================================================
   UPDATE USER PROFILE
   ========================================================= */

async function updateUserProfile(
    uid,
    data
) {

    if (!uid) {

        throw new Error(
            "User UID is required."
        );
    }


    if (!data) {
        return false;
    }


    await db
        .collection("users")
        .doc(uid)
        .update({

            ...data,

            updatedAt:
                firebase.firestore.FieldValue.serverTimestamp()

        });


    return true;
}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.loginUser =
    loginUser;

window.registerUser =
    registerUser;

window.logoutUser =
    logoutUser;

window.forgotPassword =
    forgotPassword;

window.resetPassword =
    resetPassword;

window.getCurrentUser =
    getCurrentUser;

window.getUserData =
    getUserData;

window.requireAuth =
    requireAuth;

window.requireAdmin =
    requireAdmin;

window.onAuthStateChanged =
    onAuthStateChanged;

window.loginWithGoogle =
    loginWithGoogle;

window.makeAdmin =
    makeAdmin;

window.removeAdmin =
    removeAdmin;

window.updateUserProfile =
    updateUserProfile;

window.createReferralCode =
    createReferralCode;


/* =========================================================
   CONSOLE
   ========================================================= */

console.log(
    "SkillEarn Hub auth.js loaded successfully."
);
console.log(
    "Firebase Auth:",
    !!auth
);
console.log(
    "Firestore:",
    !!db
);
