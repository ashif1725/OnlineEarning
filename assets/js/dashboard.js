/* =========================================================
   SkillEarn Hub
   assets/js/dashboard.js

   STEP 5
   User Dashboard Controller
   ========================================================= */

"use strict";


document.addEventListener(
    "DOMContentLoaded",
    initDashboard
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initDashboard() {

    setupNavigation();

    setupLogout();

    setupMobileMenu();

    await loadDashboard();
}


/* =========================================================
   LOAD CURRENT USER
   ========================================================= */

async function loadDashboard() {

    const loading =
        document.getElementById(
            "dashboardLoading"
        );


    try {

        if (loading) {

            loading.hidden =
                false;
        }


        /*
         * Server-side session
         */

        const result =
            await window.apiRequest(
                "/api/auth/me",
                {
                    method:
                        "GET"
                }
            );


        const user =
            result?.user;


        if (!user) {

            throw new Error(
                "User session not found"
            );
        }


        /*
         * Save non-sensitive display data
         */

        window.setSavedUser(
            user
        );


        /*
         * Render
         */

        renderUser(
            user
        );


        updateNavigation(
            user
        );


    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );


        if (
            error.status ===
            401
        ) {

            window.clearAuthData();

            redirectToLogin();

            return;
        }


        /*
         * Temporary network failure:
         * show cached display information
         */

        const savedUser =
            window.getSavedUser();


        if (savedUser) {

            renderUser(
                savedUser
            );

            showMessage(
                "Live account data could not be refreshed."
            );

        } else {

            showMessage(
                "Unable to load your account. Please try again."
            );
        }

    } finally {

        if (loading) {

            loading.hidden =
                true;
        }
    }
}


/* =========================================================
   RENDER USER
   ========================================================= */

function renderUser(user) {

    const fullName =
        user.fullName ||
        user.full_name ||
        "User";


    const userId =
        user.publicUserId ||
        user.public_user_id ||
        "—";


    const email =
        user.email ||
        "—";


    const status =
        user.accountStatus ||
        user.account_status ||
        "—";


    const verified =
        user.emailVerified === true
            ? "Verified"
            : "Not Verified";


    setText(
        "userName",
        fullName
    );


    setText(
        "welcomeName",
        fullName
    );


    setText(
        "userId",
        userId
    );


    setText(
        "userEmail",
        email
    );


    setText(
        "accountStatus",
        status
    );


    setText(
        "emailStatus",
        verified
    );


    /*
     * Optional email verification badge
     */

    const badge =
        document.getElementById(
            "emailStatus"
        );


    if (badge) {

        badge.classList.toggle(
            "verified",
            user.emailVerified === true
        );

        badge.classList.toggle(
            "not-verified",
            user.emailVerified !== true
        );
    }
}


/* =========================================================
   SAFE TEXT
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.textContent =
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
            ? value
            : "—";
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(
            "[data-dashboard-link]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    function () {

                        const url =
                            this.getAttribute(
                                "data-dashboard-link"
                            );


                        if (url) {

                            window.location.href =
                                url;
                        }
                    }
                );
            }
        );
}


/* =========================================================
   UPDATE NAVIGATION
   ========================================================= */

function updateNavigation(user) {

    const role =
        String(
            user?.role || "user"
        )
            .toLowerCase();


    document
        .querySelectorAll(
            "[data-admin-only]"
        )
        .forEach(
            element => {

                element.hidden =
                    role !== "admin";
            }
        );
}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

    document
        .querySelectorAll(
            "[data-action='logout']"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    handleLogout
                );
            }
        );
}


async function handleLogout(
    event
) {

    event.preventDefault();


    const buttons =
        document.querySelectorAll(
            "[data-action='logout']"
        );


    buttons.forEach(
        button => {

            button.disabled =
                true;

            button.textContent =
                "Logging out...";
        }
    );


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

        window.location.href =
            "../login.html";
    }
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function setupMobileMenu() {

    const button =
        document.getElementById(
            "mobileMenuButton"
        );


    const menu =
        document.getElementById(
            "dashboardNav"
        );


    if (!button || !menu) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            const open =
                menu.classList.toggle(
                    "open"
                );


            button.setAttribute(
                "aria-expanded",
                String(open)
            );
        }
    );


    menu
        .querySelectorAll("a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        menu.classList.remove(
                            "open"
                        );

                        button.setAttribute(
                            "aria-expanded",
                            "false"
                        );
                    }
                );
            }
        );
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    message
) {

    let element =
        document.getElementById(
            "dashboardMessage"
        );


    if (!element) {

        element =
            document.createElement(
                "div"
            );

        element.id =
            "dashboardMessage";

        element.className =
            "dashboard-message";


        document
            .querySelector(
                "main"
            )
            ?.prepend(
                element
            );
    }


    if (element) {

        element.textContent =
            message;

        element.classList.add(
            "show"
        );
    }
}


/* =========================================================
   LOGIN REDIRECT
   ========================================================= */

function redirectToLogin() {

    window.location.href =
        "../login.html";
}
