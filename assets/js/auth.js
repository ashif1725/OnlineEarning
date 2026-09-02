"use strict";


/* =========================================================
   SkillEarn Hub
   Authentication
   Final Login + Register + Role Redirect
========================================================= */


/* =========================================================
   ELEMENT HELPER
========================================================= */

function authElement(id) {

    return document.getElementById(id);

}


/* =========================================================
   MESSAGE
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


    if (
        type === "success"
    ) {

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


    return {
        ...user,

        role:
            String(
                user.role ||
                user.userRole ||
                user.user_role ||
                "user"
            )
            .trim()
            .toLowerCase()
    };

}


/* =========================================================
   EXTRACT USER
========================================================= */

function extractLoginUser(result) {

    if (!result) {
        return null;
    }


    /*
    ---------------------------------------------------------
    Standard API response
    ---------------------------------------------------------
    */

    if (result.user) {
        return result.user;
    }


    /*
    ---------------------------------------------------------
    Alternative API response structures
    ---------------------------------------------------------
    */

    if (result.data?.user) {
        return result.data.user;
    }


    if (result.account) {
        return result.account;
    }


    return null;

}


/* =========================================================
   GET USER ROLE
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
   GET REDIRECT
========================================================= */

function getRedirect(user) {

    const role =
        getUserRole(user);


    /*
    =========================================================
    ADMIN
    =========================================================
    */

    if (
        role === "admin" ||
        role === "administrator"
    ) {

        return "/admin/dashboard.html";

    }


    /*
    =========================================================
    NORMAL USER
    =========================================================
    */

    return "/user/dashboard.html";

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


    clearFieldErrors();


    authMessage(
        message,
        ""
    );


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


    setButtonLoading(
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


        /*
        =====================================================
        EXTRACT USER
        =====================================================
        */

        const rawUser =
            extractLoginUser(
                result
            );


        if (!rawUser) {

            throw new Error(
                "Login succeeded but user account data was not returned."
            );

        }


        const user =
            normalizeUser(
                rawUser
            );


        /*
        =====================================================
        SAVE USER
        =====================================================
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
        =====================================================
        SAVE TOKEN
        =====================================================
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
        =====================================================
        SUCCESS MESSAGE
        =====================================================
        */

        authMessage(
            message,

            result?.message ||
            "Login successful. Redirecting...",

            "success"
        );


        /*
        =====================================================
        FRONTEND CONTROLLED REDIRECT
        =====================================================
        */

        const redirect =
            getRedirect(
                user
            );


        window.setTimeout(
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


    clearFieldErrors();


    authMessage(
        message,
        ""
    );


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


    setButtonLoading(
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


        authMessage(
            message,

            result?.message ||
            "Account created successfully. Redirecting to login...",

            "success"
        );


        form.reset();


        window.setTimeout(
            function () {

                window.location.assign(
                    "/login.html"
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

        console.warn(
            "LOGOUT ERROR:",
            error
        );

    } finally {

        if (
            typeof window.clearAuthData ===
            "function"
        ) {

            window.clearAuthData();

        }


        /*
        -----------------------------------------------------
        Determine correct login path
        -----------------------------------------------------
        */

        const currentPath =
            window.location.pathname;


        const isInsideFolder =
            currentPath.includes(
                "/user/"
            ) ||
            currentPath.includes(
                "/admin/"
            );


        window.location.assign(
            isInsideFolder
                ? "../login.html"
                : "/login.html"
        );

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


        const registerForm =
            authElement(
                "registerForm"
            );


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLogin
            );

        }


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
        getRedirect

};
