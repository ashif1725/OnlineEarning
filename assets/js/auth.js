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


function getApiUrl(path) {

    const base =
        window.SKILLEARN_CONFIG?.apiBaseUrl || "";

    return `${base}${path}`;
}


async function apiRequest(
    path,
    options = {}
) {

    const response =
        await fetch(
            getApiUrl(path),
            {
                method:
                    options.method || "GET",

                headers: {
                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})
                },

                credentials: "include",

                body:
                    options.body
                        ? JSON.stringify(options.body)
                        : undefined
            }
        );


    let data = null;

    try {
        data = await response.json();
    } catch {
        data = {};
    }


    if (!response.ok) {

        throw new Error(
            data.error ||
            data.message ||
            "REQUEST_FAILED"
        );
    }


    return data;
}


/* =========================
   REGISTER
========================= */

async function handleRegister(event) {

    event.preventDefault();

    clearMessages();


    const form =
        event.currentTarget;


    const fullName =
        form.fullName.value.trim();

    const email =
        form.email.value.trim();

    const phone =
        form.phone.value.trim();

    const password =
        form.password.value;

    const confirmPassword =
        form.confirmPassword.value;

    const terms =
        form.terms.checked;


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


    if (!isReasonablePhone(phone)) {

        setFieldError(
            "phone",
            "Enter a valid mobile number."
        );

        valid = false;
    }


    if (!isStrongPassword(password)) {

        setFieldError(
            "password",
            "Use at least 12 characters."
        );

        valid = false;
    }


    if (password !== confirmPassword) {

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


    setButtonLoading(
        button,
        true,
        "Creating account..."
    );


    try {

        const result =
            await apiRequest(
                "/api/auth/register",
                {
                    method: "POST",

                    body: {
                        fullName,
                        email,
                        phone,
                        password
                    }
                }
            );


        showMessage(
            "registerMessage",
            result.message ||
            "Account created successfully. Please verify your email.",
            "success"
        );


        form.reset();


        setTimeout(() => {

            window.location.href =
                "verify-email.html";

        }, 1200);


    } catch (error) {

        showMessage(
            "registerMessage",
            getFriendlyError(
                error.message
            ),
            "error"
        );


    } finally {

        setButtonLoading(
            button,
            false,
            "Create Account"
        );
    }
}


/* =========================
   LOGIN
========================= */

async function handleLogin(event) {

    event.preventDefault();

    clearMessages();


    const form =
        event.currentTarget;


    const email =
        form.email.value.trim();

    const password =
        form.password.value;


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


    setButtonLoading(
        button,
        true,
        "Signing in..."
    );


    try {

        const result =
            await apiRequest(
                "/api/auth/login",
                {
                    method: "POST",

                    body: {
                        email,
                        password
                    }
                }
            );


        /*
         * The server should set the
         * HttpOnly session cookie.
         *
         * Do NOT store session tokens
         * in localStorage.
         */


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

        showMessage(
            "loginMessage",
            getFriendlyError(
                error.message
            ),
            "error"
        );


    } finally {

        setButtonLoading(
            button,
            false,
            "Sign In"
        );
    }
}


/* =========================
   FORGOT PASSWORD
========================= */

async function handleForgotPassword(
    event
) {

    event.preventDefault();

    clearMessages();


    const form =
        event.currentTarget;


    const email =
        form.email.value.trim();


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


    setButtonLoading(
        button,
        true,
        "Sending..."
    );


    try {

        /*
         * The backend should always
         * return a generic response
         * so account existence is not
         * disclosed.
         */

        const result =
            await apiRequest(
                "/api/auth/forgot-password",
                {
                    method: "POST",

                    body: {
                        email
                    }
                }
            );


        showMessage(
            "resetMessage",
            result.message ||
            "If the account exists, a recovery email has been sent.",
            "success"
        );


    } catch (error) {

        showMessage(
            "resetMessage",
            getFriendlyError(
                error.message
            ),
            "error"
        );


    } finally {

        setButtonLoading(
            button,
            false,
            "Continue"
        );
    }
}


/* =========================
   HELPERS
========================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
}


function isReasonablePhone(phone) {

    return /^[0-9+\-\s()]{8,20}$/
        .test(phone);
}


function isStrongPassword(password) {

    if (
        password.length < 12 ||
        password.length > 128
    ) {
        return false;
    }


    return true;
}


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

            element.textContent = "";
        });


    document
        .querySelectorAll(
            ".auth-message"
        )
        .forEach(element => {

            element.textContent = "";

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


function setButtonLoading(
    button,
    loading,
    text
) {

    if (!button) {
        return;
    }


    if (loading) {

        button.disabled = true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            text;

    } else {

        button.disabled = false;

        button.textContent =
            text;
    }
}


function getFriendlyError(
    error
) {

    const messages = {

        INVALID_CREDENTIALS:
            "Email or password is incorrect.",

        EMAIL_ALREADY_EXISTS:
            "An account with this email already exists.",

        EMAIL_NOT_VERIFIED:
            "Please verify your email before signing in.",

        ACCOUNT_SUSPENDED:
            "Your account is currently suspended.",

        ACCOUNT_BLOCKED:
            "Your account is currently blocked.",

        TOO_MANY_REQUESTS:
            "Too many attempts. Please try again later.",

        INVALID_REQUEST:
            "Please check the information and try again.",

        INTERNAL_SERVER_ERROR:
            "Something went wrong. Please try again later."
    };


    return (
        messages[error] ||
        error ||
        "Something went wrong. Please try again."
    );
}
