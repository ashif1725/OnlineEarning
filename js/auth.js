/* =========================================================
   SkillEarn Hub
   Authentication System
   Firebase Compat SDK
   ========================================================= */


/* =========================================================
   FIREBASE SERVICES
========================================================= */

const auth = firebase.auth();
const db = firebase.firestore();


/* =========================================================
   DEFAULT REDIRECT
========================================================= */

const DEFAULT_LOGIN_REDIRECT = "dashboard.html";


/* =========================================================
   HELPERS
========================================================= */

function getUserFriendlyError(error) {

    if (!error) {
        return "Something went wrong. Please try again.";
    }

    switch (error.code) {

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/user-not-found":
            return "No account was found with this email.";

        case "auth/wrong-password":
            return "Incorrect email or password.";

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/email-already-in-use":
            return "An account already exists with this email.";

        case "auth/weak-password":
            return "Password should be at least 6 characters.";

        case "auth/user-disabled":
            return "This account has been disabled.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";

        case "auth/popup-closed-by-user":
            return "Google login was cancelled.";

        case "auth/popup-blocked":
            return "Google login popup was blocked by the browser.";

        case "auth/account-exists-with-different-credential":
            return "An account already exists with another login method.";

        case "auth/operation-not-allowed":
            return "This login method is not enabled in Firebase.";

        default:
            return error.message || "Authentication failed.";
    }
}


/* =========================================================
   SAVE / CREATE USER PROFILE
========================================================= */

async function createOrUpdateUserProfile(user, extraData = {}) {

    if (!user) {
        throw new Error("User is not available.");
    }

    const userRef = db
        .collection("users")
        .doc(user.uid);

    const snapshot = await userRef.get();

    const existingData =
        snapshot.exists
            ? snapshot.data()
            : {};

    const userData = {

        uid: user.uid,

        name:
            extraData.name ||
            existingData.name ||
            user.displayName ||
            "Member",

        email:
            user.email ||
            existingData.email ||
            "",

        photoURL:
            user.photoURL ||
            existingData.photoURL ||
            "",

        role:
            existingData.role ||
            "user",

        status:
            existingData.status ||
            "active",

        enrolledCourses:
            Number(
                existingData.enrolledCourses || 0
            ),

        referralCode:
            existingData.referralCode ||
            generateReferralCode(user.uid),

        referredBy:
            existingData.referredBy ||
            extraData.referredBy ||
            null,

        updatedAt:
            firebase.firestore.FieldValue.serverTimestamp()

    };


    if (!snapshot.exists) {

        userData.createdAt =
            firebase.firestore.FieldValue.serverTimestamp();
    }


    await userRef.set(
        userData,
        {
            merge: true
        }
    );


    return userData;
}


/* =========================================================
   REFERRAL CODE
========================================================= */

function generateReferralCode(uid) {

    if (!uid) {
        return "";
    }

    return "SEH-" +
        uid
            .replace(/[^a-zA-Z0-9]/g, "")
            .substring(0, 8)
            .toUpperCase();
}


/* =========================================================
   EMAIL LOGIN
========================================================= */

async function loginUser(
    email,
    password,
    redirectUrl = DEFAULT_LOGIN_REDIRECT
) {

    email =
        String(email || "")
            .trim()
            .toLowerCase();

    password =
        String(password || "");


    if (!email) {
        throw new Error(
            "Please enter your email address."
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


        await createOrUpdateUserProfile(
            result.user
        );


        /*
         * Redirect after successful login
         */

        if (redirectUrl) {

            window.location.href =
                redirectUrl;
        }


        return result.user;

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        throw error;
    }
}


/* =========================================================
   REGISTER
========================================================= */

async function registerUser(
    name,
    email,
    password,
    referredBy = ""
) {

    name =
        String(name || "")
            .trim();

    email =
        String(email || "")
            .trim()
            .toLowerCase();

    password =
        String(password || "");

    referredBy =
        String(referredBy || "")
            .trim();


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
            "Please enter a password."
        );
    }


    if (password.length < 6) {

        throw new Error(
            "Password should be at least 6 characters."
        );
    }


    try {

        const result =
            await auth
                .createUserWithEmailAndPassword(
                    email,
                    password
                );


        const user =
            result.user;


        await createOrUpdateUserProfile(
            user,
            {
                name,
                referredBy:
                    referredBy || null
            }
        );


        /*
         * Registration successful
         */

        window.location.href =
            DEFAULT_LOGIN_REDIRECT;


        return user;

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        throw error;
    }
}


/* =========================================================
   GOOGLE LOGIN
========================================================= */

async function googleLogin(
    redirectUrl = DEFAULT_LOGIN_REDIRECT
) {

    const provider =
        new firebase.auth.GoogleAuthProvider();


    provider.setCustomParameters({
        prompt: "select_account"
    });


    try {

        const result =
            await auth.signInWithPopup(
                provider
            );


        const user =
            result.user;


        await createOrUpdateUserProfile(
            user
        );


        /*
         * Redirect after Google login
         */

        if (redirectUrl) {

            window.location.href =
                redirectUrl;
        }


        return user;

    } catch (error) {

        console.error(
            "Google login error:",
            error
        );

        throw error;
    }
}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

async function forgotPassword(email) {

    email =
        String(email || "")
            .trim()
            .toLowerCase();


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
            "Password reset error:",
            error
        );

        throw error;
    }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser(
    redirectUrl = "login.html"
) {

    try {

        await auth.signOut();


        if (redirectUrl) {

            window.location.href =
                redirectUrl;
        }


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        throw error;
    }
}


/* =========================================================
   GET CURRENT USER
========================================================= */

function getCurrentUser() {

    return auth.currentUser || null;
}


/* =========================================================
   GET USER DATA
========================================================= */

async function getUserData(
    uid = null
) {

    const user =
        auth.currentUser;


    const userId =
        uid ||
        (user ? user.uid : null);


    if (!userId) {

        return null;
    }


    try {

        const snapshot =
            await db
                .collection("users")
                .doc(userId)
                .get();


        if (!snapshot.exists) {

            return null;
        }


        return {

            id:
                snapshot.id,

            ...snapshot.data()

        };

    } catch (error) {

        console.error(
            "Get user data error:",
            error
        );

        throw error;
    }
}


/* =========================================================
   REQUIRE LOGIN
========================================================= */

function requireLogin(
    redirectUrl = "login.html"
) {

    return new Promise(
        (resolve) => {

            const unsubscribe =
                auth.onAuthStateChanged(
                    async (user) => {

                        unsubscribe();


                        if (!user) {

                            if (
                                redirectUrl
                            ) {

                                window.location.href =
                                    redirectUrl;
                            }

                            resolve(null);

                            return;
                        }


                        try {

                            const userData =
                                await getUserData(
                                    user.uid
                                );


                            resolve({

                                user,
                                userData

                            });

                        } catch (error) {

                            console.error(
                                error
                            );

                            resolve({

                                user,
                                userData: null

                            });
                        }

                    }
                );

        }
    );
}


/* =========================================================
   REQUIRE ADMIN
========================================================= */

async function requireAdmin(
    redirectUrl = "dashboard.html"
) {

    return new Promise(
        (resolve) => {

            const unsubscribe =
                auth.onAuthStateChanged(
                    async (user) => {

                        unsubscribe();


                        /*
                         * Not logged in
                         */

                        if (!user) {

                            window.location.href =
                                "login.html";

                            resolve(null);

                            return;
                        }


                        try {

                            const userData =
                                await getUserData(
                                    user.uid
                                );


                            /*
                             * No profile
                             */

                            if (!userData) {

                                await auth.signOut();

                                alert(
                                    "Admin profile not found."
                                );

                                window.location.href =
                                    "login.html";

                                resolve(null);

                                return;
                            }


                            /*
                             * Check role
                             */

                            if (
                                String(
                                    userData.role ||
                                    ""
                                ).toLowerCase()
                                !== "admin"
                            ) {

                                alert(
                                    "Access denied. Admin account required."
                                );

                                window.location.href =
                                    redirectUrl;

                                resolve(null);

                                return;
                            }


                            /*
                             * Admin verified
                             */

                            resolve({

                                user,

                                userData

                            });

                        } catch (error) {

                            console.error(
                                "Admin verification error:",
                                error
                            );

                            alert(
                                "Unable to verify admin access."
                            );

                            window.location.href =
                                "login.html";

                            resolve(null);
                        }

                    }
                );

        }
    );
}


/* =========================================================
   AUTH STATE LISTENER
========================================================= */

function onAuthChange(
    callback
) {

    return auth.onAuthStateChanged(
        callback
    );
}


/* =========================================================
   EXPORT GLOBAL API
========================================================= */

window.SkillEarnAuth = {

    loginUser,

    registerUser,

    googleLogin,

    forgotPassword,

    logoutUser,

    getCurrentUser,

    getUserData,

    requireLogin,

    requireAdmin,

    createOrUpdateUserProfile,

    generateReferralCode,

    onAuthChange,

    getUserFriendlyError

};


/* =========================================================
   GLOBAL FUNCTIONS
   Compatibility with existing HTML files
========================================================= */

window.loginUser =
    loginUser;

window.registerUser =
    registerUser;

window.googleLogin =
    googleLogin;

window.forgotPassword =
    forgotPassword;

window.logoutUser =
    logoutUser;

window.getCurrentUser =
    getCurrentUser;

window.getUserData =
    getUserData;

window.requireLogin =
    requireLogin;

window.requireAdmin =
    requireAdmin;


/* =========================================================
   AUTH READY MESSAGE
========================================================= */

console.log(
    "SkillEarn Hub Authentication initialized successfully."
);
