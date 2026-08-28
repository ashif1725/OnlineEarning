// Firebase Authentication
// Make sure firebase-config.js is loaded before this file.

const auth = firebase.auth();


// ===============================
// LOGIN
// ===============================
async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(
            email,
            password
        );

        console.log("Login successful:", userCredential.user);

        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Login error:", error);
        showError(error.message);
    }
}


// ===============================
// GOOGLE LOGIN
// ===============================
async function googleLogin() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();

        const result = await auth.signInWithPopup(provider);

        console.log("Google login successful:", result.user);

        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Google login error:", error);
        showError(error.message);
    }
}


// ===============================
// LOGOUT
// ===============================
async function logoutUser() {
    try {
        await auth.signOut();
        window.location.href = "login.html";
    } catch (error) {
        console.error("Logout error:", error);
    }
}


// ===============================
// SHOW ERROR
// ===============================
function showError(message) {
    const errorBox = document.getElementById("errorMessage");

    if (errorBox) {
        errorBox.textContent = message;
        errorBox.style.display = "block";
    } else {
        alert(message);
    }
}


// ===============================
// LOGIN FORM
// ===============================
document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");
    const googleButton = document.getElementById("googleLogin");

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            if (!email || !password) {
                showError("Please enter your email and password.");
                return;
            }

            loginUser(email, password);
        });
    }


    if (googleButton) {
        googleButton.addEventListener("click", function () {
            googleLogin();
        });
    }
});
