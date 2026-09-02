"use strict";


document.addEventListener(
    "DOMContentLoaded",
    initDashboard
);


/*
|--------------------------------------------------------------------------
| INIT
|--------------------------------------------------------------------------
*/

async function initDashboard() {

    setupLogout();

    setupWalletActions();

    await loadDashboard();

}


/*
|--------------------------------------------------------------------------
| LOAD DASHBOARD
|--------------------------------------------------------------------------
*/

async function loadDashboard() {

    try {

        const user =
            await loadCurrentUser();


        if (user) {

            renderUser(user);
        }


        await loadWallet();

        await loadTransactions();


    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );

        showMessage(
            "Unable to load dashboard data."
        );
    }
}


/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
*/

async function loadCurrentUser() {

    const url =
        window.apiUrl(
            "/api/auth/me"
        );


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


    if (
        response.status === 401
    ) {

        redirectToLogin();

        return null;
    }


    if (!response.ok) {

        throw new Error(
            "Unable to load user"
        );
    }


    const data =
        await response.json();


    const user =
        data.user ||
        data.data?.user ||
        null;


    if (user) {

        if (
            typeof window.setSavedUser ===
            "function"
        ) {

            window.setSavedUser(
                user
            );
        }
    }


    return user;
}


/*
|--------------------------------------------------------------------------
| RENDER USER
|--------------------------------------------------------------------------
*/

function renderUser(user) {

    setText(
        "userName",
        user.fullName ||
        user.full_name ||
        user.name ||
        "User"
    );


    setText(
        "userId",
        user.publicUserId ||
        user.public_user_id ||
        "—"
    );


    setText(
        "userEmail",
        user.email ||
        "—"
    );


    setText(
        "accountStatus",
        user.accountStatus ||
        user.account_status ||
        "—"
    );


    const verified =
        user.emailVerified === true ||
        user.email_verified === true;


    setText(
        "emailStatus",
        verified
            ? "Verified"
            : "Not Verified"
    );
}


/*
|--------------------------------------------------------------------------
| WALLET
|--------------------------------------------------------------------------
*/

async function loadWallet() {

    const response =
        await fetch(
            window.apiUrl(
                "/api/wallet"
            ),
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


    if (
        response.status === 401
    ) {

        redirectToLogin();

        return;
    }


    if (!response.ok) {

        throw new Error(
            "Wallet request failed"
        );
    }


    const data =
        await response.json();


    const wallet =
        data.wallet;


    if (!wallet) {
        return;
    }


    setText(
        "walletBalance",
        formatAmount(
            wallet.balance
        )
    );


    setText(
        "walletCurrency",
        wallet.currency ||
        "POINT"
    );


    setText(
        "walletStatus",
        wallet.status ||
        "active"
    );
}


/*
|--------------------------------------------------------------------------
| TRANSACTIONS
|--------------------------------------------------------------------------
*/

async function loadTransactions() {

    const response =
        await fetch(
            window.apiUrl(
                "/api/wallet/transactions"
            ),
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


    if (!response.ok) {
        return;
    }


    const data =
        await response.json();


    renderTransactions(
        data.transactions ||
        []
    );
}


/*
|--------------------------------------------------------------------------
| RENDER TRANSACTIONS
|--------------------------------------------------------------------------
*/

function renderTransactions(
    transactions
) {

    const container =
        document.getElementById(
            "transactionList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        transactions.length === 0
    ) {

        container.innerHTML =
            `
            <div class="empty-state">
                No transactions yet.
            </div>
            `;

        return;
    }


    transactions.forEach(
        function (transaction) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "transaction-item";


            const type =
                transaction.transaction_type;


            const incoming =
                type === "receive";


            item.innerHTML =
                `
                <div class="transaction-main">

                    <strong>
                        ${
                            incoming
                                ? "Received"
                                : "Sent"
                        }
                    </strong>

                    <span>
                        ${
                            transaction.description ||
                            "Wallet transaction"
                        }
                    </span>

                </div>

                <div class="transaction-amount ${
                    incoming
                        ? "positive"
                        : "negative"
                }">

                    ${
                        incoming
                            ? "+"
                            : "-"
                    }${formatAmount(
                        transaction.amount
                    )}

                </div>
                `;


            container.appendChild(
                item
            );
        }
    );
}


/*
|--------------------------------------------------------------------------
| WALLET ACTIONS
|--------------------------------------------------------------------------
*/

function setupWalletActions() {

    const sendForm =
        document.getElementById(
            "sendMoneyForm"
        );


    if (sendForm) {

        sendForm.addEventListener(
            "submit",
            handleSendMoney
        );
    }


    const receiveButton =
        document.getElementById(
            "receiveMoneyButton"
        );


    if (receiveButton) {

        receiveButton.addEventListener(
            "click",
            showReceivePanel
        );
    }


    const closeReceive =
        document.getElementById(
            "closeReceiveButton"
        );


    if (closeReceive) {

        closeReceive.addEventListener(
            "click",
            hideReceivePanel
        );
    }
}


/*
|--------------------------------------------------------------------------
| SEND MONEY
|--------------------------------------------------------------------------
*/

async function handleSendMoney(
    event
) {

    event.preventDefault();


    const form =
        event.currentTarget;


    const receiver =
        document.getElementById(
            "receiverUserId"
        )?.value.trim();


    const amount =
        document.getElementById(
            "sendAmount"
        )?.value;


    const description =
        document.getElementById(
            "sendDescription"
        )?.value.trim();


    if (
        !receiver ||
        !amount
    ) {

        showMessage(
            "Enter receiver User ID and amount."
        );

        return;
    }


    const button =
        form.querySelector(
            "button[type='submit']"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Sending...";
    }


    try {

        const response =
            await fetch(
                window.apiUrl(
                    "/api/wallet/send"
                ),
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json",

                        "Idempotency-Key":
                            crypto.randomUUID()
                    },

                    credentials:
                        "include",

                    body:
                        JSON.stringify({

                            receiverUserId:
                                receiver,

                            amount:
                                Number(amount),

                            description:
                                description

                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Transfer failed"
            );
        }


        showMessage(
            "Money sent successfully."
        );


        form.reset();


        await loadWallet();

        await loadTransactions();


    } catch (error) {

        console.error(
            "SEND ERROR:",
            error
        );


        showMessage(
            error.message ||
            "Unable to send money."
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Send Money";
        }
    }
}


/*
|--------------------------------------------------------------------------
| RECEIVE PANEL
|--------------------------------------------------------------------------
*/

function showReceivePanel() {

    const panel =
        document.getElementById(
            "receivePanel"
        );


    if (panel) {

        panel.hidden =
            false;
    }
}


function hideReceivePanel() {

    const panel =
        document.getElementById(
            "receivePanel"
        );


    if (panel) {

        panel.hidden =
            true;
    }
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
        async function () {

            button.disabled =
                true;

            button.textContent =
                "Logging out...";


            try {

                await fetch(
                    window.apiUrl(
                        "/api/auth/logout"
                    ),
                    {
                        method:
                            "POST",

                        headers: {
                            "Accept":
                                "application/json"
                        },

                        credentials:
                            "include"
                    }
                );

            } catch (error) {

                console.warn(
                    error
                );

            } finally {

                if (
                    typeof window.clearAuthData ===
                    "function"
                ) {

                    window.clearAuthData();
                }


                redirectToLogin();
            }
        }
    );
}


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

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
        value ??
        "—";
}


function formatAmount(
    value
) {

    const amount =
        Number(value) || 0;


    return amount.toFixed(2);
}


function showMessage(
    message
) {

    const element =
        document.getElementById(
            "dashboardMessage"
        );


    if (element) {

        element.textContent =
            message;

        element.hidden =
            false;
    }
}


function redirectToLogin() {

    window.location.href =
        "../login.html";
}
