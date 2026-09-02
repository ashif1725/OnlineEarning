"use strict";


/* =========================================================
   SkillEarn Hub
   assets/js/auth.js

   Authentication
   - Login
   - Registration
   - Role-based redirect
   - Logout
   - Field validation
   - GitHub Pages compatible redirects
========================================================= */


/* =========================================================
   ELEMENT HELPER
========================================================= */

function authElement(id) {

    return document.getElementById(id);

}


/* =========================================================
   AUTH MESSAGE
========================================================= */

function authMessage(
    element,
    message,
    type = "error"
) {

    if (!element) {
        return;
    }


    element.textContent =
        message || "";


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


    if (type === "success") {

        element.classList.add(
            "success"
        );

    }

}


/* =========================================================
   FIELD ERROR
========================================================= */

function setFieldError(
    fieldName,
    message
) {

    const element =
        document.querySelector(
            `[data-error-for="${fieldName}"]`
        );


    if (!element) {
        return;
    }


    element.textContent =
        message || "";

}


/* =========================================================
   CLEAR FIELD ERRORS
========================================================= */

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


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
    button,
    loadingText
) {

    if (!button) {
        return;
    }


    if (
        !button.dataset.originalText
    ) {

        button.dataset.originalText =
            button.textContent;

    }


    button.disabled =
        true;


    button.textContent =
        loadingText;

}


/* =========================================================
   RESTORE BUTTON
========================================================= */

function restoreButton(
    button,
    fallbackText
) {

    if (!button) {
        return;
    }


    button.disabled =
        false;


    button.textContent =
        button.dataset.originalText ||
        fallbackText;

}


/* =========================================================
   NORMALIZE USER
========================================================= */

function normalizeUser(user) {

    if (!user) {
        return null;
    }


    const role =
        String(
            user.role ||
            user.userRole ||
            user.user_role ||
            "user"
        )
        .trim()
        .toLowerCase();


    return {

        ...user,

        role

    };

}


/* =========================================================
   EXTRACT USER FROM API RESPONSE
========================================================= */

function extractUser(result) {

    if (!result) {
        return null;
    }


    /*
       Standard response:

       {
           user: { ... }
       }
    */

    if (
        result.user &&
        typeof result.user === "object"
    ) {

        return result.user;

    }


    /*
       Alternative:

       {
           data: {
               user: { ... }
           }
       }
    */

    if (
        result.data?.user &&
        typeof result.data.user === "object"
    ) {

        return result.data.user;

    }


    /*
       Alternative:

       {
           account: { ... }
       }
    */

    if (
        result.account &&
        typeof result.account === "object"
    ) {

        return result.account;

    }


    return null;

}


/* =========================================================
   GET USER ROLE
========================================================= */

function getUserRole(user) {

    if (!user) {
        return "user";
    }


    return String(

        user.role ||

        user.userRole ||

        user.user_role ||

        "user"

    )
    .trim()
    .toLowerCase();

}


/* =========================================================
   GET LOGIN REDIRECT

   IMPORTANT:
   No leading slash.

   GitHub Pages project sites may be deployed like:

   username.github.io/repository-name/

   Therefore:

   user/dashboard.html

   is safer than:

   /user/dashboard.html
========================================================= */

function getRedirect(user) {

    const role =
        getUserRole(user);


    /*
       ADMIN
    */

    if (

        role === "admin" ||

        role === "administrator"

    ) {

        return "admin/dashboard.html";

    }


    /*
       NORMAL USER
    */

    return "user/dashboard.html";

}


/* =========================================================
   REDIRECT HELPER

   Uses relative paths so GitHub Pages does not lose
   the repository base path.
========================================================= */

function redirectTo(path) {

    if (!path) {
        return;
    }


    window.location.assign(
        path
    );

}


/* =========================================================
   HANDLE LOGIN
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


    /*
       Clear previous errors
    */

    clearFieldErrors();

    authMessage(
        message,
        ""
    );


    /*
       Read values
    */

    const email =
        String(
            authElement(
                "loginEmail"
            )?.value || ""
        )
        .trim()
        .toLowerCase();


    const password =
        String(
            authElement(
                "loginPassword"
            )?.value || ""
        );


    /*
       Validation
    */

    let hasError =
        false;


    if (!email) {

        setFieldError(
            "loginEmail",
            "Please enter your email address."
        );


        hasError =
            true;

    }

    else if (

        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        )

    ) {

        setFieldError(
            "loginEmail",
            "Please enter a valid email address."
        );


        hasError =
            true;

    }


    if (!password) {

        setFieldError(
            "loginPassword",
            "Please enter your password."
        );


        hasError =
            true;

    }


    if (hasError) {
        return;
    }


    /*
       Loading state
    */

    setButtonLoading(
        button,
        "Signing in..."
    );


    try {

        /*
           Login API request
        */

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


        /*
           Extract user
        */

        const rawUser =
            extractUser(
                result
            );


        /*
           User data is required for role-based redirect.
        */

        if (!rawUser) {

            throw new Error(
                "Login was successful, but user account information was not returned by the server."
            );

        }


        const user =
            normalizeUser(
                rawUser
            );


        /*
           Save user
        */

        if (

            typeof window.setSavedUser ===
            "function"

        ) {

            window.setSavedUser(
                user
            );

        }


        /*
           Save token.

           config.js already saves data.token automatically
           inside apiRequest(), but this keeps login safe
           if the API helper behavior changes.
        */

        if (

            result?.token &&

            typeof window.setAuthToken ===
            "function"

        ) {

            window.setAuthToken(
                result.token
            );

        }


        /*
           Success message
        */

        authMessage(
            message,

            result?.message ||
            "Login successful. Redirecting...",

            "success"
        );


        /*
           Determine dashboard from role
        */

        const redirect =
            getRedirect(
                user
            );


        /*
           Redirect after message
        */

        window.setTimeout(
            function () {

                redirectTo(
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


        authMessage(
            message,

            error?.message ||
            "Login failed. Please try again.",

            "error"
        );

    } finally {

        restoreButton(
            button,
            "Sign In"
        );

    }

}


/* =========================================================
   HANDLE REGISTER
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


    /*
       Clear previous errors
    */

    clearFieldErrors();

    authMessage(
        message,
        ""
    );


    /*
       Read values
    */

    const fullName =
        String(
            authElement(
                "fullName"
            )?.value || ""
        )
        .trim();


    const email =
        String(
            authElement(
                "email"
            )?.value || ""
        )
        .trim()
        .toLowerCase();


    const phone =
        String(
            authElement(
                "phone"
            )?.value || ""
        )
        .trim();


    const password =
        String(
            authElement(
                "password"
            )?.value || ""
        );


    const confirmPassword =
        String(
            authElement(
                "confirmPassword"
            )?.value || ""
        );


    const termsAccepted =
        Boolean(
            authElement(
                "terms"
            )?.checked
        );


    /*
       Validation
    */

    let hasError =
        false;


    if (
        fullName.length < 2
    ) {

        setFieldError(
            "fullName",
            "Please enter your full name."
        );


        hasError =
            true;

    }


    if (!email) {

        setFieldError(
            "email",
            "Please enter your email address."
        );


        hasError =
            true;

    }

    else if (

        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        )

    ) {

        setFieldError(
            "email",
            "Please enter a valid email address."
        );


        hasError =
            true;

    }


    if (!phone) {

        setFieldError(
            "phone",
            "Please enter your mobile number."
        );


        hasError =
            true;

    }


    if (
        password.length < 12
    ) {

        setFieldError(
            "password",
            "Password must contain at least 12 characters."
        );


        hasError =
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


        hasError =
            true;

    }


    if (!termsAccepted) {

        authMessage(
            message,
            "Please accept the Terms and Privacy Policy."
        );


        hasError =
            true;

    }


    if (hasError) {
        return;
    }


    /*
       Loading state
    */

    setButtonLoading(
        button,
        "Creating account..."
    );


    try {

        /*
           Registration API request
        */

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


        /*
           Success message
        */

        authMessage(
            message,

            result?.message ||
            "Account created successfully. Redirecting to login...",

            "success"
        );


        /*
           Reset form after successful registration
        */

        form.reset();


        /*
           IMPORTANT:

           No leading slash here.

           Correct:
           login.html

           Wrong for many GitHub Pages project sites:
           /login.html
        */

        window.setTimeout(
            function () {

                redirectTo(
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


        authMessage(
            message,

            error?.message ||
            "Unable to create account. Please try again.",

            "error"
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

        if (

            typeof window.apiRequest ===
            "function"

        ) {

            await window.apiRequest(
                "/api/auth/logout",
                {

                    method:
                        "POST"

                }
            );

        }

    } catch (error) {

        /*
           Even if API logout fails,
           local authentication should still be cleared.
        */

        console.warn(
            "LOGOUT ERROR:",
            error
        );

    } finally {

        /*
           Clear local token and user
        */

        if (

            typeof window.clearAuthData ===
            "function"

        ) {

            window.clearAuthData();

        }


        /*
           Determine current folder.

           Dashboard pages:

           user/dashboard.html
           admin/dashboard.html

           Therefore go one level up.
        */

        const currentPath =
            window.location.pathname;


        const insideDashboardFolder =

            currentPath.includes(
                "/user/"
            ) ||

            currentPath.includes(
                "/admin/"
            );


        if (
            insideDashboardFolder
        ) {

            redirectTo(
                "../login.html"
            );

        } else {

            redirectTo(
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


        /*
           LOGIN FORM
        */

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


        /*
           REGISTER FORM
        */

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


        /*
           LOGOUT BUTTONS
        */

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
   PUBLIC API
========================================================= */

window.SkillEarnAuth = {

    login:
        handleLogin,

    register:
        handleRegister,

    logout:
        logoutUser,

    getRedirect:
        getRedirect,

    getUserRole:
        getUserRole

};
