const auth = firebase.auth();

function showMessage(message, type = "error") {
    const box = document.getElementById("authMessage");

    if (!box) {
        alert(message);
        return;
    }

    box.textContent = message;
    box.className = "auth-message " + type;
}


// ==========================
// LOGIN
// ==========================

document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", async function (e) {

            e.preventDefault();

            const email =
                document.getElementById("loginEmail").value.trim();

            const password =
                document.getElementById("loginPassword").value;

            if (!email || !password) {
                showMessage("Please enter email and password.");
                return;
            }

            try {

                showMessage("Logging in...", "success");

                await auth.signInWithEmailAndPassword(
                    email,
                    password
                );

                window.location.href = "dashboard.html";

            } catch (error) {

                console.error(error);

                showMessage(getFirebaseError(error));
            }
        });
    }


    // ==========================
    // REGISTER
    // ==========================

    const registerForm =
        document.getElementById("registerForm");

    if (registerForm) {

        registerForm.addEventListener("submit", async function (e) {

            e.preventDefault();

            const name =
                document.getElementById("registerName").value.trim();

            const email =
                document.getElementById("registerEmail").value.trim();

            const password =
                document.getElementById("registerPassword").value;

            const confirmPassword =
                document.getElementById(
                    "registerConfirmPassword"
                ).value;


            if (password !== confirmPassword) {
                showMessage("Passwords do not match.");
                return;
            }

            if (password.length < 6) {
                showMessage(
                    "Password must be at least 6 characters."
                );
                return;
            }


            try {

                showMessage(
                    "Creating your account...",
                    "success"
                );

                const result =
                    await auth.createUserWithEmailAndPassword(
                        email,
                        password
                    );

                const user = result.user;


                await user.updateProfile({
                    displayName: name
                });


                // Save user in Firestore
                await db.collection("users")
                    .doc(user.uid)
                    .set({

                        name: name,
                        email: email,
                        uid: user.uid,

                        createdAt:
                            firebase.firestore.FieldValue
                                .serverTimestamp(),

                        role: "user",
                        earnings: 0,
                        coursesCompleted: 0

                    });


                await user.sendEmailVerification();


                showMessage(
                    "Account created successfully!",
                    "success"
                );


                setTimeout(function () {

                    window.location.href =
                        "dashboard.html";

                }, 1500);


            } catch (error) {

                console.error(error);

                showMessage(
                    getFirebaseError(error)
                );
            }
        });
    }

});


// ==========================
// GOOGLE LOGIN
// ==========================

async function googleLogin() {

    try {

        showMessage(
            "Connecting to Google...",
            "success"
        );

        const provider =
            new firebase.auth.GoogleAuthProvider();

        const result =
            await auth.signInWithPopup(provider);

        const user = result.user;

        const userRef =
            db.collection("users").doc(user.uid);

        const userDoc =
            await userRef.get();


        if (!userDoc.exists) {

            await userRef.set({

                name: user.displayName || "",
                email: user.email || "",
                uid: user.uid,
                photoURL: user.photoURL || "",

                createdAt:
                    firebase.firestore.FieldValue
                        .serverTimestamp(),

                role: "user",
                earnings: 0,
                coursesCompleted: 0
            });
        }


        window.location.href =
            "dashboard.html";


    } catch (error) {

        console.error(error);

        showMessage(
            getFirebaseError(error)
        );
    }
}


// ==========================
// FORGOT PASSWORD
// ==========================

async function forgotPassword() {

    const email = prompt(
        "Enter your registered email address:"
    );

    if (!email) return;

    try {

        await auth.sendPasswordResetEmail(
            email.trim()
        );

        alert(
            "Password reset email has been sent."
        );

    } catch (error) {

        alert(
            getFirebaseError(error)
        );
    }
}


// ==========================
// LOGOUT
// ==========================

async function logoutUser() {

    try {

        await auth.signOut();

        window.location.href =
            "login.html";

    } catch (error) {

        console.error(error);
    }
}


// ==========================
// FIREBASE ERRORS
// ==========================

function getFirebaseError(error) {

    switch (error.code) {

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/weak-password":
            return "Password must be at least 6 characters.";

        case "auth/user-not-found":
            return "No account found with this email.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/invalid-credential":
            return "Email or password is incorrect.";

        case "auth/popup-closed-by-user":
            return "Google login was cancelled.";

        case "auth/popup-blocked":
            return "Please allow popups for Google login.";

        case "auth/network-request-failed":
            return "Network error. Check your internet.";

        default:
            return error.message ||
                "Something went wrong. Please try again.";
    }
}
