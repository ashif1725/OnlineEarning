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


function handleRegister(event) {

    event.preventDefault();

    clearMessages();

    const form = event.currentTarget;

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
            "Password does not meet the security requirements."
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


    /*
     * IMPORTANT:
     *
     * Registration will be sent to the real backend
     * in the next integration stage.
     *
     * No fake user account is created here.
     */

    showMessage(
        "registerMessage",
        "Account creation is ready for secure backend integration.",
        "success"
    );
}


function handleLogin(event) {

    event.preventDefault();

    clearMessages();

    const form = event.currentTarget;

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


    /*
     * No client-side authentication.
     *
     * Real authentication will be performed
     * by the backend/authentication provider.
     */

    showMessage(
        "loginMessage",
        "Login is ready for secure authentication integration.",
        "success"
    );
}


function handleForgotPassword(event) {

    event.preventDefault();

    clearMessages();

    const form = event.currentTarget;

    const email =
        form.email.value.trim();


    if (!isValidEmail(email)) {

        setFieldError(
            "resetEmail",
            "Enter a valid email address."
        );

        return;
    }


    /*
     * Password recovery will use the
     * real authentication service.
     */

    showMessage(
        "resetMessage",
        "Password recovery is ready for secure backend integration.",
        "success"
    );
}


function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
}


function isReasonablePhone(phone) {

    return /^[0-9+\-\s()]{8,20}$/
        .test(phone);
}


function isStrongPassword(password) {

    if (password.length < 12) {
        return false;
    }

    if (password.length > 128) {
        return false;
    }

    return true;
}


function setFieldError(fieldName, message) {

    const element =
        document.querySelector(
            `[data-error-for="${fieldName}"]`
        );

    if (element) {
        element.textContent = message;
    }
}


function clearMessages() {

    document
        .querySelectorAll(".field-error")
        .forEach(element => {
            element.textContent = "";
        });


    document
        .querySelectorAll(".auth-message")
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
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className =
        `auth-message show ${type}`;
}
