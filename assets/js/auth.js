"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const registerForm =
        document.getElementById("registerForm");

    const loginForm =
        document.getElementById("loginForm");

    const forgotPasswordForm =
        document.getElementById("forgotPasswordForm");


    if (registerForm) {
        registerForm.addEventListener(
            "submit",
            handleRegister
        );
    }


    if (loginForm) {
        loginForm.addEventListener(
            "submit",
            handleLogin
        );
    }


    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener(
            "submit",
            handleForgotPassword
        );
    }
});


function getApiBaseUrl() {

    const configured =
        window.SKILLEARN_CONFIG &&
        window.SKILLEARN_CONFIG.apiBaseUrl;

    if (!configured) {
        throw new Error(
            "API_URL_NOT_CONFIGURED"
        );
    }

    return configured.replace(
        /\/+$/,
        ""
    );
}


async function apiRequest(
    endpoint,
    method,
    body
) {

    const url =
        `${getApiBaseUrl()}${endpoint}`;


    const response =
        await fetch(
            url,
            {
                method,

                credentials:
                    "include",

                headers: {
                    "Accept":
                        "application/json",

                    "Content-Type":
                        "application/json"
                },

                body:
                    body === undefined
                        ? undefined
                        : JSON.stringify(body)
            }
        );


    let data = {};

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    if (
        contentType.includes(
            "application/json"
        )
    ) {

        try {

            data =
                await response.json();

        } catch {

            data = {};
        }

    } else {

        const text =
            await response.text();

        data = {
            message: text
        };
    }


    if (!response.ok) {

        const error =
            new Error(
                data.error ||
                data.message ||
                `HTTP_${response.status}`
            );

        error.status =
            response.status;

        error.data =
            data;

        throw error;
    }


    return data;
}


/* =========================================
   REGISTER
========================================= */

async function handleRegister(event) {

    event.preventDefault();

    clearMessages();


    const form =
        event.currentTarget;


    const fullName =
        form.elements.fullName.value.trim();

    const email =
        form.elements.email.value.trim();

    const phone =
        form.elements.phone.value.trim();

    const password =
        form.elements.password.value;

    const confirmPassword =
        form.elements.confirmPassword.value;

    const terms =
        form.elements.terms.checked;


    let valid = true;


    if (fullName.length < 2) {

        setFieldError(
            "fullName",
            "Please enter your full name."
        );

        valid = false;
    }


    if (!isValidEmail(email)) {

        setFieldError(
            "email",
            "Enter a valid email address."
        );

        valid = false;
    }


    if (!isValidPhone(phone)) {

        setFieldError(
            "phone",
            "Enter a valid mobile number."
        );

        valid = false;
    }


    if (!isStrongPassword(password)) {

        setFieldError(
            "password",
            "Password must contain at least 12 characters."
        );

        valid = false;
    }


    if (
        password !==
        confirmPassword
    ) {

        setFieldError(
            "confirmPassword",
            "Passwords do not match."
        );

        valid = false;
    }


    if (!terms) {

        showMessage(
            "registerMessage",
            "Please accept the Terms and Privacy Policy.",
            "error"
        );

        valid = false;
    }


    if (!valid) {
        return;
    }


    const button =
        form.querySelector(
            'button[type="submit"]'
        );


    setLoading(
        button,
        true,
        "Creating account..."
    );


    try {

        const result =
            await apiRequest(
                "/api/auth/register",
                "POST",
                {
                    fullName,
                    email,
                    phone,
                    password
                }
            );


        showMessage(
            "registerMessage",
            result.message ||
            "Account created. Please verify your email.",
            "success"
        );


        form.reset();


        setTimeout(() => {

            window.location.href =
                "verify-email.html";

        }, 1000);


    } catch (error) {

        console.error(
            "Register error:",
            error
        );


        showMessage(
            "registerMessage",
            friendlyError(
                error
            ),
            "error"
        );


    } finally {

        setLoading(
            button,
            false,
            "Create Account"
        );
    }
}


/* =========================================
   LOGIN
========================================= */

async function handleLogin(event) {

    event.preventDefault();

    clearMessages();


    const form =
        event.currentTarget;


    const email =
        form.elements.email.value.trim();

    const password =
        form.elements.password.value;


    if (!isValidEmail(email)) {

        setFieldError(
            "loginEmail",
            "Enter a valid email address."
        );

        return;
    }


    if (!password) {

        setFieldError(
            "loginPassword",
            "Password is required."
        );

        return;
    }


    const button =
        form.querySelector(
            'button[type="submit"]'
        );


    setLoading(
        button,
        true,
        "Signing in..."
    );


    try {

        const result =
            await apiRequest(
                "/api/auth/login",
                "POST",
                {
                    email,
                    password
                }
            );


        if (
            result.requires2FA === true
        ) {

            sessionStorage.setItem(
                "skillearn_2fa_pending",
                "true"
            );


            window.location.href =
                "2fa.html";

            return;
        }


        showMessage(
            "loginMessage",
            result.message ||
            "Login successful.",
            "success"
        );


        setTimeout(() => {

            window.location.href =
                "user/dashboard.html";

        }, 700);


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        showMessage(
            "loginMessage",
            friendlyError(
                error
            ),
            "error"
        );


    } finally {

        setLoading(
            button,
            false,
            "Sign In"
        );
    }
}


/* =========================================
   FORGOT PASSWORD
========================================= */

async function handleForgotPassword(
    event
) {

    event.preventDefault();

    clearMessages();


    const form =
        event.currentTarget;


    const email =
        form.elements.email.value.trim();


    if (!isValidEmail(email)) {

        setFieldError(
            "resetEmail",
            "Enter a valid email address."
        );

        return;
    }


    const button =
        form.querySelector(
            'button[type="submit"]'
        );


    setLoading(
        button,
        true,
        "Sending..."
    );


    try {

        const result =
            await apiRequest(
                "/api/auth/forgot-password",
                "POST",
                {
                    email
                }
            );


        showMessage(
            "resetMessage",
            result.message ||
            "If the account exists, a recovery email has been sent.",
            "success"
        );


    } catch (error) {

        console.error(
            "Password recovery error:",
            error
        );


        showMessage(
            "resetMessage",
            friendlyError(
                error
            ),
            "error"
        );


    } finally {

        setLoading(
            button,
            false,
            "Continue"
        );
    }
}


/* =========================================
   VALIDATION
========================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
}


function isValidPhone(phone) {

    return /^[0-9+\-\s()]{8,20}$/
        .test(phone);
}


function isStrongPassword(password) {

    return (
        password.length >= 12 &&
        password.length <= 128
    );
}


/* =========================================
   UI HELPERS
========================================= */

function setFieldError(
    fieldName,
    message
) {

    const element =
        document.querySelector(
            `[data-error-for="${fieldName}"]`
        );


    if (element) {

        element.textContent =
            message;
    }
}


function clearMessages() {

    document
        .querySelectorAll(
            ".field-error"
        )
        .forEach(element => {

            element.textContent =
                "";
        });


    document
        .querySelectorAll(
            ".auth-message"
        )
        .forEach(element => {

            element.textContent =
                "";

            element.className =
                "auth-message";
        });
}


function showMessage(
    elementId,
    message,
    type
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;

    element.className =
        `auth-message show ${type}`;
}


function setLoading(
    button,
    loading,
    loadingText
) {

    if (!button) {
        return;
    }


    if (loading) {

        button.disabled =
            true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            loadingText;

    } else {

        button.disabled =
            false;

        button.textContent =
            button.dataset.originalText ||
            button.textContent;
    }
}


/* =========================================
   ERROR HANDLING
========================================= */

function friendlyError(error) {

    if (
        error.message ===
        "API_URL_NOT_CONFIGURED"
    ) {

        return "Authentication server is not configured.";
    }


    if (
        error.message ===
        "Failed to fetch"
    ) {

        return "Unable to connect to the authentication server.";
    }


    const status =
        error.status;


    if (status === 400) {

        return (
            error.data?.message ||
            error.data?.error ||
            "Please check the information you entered."
        );
    }


    if (status === 401) {

        return "Invalid email or password.";
    }


    if (status === 403) {

        return (
            error.data?.message ||
            "This account is not allowed to sign in."
        );
    }


    if (status === 409) {

        return (
            error.data?.message ||
            "An account with these details already exists."
        );
    }


    if (status === 429) {

        return "Too many attempts. Please try again later.";
    }


    if (status >= 500) {

        return "Server error. Please try again later.";
    }


    return (
        error.data?.message ||
        error.data?.error ||
        error.message ||
        "Request failed."
    );
}
