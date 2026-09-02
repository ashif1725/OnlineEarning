"use strict";

/*
|--------------------------------------------------------------------------
| SkillEarn Hub
| User Dashboard
|--------------------------------------------------------------------------
|
| Authentication:
| HTTP-only skillearn_session cookie
|
| IMPORTANT:
| No password/token is stored in localStorage.
|--------------------------------------------------------------------------
*/


document.addEventListener(
    "DOMContentLoaded",
    initDashboard
);



/* =========================================================
   INITIALIZE
========================================================= */

async function initDashboard() {

    setCurrentYear();

    setupLogout();

    await loadDashboard();

}



/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        showDashboardMessage(
            "Loading your account...",
            false
        );


        const url =
            typeof window.apiUrl === "function"
                ? window.apiUrl("/api/auth/me")
                : "https://skillearnhub-1.onrender.com/api/auth/me";


        const response =
            await fetch(
                url,
                {
                    method: "GET",

                    credentials: "include",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache: "no-store"
                }
            );


        /*
        |--------------------------------------------------------------------------
        | Session expired / missing
        |--------------------------------------------------------------------------
        */

        if (
            response.status === 401
        ) {

            redirectToLogin();

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Other server errors
        |--------------------------------------------------------------------------
        */

        if (!response.ok) {

            throw new Error(
                "Dashboard request failed: " +
                response.status
            );
        }


        const data =
            await response.json();


        const user =
            data?.user ||
            data?.data?.user ||
            null;


        if (!user) {

            throw new Error(
                "User information was not returned by the server."
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Render
        |--------------------------------------------------------------------------
        */

        renderUser(user);


        /*
        |--------------------------------------------------------------------------
        | Optional wallet data
        |--------------------------------------------------------------------------
        */

        if (data.wallet) {

            renderWallet(
                data.wallet
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Optional transactions
        |--------------------------------------------------------------------------
        */

        if (
            Array.isArray(
                data.transactions
            )
        ) {

            renderTransactions(
                data.transactions
            );
        }


        hideDashboardMessage();


    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );


        showDashboardMessage(
            "Unable to refresh your account right now. Please try again.",
            true
        );
    }

}



/* =========================================================
   RENDER USER
========================================================= */

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


    /*
    |--------------------------------------------------------------------------
    | Email verification
    |--------------------------------------------------------------------------
    */

    let verified =
        user.emailVerified;


    if (
        verified === undefined
    ) {
        verified =
            user.email_verified;
    }


    if (
        verified === undefined
    ) {
        verified =
            Boolean(
                user.emailVerifiedAt ||
                user.email_verified_at
            );
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


    renderVerificationStatus(
        verified
    );

}



/* =========================================================
   EMAIL VERIFICATION
========================================================= */

function renderVerificationStatus(
    verified
) {

    const element =
        document.getElementById(
            "emailStatus"
        );


    if (!element) {
        return;
    }


    element.classList.remove(
        "verified",
        "not-verified"
    );


    if (verified === true) {

        element.textContent =
            "Verified";

        element.classList.add(
            "verified"
        );

        return;
    }


    element.textContent =
        "Not Verified";

    element.classList.add(
        "not-verified"
    );
}



/* =========================================================
   WALLET
========================================================= */

function renderWallet(wallet) {

    const balance =
        wallet.balance ??
        wallet.availableBalance ??
        wallet.available_balance ??
        0;


    const numericBalance =
        Number(balance);


    const formatted =
        Number.isFinite(
            numericBalance
        )
            ? numericBalance.toLocaleString(
                "en-IN",
                {
                    style: "currency",
                    currency: "INR"
                }
            )
            : "₹0.00";


    setText(
        "walletBalance",
        formatted
    );

}



/* =========================================================
   TRANSACTIONS
========================================================= */

function renderTransactions(
    transactions
) {

    const container =
        document.getElementById(
            "transactionsList"
        );


    if (!container) {
        return;
    }


    if (
        !transactions ||
        transactions.length === 0
    ) {

        return;
    }


    container.innerHTML = "";


    transactions
        .slice(0, 5)
        .forEach(
            function (transaction) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "transaction-item";


                const title =
                    document.createElement(
                        "strong"
                    );


                title.textContent =
                    transaction.title ||
                    transaction.type ||
                    "Transaction";


                const amount =
                    document.createElement(
                        "span"
                    );


                amount.textContent =
                    transaction.amount !== undefined
                        ? formatCurrency(
                            transaction.amount
                        )
                        : "—";


                item.appendChild(
                    title
                );


                item.appendChild(
                    amount
                );


                container.appendChild(
                    item
                );

            }
        );
}



/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(
    value
) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {
        return "₹0.00";
    }


    return number.toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR"
        }
    );
}



/* =========================================================
   SAFE TEXT
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    const text =
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
            ? String(value)
            : "—";


    element.textContent =
        text;
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



async function logoutUser() {

    const button =
        document.getElementById(
            "logoutButton"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Logging out...";
    }


    try {

        const url =
            typeof window.apiUrl === "function"
                ? window.apiUrl("/api/auth/logout")
                : "https://skillearnhub-1.onrender.com/api/auth/logout";


        await fetch(
            url,
            {
                method: "POST",

                credentials: "include",

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

        redirectToLogin();
    }

}



/* =========================================================
   REDIRECT
========================================================= */

function redirectToLogin() {

    window.location.replace(
        "../login.html"
    );

}



/* =========================================================
   MESSAGE
========================================================= */

function showDashboardMessage(
    message,
    isError
) {

    const element =
        document.getElementById(
            "dashboardMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message || "";


    element.classList.toggle(
        "show",
        Boolean(message)
    );


    if (isError) {

        element.style.border =
            "1px solid rgba(255,80,100,.3)";

    } else {

        element.style.border =
            "1px solid rgba(130,110,255,.2)";
    }

}



function hideDashboardMessage() {

    const element =
        document.getElementById(
            "dashboardMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        "";

    element.classList.remove(
        "show"
    );
}



/* =========================================================
   YEAR
========================================================= */

function setCurrentYear() {

    const element =
        document.getElementById(
            "currentYear"
        );


    if (element) {

        element.textContent =
            new Date().getFullYear();
    }

}
