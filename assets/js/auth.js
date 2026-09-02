"use strict";


/* =========================================================
   SkillEarn Hub
   Authentication
   Login + Register + Logout
========================================================= */


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


    element.classList.remove(
        "success"
    );


    element.classList.toggle(
        "show",
        Boolean(message)
    );

}


function authSuccess(element, message) {

    if (!element) {
        return;
    }


    element.textContent =
        message || "";


    element.classList.add(
        "show",
        "success"
    );

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
   GET REDIRECT URL BY USER ROLE
========================================================= */

function getRedirectByRole(user, fallbackRedirect) {

    const role =
        String(
            user?.role ||
            user?.userRole ||
            user?.accountRole ||
            "user"
        )
            .trim()
            .toLowerCase();


    /*
    ---------------------------------------------------------
    ADMIN
    ---------------------------------------------------------
    */

    if (
        role === "admin" ||
        role === "administrator"
    ) {

        /*
         IMPORTANT:

         अगर आपकी admin dashboard file का path अलग है,
         तो सिर्फ नीचे वाला path बदलना है।

         Example:
         admin/dashboard.html

         या

         admin/index.html
        */

        return "admin/dashboard.html";

    }


    /*
    ---------------------------------------------------------
    NORMAL USER
    ---------------------------------------------------------
    */

    return (
        fallbackRedirect ||
        "user/dashboard.html"
    );

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


    const message =
        authElement(
            "loginMessage"
        );


    if (!form) {
        return;
    }


    const button =
        form.querySelector(
            'button[type="submit"]'
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


    clearFieldErrors();


    authError(
        message,
        ""
    );


    /*
    ---------------------------------------------------------
    EMAIL VALIDATION
    ---------------------------------------------------------
    */

    if (!email) {

        setFieldError(
            "loginEmail",
            "Please enter your email address."
        );


        authError(
            message,
            "Please enter your email address."
        );


        return;

    }


    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email)
    ) {

        setFieldError(
            "loginEmail",
            "Please enter a valid email address."
        );


        authError(
            message,
            "Please enter a valid email address."
        );


        return;

    }


    /*
    ---------------------------------------------------------
    PASSWORD VALIDATION
    ---------------------------------------------------------
    */

    if (!password) {

        setFieldError(
            "loginPassword",
            "Please enter your password."
        );


        authError(
            message,
            "Please enter your password."
        );


        return;

    }


    /*
    ---------------------------------------------------------
    BUTTON LOADING
    ---------------------------------------------------------
    */

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

                    method:
                        "POST",

                    body: {

                        email:
                            email,

                        password:
                            password

                    }

                }
            );


        /*
        -----------------------------------------------------
        SAVE USER
        -----------------------------------------------------
        */

        if (
            result?.user
        ) {

            window.setSavedUser(
                result.user
            );

        }


        /*
        -----------------------------------------------------
        SUCCESS MESSAGE
        -----------------------------------------------------
        */

        authSuccess(
            message,
            result?.message ||
            "Login successful. Redirecting..."
        );


        /*
        -----------------------------------------------------
        ROLE BASED REDIRECT
        -----------------------------------------------------
        */

        const redirect =
            getRedirectByRole(
                result?.user,
                result?.redirect
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
   REGISTER
========================================================= */

async function handleRegister(event) {

    event.preventDefault();


    const form =
        authElement(
            "registerForm"
        );


    const message =
        authElement(
            "registerMessage"
        );


    if (!form) {
        return;
    }


    const button =
        form.querySelector(
            'button[type="submit"]'
        );


    /*
    ---------------------------------------------------------
    GET VALUES
    ---------------------------------------------------------
    */

    const fullName =
        String(
            authElement(
                "fullName"
            )?.value ||
            ""
        )
            .trim();


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
        )
            .trim();


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


    clearFieldErrors();


    authError(
        message,
        ""
    );


    /*
    ---------------------------------------------------------
    FULL NAME VALIDATION
    ---------------------------------------------------------
    */

    if (
        fullName.length < 2
    ) {

        setFieldError(
            "fullName",
            "Please enter your full name."
        );


        authError(
            message,
            "Please enter a valid full name."
        );


        return;

    }


    /*
    ---------------------------------------------------------
    EMAIL VALIDATION
    ---------------------------------------------------------
    */

    if (!email) {

        setFieldError(
            "email",
            "Please enter your email address."
        );


        authError(
            message,
            "Please enter your email address."
        );


        return;

    }


    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email)
    ) {

        setFieldError(
            "email",
            "Please enter a valid email address."
        );


        authError(
            message,
            "Please enter a valid email address."
        );


        return;

    }


    /*
    ---------------------------------------------------------
    PHONE VALIDATION
    ---------------------------------------------------------
    */

    if (
        phone.length < 8
    ) {

        setFieldError(
            "phone",
            "Please enter a valid mobile number."
        );


        authError(
            message,
            "Please enter a valid mobile number."
        );


        return;

    }


    /*
    ---------------------------------------------------------
    PASSWORD VALIDATION
    ---------------------------------------------------------
    */

    if (
        password.length < 12
    ) {

        setFieldError(
            "password",
            "Password must contain at least 12 characters."
        );


        authError(
            message,
            "Password must contain at least 12 characters."
        );


        return;

    }


    /*
    ---------------------------------------------------------
    CONFIRM PASSWORD
    ---------------------------------------------------------
    */

    if (
        password !==
        confirmPassword
    ) {

        setFieldError(
            "confirmPassword",
            "Passwords do not match."
        );


        authError(
            message,
            "Passwords do not match."
        );


        return;

    }


    /*
    ---------------------------------------------------------
    TERMS
    ---------------------------------------------------------
    */

    if (!terms) {

        authError(
            message,
            "Please accept the Terms and Privacy Policy."
        );


        return;

    }


    /*
    ---------------------------------------------------------
    BUTTON LOADING
    ---------------------------------------------------------
    */

    if (button) {

        button.disabled =
            true;


        button.dataset.originalText =
            button.textContent;


        button.textContent =
            "Creating account...";

    }


    try {

        /*
        -----------------------------------------------------
        REGISTER API
        -----------------------------------------------------
        */

        const result =
            await window.apiRequest(
                "/api/auth/register",
                {

                    method:
                        "POST",

                    body: {

                        fullName:
                            fullName,

                        email:
                            email,

                        phone:
                            phone,

                        password:
                            password

                    }

                }
            );


        /*
        -----------------------------------------------------
        SAVE USER IF API RETURNS USER
        -----------------------------------------------------
        */

        if (
            result?.user
        ) {

            window.setSavedUser(
                result.user
            );

        }


        /*
        -----------------------------------------------------
        SUCCESS MESSAGE
        -----------------------------------------------------
        */

        authSuccess(
            message,
            result?.message ||
            "Account created successfully. Redirecting..."
        );


        /*
        -----------------------------------------------------
        IMPORTANT
        -----------------------------------------------------

        Registration के बाद सीधे dashboard पर भेजने
        के बजाय login page पर भेजना safer है।

        अगर backend automatically login करता है,
        तब result.redirect को use कर सकते हैं।
        */


        setTimeout(
            function () {

                if (
                    result?.redirect &&
                    result?.user
                ) {

                    window.location.href =
                        getRedirectByRole(
                            result.user,
                            result.redirect
                        );

                    return;

                }


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


        authError(
            message,
            error.message ||
            "Unable to create account. Please try again."
        );

    } finally {

        if (button) {

            button.disabled =
                false;


            button.textContent =
                button.dataset.originalText ||
                "Create Account";

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

        if (
            typeof window.clearAuthData ===
            "function"
        ) {

            window.clearAuthData();

        }


        /*
        -----------------------------------------------------
        Determine correct relative login path
        -----------------------------------------------------
        */

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

            window.location.href =
                "../login.html";

        } else {

            window.location.href =
                "login.html";

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
        -----------------------------------------------------
        LOGIN FORM
        -----------------------------------------------------
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
        -----------------------------------------------------
        REGISTER FORM
        -----------------------------------------------------
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
        -----------------------------------------------------
        LOGOUT BUTTONS
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
   PUBLIC FUNCTIONS
========================================================= */

window.SkillEarnAuth = {

    login:
        handleLogin,


    register:
        handleRegister,


    logout:
        logoutUser

};
