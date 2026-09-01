"use strict";

/*
|--------------------------------------------------------------------------
| SkillEarn Hub - User Dashboard
|--------------------------------------------------------------------------
*/

document.addEventListener("DOMContentLoaded", initDashboard);


/*
|--------------------------------------------------------------------------
| INITIALIZE
|--------------------------------------------------------------------------
*/

async function initDashboard() {

    setupLogout();

    // Show saved user immediately if available
    const savedUser =
        typeof window.getSavedUser === "function"
            ? window.getSavedUser()
            : null;

    if (savedUser) {
        renderUser(savedUser);
    }

    // Then load fresh data from Render API
    await loadDashboard();
}


/*
|--------------------------------------------------------------------------
| LOAD DASHBOARD
|--------------------------------------------------------------------------
*/

async function loadDashboard() {

    try {

        const token =
            typeof window.getAuthToken === "function"
                ? window.getAuthToken()
                : null;


        /*
        |--------------------------------------------------------------------------
        | If there is no token, use saved user only
        |--------------------------------------------------------------------------
        */

        if (!token) {

            const savedUser =
                typeof window.getSavedUser === "function"
                    ? window.getSavedUser()
                    : null;

            if (savedUser) {
                renderUser(savedUser);
                return;
            }

            redirectToLogin();
            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Build Render API URL
        |--------------------------------------------------------------------------
        */

        const url =
            typeof window.apiUrl === "function"
                ? window.apiUrl("/api/auth/me")
                : "https://skillearnhub-1.onrender.com/api/auth/me";


        /*
        |--------------------------------------------------------------------------
        | API REQUEST
        |--------------------------------------------------------------------------
        */

        const response =
            await fetch(url, {

                method: "GET",

                headers:
                    typeof window.getApiHeaders === "function"
                        ? window.getApiHeaders()
                        : {
                            "Accept":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                credentials: "include"

            });


        /*
        |--------------------------------------------------------------------------
        | Unauthorized
        |--------------------------------------------------------------------------
        */

        if (response.status === 401) {

            if (
                typeof window.clearAuthData ===
                "function"
            ) {
                window.clearAuthData();
            }

            redirectToLogin();

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Server Error
        |--------------------------------------------------------------------------
        */

        if (!response.ok) {

            throw new Error(
                `Dashboard API failed: ${response.status}`
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Parse JSON
        |--------------------------------------------------------------------------
        */

        const data =
            await response.json();


        /*
        |--------------------------------------------------------------------------
        | Get User
        |--------------------------------------------------------------------------
        */

        const user =
            data.user ||
            data.data?.user ||
            data;


        if (!user) {

            throw new Error(
                "User data not found"
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Save User
        |--------------------------------------------------------------------------
        */

        if (
            typeof window.setSavedUser ===
            "function"
        ) {
            window.setSavedUser(user);
        }


        /*
        |--------------------------------------------------------------------------
        | Render User
        |--------------------------------------------------------------------------
        */

        renderUser(user);


    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );


        /*
        |--------------------------------------------------------------------------
        | Use cached user if API temporarily fails
        |--------------------------------------------------------------------------
        */

        const savedUser =
            typeof window.getSavedUser === "function"
                ? window.getSavedUser()
                : null;


        if (savedUser) {

            renderUser(savedUser);

            showDashboardMessage(
                "Unable to refresh live data. Showing saved account information."
            );

            return;
        }


        showDashboardMessage(
            "Unable to load your account. Please try again."
        );
    }
}


/*
|--------------------------------------------------------------------------
| RENDER USER
|--------------------------------------------------------------------------
*/

function renderUser(user) {

    /*
    |--------------------------------------------------------------------------
    | Support both backend naming styles
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | Email verification
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | Update dashboard
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
        emailVerified
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
            ? value
            : "—";
}


/*
|--------------------------------------------------------------------------
| LOGOUT
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
| LOGOUT USER
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


        const token =
            typeof window.getAuthToken === "function"
                ? window.getAuthToken()
                : null;


        const url =
            typeof window.apiUrl === "function"
                ? window.apiUrl("/api/auth/logout")
                : "https://skillearnhub-1.onrender.com/api/auth/logout";


        await fetch(url, {

            method: "POST",

            headers:
                token
                    ? {
                        "Accept":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    }
                    : {
                        "Accept":
                            "application/json"
                    },

            credentials: "include"

        });


    } catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );


    } finally {

        /*
        |--------------------------------------------------------------------------
        | Always clear local authentication
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | Redirect
        |--------------------------------------------------------------------------
        */

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
