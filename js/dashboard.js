/* =========================================================
   SKILLEARN HUB
   DASHBOARD JAVASCRIPT
========================================================= */

"use strict";


/* =========================================================
   ELEMENTS
========================================================= */

const sidebar =
    document.getElementById("dashboardSidebar");

const sidebarToggle =
    document.getElementById("sidebarToggle");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const logoutButton =
    document.getElementById("logoutButton");

const userName =
    document.getElementById("userName");

const userEmail =
    document.getElementById("userEmail");

const userAvatar =
    document.getElementById("userAvatar");

const welcomeName =
    document.getElementById("welcomeName");

const accountStatus =
    document.getElementById("accountStatus");

const currentDate =
    document.getElementById("currentDate");


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function closeSidebar() {

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    if (sidebarOverlay) {
        sidebarOverlay.classList.remove("open");
    }

}


if (sidebarToggle) {

    sidebarToggle.addEventListener(
        "click",
        function () {

            if (sidebar) {
                sidebar.classList.toggle("open");
            }

            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle("open");
            }

        }
    );

}


if (sidebarOverlay) {

    sidebarOverlay.addEventListener(
        "click",
        closeSidebar
    );

}


/* =========================================================
   DATE
========================================================= */

if (currentDate) {

    const today =
        new Date();

    currentDate.textContent =
        today.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

}


/* =========================================================
   FIREBASE AUTH
========================================================= */

if (
    typeof firebase === "undefined" ||
    !firebase.auth
) {

    console.error(
        "Firebase Authentication is not loaded."
    );

} else {

    firebase
        .auth()
        .onAuthStateChanged(
            function (user) {

                /*
                 * No authenticated user:
                 * send back to login.
                 */

                if (!user) {

                    window.location.replace(
                        "./pages/login.html"
                    );

                    return;

                }


                /* =========================================
                   USER NAME
                ========================================== */

                const name =
                    user.displayName ||
                    (
                        user.email
                            ? user.email.split("@")[0]
                            : "User"
                    );


                /* =========================================
                   USER EMAIL
                ========================================== */

                const email =
                    user.email ||
                    "No email";


                /* =========================================
                   UPDATE UI
                ========================================== */

                if (userName) {
                    userName.textContent = name;
                }


                if (welcomeName) {
                    welcomeName.textContent = name;
                }


                if (userEmail) {
                    userEmail.textContent = email;
                }


                if (userAvatar) {

                    userAvatar.textContent =
                        name
                            .charAt(0)
                            .toUpperCase();

                }


                if (accountStatus) {

                    accountStatus.textContent =
                        user.emailVerified
                            ? "Verified"
                            : "Active";

                }

            }
        );

}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            logoutButton.disabled = true;

            logoutButton.textContent =
                "Signing out...";


            try {

                await firebase
                    .auth()
                    .signOut();


                window.location.replace(
                    "./pages/login.html"
                );


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                logoutButton.disabled = false;

                logoutButton.textContent =
                    "Sign Out";


                alert(
                    "Unable to sign out. Please try again."
                );

            }

        }
    );

}


/* =========================================================
   CLOSE MOBILE MENU AFTER NAVIGATION
========================================================= */

document
    .querySelectorAll(".sidebar-link")
    .forEach(
        function (link) {

            link.addEventListener(
                "click",
                closeSidebar
            );

        }
    );


console.log(
    "SkillEarn Hub Dashboard initialized."
);
