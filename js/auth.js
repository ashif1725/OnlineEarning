/*

* =========================================================
* SKILLEARN HUB
* AUTHENTICATION UI
* 
* IMPORTANT:
* This file only handles frontend validation and UI.
* It does NOT store passwords or create real accounts.
* 
* Real authentication should be connected to a secure
* authentication provider/backend in a later step.
* =========================================================
  */

"use strict";

/* =========================================================
HELPERS
========================================================= */

function getElement(id) {
return document.getElementById(id);
}

function showAlert(element, message, type = "error") {
if (!element) return;

element.textContent = message;
element.className = "auth-alert show";

if (type === "success") {
    element.classList.add("success");
}

}

function clearAlert(element) {
if (!element) return;

element.textContent = "";
element.className = "auth-alert";

}

function isValidEmail(email) {
return /^[^\s@]+@[^\s@]+.[^\s@]+$/.test(email);
}

function setButtonLoading(button, loading) {
if (!button) return;

if (loading) {
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
        <span class="button-spinner"></span>
        <span>Please wait...</span>
    `;
} else {
    button.disabled = false;

    if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
    }
}

}

/* =========================================================
PASSWORD VISIBILITY
========================================================= */

document.querySelectorAll(".password-toggle").forEach(button => {

button.addEventListener("click", () => {

    const targetId = button.dataset.target;
    const input = getElement(targetId);

    if (!input) return;

    const isPassword = input.type === "password";

    input.type = isPassword ? "text" : "password";

    button.textContent = isPassword ? "Hide" : "Show";

    button.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
    );
});

});

/* =========================================================
LOGIN
========================================================= */

const loginForm = getElement("loginForm");

if (loginForm) {

const loginAlert = getElement("loginAlert");
const emailInput = getElement("loginEmail");
const passwordInput = getElement("loginPassword");

loginForm.addEventListener("submit", event => {

    event.preventDefault();

    clearAlert(loginAlert);

    emailInput.classList.remove("input-error");
    passwordInput.classList.remove("input-error");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {

        emailInput.classList.add("input-error");

        showAlert(
            loginAlert,
            "Please enter your email address."
        );

        emailInput.focus();
        return;
    }

    if (!isValidEmail(email)) {

        emailInput.classList.add("input-error");

        showAlert(
            loginAlert,
            "Please enter a valid email address."
        );

        emailInput.focus();
        return;
    }

    if (!password) {

        passwordInput.classList.add("input-error");

        showAlert(
            loginAlert,
            "Please enter your password."
        );

        passwordInput.focus();
        return;
    }

    if (password.length < 8) {

        passwordInput.classList.add("input-error");

        showAlert(
            loginAlert,
            "Password must contain at least 8 characters."
        );

        passwordInput.focus();
        return;
    }

    /*
     * Real authentication will be connected here later.
     *
     * Example future flow:
     *
     * 1. Send credentials securely to authentication service.
     * 2. Server/provider validates credentials.
     * 3. Receive authenticated session/token.
     * 4. Redirect to dashboard.
     *
     * Never store raw passwords in localStorage.
     */

    showAlert(
        loginAlert,
        "Login UI is ready. Real authentication will be connected in the backend step.",
        "success"
    );

});

}

/* =========================================================
REGISTER
========================================================= */

const registerForm = getElement("registerForm");

if (registerForm) {

const registerAlert = getElement("registerAlert");

const firstName = getElement("firstName");
const lastName = getElement("lastName");
const email = getElement("registerEmail");
const password = getElement("registerPassword");
const confirmPassword = getElement("confirmPassword");
const terms = getElement("acceptTerms");

const strengthText = getElement("passwordStrengthText");
const strengthBars = document.querySelectorAll(".strength-bars span");


function updatePasswordStrength(value) {

    if (!strengthText || !strengthBars.length) return;

    let score = 0;

    if (value.length >= 8) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    strengthBars.forEach(bar => {
        bar.removeAttribute("data-strength");
    });

    if (!value) {

        strengthText.textContent =
            "Use 8+ characters with a mix of letters and numbers.";

        return;
    }

    if (score <= 2) {

        strengthText.textContent = "Password strength: Weak";

        strengthBars.forEach((bar, index) => {
            if (index === 0) {
                bar.dataset.strength = "weak";
            }
        });

    } else if (score <= 3) {

        strengthText.textContent = "Password strength: Fair";

        strengthBars.forEach((bar, index) => {
            if (index < 2) {
                bar.dataset.strength = "fair";
            }
        });

    } else if (score <= 4) {

        strengthText.textContent = "Password strength: Good";

        strengthBars.forEach((bar, index) => {
            if (index < 3) {
                bar.dataset.strength = "good";
            }
        });

    } else {

        strengthText.textContent = "Password strength: Strong";

        strengthBars.forEach(bar => {
            bar.dataset.strength = "strong";
        });
    }
}


password.addEventListener("input", () => {
    updatePasswordStrength(password.value);
});


registerForm.addEventListener("submit", event => {

    event.preventDefault();

    clearAlert(registerAlert);

    const inputs = [
        firstName,
        lastName,
        email,
        password,
        confirmPassword
    ];

    inputs.forEach(input => {
        input.classList.remove("input-error");
    });


    if (!firstName.value.trim()) {

        firstName.classList.add("input-error");

        showAlert(
            registerAlert,
            "Please enter your first name."
        );

        firstName.focus();
        return;
    }


    if (!lastName.value.trim()) {

        lastName.classList.add("input-error");

        showAlert(
            registerAlert,
            "Please enter your last name."
        );

        lastName.focus();
        return;
    }


    if (!email.value.trim()) {

        email.classList.add("input-error");

        showAlert(
            registerAlert,
            "Please enter your email address."
        );

        email.focus();
        return;
    }


    if (!isValidEmail(email.value.trim())) {

        email.classList.add("input-error");

        showAlert(
            registerAlert,
            "Please enter a valid email address."
        );

        email.focus();
        return;
    }


    if (password.value.length < 8) {

        password.classList.add("input-error");

        showAlert(
            registerAlert,
            "Password must contain at least 8 characters."
        );

        password.focus();
        return;
    }


    if (password.value !== confirmPassword.value) {

        confirmPassword.classList.add("input-error");

        showAlert(
            registerAlert,
            "Passwords do not match."
        );

        confirmPassword.focus();
        return;
    }


    if (!terms.checked) {

        showAlert(
            registerAlert,
            "Please accept the Terms of Service and Privacy Policy."
        );

        terms.focus();
        return;
    }


    /*
     * SECURITY:
     * No password is stored here.
     *
     * Real account creation will be connected to a secure
     * authentication service/backend later.
     */

    showAlert(
        registerAlert,
        "Registration UI is ready. Secure account creation will be connected in the backend step.",
        "success"
    );

});

}

/* =========================================================
FORGOT PASSWORD
========================================================= */

const forgotForm = getElement("forgotForm");

if (forgotForm) {

const forgotAlert = getElement("forgotAlert");
const emailInput = getElement("forgotEmail");

forgotForm.addEventListener("submit", event => {

    event.preventDefault();

    clearAlert(forgotAlert);

    emailInput.classList.remove("input-error");

    const email = emailInput.value.trim();

    if (!email) {

        emailInput.classList.add("input-error");

        showAlert(
            forgotAlert,
            "Please enter your email address."
        );

        emailInput.focus();
        return;
    }


    if (!isValidEmail(email)) {

        emailInput.classList.add("input-error");

        showAlert(
            forgotAlert,
            "Please enter a valid email address."
        );

        emailInput.focus();
        return;
    }


    /*
     * Real password reset will be implemented through the
     * authentication provider/backend.
     *
     * Do not expose whether an email exists in a production
     * password-reset endpoint unless the backend is designed
     * to handle account-enumeration risks appropriately.
     */

    showAlert(
        forgotAlert,
        "Password reset UI is ready. The secure reset service will be connected later.",
        "success"
    );

});

}

/* =========================================================
PASSWORD STRENGTH BAR STYLING
========================================================= */

const strengthStyle = document.createElement("style");

strengthStyle.textContent = `
.strength-bars span[data-strength="weak"] {
background: #e36b6b;
}

.strength-bars span[data-strength="fair"] {
    background: #d5a64f;
}

.strength-bars span[data-strength="good"] {
    background: #6f9cff;
}

.strength-bars span[data-strength="strong"] {
    background: #4fdaa0;
}

.button-spinner {
    width: 15px;
    height: 15px;
    border: 2px solid rgba(255,255,255,.25);
    border-top-color: white;
    border-radius: 50%;
    animation: authSpin .7s linear infinite;
}

@keyframes authSpin {
    to {
        transform: rotate(360deg);
    }
}

`;

document.head.appendChild(strengthStyle);
