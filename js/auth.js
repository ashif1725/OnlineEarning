/* =========================================================
   SkillEarn Hub
   js/auth.js
   Firebase Authentication
   ========================================================= */

(function () {

    "use strict";


    /* =======================================================
       FIREBASE CHECK
       ======================================================= */

    if (typeof firebase === "undefined") {

        console.error(
            "Firebase SDK is not loaded."
        );

        return;
    }


    if (!firebase.apps.length) {

        console.error(
            "Firebase has not been initialized."
        );

        return;
    }


    const auth = firebase.auth();
    const db = firebase.firestore();


    /* =======================================================
       HELPERS
       ======================================================= */

    function showMessage(message, type = "error") {

        const possibleIds = [
            "loginMessage",
            "authMessage",
            "message",
            "errorMessage"
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

            console.log(message);
            return;
        }


        box.textContent = message;

        box.className =
            "message " + type;

        box.style.display = "block";
    }


    function clearMessage() {

        const possibleIds = [
            "loginMessage",
            "authMessage",
            "message",
            "errorMessage"
        ];

        possibleIds.forEach(function (id) {

            const element =
                document.getElementById(id);

            if (element) {

                element.textContent = "";
                element.style.display = "none";
            }

        });
    }


    function getLoginErrorMessage(error) {

        if (!error) {
            return "Unable to login.";
        }


        switch (error.code) {

            case "auth/invalid-email":
                return "Please enter a valid email address.";

            case "auth/user-disabled":
                return "This account has been disabled.";

            case "auth/user-not-found":
                return "No account found with this email.";

            case "auth/wrong-password":
                return "Incorrect password.";

            case "auth/invalid-credential":
                return "Incorrect email or password.";

            case "auth/too-many-requests":
                return "Too many login attempts. Please try again later.";

            case "auth/network-request-failed":
                return "Network error. Please check your internet connection.";

            case "auth/operation-not-allowed":
                return "Email/password login is not enabled in Firebase.";

            default:
                return error.message ||
                    "Unable to login. Please try again.";
        }
    }


    /* =======================================================
       GET USER DATA
       ======================================================= */

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


    /* =======================================================
       CREATE USER PROFILE
       ======================================================= */

    async function createUserProfile(
        user,
        extraData = {}
    ) {

        if (!user) {
            throw new Error(
                "User is required."
            );
        }


        const userRef =
            db.collection("users").doc(user.uid);


        const existing =
            await userRef.get();


        if (existing.exists) {

            return {
                id: user.uid,
                ...existing.data()
            };
        }


        const userData = {

            uid: user.uid,

            name:
                extraData.name ||
                user.displayName ||
                "Member",

            email:
                user.email || "",

            role:
                "user",

            status:
                "active",

            enrolledCourses:
                0,

            earnings:
                0,

            createdAt:
                firebase.firestore.FieldValue.serverTimestamp(),

            updatedAt:
                firebase.firestore.FieldValue.serverTimestamp()
        };


        await userRef.set(
            userData,
            {
                merge: true
            }
        );


        return {
            id: user.uid,
            ...userData
        };
    }


    /* =======================================================
       LOGIN USER
       ======================================================= */

    async function loginUser(
        email,
        password
    ) {

        try {

            clearMessage();


            email =
                String(email || "")
                .trim()
                .toLowerCase();

            password =
                String(password || "");


            if (!email) {

                showMessage(
                    "Please enter your email address."
                );

                return null;
            }


            if (!password) {

                showMessage(
                    "Please enter your password."
                );

                return null;
            }


            console.log(
                "Logging in:",
                email
            );


            const result =
                await auth.signInWithEmailAndPassword(
                    email,
                    password
                );


            const user =
                result.user;


            if (!user) {

                throw new Error(
                    "Login failed. User not found."
                );
            }


            console.log(
                "Firebase login successful:",
                user.uid
            );


            /*
             * Load Firestore user profile.
             */

            let userData =
                await getUserData(user.uid);


            /*
             * If profile doesn't exist,
             * create a normal user profile.
             */

            if (!userData) {

                userData =
                    await createUserProfile(
                        user
                    );
            }


            showMessage(
                "Login successful. Redirecting...",
                "success"
            );


            /*
             * Save basic login information.
             */

            try {

                localStorage.setItem(
                    "skillEarnUser",
                    JSON.stringify({
                        uid: user.uid,
                        email: user.email || "",
                        name:
                            userData.name ||
                            user.displayName ||
                            "Member",
                        role:
                            userData.role ||
                            "user"
                    })
                );

            } catch (storageError) {

                console.warn(
                    "localStorage error:",
                    storageError
                );
            }


            /*
             * Redirect according to role.
             */

            if (
                userData.role === "admin"
            ) {

                window.location.href =
                    "admin.html";

            } else {

                window.location.href =
                    "dashboard.html";
            }


            return {
                user: user,
                userData: userData
            };


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            showMessage(
                getLoginErrorMessage(error),
                "error"
            );


            return null;
        }
    }


    /* =======================================================
       REGISTER USER
       ======================================================= */

    async function registerUser(
        name,
        email,
        password
    ) {

        try {

            clearMessage();


            name =
                String(name || "")
                .trim();

            email =
                String(email || "")
                .trim()
                .toLowerCase();

            password =
                String(password || "");


            if (!name) {

                showMessage(
                    "Please enter your name."
                );

                return null;
            }


            if (!email) {

                showMessage(
                    "Please enter your email address."
                );

                return null;
            }


            if (!password) {

                showMessage(
                    "Please enter a password."
                );

                return null;
            }


            if (password.length < 6) {

                showMessage(
                    "Password must be at least 6 characters."
                );

                return null;
            }


            const result =
                await auth.createUserWithEmailAndPassword(
                    email,
                    password
                );


            const user =
                result.user;


            if (!user) {

                throw new Error(
                    "Account creation failed."
                );
            }


            /*
             * Update Firebase Auth display name.
             */

            await user.updateProfile({

                displayName:
                    name
            });


            /*
             * Create Firestore profile.
             */

            const userData =
                await createUserProfile(
                    user,
                    {
                        name: name
                    }
                );


            showMessage(
                "Account created successfully.",
                "success"
            );


            /*
             * Save local session info.
             */

            try {

                localStorage.setItem(
                    "skillEarnUser",
                    JSON.stringify({
                        uid: user.uid,
                        email: user.email || "",
                        name: name,
                        role: "user"
                    })
                );

            } catch (error) {

                console.warn(
                    "Storage error:",
                    error
                );
            }


            setTimeout(function () {

                window.location.href =
                    "dashboard.html";

            }, 500);


            return {
                user: user,
                userData: userData
            };


        } catch (error) {

            console.error(
                "Register error:",
                error
            );


            let message =
                "Unable to create account.";


            switch (error.code) {

                case "auth/email-already-in-use":
                    message =
                        "This email is already registered.";
                    break;

                case "auth/invalid-email":
                    message =
                        "Please enter a valid email address.";
                    break;

                case "auth/weak-password":
                    message =
                        "Password is too weak.";
                    break;

                case "auth/network-request-failed":
                    message =
                        "Network error. Check your internet connection.";
                    break;

                default:
                    message =
                        error.message ||
                        message;
            }


            showMessage(
                message,
                "error"
            );


            return null;
        }
    }


    /* =======================================================
       FORGOT PASSWORD
       ======================================================= */

    async function forgotPassword(email) {

        try {

            clearMessage();


            email =
                String(email || "")
                .trim()
                .toLowerCase();


            if (!email) {

                showMessage(
                    "Please enter your email address."
                );

                return false;
            }


            await auth.sendPasswordResetEmail(
                email
            );


            showMessage(
                "Password reset email has been sent. Check your inbox.",
                "success"
            );


            return true;


        } catch (error) {

            console.error(
                "Forgot password error:",
                error
            );


            let message =
                "Unable to send password reset email.";


            switch (error.code) {

                case "auth/invalid-email":
                    message =
                        "Please enter a valid email address.";
                    break;

                case "auth/user-not-found":
                    message =
                        "No account found with this email.";
                    break;

                case "auth/network-request-failed":
                    message =
                        "Network error. Please check your internet.";
                    break;

                default:
                    message =
                        error.message ||
                        message;
            }


            showMessage(
                message,
                "error"
            );


            return false;
        }
    }


    /* =======================================================
       GOOGLE LOGIN
       ======================================================= */

    async function loginWithGoogle() {

        try {

            clearMessage();


            const provider =
                new firebase.auth.GoogleAuthProvider();


            const result =
                await auth.signInWithPopup(
                    provider
                );


            const user =
                result.user;


            if (!user) {

                throw new Error(
                    "Google login failed."
                );
            }


            let userData =
                await getUserData(
                    user.uid
                );


            /*
             * Create Firestore profile
             * if Google user is new.
             */

            if (!userData) {

                userData =
                    await createUserProfile(
                        user
                    );
            }


            try {

                localStorage.setItem(
                    "skillEarnUser",
                    JSON.stringify({
                        uid: user.uid,
                        email: user.email || "",
                        name:
                            userData.name ||
                            user.displayName ||
                            "Member",
                        role:
                            userData.role ||
                            "user"
                    })
                );

            } catch (error) {

                console.warn(error);
            }


            showMessage(
                "Google login successful.",
                "success"
            );


            if (
                userData.role === "admin"
            ) {

                window.location.href =
                    "admin.html";

            } else {

                window.location.href =
                    "dashboard.html";
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


            let message =
                "Google login failed.";


            if (
                error.code ===
                "auth/popup-closed-by-user"
            ) {

                message =
                    "Google login was cancelled.";

            } else if (
                error.code ===
                "auth/popup-blocked"
            ) {

                message =
                    "Popup was blocked by the browser.";

            } else {

                message =
                    error.message ||
                    message;
            }


            showMessage(
                message,
                "error"
            );


            return null;
        }
    }


    /* =======================================================
       LOGOUT
       ======================================================= */

    async function logoutUser() {

        try {

            await auth.signOut();


            try {

                localStorage.removeItem(
                    "skillEarnUser"
                );

            } catch (error) {

                console.warn(error);
            }


            window.location.href =
                "login.html";


        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            showMessage(
                "Unable to logout.",
                "error"
            );
        }
    }


    /* =======================================================
       CURRENT USER
       ======================================================= */

    function getCurrentUser() {

        return auth.currentUser || null;
    }


    /* =======================================================
       REQUIRE LOGIN
       ======================================================= */

    async function requireLogin(
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


    /* =======================================================
       REQUIRE ADMIN
       ======================================================= */

    async function requireAdmin(
        redirectPage = "dashboard.html"
    ) {

        const user =
            auth.currentUser;


        if (!user) {

            window.location.href =
                "login.html";

            return null;
        }


        const userData =
            await getUserData(
                user.uid
            );


        if (
            !userData ||
            userData.role !== "admin"
        ) {

            alert(
                "Access denied. Administrator permission required."
            );


            window.location.href =
                redirectPage;


            return null;
        }


        return {
            user: user,
            userData: userData
        };
    }


    /* =======================================================
       AUTH STATE LISTENER
       ======================================================= */

    function onAuthStateChanged(
        callback
    ) {

        return auth.onAuthStateChanged(
            callback
        );
    }


    /* =======================================================
       MAKE FUNCTIONS AVAILABLE GLOBALLY
       =======================================================
       
       IMPORTANT:
       Your login.html is calling:
       
       window.loginUser()
       window.forgotPassword()
       
       Therefore these MUST be attached to window.
       
    ======================================================= */

    window.loginUser =
        loginUser;

    window.registerUser =
        registerUser;

    window.forgotPassword =
        forgotPassword;

    window.loginWithGoogle =
        loginWithGoogle;

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

    window.onAuthStateChanged =
        onAuthStateChanged;


    /* =======================================================
       SKILLEARN AUTH API
       ======================================================= */

    window.SkillEarnAuth = {

        auth: auth,

        db: db,

        loginUser,

        registerUser,

        forgotPassword,

        loginWithGoogle,

        logoutUser,

        getCurrentUser,

        getUserData,

        createUserProfile,

        requireLogin,

        requireAdmin,

        onAuthStateChanged
    };


    console.log(
        "SkillEarn Hub auth.js loaded successfully."
    );

})();
