/*

* =========================================================
* SKILLEARN HUB
* AUTHENTICATION PAGES
* =========================================================
  */

"use strict";

import {
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
sendPasswordResetEmail,
updateProfile,
setPersistence,
browserLocalPersistence,
browserSessionPersistence,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
auth,
createUserProfile
} from "../firebase/firebase-auth.js";

/* =========================================================
HELPERS
========================================================= */

function $(id) {
return document.getElementById(id);
}

function showMessage(
element,
message,
type = "error"
) {

if (!element) {
    return;
}

element.textContent =
    message;

element.className =
    `form-message ${
        type === "success"
            ? "success"
            : ""
    }`;

element.hidden = false;

}

function hideMessage(element) {

if (!element) {
    return;
}

element.hidden = true;

element.textContent = "";

}

function setLoading(
button,
loading,
loadingText
) {

if (!button) {
    return;
}


button.disabled =
    loading;


const normalText =
    button.querySelector(
        ".button-text"
    );

const loader =
    button.querySelector(
        ".button-loader"
    );


if (normalText) {
    normalText.hidden =
        loading;
}


if (loader) {

    loader.hidden =
        !loading;

    if (loadingText) {
        loader.textContent =
            loadingText;
    }

}

}

function isValidEmail(email) {

return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);

}

/* =========================================================
PASSWORD VISIBILITY
========================================================= */

document
.querySelectorAll(
".password-toggle"
)
.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const target =
                $(button.dataset.target);

            if (!target) {
                return;
            }


            const isPassword =
                target.type ===
                "password";


            target.type =
                isPassword
                    ? "text"
                    : "password";


            button.textContent =
                isPassword
                    ? "Hide"
                    : "Show";

        }
    );

});

/* =========================================================
FIREBASE ERROR MESSAGES
========================================================= */

function getAuthErrorMessage(error) {

const code =
    error?.code || "";


const messages = {

    "auth/invalid-credential":
        "The email or password is incorrect.",

    "auth/user-not-found":
        "The email or password is incorrect.",

    "auth/wrong-password":
        "The email or password is incorrect.",

    "auth/email-already-in-use":
        "An account with this email already exists.",

    "auth/invalid-email":
        "Please enter a valid email address.",

    "auth/weak-password":
        "Please choose a stronger password.",

    "auth/too-many-requests":
        "Too many attempts. Please try again later.",

    "auth/network-request-failed":
        "Network error. Please check your connection.",

    "auth/user-disabled":
        "This account has been disabled.",

    "auth/operation-not-allowed":
        "This sign-in method is not enabled in Firebase."

};


return (
    messages[code] ||
    "Something went wrong. Please try again."
);

}

/* =========================================================
PASSWORD STRENGTH
========================================================= */

const registerPassword =
$("registerPassword");

const strengthBars =
document.querySelectorAll(
"#strengthBars i"
);

const strengthText =
$("strengthText");

function passwordScore(password) {

let score = 0;


if (password.length >= 8) {
    score++;
}

if (password.length >= 12) {
    score++;
}

if (/[A-Z]/.test(password)) {
    score++;
}

if (/[0-9]/.test(password)) {
    score++;
}

if (/[^A-Za-z0-9]/.test(password)) {
    score++;
}


return Math.min(
    score,
    4
);

}

function updatePasswordStrength() {

if (!registerPassword) {
    return;
}


const score =
    passwordScore(
        registerPassword.value
    );


strengthBars.forEach(
    (bar, index) => {

        bar.style.background =
            index < score
                ? "#6758e8"
                : "#222b3b";

    }
);


const labels = [
    "Use 8+ characters",
    "Weak password",
    "Fair password",
    "Good password",
    "Strong password"
];


if (strengthText) {

    strengthText.textContent =
        labels[score];

}

}

registerPassword?.addEventListener(
"input",
updatePasswordStrength
);

/* =========================================================
LOGIN
========================================================= */

const loginForm =
$("loginForm");

loginForm?.addEventListener(
"submit",
async event => {

    event.preventDefault();


    const email =
        $("loginEmail")
            ?.value
            .trim()
            .toLowerCase();


    const password =
        $("loginPassword")
            ?.value || "";


    const message =
        $("loginMessage");


    const emailError =
        $("loginEmailError");


    const passwordError =
        $("loginPasswordError");


    emailError.textContent = "";
    passwordError.textContent = "";

    hideMessage(message);


    let valid = true;


    if (!isValidEmail(email)) {

        emailError.textContent =
            "Enter a valid email address.";

        valid = false;

    }


    if (!password) {

        passwordError.textContent =
            "Enter your password.";

        valid = false;

    }


    if (!valid) {
        return;
    }


    const submit =
        $("loginSubmit");


    setLoading(
        submit,
        true,
        "Signing in..."
    );


    try {

        const remember =
            $("rememberMe")
                ?.checked;


        await setPersistence(
            auth,
            remember
                ? browserLocalPersistence
                : browserSessionPersistence
        );


        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );


        /*
         * Redirect after successful authentication.
         */

        const params =
            new URLSearchParams(
                window.location.search
            );


        const redirect =
            params.get(
                "redirect"
            );


        /*
         * Only allow local relative paths.
         * Never redirect to arbitrary external URLs.
         */

        const safeRedirect =
            redirect &&
            redirect.startsWith("/") &&
            !redirect.startsWith("//")
                ? redirect
                : "../pages/dashboard.html";


        window.location.href =
            safeRedirect;

    } catch (error) {

        showMessage(
            message,
            getAuthErrorMessage(error)
        );

        setLoading(
            submit,
            false
        );

    }

}

);

/* =========================================================
REGISTER
========================================================= */

const registerForm =
$("registerForm");

registerForm?.addEventListener(
"submit",
async event => {

    event.preventDefault();


    const name =
        $("registerName")
            ?.value
            .trim();


    const email =
        $("registerEmail")
            ?.value
            .trim()
            .toLowerCase();


    const password =
        $("registerPassword")
            ?.value || "";


    const confirmPassword =
        $("registerConfirmPassword")
            ?.value || "";


    const accepted =
        $("acceptTerms")
            ?.checked;


    const message =
        $("registerMessage");


    const nameError =
        $("registerNameError");


    const emailError =
        $("registerEmailError");


    const passwordError =
        $("registerPasswordError");


    const confirmError =
        $("registerConfirmPasswordError");


    nameError.textContent = "";
    emailError.textContent = "";
    passwordError.textContent = "";
    confirmError.textContent = "";

    hideMessage(message);


    let valid = true;


    if (
        !name ||
        name.length < 2
    ) {

        nameError.textContent =
            "Enter your name.";

        valid = false;

    }


    if (!isValidEmail(email)) {

        emailError.textContent =
            "Enter a valid email address.";

        valid = false;

    }


    if (
        password.length < 8
    ) {

        passwordError.textContent =
            "Password must contain at least 8 characters.";

        valid = false;

    }


    if (
        password !==
        confirmPassword
    ) {

        confirmError.textContent =
            "Passwords do not match.";

        valid = false;

    }


    if (!accepted) {

        showMessage(
            message,
            "Please accept the Terms and Privacy Policy."
        );

        valid = false;

    }


    if (!valid) {
        return;
    }


    const submit =
        $("registerSubmit");


    setLoading(
        submit,
        true,
        "Creating account..."
    );


    try {

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            credential.user;


        await updateProfile(
            user,
            {
                displayName: name
            }
        );


        await createUserProfile(
            user,
            {
                displayName: name
            }
        );


        window.location.href =
            "../pages/dashboard.html";

    } catch (error) {

        showMessage(
            message,
            getAuthErrorMessage(error)
        );

        setLoading(
            submit,
            false
        );

    }

}

);

/* =========================================================
FORGOT PASSWORD
========================================================= */

const forgotForm =
$("forgotForm");

forgotForm?.addEventListener(
"submit",
async event => {

    event.preventDefault();


    const email =
        $("forgotEmail")
            ?.value
            .trim()
            .toLowerCase();


    const message =
        $("forgotMessage");


    const emailError =
        $("forgotEmailError");


    emailError.textContent = "";

    hideMessage(message);


    if (!isValidEmail(email)) {

        emailError.textContent =
            "Enter a valid email address.";

        return;

    }


    const submit =
        $("forgotSubmit");


    setLoading(
        submit,
        true,
        "Sending..."
    );


    try {

        /*
         * Firebase sends the reset email.
         *
         * We intentionally show the same success
         * response whether or not the account exists,
         * reducing account-enumeration leakage.
         */

        await sendPasswordResetEmail(
            auth,
            email
        );


        forgotForm.hidden =
            true;


        $("resetSuccess").hidden =
            false;

    } catch (error) {

        /*
         * Avoid exposing whether an email exists.
         * Network/configuration errors can still be shown.
         */

        if (
            error?.code ===
            "auth/network-request-failed"
        ) {

            showMessage(
                message,
                "Network error. Please check your connection and try again."
            );

        } else {

            forgotForm.hidden =
                true;

            $("resetSuccess").hidden =
                false;

        }


        setLoading(
            submit,
            false
        );

    }

}

);

/* =========================================================
AUTH REDIRECT

If an already-authenticated user visits login/register,
send them to the dashboard.
========================================================= */

const authPage =
document.body.classList.contains(
"auth-page"
);

if (authPage) {

onAuthStateChanged(
    auth,
    user => {

        if (!user) {
            return;
        }


        const path =
            window.location.pathname;


        const isLogin =
            path.endsWith(
                "/login.html"
            );


        const isRegister =
            path.endsWith(
                "/register.html"
            );


        /*
         * Do not interrupt the forgot-password page.
         */

        if (
            isLogin ||
            isRegister
        ) {

            window.location.href =
                "../pages/dashboard.html";

        }

    }
);

}
