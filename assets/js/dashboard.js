"use strict";


document.addEventListener(
    "DOMContentLoaded",
    initDashboard
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initDashboard() {

    setupLogout();

    await loadDashboard();

}


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        const url =
            typeof window.apiUrl === "function"
                ? window.apiUrl("/api/auth/me")
                : "https://skillearnhub-1.onrender.com/api/auth/me";


        const response =
            await fetch(
                url,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    credentials:
                        "include"
                }
            );


        if (response.status === 401) {

            redirectToLogin();

            return;
        }


        if (!response.ok) {

            throw new Error(
                "Dashboard request failed"
            );
        }


        const data =
            await response.json();


        if (
            !data ||
            !data.user
        ) {

            throw new Error(
                "User information unavailable"
            );
        }


        const user =
            data.user;


        if (
            typeof window.setSavedUser ===
            "function"
        ) {

            window.setSavedUser(user);
        }


        renderUser(user);


    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );


        const savedUser =
            typeof window.getSavedUser ===
            "function"
                ? window.getSavedUser()
                : null;


        if (savedUser) {

            renderUser(savedUser);

            showDashboardMessage(
                "Live account data could not be refreshed."
            );

            return;
        }


        redirectToLogin();
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


    const publicUserId =
        user.publicUserId ||
        user.public_user_id ||
        "—";


    const email =
        user.email ||
        "—";


    const accountStatus =
        user.accountStatus ||
        user.account_status ||
        "—";


    let emailVerified =
        user.emailVerified ??
        user.email_verified;


    if (emailVerified === true) {

        emailVerified =
            "Verified";

    } else if (emailVerified === false) {

        emailVerified =
            "Not Verified";

    } else {

        emailVerified =
            "—";
    }


    setText(
        "userName",
        fullName
    );


    setText(
        "userId",
        publicUserId
    );


    setText(
        "userEmail",
        email
    );


    setText(
        "accountStatus",
        accountStatus
    );


    setText(
        "emailStatus",
        emailVerified
    );
}


/* =========================================================
   SAFE TEXT
========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);


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
   LOGOUT
========================================================= */

function setupLogout() {

    const button =
        document.getElementById(
            "logoutButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        logoutUser
    );
}


/* =========================================================
   LOGOUT USER
========================================================= */

async function logoutUser() {

    const button =
        document.getElementById(
            "logoutButton"
        );


    try {

        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Logging out...";
        }


        const url =
            typeof window.apiUrl === "function"
                ? window.apiUrl("/api/auth/logout")
                : "https://skillearnhub-1.onrender.com/api/auth/logout";


        await fetch(
            url,
            {
                method: "POST",

                headers: {
                    "Accept":
                        "application/json"
                },

                credentials:
                    "include"
            }
        );


    } catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );


    } finally {

        if (
            typeof window.clearAuthData ===
            "function"
        ) {

            window.clearAuthData();

        } else {

            localStorage.removeItem(
                "skillearn_access_token"
            );

            localStorage.removeItem(
                "skillearn_user"
            );
        }


        try {

            sessionStorage.removeItem(
                "skillEarnUser"
            );

        } catch (error) {
            console.warn(error);
        }


        redirectToLogin();
    }
}


/* =========================================================
   REDIRECT
========================================================= */

function redirectToLogin() {

    window.location.href =
        "../login.html";
}


/* =========================================================
   MESSAGE
========================================================= */

function showDashboardMessage(message) {

    const element =
        document.getElementById(
            "dashboardMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.style.display =
        "block";
}
