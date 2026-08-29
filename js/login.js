"use strict";

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginButtonText = document.getElementById("loginButtonText");
const loginLoader = document.getElementById("loginLoader");
const loginMessage = document.getElementById("loginMessage");

function showMessage(message, type = "error") {
    if (!loginMessage) return;

    loginMessage.textContent = message;
    loginMessage.className = `auth-message show ${type}`;
}

function setLoading(loading) {
    if (loginButton) {
        loginButton.disabled = loading;
    }

    if (loginButtonText) {
        loginButtonText.textContent = loading
            ? "Signing in..."
            : "Login";
    }

    if (loginLoader) {
        loginLoader.style.display = loading
            ? "inline-block"
            : "none";
    }
}


if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();
        event.stopPropagation();

        const emailInput =
            document.getElementById("email");

        const passwordInput =
            document.getElementById("password");

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        if (!email) {
            showMessage("Please enter your email address.");
            emailInput.focus();
            return;
        }

        if (!password) {
            showMessage("Please enter your password.");
            passwordInput.focus();
            return;
        }

        setLoading(true);
        showMessage("");

        try {

            await firebase
                .auth()
                .signInWithEmailAndPassword(
                    email,
                    password
                );

            /*
             * IMPORTANT:
             * GitHub Pages project URL
             */
            window.location.replace(
                "../dashboard.html"
            );

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            let message =
                "Unable to login. Please try again.";

            switch (error.code) {

                case "auth/invalid-email":
                    message =
                        "Please enter a valid email address.";
                    break;

                case "auth/user-not-found":
                    message =
                        "No account was found with this email.";
                    break;

                case "auth/wrong-password":
                case "auth/invalid-credential":
                    message =
                        "Incorrect email or password.";
                    break;

                case "auth/too-many-requests":
                    message =
                        "Too many login attempts. Please try again later.";
                    break;

                case "auth/network-request-failed":
                    message =
                        "Network error. Please check your internet connection.";
                    break;

            }

            showMessage(message);

            setLoading(false);

        }

    });

}


/* =================================================
   SHOW / HIDE PASSWORD
================================================= */

document
    .querySelectorAll(".password-toggle")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const targetId =
                    button.dataset.target;

                const input =
                    document.getElementById(
                        targetId
                    );

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
