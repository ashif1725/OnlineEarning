/* =========================================================
   SKILLEARN HUB
   REGISTER
   Firebase JS SDK - COMPAT
   ========================================================= */

"use strict";


/* =========================================================
   ELEMENTS
   ========================================================= */

const registerForm = document.getElementById("registerForm");

const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput =
    document.getElementById("confirmPassword");
const termsInput = document.getElementById("terms");

const registerButton =
    document.getElementById("registerButton");

const registerButtonText =
    document.getElementById("registerButtonText");

const registerMessage =
    document.getElementById("registerMessage");


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(message, type = "error") {

    if (!registerMessage) return;

    registerMessage.textContent = message;

    registerMessage.className =
        `auth-message show ${type}`;
}


function clearMessage() {

    if (!registerMessage) return;

    registerMessage.textContent = "";

    registerMessage.className =
        "auth-message";
}


/* =========================================================
   LOADING STATE
   ========================================================= */

function setLoading(loading) {

    if (!registerButton) return;

    registerButton.disabled = loading;

    if (loading) {

        registerButton.classList.add("loading");

        if (registerButtonText) {
            registerButtonText.textContent =
                "Creating Account...";
        }

    } else {

        registerButton.classList.remove("loading");

        if (registerButtonText) {
            registerButtonText.textContent =
                "Create Account";
        }
    }
}


/* =========================================================
   VALIDATION
   ========================================================= */

function validateForm() {

    const fullName =
        fullNameInput.value.trim();

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;


    if (!fullName) {
        return "Please enter your full name.";
    }


    if (fullName.length < 2) {
        return "Please enter a valid full name.";
    }


    if (!email) {
        return "Please enter your email address.";
    }


    if (!password) {
        return "Please create a password.";
    }


    if (password.length < 6) {
        return "Password must contain at least 6 characters.";
    }


    if (password !== confirmPassword) {
        return "Passwords do not match.";
    }


    if (!termsInput.checked) {
        return "Please accept the Terms & Conditions.";
    }


    return null;
}


/* =========================================================
   FIREBASE ERROR HANDLER
   ========================================================= */

function getFirebaseErrorMessage(error) {

    console.error(
        "Firebase registration error:",
        error
    );


    switch (error.code) {

        case "auth/email-already-in-use":
            return "An account already exists with this email.";


        case "auth/invalid-email":
            return "Please enter a valid email address.";


        case "auth/weak-password":
            return "Password is too weak. Use at least 6 characters.";


        case "auth/operation-not-allowed":
            return "Email/Password sign-up is not enabled in Firebase.";


        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";


        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";


        case "permission-denied":
            return "Firestore permission denied. Check Firestore Security Rules.";


        default:
            return (
                error.message ||
                "Registration failed. Please try again."
            );
    }
}


/* =========================================================
   CHECK FIREBASE
   ========================================================= */

if (
    typeof firebase === "undefined"
) {

    showMessage(
        "Firebase SDK is not loaded. Please check your Firebase scripts.",
        "error"
    );

    console.error(
        "SkillEarn Hub: Firebase SDK missing."
    );
}


/* =========================================================
   REGISTER
   ========================================================= */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            clearMessage();


            const validationError =
                validateForm();


            if (validationError) {

                showMessage(
                    validationError,
                    "error"
                );

                return;
            }


            setLoading(true);


            const fullName =
                fullNameInput.value.trim();

            const email =
                emailInput.value.trim().toLowerCase();

            const password =
                passwordInput.value;


            try {

                /* -----------------------------------------
                   CREATE FIREBASE AUTH USER
                   ----------------------------------------- */

                const userCredential =
                    await firebase
                        .auth()
                        .createUserWithEmailAndPassword(
                            email,
                            password
                        );


                const user =
                    userCredential.user;


                if (!user) {
                    throw new Error(
                        "Firebase user creation failed."
                    );
                }


                /* -----------------------------------------
                   UPDATE DISPLAY NAME
                   ----------------------------------------- */

                await user.updateProfile({
                    displayName: fullName
                });


                /* -----------------------------------------
                   CREATE FIRESTORE USER PROFILE
                   ----------------------------------------- */

                await firebase
                    .firestore()
                    .collection("users")
                    .doc(user.uid)
                    .set({

                        uid: user.uid,

                        fullName: fullName,

                        email: email,

                        role: "user",

                        walletBalance: 0,

                        walletFrozen: false,

                        createdAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp()

                    }, {
                        merge: true
                    });


                /* -----------------------------------------
                   SUCCESS
                   ----------------------------------------- */

                showMessage(
                    "Account created successfully. Redirecting...",
                    "success"
                );


                registerForm.reset();


                setTimeout(
                    function () {

                        window.location.href =
                            "./login.html";

                    },
                    1200
                );


            } catch (error) {

                showMessage(
                    getFirebaseErrorMessage(error),
                    "error"
                );

            } finally {

                setLoading(false);
            }

        }
    );
}


/* =========================================================
   PASSWORD SHOW / HIDE
   ========================================================= */

document
    .querySelectorAll(".password-toggle")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const targetId =
                    button.dataset.target;

                const input =
                    document.getElementById(targetId);


                if (!input) return;


                if (input.type === "password") {

                    input.type = "text";

                    button.textContent =
                        "Hide";

                    button.setAttribute(
                        "aria-label",
                        "Hide password"
                    );

                } else {

                    input.type = "password";

                    button.textContent =
                        "Show";

                    button.setAttribute(
                        "aria-label",
                        "Show password"
                    );
                }
            }
        );

    });


/* =========================================================
   DEBUG
   ========================================================= */

console.log(
    "SkillEarn Hub Register JS loaded."
);
