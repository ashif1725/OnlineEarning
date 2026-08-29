/* =========================================================
   SKILLEARN HUB
   LOGIN
   Firebase JS SDK - COMPAT
   ========================================================= */

"use strict";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("loginButton");
const loginButtonText = document.getElementById("loginButtonText");
const loginMessage = document.getElementById("loginMessage");


/* =========================================================
   MESSAGE
========================================================= */

function showLoginMessage(message, type = "error") {

    if (!loginMessage) return;

    loginMessage.textContent = message;

    loginMessage.className =
        `auth-message show ${type}`;
}


function clearLoginMessage() {

    if (!loginMessage) return;

    loginMessage.textContent = "";

    loginMessage.className =
        "auth-message";
}


/* =========================================================
   LOADING
========================================================= */

function setLoginLoading(loading) {

    if (!loginButton) return;

    loginButton.disabled = loading;

    if (loginButtonText) {

        loginButtonText.textContent =
            loading
                ? "Signing In..."
                : "Login";

    }

}


/* =========================================================
   FIREBASE ERROR
========================================================= */

function getLoginErrorMessage(error) {

    console.error(
        "SkillEarn Hub login error:",
        error
    );


    switch (error.code) {

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/user-not-found":
            return "No account was found with this email.";

        case "auth/wrong-password":
            return "Incorrect email or password.";

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/user-disabled":
            return "This account has been disabled.";

        case "auth/too-many-requests":
            return "Too many login attempts. Please try again later.";

        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";

        case "auth/operation-not-allowed":
            return "Email/Password authentication is not enabled.";

        default:
            return (
                error.message ||
                "Login failed. Please try again."
            );
    }
}


/* =========================================================
   LOGIN
========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            clearLoginMessage();


            const email =
                emailInput.value.trim().toLowerCase();

            const password =
                passwordInput.value;


            if (!email) {

                showLoginMessage(
                    "Please enter your email address."
                );

                return;
            }


            if (!password) {

                showLoginMessage(
                    "Please enter your password."
                );

                return;
            }


            setLoginLoading(true);


            try {

                /* =========================================
                   FIREBASE LOGIN
                ========================================= */

                const userCredential =
                    await firebase
                        .auth()
                        .signInWithEmailAndPassword(
                            email,
                            password
                        );


                const user =
                    userCredential.user;


                if (!user) {

                    throw new Error(
                        "Unable to authenticate user."
                    );

                }


                /* =========================================
                   SUCCESS
                ========================================= */

                showLoginMessage(
                    "Login successful. Redirecting...",
                    "success"
                );


                /*
                   Temporary dashboard redirect.

                   जब dashboard.html तैयार हो जाए,
                   इसे dashboard.html कर देना।
                */

                setTimeout(
                    function () {

                        window.location.href =
                            "../dashboard.html";

                    },
                    800
                );


            } catch (error) {

                showLoginMessage(
                    getLoginErrorMessage(error),
                    "error"
                );

            } finally {

                setLoginLoading(false);

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

                } else {

                    input.type = "password";

                    button.textContent =
                        "Show";

                }

            }
        );

    });


console.log(
    "SkillEarn Hub Login JS loaded."
);
