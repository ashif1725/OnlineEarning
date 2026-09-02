"use strict";


/* =========================================================
   SkillEarn Hub
   Authentication
========================================================= */


/* =========================================================
   ELEMENT HELPER
========================================================= */

function authElement(id) {

    return document.getElementById(
        id
    );

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
   SET BUTTON LOADING
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

function normalizeUser(
    user
) {

    if (!user) {

        return null;

    }


    return user;

}


/* =========================================================
   GET REDIRECT
========================================================= */

function getRedirect(
    result,
    user
) {

    /*
    ---------------------------------------------------------
    Backend explicitly provides redirect
    ---------------------------------------------------------
    */

    if (
        result?.redirect
    ) {

        return result.redirect;

    }


    /*
    ---------------------------------------------------------
    Check role
    ---------------------------------------------------------
    */

    const role =
        String(

            user?.role ||

            user?.userRole ||

            user?.user_role ||

            ""

        )
        .trim()
        .toLowerCase();


    /*
    ---------------------------------------------------------
    Admin
    ---------------------------------------------------------
    */

    if (

        role === "admin" ||

        role === "administrator"

    ) {

        return "admin/dashboard.html";

    }


    /*
    ---------------------------------------------------------
    Normal user
    ---------------------------------------------------------
    */

    return "user/dashboard.html";

}


/* =========================================================
   HANDLE LOGIN
========================================================= */

async function handleLogin(
    event
) {

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


    /* =====================================================
       VALIDATION
    ===================================================== */

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
        -----------------------------------------------------
        Extract user
        -----------------------------------------------------
        */

        const user =
            typeof window.extractUser ===
            "function"

                ? window.extractUser(
                    result
                )

                : (
                    result?.user ||
                    null
                );


        if (user) {

            window.setSavedUser(
                normalizeUser(
                    user
                )
            );

        }


        /*
        -----------------------------------------------------
        Login success
        -----------------------------------------------------
        */

        authMessage(
            message,

            result?.message ||
            "Login successful. Redirecting...",

            "success"
        );


        /*
        -----------------------------------------------------
        Redirect
        -----------------------------------------------------
        */

        const redirect =
            getRedirect(
                result,
                user
            );


        setTimeout(
            function () {

                window.location.href =
                    redirect;

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

            error.message ||
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

async function handleRegister(
    event
) {

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


    /* =====================================================
       VALIDATION
    ===================================================== */

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


    if (
        !termsAccepted
    ) {

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


        /*
        -----------------------------------------------------
        Save user if backend returns it
        -----------------------------------------------------
        */

        const user =
            typeof window.extractUser ===
            "function"

                ? window.extractUser(
                    result
                )

                : (
                    result?.user ||
                    null
                );


        if (user) {

            window.setSavedUser(
                normalizeUser(
                    user
                )
            );

        }


        /*
        -----------------------------------------------------
        Registration success
        -----------------------------------------------------
        */

        authMessage(
            message,

            result?.message ||
            "Account created successfully. Redirecting to login...",

            "success"
        );


        /*
        -----------------------------------------------------
        IMPORTANT
        -----------------------------------------------------
        Registration ke baad login page par bhejna
        taaki authentication state clear aur predictable rahe.
        -----------------------------------------------------
        */

        setTimeout(
            function () {

                window.location.href =
                    "login.html";

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

            error.message ||
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

        window.location.href =
            "../login.html";

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


        /*
        -----------------------------------------------------
        Login
        -----------------------------------------------------
        */

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLogin
            );

        }


        /*
        -----------------------------------------------------
        Register
        -----------------------------------------------------
        */

        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                handleRegister
            );

        }


        /*
        -----------------------------------------------------
        Logout buttons
        -----------------------------------------------------
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
        logoutUser

};
