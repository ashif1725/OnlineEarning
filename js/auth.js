/* =========================================================
   SKILLEARN HUB - FIREBASE AUTHENTICATION
   Login | Register | Google | Forgot Password | Logout
   ========================================================= */


/* =========================================================
   FIREBASE SERVICES
   ========================================================= */

const auth = firebase.auth();
const db = firebase.firestore();


/* =========================================================
   CONFIG
   ========================================================= */

const DASHBOARD_PAGE = "dashboard.html";
const LOGIN_PAGE = "login.html";


/* =========================================================
   MESSAGE HELPER
   ========================================================= */

function showMessage(message, type = "error") {

    const messageBox =
        document.getElementById("authMessage") ||
        document.getElementById("errorMessage");

    if (!messageBox) {
        alert(message);
        return;
    }

    messageBox.textContent = message;

    messageBox.style.display = "block";

    messageBox.className =
        "auth-message " +
        (type === "success"
            ? "success"
            : type === "info"
            ? "info"
            : "error");
}


/* =========================================================
   HIDE MESSAGE
   ========================================================= */

function hideMessage() {

    const messageBox =
        document.getElementById("authMessage") ||
        document.getElementById("errorMessage");

    if (messageBox) {
        messageBox.textContent = "";
        messageBox.style.display = "none";
    }
}


/* =========================================================
   FIREBASE ERROR MESSAGE
   ========================================================= */

function getFirebaseErrorMessage(error) {

    if (!error || !error.code) {
        return "Something went wrong. Please try again.";
    }

    switch (error.code) {

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/user-not-found":
            return "No account was found with this email.";

        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/email-already-in-use":
            return "This email is already registered. Please login.";

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
            return "Your browser blocked the Google login popup.";

        case "auth/operation-not-allowed":
            return "This login method is not enabled in Firebase.";

        case "auth/account-exists-with-different-credential":
            return "An account already exists with this email using another login method.";

        case "auth/requires-recent-login":
            return "Please login again and try this action.";

        default:
            return error.message || "Authentication failed.";
    }
}


/* =========================================================
   SET BUTTON LOADING
   ========================================================= */

function setButtonLoading(button, loading, loadingText = "Please wait...") {

    if (!button) return;

    if (loading) {

        button.dataset.originalText =
            button.innerHTML;

        button.disabled = true;

        button.innerHTML =
            loadingText;

    } else {

        button.disabled = false;

        if (button.dataset.originalText) {
            button.innerHTML =
                button.dataset.originalText;
        }
    }
}


/* =========================================================
   LOGIN
   ========================================================= */

async function loginUser(email, password) {

    hideMessage();

    email = email.trim();

    if (!email || !password) {

        showMessage(
            "Please enter your email and password."
        );

        return false;
    }

    try {

        const userCredential =
            await auth.signInWithEmailAndPassword(
                email,
                password
            );

        console.log(
            "Login successful:",
            userCredential.user.uid
        );

        showMessage(
            "Login successful. Redirecting...",
            "success"
        );

        setTimeout(function () {

            window.location.href =
                DASHBOARD_PAGE;

        }, 500);

        return true;

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        showMessage(
            getFirebaseErrorMessage(error)
        );

        return false;
    }
}


/* =========================================================
   REGISTER
   ========================================================= */

async function registerUser(
    name,
    email,
    password,
    confirmPassword
) {

    hideMessage();

    name = name.trim();
    email = email.trim();

    if (!name) {

        showMessage(
            "Please enter your full name."
        );

        return false;
    }

    if (!email) {

        showMessage(
            "Please enter your email address."
        );

        return false;
    }

    if (password.length < 6) {

        showMessage(
            "Password must be at least 6 characters."
        );

        return false;
    }

    if (password !== confirmPassword) {

        showMessage(
            "Passwords do not match."
        );

        return false;
    }

    try {

        /* Create Firebase account */

        const userCredential =
            await auth.createUserWithEmailAndPassword(
                email,
                password
            );

        const user =
            userCredential.user;


        /* Update Firebase display name */

        await user.updateProfile({

            displayName: name

        });


        /* Save user profile in Firestore */

        await db
            .collection("users")
            .doc(user.uid)
            .set({

                uid: user.uid,

                name: name,

                email: user.email,

                photoURL: user.photoURL || "",

                role: "user",

                walletBalance: 0,

                totalEarnings: 0,

                referralEarnings: 0,

                referralCount: 0,

                coursesEnrolled: 0,

                createdAt:
                    firebase.firestore.FieldValue.serverTimestamp(),

                updatedAt:
                    firebase.firestore.FieldValue.serverTimestamp()

            }, {

                merge: true

            });


        console.log(
            "Registration successful:",
            user.uid
        );


        showMessage(
            "Account created successfully. Redirecting...",
            "success"
        );


        setTimeout(function () {

            window.location.href =
                DASHBOARD_PAGE;

        }, 700);


        return true;

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        showMessage(
            getFirebaseErrorMessage(error)
        );

        return false;
    }
}


/* =========================================================
   GOOGLE LOGIN / SIGNUP
   ========================================================= */

async function googleLogin() {

    hideMessage();

    try {

        const provider =
            new firebase.auth.GoogleAuthProvider();

        provider.setCustomParameters({

            prompt: "select_account"

        });


        const result =
            await auth.signInWithPopup(provider);


        const user =
            result.user;


        /* Check whether user profile already exists */

        const userRef =
            db.collection("users")
              .doc(user.uid);

        const userDoc =
            await userRef.get();


        /* Create profile for first-time Google user */

        if (!userDoc.exists) {

            await userRef.set({

                uid: user.uid,

                name:
                    user.displayName ||
                    "SkillEarn User",

                email:
                    user.email || "",

                photoURL:
                    user.photoURL || "",

                role: "user",

                walletBalance: 0,

                totalEarnings: 0,

                referralEarnings: 0,

                referralCount: 0,

                coursesEnrolled: 0,

                provider: "google",

                createdAt:
                    firebase.firestore.FieldValue.serverTimestamp(),

                updatedAt:
                    firebase.firestore.FieldValue.serverTimestamp()

            });

        } else {

            await userRef.set({

                name:
                    user.displayName ||
                    userDoc.data().name ||
                    "SkillEarn User",

                email:
                    user.email || "",

                photoURL:
                    user.photoURL || "",

                updatedAt:
                    firebase.firestore.FieldValue.serverTimestamp()

            }, {

                merge: true

            });

        }


        console.log(
            "Google authentication successful:",
            user.uid
        );


        showMessage(
            "Google login successful. Redirecting...",
            "success"
        );


        setTimeout(function () {

            window.location.href =
                DASHBOARD_PAGE;

        }, 500);


        return true;

    } catch (error) {

        console.error(
            "Google login error:",
            error
        );

        showMessage(
            getFirebaseErrorMessage(error)
        );

        return false;
    }
}


/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

async function forgotPassword() {

    hideMessage();

    let emailInput =
        document.getElementById("loginEmail");


    let email =
        emailInput
            ? emailInput.value.trim()
            : "";


    if (!email) {

        email =
            prompt(
                "Enter your registered email address:"
            );

        if (!email) {
            return;
        }

        email =
            email.trim();
    }


    if (!email) {

        showMessage(
            "Please enter your email address."
        );

        return;
    }


    try {

        await auth.sendPasswordResetEmail(
            email
        );


        showMessage(
            "Password reset email sent. Please check your inbox.",
            "success"
        );


    } catch (error) {

        console.error(
            "Password reset error:",
            error
        );

        showMessage(
            getFirebaseErrorMessage(error)
        );
    }
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutUser() {

    try {

        await auth.signOut();

        window.location.href =
            LOGIN_PAGE;

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        showMessage(
            getFirebaseErrorMessage(error)
        );
    }
}


/* =========================================================
   AUTH STATE CHECK
   ========================================================= */

function requireAuth() {

    auth.onAuthStateChanged(function(user) {

        if (!user) {

            window.location.href =
                LOGIN_PAGE;

        }

    });
}


/* =========================================================
   LOGIN FORM
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const loginForm =
            document.getElementById(
                "loginForm"
            );


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                async function(event) {

                    event.preventDefault();

                    const email =
                        document.getElementById(
                            "loginEmail"
                        )?.value.trim();


                    const password =
                        document.getElementById(
                            "loginPassword"
                        )?.value;


                    const submitButton =
                        loginForm.querySelector(
                            'button[type="submit"]'
                        );


                    setButtonLoading(
                        submitButton,
                        true,
                        "Logging in..."
                    );


                    await loginUser(
                        email,
                        password
                    );


                    setButtonLoading(
                        submitButton,
                        false
                    );

                }
            );

        }


        /* =====================================================
           REGISTER FORM
           ===================================================== */

        const registerForm =
            document.getElementById(
                "registerForm"
            );


        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                async function(event) {

                    event.preventDefault();


                    const name =
                        document.getElementById(
                            "registerName"
                        )?.value.trim();


                    const email =
                        document.getElementById(
                            "registerEmail"
                        )?.value.trim();


                    const password =
                        document.getElementById(
                            "registerPassword"
                        )?.value;


                    const confirmPassword =
                        document.getElementById(
                            "registerConfirmPassword"
                        )?.value;


                    const submitButton =
                        registerForm.querySelector(
                            'button[type="submit"]'
                        );


                    setButtonLoading(
                        submitButton,
                        true,
                        "Creating Account..."
                    );


                    await registerUser(
                        name,
                        email,
                        password,
                        confirmPassword
                    );


                    setButtonLoading(
                        submitButton,
                        false
                    );

                }
            );

        }

    }
);


/* =========================================================
   GOOGLE BUTTON SUPPORT
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const googleButtons =
            document.querySelectorAll(
                ".google-btn"
            );


        googleButtons.forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    async function(event) {

                        event.preventDefault();

                        setButtonLoading(
                            button,
                            true,
                            "Connecting..."
                        );


                        await googleLogin();


                        setButtonLoading(
                            button,
                            false
                        );

                    }
                );

            }
        );

    }
);


/* =========================================================
   PROTECT DASHBOARD PAGES
   ========================================================= */

const protectedPages = [

    "dashboard.html",
    "profile.html",
    "referral.html",
    "affiliate.html",
    "earn.html",
    "payment.html"

];


const currentPage =
    window.location.pathname
        .split("/")
        .pop();


if (
    protectedPages.includes(
        currentPage
    )
) {

    requireAuth();

}


/* =========================================================
   EXPORT GLOBAL FUNCTIONS
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

window.requireAuth =
    requireAuth;


/* =========================================================
   END OF AUTH.JS
   ========================================================= */
