"use strict";


/* =========================================================
   SkillEarn Hub
   Authentication
========================================================= */


/* =========================================================
   ELEMENT
========================================================= */

function authElement(id) {

    return document.getElementById(id);

}


/* =========================================================
   MESSAGE
========================================================= */

function showAuthMessage(
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
   CLEAR ERRORS
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
    text
) {

    if (!button) {

        return;

    }


    if (!button.dataset.originalText) {

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
   GET ROLE
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

function getRedirectByRole(user) {

    const role =
        getUserRole(user);


    if (

        role === "admin" ||

        role === "administrator"

    ) {

        return "admin/dashboard.html";

    }


    return "user/dashboard.html";

}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(event) {

    event.preventDefault();


    const form =
        authElement("loginForm");


    if (!form) {

        return;

    }


    const message =
        authElement("loginMessage");


    const button =
        form.querySelector(
            'button[type="submit"]'
        );


    clearFieldErrors();


    showAuthMessage(
        message,
        ""
    );


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

        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email)

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


        const user =
            window.extractUser
                ? window.extractUser(result)
                : result?.user;


        if (!user) {

            throw new Error(
                "Login succeeded but user data was not returned."
            );

        }


        window.setSavedUser(
            user
        );


        const role =
            getUserRole(
                user
            );


        showAuthMessage(
            message,
            role === "admin"
                ? "Admin login successful. Redirecting..."
                : "Login successful. Redirecting...",
            "success"
        );


        const redirect =
            getRedirectByRole(
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


        showAuthMessage(
            message,
            error.message ||
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
        authElement("registerForm");


    if (!form) {

        return;

    }


    const message =
        authElement("registerMessage");


    const button =
        form.querySelector(
            'button[type="submit"]'
        );


    clearFieldErrors();


    showAuthMessage(
        message,
        ""
    );


    const fullName =
        String(
            authElement("fullName")?.value ||
            ""
        ).trim();


    const email =
        String(
            authElement("email")?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const phone =
        String(
            authElement("phone")?.value ||
            ""
        ).trim();


    const password =
        String(
            authElement("password")?.value ||
            ""
        );


    const confirmPassword =
        String(
            authElement("confirmPassword")?.value ||
            ""
        );


    const terms =
        Boolean(
            authElement("terms")?.checked
        );


    let hasError =
        false;


    if (fullName.length < 2) {

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

        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email)

    ) {

        setFieldError(
            "email",
            "Please enter a valid email address."
        );

        hasError =
            true;

    }


    if (phone.length < 8) {

        setFieldError(
            "phone",
            "Please enter a valid mobile number."
        );

        hasError =
            true;

    }


    if (password.length < 12) {

        setFieldError(
            "password",
            "Password must contain at least 12 characters."
        );

        hasError =
            true;

    }


    if (password !== confirmPassword) {

        setFieldError(
            "confirmPassword",
            "Passwords do not match."
        );

        hasError =
            true;

    }


    if (!terms) {

        showAuthMessage(
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


        showAuthMessage(
            message,
            result?.message ||
            "Account created successfully.",
            "success"
        );


        form.reset();


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


        showAuthMessage(
            message,
            error.message ||
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

            path.includes("/user/") ||

            path.includes("/admin/")

        ) {

            window.location.href =
                "../login.html";

        }

        else {

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

        const loginForm =
            authElement("loginForm");


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLogin
            );

        }


        const registerForm =
            authElement("registerForm");


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
        logoutUser

};
