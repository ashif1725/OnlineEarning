"use strict";


/* =========================================================
   HELPERS
========================================================= */

function authElement(id) {

    return document.getElementById(
        id
    );

}


function showMessage(
    element,
    message,
    success = false
) {

    if (!element) {
        return;
    }


    element.textContent =
        message ||
        "";


    element.classList.remove(
        "show",
        "success"
    );


    if (!message) {
        return;
    }


    element.classList.add(
        "show"
    );


    if (success) {

        element.classList.add(
            "success"
        );

    }

}


function setFieldError(
    field,
    message
) {

    const element =
        document.querySelector(
            `[data-error-for="${field}"]`
        );


    if (element) {

        element.textContent =
            message ||
            "";

    }

}


function clearFieldErrors() {

    document
        .querySelectorAll(
            ".field-error"
        )
        .forEach(

            function (element) {

                element.textContent =
                    "";

            }

        );

}


function setLoading(
    button,
    text
) {

    if (!button) {
        return;
    }


    if (
        !button.dataset
            .originalText
    ) {

        button.dataset.originalText =
            button.textContent;

    }


    button.disabled =
        true;


    button.textContent =
        text;

}


function restoreButton(
    button,
    fallback
) {

    if (!button) {
        return;
    }


    button.disabled =
        false;


    button.textContent =

        button.dataset
            .originalText ||

        fallback;

}


/* =========================================================
   USER ROLE
========================================================= */

function getUserRole(user) {

    return String(

        user?.role ||

        user?.userRole ||

        user?.user_role ||

        "user"

    )
    .trim()
    .toLowerCase();

}


/* =========================================================
   REDIRECT
========================================================= */

function getDashboardUrl(user) {

    const role =
        getUserRole(
            user
        );


if (
    role === "admin" ||
    role === "administrator"
) {

    return "admin/admin-dashboard.html";

}


    return "user/dashboard.html";

}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(event) {

    event.preventDefault();


    const form =
        authElement(
            "loginForm"
        );


    if (!form) {
        return;
    }


    const message =
        authElement(
            "loginMessage"
        );


    const button =
        form.querySelector(
            'button[type="submit"]'
        );


    clearFieldErrors();


    showMessage(
        message,
        ""
    );


    const email =
        String(

            authElement(
                "loginEmail"
            )?.value ||

            ""

        )
        .trim()
        .toLowerCase();


    const password =
        String(

            authElement(
                "loginPassword"
            )?.value ||

            ""

        );


    let invalid =
        false;


    if (!email) {

        setFieldError(
            "loginEmail",
            "Please enter your email address."
        );

        invalid =
            true;

    }


    if (!password) {

        setFieldError(
            "loginPassword",
            "Please enter your password."
        );

        invalid =
            true;

    }


    if (invalid) {
        return;
    }


    setLoading(
        button,
        "Signing in..."
    );


    try {

        const result =
            await window.apiRequest(

                "/api/auth/login",

                {

                    method:
                        "POST",

                    body: {

                        email,
                        password

                    }

                }

            );


        const user =
            window.extractUser(
                result
            );


        if (!user) {

            throw new Error(
                "Login succeeded but user information was missing."
            );

        }


        /*
           IMPORTANT:
           Save authenticated user.
        */

        window.setSavedUser(
            user
        );


        /*
           IMPORTANT:
           apiRequest automatically saves result.token.
        */

        if (
            result?.token
        ) {

            window.setAuthToken(
                result.token
            );

        }


        showMessage(

            message,

            "Login successful. Redirecting...",

            true

        );


        const redirect =
            getDashboardUrl(
                user
            );


        setTimeout(

            function () {

                window.location.assign(
                    redirect
                );

            },

            700

        );


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        showMessage(

            message,

            error?.message ||

            "Login failed. Please try again."

        );

    } finally {

        restoreButton(
            button,
            "Sign In"
        );

    }

}


/* =========================================================
   REGISTER
========================================================= */

async function handleRegister(event) {

    event.preventDefault();


    const form =
        authElement(
            "registerForm"
        );


    if (!form) {
        return;
    }


    const message =
        authElement(
            "registerMessage"
        );


    const button =
        form.querySelector(
            'button[type="submit"]'
        );


    clearFieldErrors();

    showMessage(
        message,
        ""
    );


    const fullName =
        String(
            authElement(
                "fullName"
            )?.value ||
            ""
        ).trim();


    const email =
        String(
            authElement(
                "email"
            )?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const phone =
        String(
            authElement(
                "phone"
            )?.value ||
            ""
        ).trim();


    const password =
        String(
            authElement(
                "password"
            )?.value ||
            ""
        );


    const confirmPassword =
        String(
            authElement(
                "confirmPassword"
            )?.value ||
            ""
        );


    const terms =
        Boolean(
            authElement(
                "terms"
            )?.checked
        );


    let invalid =
        false;


    if (
        fullName.length < 2
    ) {

        setFieldError(
            "fullName",
            "Please enter your full name."
        );

        invalid =
            true;

    }


    if (!email) {

        setFieldError(
            "email",
            "Please enter your email address."
        );

        invalid =
            true;

    }


    if (!phone) {

        setFieldError(
            "phone",
            "Please enter your mobile number."
        );

        invalid =
            true;

    }


    if (
        password.length < 12
    ) {

        setFieldError(
            "password",
            "Password must contain at least 12 characters."
        );

        invalid =
            true;

    }


    if (
        password !==
        confirmPassword
    ) {

        setFieldError(
            "confirmPassword",
            "Passwords do not match."
        );

        invalid =
            true;

    }


    if (!terms) {

        showMessage(
            message,
            "Please accept the Terms and Privacy Policy."
        );

        invalid =
            true;

    }


    if (invalid) {
        return;
    }


    setLoading(
        button,
        "Creating account..."
    );


    try {

        const result =
            await window.apiRequest(

                "/api/auth/register",

                {

                    method:
                        "POST",

                    body: {

                        fullName,
                        email,
                        phone,
                        password

                    }

                }

            );


        showMessage(

            message,

            result?.message ||
            "Account created successfully. Redirecting to login...",

            true

        );


        form.reset();


        setTimeout(

            function () {

                window.location.assign(
                    "login.html"
                );

            },

            1000

        );


    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );


        showMessage(

            message,

            error?.message ||

            "Unable to create account."

        );

    } finally {

        restoreButton(
            button,
            "Create Account"
        );

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

                method:
                    "POST"

            }

        );

    } catch (error) {

        console.warn(
            "LOGOUT ERROR:",
            error
        );

    } finally {

        window.clearAuthData();


        const path =
            window.location.pathname;


        if (

            path.includes(
                "/user/"
            ) ||

            path.includes(
                "/admin/"
            )

        ) {

            window.location.assign(
                "../login.html"
            );

        }

        else {

            window.location.assign(
                "login.html"
            );

        }

    }

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    function () {

        const loginForm =
            authElement(
                "loginForm"
            );


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLogin
            );

        }


        const registerForm =
            authElement(
                "registerForm"
            );


        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                handleRegister
            );

        }


        document
            .querySelectorAll(
                "[data-action='logout']"
            )
            .forEach(

                function (button) {

                    button.addEventListener(

                        "click",

                        function (event) {

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

    login:
        handleLogin,

    register:
        handleRegister,

    logout:
        logoutUser

};
