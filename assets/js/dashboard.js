"use strict";

/*
|--------------------------------------------------------------------------
| SkillEarn Hub - User Dashboard
| Cookie-based Session Authentication
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    initDashboard
);


/*
|--------------------------------------------------------------------------
| INITIALIZE
|--------------------------------------------------------------------------
*/

async function initDashboard() {

    setupLogout();

    await loadDashboard();
}


/*
|--------------------------------------------------------------------------
| LOAD DASHBOARD
|--------------------------------------------------------------------------
*/

async function loadDashboard() {

    try {

        /*
        |--------------------------------------------------------------------------
        | Build API URL
        |--------------------------------------------------------------------------
        */

        const url =
            typeof window.apiUrl === "function"
                ? window.apiUrl("/api/auth/me")
                : "https://skillearnhub-1.onrender.com/api/auth/me";


        /*
        |--------------------------------------------------------------------------
        | Request using HTTP-only session cookie
        |--------------------------------------------------------------------------
        */

        const response =
            await fetch(url, {

                method: "GET",

                headers: {
                    "Accept":
                        "application/json"
                },

                credentials:
                    "include"

            });


        /*
        |--------------------------------------------------------------------------
        | Authentication failed
        |--------------------------------------------------------------------------
        */

        if (response.status === 401) {

            redirectToLogin();

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Account disabled
        |--------------------------------------------------------------------------
        */

        if (response.status === 403) {

            showDashboardMessage(
                "Your account is currently unavailable."
            );

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Other server errors
        |--------------------------------------------------------------------------
        */

        if (!response.ok) {

            throw new Error(
                `Dashboard API failed: ${response.status}`
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Parse response
        |--------------------------------------------------------------------------
        */

        const data =
            await response.json();


        if (
            !data ||
            !data.user
        ) {

            throw new Error(
                "User data not found"
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Render user
        |--------------------------------------------------------------------------
        */

        renderUser(
            data.user
        );


    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );


        showDashboardMessage(
            "Unable to load your account. Please refresh the page and try again."
        );
    }
}


/*
|--------------------------------------------------------------------------
| RENDER USER
|--------------------------------------------------------------------------
*/

function renderUser(user) {

    const fullName =
        user.fullName ||
        user.full_name ||
        user.name ||
        "User";


    const publicUserId =
        user.publicUserId ||
        user.public_user_id ||
        user.userId ||
        "—";


    const email =
        user.email ||
        "—";


    const accountStatus =
        user.accountStatus ||
        user.account_status ||
        "—";


    let emailVerified =
        user.emailVerified;


    if (
        emailVerified === undefined
    ) {

        emailVerified =
            user.email_verified;
    }


    let emailStatus;


    if (
        emailVerified === true
    ) {

        emailStatus =
            "Verified";

    } else if (
        emailVerified === false
    ) {

        emailStatus =
            "Not Verified";

    } else {

        emailStatus =
            "—";
    }


    /*
    |--------------------------------------------------------------------------
    | Update UI
    |--------------------------------------------------------------------------
    */

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
        emailStatus
    );
}


/*
|--------------------------------------------------------------------------
| SAFE TEXT SETTER
|--------------------------------------------------------------------------
*/

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
            ? String(value)
            : "—";
}


/*
|--------------------------------------------------------------------------
| LOGOUT BUTTON
|--------------------------------------------------------------------------
*/

function setupLogout() {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        logoutUser
    );
}


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

async function logoutUser() {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    try {

        if (logoutButton) {

            logoutButton.disabled =
                true;

            logoutButton.textContent =
                "Logging out...";
        }


        const url =
            typeof window.apiUrl === "function"
                ? window.apiUrl("/api/auth/logout")
                : "https://skillearnhub-1.onrender.com/api/auth/logout";


        await fetch(url, {

            method: "POST",

            headers: {

                "Accept":
                    "application/json"
            },

            credentials:
                "include"

        });


    } catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );


    } finally {

        redirectToLogin();
    }
}


/*
|--------------------------------------------------------------------------
| REDIRECT TO LOGIN
|--------------------------------------------------------------------------
*/

function redirectToLogin() {

    window.location.href =
        "../login.html";
}


/*
|--------------------------------------------------------------------------
| DASHBOARD MESSAGE
|--------------------------------------------------------------------------
*/

function showDashboardMessage(message) {

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

        element.style.marginTop =
            "20px";

        element.style.padding =
            "12px";

        element.style.borderRadius =
            "10px";

        element.style.fontSize =
            "14px";


        const dashboard =
            document.querySelector(
                "main"
            ) ||
            document.body;


        dashboard.appendChild(
            element
        );
    }


    element.textContent =
        message;
}
