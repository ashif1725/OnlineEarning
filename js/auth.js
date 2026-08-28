// ============================================================
// SkillEarn Hub - Authentication System
// ============================================================
// Required:
// 1. firebase-app-compat.js
// 2. firebase-auth-compat.js
// 3. firebase-firestore-compat.js
// 4. firebase-config.js
// 5. auth.js
// ============================================================


// ============================================================
// HELPER: SHOW MESSAGE
// ============================================================

function showAuthMessage(message, type = "error") {
    const messageBox = document.getElementById("authMessage");

    if (!messageBox) {
        alert(message);
        return;
    }

    messageBox.textContent = message;
    messageBox.style.display = "block";

    if (type === "success") {
        messageBox.style.color = "#16a34a";
    } else {
        messageBox.style.color = "#dc2626";
    }
}


// ============================================================
// HELPER: CLEAR MESSAGE
// ============================================================

function clearAuthMessage() {
    const messageBox = document.getElementById("authMessage");

    if (messageBox) {
        messageBox.textContent = "";
        messageBox.style.display = "none";
    }
}


// ============================================================
// HELPER: FRIENDLY FIREBASE ERROR
// ============================================================

function getFriendlyError(error) {

    if (!error || !error.code) {
        return "Something went wrong. Please try again.";
    }

    switch (error.code) {

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/user-disabled":
            return "This account has been disabled. Please contact support.";

        case "auth/user-not-found":
            return "No account was found with this email.";

        case "auth/wrong-password":
            return "Incorrect password. Please try again.";

        case "auth/invalid-credential":
            return "Email or password is incorrect.";

        case "auth/email-already-in-use":
            return "An account with this email already exists.";

        case "auth/weak-password":
            return "Password should be at least 6 characters.";

        case "auth/operation-not-allowed":
            return "This login method is not enabled in Firebase.";

        case "auth/popup-closed-by-user":
            return "Google login was cancelled.";

        case "auth/popup-blocked":
            return "Your browser blocked the Google login popup.";

        case "auth/cancelled-popup-request":
            return "Google login was cancelled.";

        case "auth/account-exists-with-different-credential":
            return "An account already exists with this email using another login method.";

        case "auth/unauthorized-domain":
            return "This website domain is not authorized in Firebase Authentication.";

        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";

        case "auth/too-many-requests":
            return "Too many attempts. Please wait a while and try again.";

        case "auth/requires-recent-login":
            return "Please login again and retry this action.";

        default:
            return error.message || "Authentication failed. Please try again.";
    }
}


// ============================================================
// HELPER: BUTTON LOADING
// ============================================================

function setButtonLoading(button, loading, loadingText = "Please wait...") {

    if (!button) return;

    if (loading) {

        if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
        }

        button.disabled = true;
        button.textContent = loadingText;

    } else {

        button.disabled = false;

        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
        }
    }
}


// ============================================================
// LOGIN
// ============================================================

async function loginUser(email, password, button = null) {

    clearAuthMessage();

    email = email.trim();

    if (!email || !password) {
        showAuthMessage("Please enter your email and password.");
        return;
    }

    setButtonLoading(button, true, "Logging in...");

    try {

        const userCredential =
            await auth.signInWithEmailAndPassword(
                email,
                password
            );

        const user = userCredential.user;

        console.log("Login successful:", user.uid);

        showAuthMessage(
            "Login successful. Redirecting...",
            "success"
        );

        // Give Firebase a moment to finish auth state update
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 500);

    } catch (error) {

        console.error("Login error:", error);

        showAuthMessage(
            getFriendlyError(error)
        );

        setButtonLoading(button, false);
    }
}


// ============================================================
// REGISTER
// ============================================================

async function registerUser(
    name,
    email,
    password,
    confirmPassword,
    button = null
) {

    clearAuthMessage();

    name = name.trim();
    email = email.trim();

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!name) {
        showAuthMessage("Please enter your full name.");
        return;
    }

    if (!email) {
        showAuthMessage("Please enter your email address.");
        return;
    }

    if (!password) {
        showAuthMessage("Please enter a password.");
        return;
    }

    if (password.length < 6) {
        showAuthMessage(
            "Password must be at least 6 characters."
        );
        return;
    }

    if (password !== confirmPassword) {
        showAuthMessage(
            "Passwords do not match."
        );
        return;
    }

    setButtonLoading(
        button,
        true,
        "Creating Account..."
    );

    try {

        // -----------------------------
        // CREATE FIREBASE ACCOUNT
        // -----------------------------

        const userCredential =
            await auth.createUserWithEmailAndPassword(
                email,
                password
            );

        const user = userCredential.user;


        // -----------------------------
        // SAVE DISPLAY NAME
        // -----------------------------

        await user.updateProfile({
            displayName: name
        });


        console.log(
            "Registration successful:",
            user.uid
        );


        // -----------------------------
        // OPTIONAL USER PROFILE
        // -----------------------------
        // Firestore profile creation is attempted.
        // If Firestore rules are not configured yet,
        // authentication itself will still remain successful.

        try {

            if (typeof db !== "undefined") {

                await db
                    .collection("users")
                    .doc(user.uid)
                    .set({
                        uid: user.uid,
                        name: name,
                        email: user.email,
                        photoURL: user.photoURL || "",
                        role: "user",
                        referralCode: createReferralCode(user.uid),
                        balance: 0,
                        totalEarnings: 0,
                        totalReferrals: 0,
                        createdAt:
                            firebase.firestore.FieldValue.serverTimestamp()
                    }, {
                        merge: true
                    });
            }

        } catch (profileError) {

            console.warn(
                "User profile could not be saved:",
                profileError
            );

            // Do NOT block registration because of Firestore rules.
        }


        // -----------------------------
        // SUCCESS
        // -----------------------------

        showAuthMessage(
            "Account created successfully. Redirecting...",
            "success"
        );

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 700);


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        showAuthMessage(
            getFriendlyError(error)
        );

        setButtonLoading(
            button,
            false
        );
    }
}


// ============================================================
// GOOGLE LOGIN / SIGNUP
// ============================================================

async function googleLogin(button = null) {

    clearAuthMessage();

    setButtonLoading(
        button,
        true,
        "Connecting to Google..."
    );

    try {

        const provider =
            new firebase.auth.GoogleAuthProvider();

        // Ask Google for basic profile information
        provider.addScope("profile");
        provider.addScope("email");


        // Force account selection
        provider.setCustomParameters({
            prompt: "select_account"
        });


        // -----------------------------
        // GOOGLE POPUP
        // -----------------------------

        const result =
            await auth.signInWithPopup(provider);

        const user = result.user;

        console.log(
            "Google authentication successful:",
            user.uid
        );


        // -----------------------------
        // CREATE / UPDATE USER PROFILE
        // -----------------------------

        try {

            if (typeof db !== "undefined") {

                await db
                    .collection("users")
                    .doc(user.uid)
                    .set({

                        uid: user.uid,

                        name:
                            user.displayName ||
                            "SkillEarn User",

                        email:
                            user.email || "",

                        photoURL:
                            user.photoURL || "",

                        role: "user",

                        lastLogin:
                            firebase.firestore.FieldValue
                                .serverTimestamp(),

                        createdAt:
                            firebase.firestore.FieldValue
                                .serverTimestamp()

                    }, {
                        merge: true
                    });
            }

        } catch (profileError) {

            console.warn(
                "Google user profile update failed:",
                profileError
            );
        }


        // -----------------------------
        // REDIRECT
        // -----------------------------

        showAuthMessage(
            "Google login successful. Redirecting...",
            "success"
        );

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 500);


    } catch (error) {

        console.error(
            "Google login error:",
            error
        );

        showAuthMessage(
            getFriendlyError(error)
        );

        setButtonLoading(
            button,
            false
        );
    }
}


// ============================================================
// FORGOT PASSWORD
// ============================================================

async function forgotPassword() {

    clearAuthMessage();

    let emailInput =
        document.getElementById("loginEmail");

    let email =
        emailInput
            ? emailInput.value.trim()
            : "";


    // If email is not already entered,
    // ask user for it.

    if (!email) {

        email = prompt(
            "Enter your email address to reset your password:"
        );

        if (!email) {
            return;
        }

        email = email.trim();
    }


    if (!email) {
        showAuthMessage(
            "Please enter your email address."
        );
        return;
    }


    try {

        await auth.sendPasswordResetEmail(email);

        showAuthMessage(
            "Password reset email sent. Please check your inbox.",
            "success"
        );

    } catch (error) {

        console.error(
            "Password reset error:",
            error
        );

        showAuthMessage(
            getFriendlyError(error)
        );
    }
}


// ============================================================
// LOGOUT
// ============================================================

async function logoutUser() {

    try {

        await auth.signOut();

        console.log(
            "User logged out successfully."
        );

        window.location.href = "login.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            "Unable to logout. Please try again."
        );
    }
}


// ============================================================
// CHECK LOGIN STATUS
// ============================================================

function requireLogin() {

    auth.onAuthStateChanged(function (user) {

        if (!user) {

            window.location.href =
                "login.html";

        }

    });
}


// ============================================================
// CHECK IF ALREADY LOGGED IN
// ============================================================

function redirectIfLoggedIn() {

    auth.onAuthStateChanged(function (user) {

        if (user) {

            const currentPage =
                window.location.pathname
                    .split("/")
                    .pop();

            if (
                currentPage === "login.html" ||
                currentPage === "register.html" ||
                currentPage === ""
            ) {

                window.location.href =
                    "dashboard.html";
            }
        }

    });
}


// ============================================================
// CREATE REFERRAL CODE
// ============================================================

function createReferralCode(uid) {

    if (!uid) {
        return "";
    }

    return "SEH-" +
        uid.substring(0, 8).toUpperCase();
}


// ============================================================
// LOGIN FORM
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // ====================================================
        // LOGIN
        // ====================================================

        const loginForm =
            document.getElementById("loginForm");

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    const emailInput =
                        document.getElementById(
                            "loginEmail"
                        );

                    const passwordInput =
                        document.getElementById(
                            "loginPassword"
                        );

                    const submitButton =
                        loginForm.querySelector(
                            'button[type="submit"]'
                        );

                    if (
                        !emailInput ||
                        !passwordInput
                    ) {

                        showAuthMessage(
                            "Login form is missing required fields."
                        );

                        return;
                    }

                    loginUser(
                        emailInput.value,
                        passwordInput.value,
                        submitButton
                    );
                }
            );
        }


        // ====================================================
        // REGISTER
        // ====================================================

        const registerForm =
            document.getElementById(
                "registerForm"
            );

        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    const nameInput =
                        document.getElementById(
                            "registerName"
                        );

                    const emailInput =
                        document.getElementById(
                            "registerEmail"
                        );

                    const passwordInput =
                        document.getElementById(
                            "registerPassword"
                        );

                    const confirmPasswordInput =
                        document.getElementById(
                            "registerConfirmPassword"
                        );

                    const submitButton =
                        registerForm.querySelector(
                            'button[type="submit"]'
                        );


                    if (
                        !nameInput ||
                        !emailInput ||
                        !passwordInput ||
                        !confirmPasswordInput
                    ) {

                        showAuthMessage(
                            "Registration form is missing required fields."
                        );

                        return;
                    }


                    registerUser(

                        nameInput.value,

                        emailInput.value,

                        passwordInput.value,

                        confirmPasswordInput.value,

                        submitButton
                    );
                }
            );
        }


        // ====================================================
        // GOOGLE BUTTON
        // ====================================================

        const googleButtons =
            document.querySelectorAll(
                ".google-btn"
            );

        googleButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        googleLogin(button);
                    }
                );
            }
        );

    }
);
