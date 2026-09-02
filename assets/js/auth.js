/* =========================================================
   SkillEarn Hub
   assets/js/auth.js
   STEP 5
   Authentication
   ========================================================= */

"use strict";


/* =========================================================
   HELPERS
   ========================================================= */

function authElement(id) {

    return document.getElementById(id);
}


function authError(element, message) {

    if (!element) {
        return;
    }

    element.textContent =
        message || "";

    element.classList.toggle(
        "show",
        Boolean(message)
    );
}


/* =========================================================
   LOGIN
   ========================================================= */

async function handleLogin(event) {

    event.preventDefault();


    const form =
        authElement("loginForm");

    const message =
        authElement("loginMessage");

    const button =
        form?.querySelector(
            'button[type="submit"]'
        );


    if (!form) {
        return;
    }


    const email =
        String(
            authElement("loginEmail")?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const password =
        String(
            authElement("loginPassword")?.value ||
            ""
        );


    authError(
        message,
        ""
    );


    if (!email) {

        authError(
            message,
            "Please enter your email address."
        );

        return;
    }


    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

        authError(
            message,
            "Please enter a valid email address."
        );

        return;
    }


    if (!password) {

        authError(
            message,
            "Please enter your password."
        );

        return;
    }


    if (button) {

        button.disabled =
            true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Signing in...";
    }


    try {

        const result =
            await window.apiRequest(
                "/api/auth/login",
                {
                    method: "POST",

                    body: {
                        email,
                        password
                    }
                }
            );


        if (
            result?.user
        ) {

            window.setSavedUser(
                result.user
            );
        }


        if (message) {

            message.textContent =
                result?.message ||
                "Login successful.";

            message.classList.add(
                "show",
                "success"
            );
        }


        setTimeout(
            () => {

                window.location.href =
                    result?.redirect ||
                    "user/dashboard.html";

            },
            500
        );


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        authError(
            message,
            error.message ||
            "Login failed. Please try again."
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                button.dataset.originalText ||
                "Sign In";
        }
    }
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutUser() {

    try {

        await window.apiRequest(
            "/api/auth/logout",
            {
                method: "POST"
            }
        );

    } catch (error) {

        console.warn(
            "Logout API error:",
            error
        );

    } finally {

        window.clearAuthData();

        window.location.href =
            "../login.html";
    }
}


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const loginForm =
            authElement("loginForm");


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLogin
            );
        }


        document
            .querySelectorAll(
                "[data-action='logout']"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            logoutUser();
                        }
                    );
                }
            );
    }
);


/* =========================================================
   PUBLIC
   ========================================================= */

window.SkillEarnAuth = {

    logout:
        logoutUser

};
