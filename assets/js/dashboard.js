"use strict";


/*
|--------------------------------------------------------------------------
| SkillEarn Hub
| User Dashboard
|--------------------------------------------------------------------------
*/


document.addEventListener(
    "DOMContentLoaded",
    initDashboard
);


/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

const DASHBOARD_API =
    (
        typeof window.apiUrl ===
        "function"
    )
        ? window.apiUrl
        : endpoint =>
            "https://skillearnhub-1.onrender.com" +
            endpoint;


/*
|--------------------------------------------------------------------------
| INITIALIZE
|--------------------------------------------------------------------------
*/

async function initDashboard() {

    setupLogout();

    setupQuickAccess();

    showLoadingState();

    await loadDashboard();
}


/*
|--------------------------------------------------------------------------
| LOAD DASHBOARD
|--------------------------------------------------------------------------
*/

async function loadDashboard() {

    try {

        const response =
            await fetch(

                DASHBOARD_API(
                    "/api/auth/me"
                ),

                {

                    method:
                        "GET",

                    credentials:
                        "include",

                    headers:
                        typeof window.getApiHeaders ===
                        "function"

                            ? window.getApiHeaders()

                            : {
                                "Accept":
                                    "application/json"
                            }

                }

            );


        /*
        |--------------------------------------------------------------------------
        | NOT AUTHENTICATED
        |--------------------------------------------------------------------------
        */

        if (
            response.status ===
            401
        ) {

            clearLocalSession();

            redirectToLogin();

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | OTHER SERVER ERROR
        |--------------------------------------------------------------------------
        */

        if (!response.ok) {

            throw new Error(
                `Dashboard request failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        const user =
            data?.user ||
            data?.data?.user;


        if (!user) {

            throw new Error(
                "User information was not returned by the server."
            );
        }


        /*
        |--------------------------------------------------------------------------
        | SAVE SAFE USER DATA
        |--------------------------------------------------------------------------
        */

        try {

            sessionStorage.setItem(
                "skillEarnUser",
                JSON.stringify(user)
            );

        } catch {}


        /*
        |--------------------------------------------------------------------------
        | RENDER
        |--------------------------------------------------------------------------
        */

        renderUser(user);

        hideLoadingState();


    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );


        /*
        |--------------------------------------------------------------------------
        | Try cached user
        |--------------------------------------------------------------------------
        */

        let cachedUser = null;


        try {

            const saved =
                sessionStorage.getItem(
                    "skillEarnUser"
                );


            if (saved) {

                cachedUser =
                    JSON.parse(saved);
            }

        } catch {}


        if (cachedUser) {

            renderUser(
                cachedUser
            );

            hideLoadingState();

            showDashboardMessage(
                "Live account data is temporarily unavailable. Showing saved information."
            );

            return;
        }


        hideLoadingState();


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
        user?.fullName ||
        user?.full_name ||
        user?.name ||
        "User";


    const publicUserId =
        user?.publicUserId ||
        user?.public_user_id ||
        user?.userId ||
        user?.id ||
        "—";


    const email =
        user?.email ||
        "—";


    const phone =
        user?.phone ||
        "—";


    const role =
        user?.role ||
        "User";


    const accountStatus =
        user?.accountStatus ||
        user?.account_status ||
        "Active";


    let emailVerified =
        user?.emailVerified;


    if (
        emailVerified ===
        undefined
    ) {

        emailVerified =
            user?.email_verified;
    }


    let emailStatus;


    if (
        emailVerified ===
        true
    ) {

        emailStatus =
            "Verified";

    } else if (
        emailVerified ===
        false
    ) {

        emailStatus =
            "Not Verified";

    } else {

        emailStatus =
            "—";
    }


    /*
    |--------------------------------------------------------------------------
    | USER NAME
    |--------------------------------------------------------------------------
    */

    setText(
        "userName",
        fullName
    );


    /*
    |--------------------------------------------------------------------------
    | USER ID
    |--------------------------------------------------------------------------
    */

    setText(
        "userId",
        publicUserId
    );


    /*
    |--------------------------------------------------------------------------
    | EMAIL
    |--------------------------------------------------------------------------
    */

    setText(
        "userEmail",
        email
    );


    /*
    |--------------------------------------------------------------------------
    | PHONE
    |--------------------------------------------------------------------------
    */

    setText(
        "userPhone",
        phone
    );


    /*
    |--------------------------------------------------------------------------
    | ROLE
    |--------------------------------------------------------------------------
    */

    setText(
        "userRole",
        role
    );


    /*
    |--------------------------------------------------------------------------
    | ACCOUNT STATUS
    |--------------------------------------------------------------------------
    */

    setText(
        "accountStatus",
        accountStatus
    );


    /*
    |--------------------------------------------------------------------------
    | EMAIL VERIFICATION
    |--------------------------------------------------------------------------
    */

    setText(
        "emailStatus",
        emailStatus
    );


    /*
    |--------------------------------------------------------------------------
    | Avatar initial
    |--------------------------------------------------------------------------
    */

    const initial =
        fullName
            .charAt(0)
            .toUpperCase();


    setText(
        "userInitial",
        initial
    );
}


/*
|--------------------------------------------------------------------------
| SAFE TEXT
|--------------------------------------------------------------------------
*/

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {

        return;
    }


    element.textContent =
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""

            ? String(value)

            : "—";
}


/*
|--------------------------------------------------------------------------
| LOADING STATE
|--------------------------------------------------------------------------
*/

function showLoadingState() {

    [
        "userName",
        "userId",
        "userEmail",
        "userPhone",
        "userRole",
        "accountStatus",
        "emailStatus"
    ]
        .forEach(
            id => {

                const element =
                    document.getElementById(
                        id
                    );


                if (element) {

                    element.textContent =
                        "Loading...";
                }
            }
        );
}


function hideLoadingState() {

    /*
     * Data is replaced by renderUser().
     * Nothing else required.
     */
}


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

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


        await fetch(

            DASHBOARD_API(
                "/api/auth/logout"
            ),

            {

                method:
                    "POST",

                credentials:
                    "include",

                headers: {

                    "Accept":
                        "application/json"

                }

            }

        );


    } catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );

    } finally {

        clearLocalSession();

        redirectToLogin();
    }
}


/*
|--------------------------------------------------------------------------
| QUICK ACCESS
|--------------------------------------------------------------------------
*/

function setupQuickAccess() {

    document
        .querySelectorAll(
            "[data-dashboard-link]"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    event => {

                        const url =
                            card.getAttribute(
                                "data-dashboard-link"
                            );


                        if (!url) {

                            return;
                        }


                        event.preventDefault();

                        window.location.href =
                            url;
                    }
                );
            }
        );
}


/*
|--------------------------------------------------------------------------
| CLEAR LOCAL CACHE
|--------------------------------------------------------------------------
*/

function clearLocalSession() {

    try {

        sessionStorage.removeItem(
            "skillEarnUser"
        );

        localStorage.removeItem(
            "skillearn_access_token"
        );

        localStorage.removeItem(
            "skillearn_user"
        );

    } catch {}
}


/*
|--------------------------------------------------------------------------
| LOGIN REDIRECT
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

function showDashboardMessage(
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


        element.style.margin =
            "20px 0";


        element.style.padding =
            "14px 16px";


        element.style.borderRadius =
            "12px";


        element.style.background =
            "rgba(255,255,255,0.06)";


        element.style.color =
            "#ffffff";


        const main =
            document.querySelector(
                "main"
            ) ||
            document.body;


        main.prepend(
            element
        );
    }


    element.textContent =
        message;
}
