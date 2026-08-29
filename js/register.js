// =========================================
// SkillEarn Hub
// Register Authentication
// =========================================

import {
    auth,
    db
} from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const registerForm = document.getElementById("registerForm");
const registerButton = document.getElementById("registerButton");
const registerButtonText = document.getElementById("registerButtonText");
const registerMessage = document.getElementById("registerMessage");

const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const termsInput = document.getElementById("terms");


function showMessage(message, type = "error") {
    registerMessage.textContent = message;
    registerMessage.className = `auth-message show ${type}`;
}


function clearMessage() {
    registerMessage.textContent = "";
    registerMessage.className = "auth-message";
}


function setLoading(isLoading) {
    registerButton.disabled = isLoading;

    if (isLoading) {
        registerButton.classList.add("loading");
        registerButtonText.textContent = "Creating Account...";
    } else {
        registerButton.classList.remove("loading");
        registerButtonText.textContent = "Create Account";
    }
}


function validateForm() {
    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!fullName) {
        return "Please enter your full name.";
    }

    if (fullName.length < 2) {
        return "Please enter a valid full name.";
    }

    if (!email) {
        return "Please enter your email address.";
    }

    if (!password) {
        return "Please create a password.";
    }

    if (password.length < 6) {
        return "Password must contain at least 6 characters.";
    }

    if (password !== confirmPassword) {
        return "Passwords do not match.";
    }

    if (!termsInput.checked) {
        return "Please accept the Terms & Conditions.";
    }

    return null;
}


function getFirebaseErrorMessage(error) {

    switch (error.code) {

        case "auth/email-already-in-use":
            return "An account already exists with this email address.";

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/weak-password":
            return "Please choose a stronger password.";

        case "auth/operation-not-allowed":
            return "Email/password registration is not enabled in Firebase.";

        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        default:
            console.error("Firebase registration error:", error);
            return "Registration failed. Please try again.";
    }
}


registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    clearMessage();

    const validationError = validateForm();

    if (validationError) {
        showMessage(validationError, "error");
        return;
    }

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    setLoading(true);

    try {

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;

        await updateProfile(user, {
            displayName: fullName
        });

        /*
         * Create a basic user profile.
         *
         * IMPORTANT:
         * Do not trust client-side wallet values.
         * Wallet/deposit/withdrawal authorization should
         * ultimately be protected with Firebase Security Rules
         * and/or trusted server-side code.
         */

        await setDoc(
            doc(db, "users", user.uid),
            {
                uid: user.uid,
                fullName: fullName,
                email: email,
                role: "user",
                walletBalance: 0,
                walletFrozen: false,
                createdAt: serverTimestamp()
            },
            {
                merge: true
            }
        );

        showMessage(
            "Account created successfully. Redirecting to login...",
            "success"
        );

        registerForm.reset();

        setTimeout(() => {
            window.location.href = "./login.html";
        }, 1200);

    } catch (error) {

        showMessage(
            getFirebaseErrorMessage(error),
            "error"
        );

    } finally {

        setLoading(false);
    }
});


document.querySelectorAll(".password-toggle").forEach((button) => {

    button.addEventListener("click", () => {

        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);

        if (!input) return;

        if (input.type === "password") {
            input.type = "text";
            button.textContent = "Hide";
            button.setAttribute("aria-label", "Hide password");
        } else {
            input.type = "password";
            button.textContent = "Show";
            button.setAttribute("aria-label", "Show password");
        }
    });

});
