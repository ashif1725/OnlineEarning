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
| INITIALIZE
|--------------------------------------------------------------------------
*/

async function initDashboard() {

    setupNavigation();

    setupMobileMenu();

    setupLogout();

    setupCopyUserId();

    setupForms();


    /*
    |--------------------------------------------------------------------------
    | Show cached user immediately
    |--------------------------------------------------------------------------
    */

    const savedUser =
        typeof window.getSavedUser === "function"
            ? window.getSavedUser()
            : null;


    if (savedUser) {

        renderUser(
            savedUser
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Open URL hash
    |--------------------------------------------------------------------------
    */

    openInitialHash();


    /*
    |--------------------------------------------------------------------------
    | Load authenticated user
    |--------------------------------------------------------------------------
    */

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
        ------------------------------------------------------
        IMPORTANT:
        Use global apiRequest.
        This automatically sends Bearer token.
        ------------------------------------------------------
        */

        const data =
            await window.apiRequest(
                "/api/auth/me",
                {
                    method:
                        "GET"
                }
            );


        const user =
            data?.user ||
            data?.data?.user ||
            data?.data ||
            null;


        if (!user) {

            throw new Error(
                "User data not found."
            );

        }


        /*
        ------------------------------------------------------
        Save fresh user
        ------------------------------------------------------
        */

        if (
            typeof window.setSavedUser ===
            "function"
        ) {

            window.setSavedUser(
                user
            );

        }


        /*
        ------------------------------------------------------
        Render user
        ------------------------------------------------------
        */

        renderUser(
            user
        );


        /*
        ------------------------------------------------------
        Load deposits
        ------------------------------------------------------
        */

        await loadDeposits();


    } catch (error) {

        console.error(
            "DASHBOARD LOAD ERROR:",
            error
        );


        /*
        ------------------------------------------------------
        If authentication failed
        ------------------------------------------------------
        */

        if (
            error?.status === 401 ||
            error?.status === 403
        ) {

            clearLocalAuth();

            redirectToLogin();

            return;

        }


        /*
        ------------------------------------------------------
        If cached user exists,
        keep dashboard visible.
        ------------------------------------------------------
        */

        const savedUser =
            typeof window.getSavedUser ===
            "function"
                ? window.getSavedUser()
                : null;


        if (savedUser) {

            renderUser(
                savedUser
            );


            showDashboardMessage(
                "Live account data could not be refreshed. Please check your internet connection."
            );


            /*
            --------------------------------------------------
            Try deposits separately
            --------------------------------------------------
            */

            try {

                await loadDeposits();

            } catch (depositError) {

                console.warn(
                    "Unable to load deposits:",
                    depositError
                );

            }


            return;

        }


        /*
        ------------------------------------------------------
        No user available
        ------------------------------------------------------
        */

        clearLocalAuth();

        redirectToLogin();

    }

}


/*
|--------------------------------------------------------------------------
| RENDER USER
|--------------------------------------------------------------------------
*/

function renderUser(user) {

    if (!user) {

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | USER DATA
    |--------------------------------------------------------------------------
    */

    const fullName =
        user.fullName ||
        user.full_name ||
        user.name ||
        "User";


    const email =
        user.email ||
        "—";


    const phone =
        user.phone ||
        user.mobile ||
        user.mobileNumber ||
        "—";


    const publicUserId =
        user.publicUserId ||
        user.public_user_id ||
        user.userId ||
        user.user_id ||
        "—";


    const accountStatus =
        user.accountStatus ||
        user.account_status ||
        user.status ||
        "Active";


    /*
    |--------------------------------------------------------------------------
    | EMAIL VERIFICATION
    |--------------------------------------------------------------------------
    */

    let emailVerified =
        user.emailVerified;


    if (
        emailVerified === undefined
    ) {

        emailVerified =
            user.email_verified;

    }


    if (
        emailVerified === undefined
    ) {

        emailVerified =
            Boolean(
                user.emailVerifiedAt ||
                user.email_verified_at
            );

    }


    const emailStatus =
        emailVerified
            ? "Verified"
            : "Not Verified";


    /*
    |--------------------------------------------------------------------------
    | MAIN DASHBOARD
    |--------------------------------------------------------------------------
    */

    setText(
        "userName",
        fullName
    );


    setText(
        "accountStatus",
        accountStatus
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
        "emailStatus",
        emailStatus
    );


    /*
    |--------------------------------------------------------------------------
    | SIDEBAR
    |--------------------------------------------------------------------------
    */

    setText(
        "sidebarUserName",
        fullName
    );


    setText(
        "sidebarUserEmail",
        email
    );


    /*
    |--------------------------------------------------------------------------
    | TOPBAR
    |--------------------------------------------------------------------------
    */

    setText(
        "topbarUserName",
        fullName
    );


    /*
    |--------------------------------------------------------------------------
    | WALLET
    |--------------------------------------------------------------------------
    */

    setText(
        "walletAccountStatus",
        accountStatus
    );


    /*
    |--------------------------------------------------------------------------
    | RECEIVE
    |--------------------------------------------------------------------------
    */

    setText(
        "receiveUserId",
        publicUserId
    );


    /*
    |--------------------------------------------------------------------------
    | PROFILE
    |--------------------------------------------------------------------------
    */

    setText(
        "profileFullName",
        fullName
    );


    setText(
        "profileEmail",
        email
    );


    setText(
        "profilePhone",
        phone
    );


    setText(
        "profileUserId",
        publicUserId
    );


    /*
    |--------------------------------------------------------------------------
    | AVATAR
    |--------------------------------------------------------------------------
    */

    const initial =
        getInitial(
            fullName
        );


    setText(
        "profileAvatar",
        initial
    );


    setText(
        "topbarAvatar",
        initial
    );


    setText(
        "profileInitial",
        initial
    );

}


/*
|--------------------------------------------------------------------------
| GET INITIAL
|--------------------------------------------------------------------------
*/

function getInitial(name) {

    const value =
        String(
            name || "U"
        )
        .trim();


    if (!value) {

        return "U";

    }


    return value
        .charAt(0)
        .toUpperCase();

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


/*
|--------------------------------------------------------------------------
| FORMAT MONEY
|--------------------------------------------------------------------------
*/

function formatMoney(
    amount,
    currency = "INR"
) {

    const numericAmount =
        Number(amount);


    if (
        !Number.isFinite(
            numericAmount
        )
    ) {

        return "₹0.00";

    }


    try {

        return new Intl.NumberFormat(
            "en-IN",
            {

                style:
                    "currency",

                currency:
                    currency || "INR",

                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2

            }
        )
        .format(
            numericAmount
        );

    } catch (error) {

        return `₹${numericAmount.toFixed(2)}`;

    }

}


/*
|--------------------------------------------------------------------------
| NAVIGATION
|--------------------------------------------------------------------------
*/

function setupNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item[data-section]"
        );


    navItems.forEach(
        function (item) {

            item.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    const section =
                        item.dataset.section;


                    openSection(
                        section
                    );


                    closeMobileMenu();

                }
            );

        }
    );


    /*
    |--------------------------------------------------------------------------
    | QUICK ACTIONS
    |--------------------------------------------------------------------------
    */

    document
        .querySelectorAll(
            "[data-open-section]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const section =
                            button.dataset.openSection;


                        openSection(
                            section
                        );

                    }
                );

            }
        );

}


/*
|--------------------------------------------------------------------------
| OPEN SECTION
|--------------------------------------------------------------------------
*/

function openSection(
    sectionId
) {

    if (!sectionId) {

        return;

    }


    const sections =
        document.querySelectorAll(
            ".dashboard-section"
        );


    sections.forEach(
        function (section) {

            section.classList.remove(
                "active-section"
            );

        }
    );


    const target =
        document.getElementById(
            sectionId
        );


    if (target) {

        target.classList.add(
            "active-section"
        );

    }


    const navItems =
        document.querySelectorAll(
            ".nav-item[data-section]"
        );


    navItems.forEach(
        function (item) {

            item.classList.toggle(
                "active",

                item.dataset.section ===
                sectionId
            );

        }
    );


    /*
    |--------------------------------------------------------------------------
    | UPDATE HASH
    |--------------------------------------------------------------------------
    */

    try {

        history.replaceState(
            null,
            "",
            "#" + sectionId
        );

    } catch (error) {

        console.warn(
            "Unable to update URL:",
            error
        );

    }


    window.scrollTo(
        {

            top:
                0,

            behavior:
                "smooth"

        }
    );

}


/*
|--------------------------------------------------------------------------
| OPEN INITIAL HASH
|--------------------------------------------------------------------------
*/

function openInitialHash() {

    const hash =
        window.location.hash
            .replace(
                "#",
                ""
            );


    if (!hash) {

        return;

    }


    const target =
        document.getElementById(
            hash
        );


    if (

        target &&

        target.classList.contains(
            "dashboard-section"
        )

    ) {

        openSection(
            hash
        );

    }

}


window.addEventListener(
    "hashchange",
    function () {

        openInitialHash();

    }
);


/*
|--------------------------------------------------------------------------
| MOBILE MENU
|--------------------------------------------------------------------------
*/

function setupMobileMenu() {

    const button =
        document.getElementById(
            "mobileMenuButton"
        );


    const sidebar =
        document.getElementById(
            "dashboardSidebar"
        );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (
        !button ||
        !sidebar
    ) {

        return;

    }


    button.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "open"
            );


            if (overlay) {

                overlay.hidden =
                    false;


                overlay.classList.toggle(
                    "visible",

                    sidebar.classList.contains(
                        "open"
                    )
                );

            }

        }
    );


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeMobileMenu
        );

    }

}


/*
|--------------------------------------------------------------------------
| CLOSE MOBILE MENU
|--------------------------------------------------------------------------
*/

function closeMobileMenu() {

    const sidebar =
        document.getElementById(
            "dashboardSidebar"
        );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "visible"
        );


        setTimeout(
            function () {

                if (

                    !overlay.classList.contains(
                        "visible"
                    )

                ) {

                    overlay.hidden =
                        true;

                }

            },
            250
        );

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
        logoutUser
    );

}


/*
|--------------------------------------------------------------------------
| LOGOUT USER
|--------------------------------------------------------------------------
*/

async function logoutUser() {

    const button =
        document.getElementById(
            "logoutButton"
        );


    const originalText =
        button
            ? button.innerHTML
            : "";


    try {

        if (button) {

            button.disabled =
                true;


            button.textContent =
                "Logging out...";

        }


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

        clearLocalAuth();

        redirectToLogin();

    }

}


/*
|--------------------------------------------------------------------------
| CLEAR AUTH
|--------------------------------------------------------------------------
*/

function clearLocalAuth() {

    try {

        if (

            typeof window.clearAuthData ===
            "function"

        ) {

            window.clearAuthData();

        }

        else {

            localStorage.removeItem(
                "skillearn_access_token"
            );


            localStorage.removeItem(
                "skillearn_user"
            );


            sessionStorage.removeItem(
                "skillEarnUser"
            );

        }

    } catch (error) {

        console.warn(
            "Unable to clear authentication:",
            error
        );

    }

}


/*
|--------------------------------------------------------------------------
| REDIRECT LOGIN
|--------------------------------------------------------------------------
*/

function redirectToLogin() {

    window.location.href =
        "../login.html";

}


/*
|--------------------------------------------------------------------------
| COPY USER ID
|--------------------------------------------------------------------------
*/

function setupCopyUserId() {

    const button =
        document.getElementById(
            "copyUserIdButton"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        async function () {

            const element =
                document.getElementById(
                    "receiveUserId"
                );


            const value =
                element
                    ? element.textContent.trim()
                    : "";


            if (

                !value ||

                value === "—"

            ) {

                showDashboardMessage(
                    "User ID is not available yet."
                );

                return;

            }


            try {

                await navigator.clipboard.writeText(
                    value
                );


                button.textContent =
                    "Copied ✓";


                setTimeout(
                    function () {

                        button.textContent =
                            "Copy User ID";

                    },
                    1500
                );


            } catch (error) {

                console.error(
                    "COPY ERROR:",
                    error
                );


                showDashboardMessage(
                    "Unable to copy User ID."
                );

            }

        }
    );

}


/*
|--------------------------------------------------------------------------
| FORMS
|--------------------------------------------------------------------------
*/

function setupForms() {

    setupSendMoneyForm();

    setupDepositForm();

    setupWithdrawForm();

}


/*
|--------------------------------------------------------------------------
| SEND MONEY FORM
|--------------------------------------------------------------------------
*/

function setupSendMoneyForm() {

    const form =
        document.getElementById(
            "sendMoneyForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            showDashboardMessage(
                "Send Money is not connected yet. We will connect the secure wallet transfer API in the next step."
            );

        }
    );

}


/*
|--------------------------------------------------------------------------
| CREATE DEPOSIT
|--------------------------------------------------------------------------
*/

function setupDepositForm() {

    const form =
        document.getElementById(
            "depositForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        createDepositRequest
    );

}


/*
|--------------------------------------------------------------------------
| DEPOSIT REQUEST API
|--------------------------------------------------------------------------
*/

async function createDepositRequest(
    event
) {

    event.preventDefault();


    const input =
        document.getElementById(
            "depositAmount"
        );


    const submitButton =
        event.currentTarget.querySelector(
            'button[type="submit"]'
        );


    const amount =
        Number(
            input?.value
        );


    /*
    |--------------------------------------------------------------------------
    | VALIDATE
    |--------------------------------------------------------------------------
    */

    if (

        !Number.isFinite(
            amount
        ) ||

        amount <= 0

    ) {

        showDashboardMessage(
            "Please enter a valid deposit amount."
        );

        return;

    }


    const originalText =
        submitButton
            ? submitButton.textContent
            : "";


    try {

        if (submitButton) {

            submitButton.disabled =
                true;


            submitButton.textContent =
                "Creating request...";

        }


        /*
        ------------------------------------------------------
        POST /api/deposits
        ------------------------------------------------------
        */

        const result =
            await window.apiRequest(
                "/api/deposits",
                {

                    method:
                        "POST",

                    body:
                        {
                            amount:
                                amount
                        }

                }
            );


        showDashboardMessage(
            result?.message ||
            "Deposit request created successfully. Waiting for admin approval."
        );


        /*
        ------------------------------------------------------
        Clear form
        ------------------------------------------------------
        */

        event.currentTarget.reset();


        /*
        ------------------------------------------------------
        Refresh deposit data
        ------------------------------------------------------
        */

        await loadDeposits();


    } catch (error) {

        console.error(
            "CREATE DEPOSIT ERROR:",
            error
        );


        showDashboardMessage(
            error.message ||
            "Unable to create deposit request."
        );

    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;


            submitButton.textContent =
                originalText ||
                "Create Deposit Request";

        }

    }

}


/*
|--------------------------------------------------------------------------
| LOAD DEPOSITS
|--------------------------------------------------------------------------
*/

async function loadDeposits() {

    try {

        /*
        ------------------------------------------------------
        GET /api/deposits
        ------------------------------------------------------
        */

        const result =
            await window.apiRequest(
                "/api/deposits",
                {

                    method:
                        "GET"

                }
            );


        const deposits =
            Array.isArray(
                result?.deposits
            )

                ? result.deposits

                : [];


        /*
        ------------------------------------------------------
        Render deposit activity
        ------------------------------------------------------
        */

        renderDepositTransactions(
            deposits
        );


    } catch (error) {

        console.warn(
            "LOAD DEPOSITS ERROR:",
            error
        );


        /*
        Deposit endpoint failure should not
        destroy the whole dashboard.
        */

    }

}


/*
|--------------------------------------------------------------------------
| RENDER DEPOSIT TRANSACTIONS
|--------------------------------------------------------------------------
*/

function renderDepositTransactions(
    deposits
) {

    const allTransactions =
        document.getElementById(
            "allTransactions"
        );


    const recentTransactions =
        document.getElementById(
            "recentTransactions"
        );


    if (

        !allTransactions &&
        !recentTransactions

    ) {

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | No transactions
    |--------------------------------------------------------------------------
    */

    if (

        !Array.isArray(
            deposits
        ) ||

        deposits.length === 0

    ) {

        const emptyHtml =

            `
            <div class="empty-state">

                <div class="empty-icon">
                    ↔
                </div>

                <strong>
                    No transactions yet
                </strong>

                <p>
                    Your wallet activity will appear here.
                </p>

            </div>
            `;


        if (allTransactions) {

            allTransactions.innerHTML =
                emptyHtml;

        }


        if (recentTransactions) {

            recentTransactions.innerHTML =
                emptyHtml;

        }


        updateTransactionStats(
            deposits
        );


        return;

    }


    /*
    |--------------------------------------------------------------------------
    | Build HTML
    |--------------------------------------------------------------------------
    */

    const allHtml =
        deposits
            .map(
                createDepositTransactionHtml
            )
            .join(
                ""
            );


    const recentDeposits =
        deposits.slice(
            0,
            5
        );


    const recentHtml =
        recentDeposits
            .map(
                createDepositTransactionHtml
            )
            .join(
                ""
            );


    if (allTransactions) {

        allTransactions.innerHTML =
            allHtml;

    }


    if (recentTransactions) {

        recentTransactions.innerHTML =
            recentHtml;

    }


    updateTransactionStats(
        deposits
    );

}


/*
|--------------------------------------------------------------------------
| DEPOSIT TRANSACTION HTML
|--------------------------------------------------------------------------
*/

function createDepositTransactionHtml(
    deposit
) {

    const amount =
        formatMoney(
            deposit.amount,
            deposit.currency ||
            "INR"
        );


    const status =
        String(
            deposit.status ||
            "pending"
        );


    const date =
        formatDate(
            deposit.requested_at ||
            deposit.requestedAt
        );


    return `

        <div class="transaction-item">

            <div class="transaction-icon">
                ＋
            </div>


            <div class="transaction-info">

                <strong>
                    Deposit
                </strong>

                <span>
                    ${date}
                </span>

            </div>


            <div class="transaction-right">

                <strong>
                    ${amount}
                </strong>

                <span>
                    ${escapeHtml(status)}
                </span>

            </div>

        </div>

    `;

}


/*
|--------------------------------------------------------------------------
| UPDATE TRANSACTION STATS
|--------------------------------------------------------------------------
*/

function updateTransactionStats(
    deposits
) {

    const transactionCount =
        Array.isArray(
            deposits
        )

            ? deposits.length

            : 0;


    setText(
        "transactionCount",
        transactionCount
    );


    /*
    |--------------------------------------------------------------------------
    | Total approved deposits
    |--------------------------------------------------------------------------
    */

    const totalReceived =
        Array.isArray(
            deposits
        )

            ? deposits
                .filter(
                    function (deposit) {

                        return (
                            String(
                                deposit.status
                            )
                            .toLowerCase() ===
                            "approved"
                        );

                    }
                )
                .reduce(
                    function (
                        total,
                        deposit
                    ) {

                        const amount =
                            Number(
                                deposit.amount
                            );


                        return (
                            total +

                            (
                                Number.isFinite(
                                    amount
                                )

                                    ? amount

                                    : 0
                            )

                        );

                    },
                    0
                )

            : 0;


    setText(
        "totalReceived",
        formatMoney(
            totalReceived
        )
    );

}


/*
|--------------------------------------------------------------------------
| WITHDRAW FORM
|--------------------------------------------------------------------------
*/

function setupWithdrawForm() {

    const form =
        document.getElementById(
            "withdrawForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            showDashboardMessage(
                "Withdraw API is not connected yet. We will connect the secure withdrawal workflow after wallet transactions."
            );

        }
    );

}


/*
|--------------------------------------------------------------------------
| FORMAT DATE
|--------------------------------------------------------------------------
*/

function formatDate(
    value
) {

    if (!value) {

        return "—";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    try {

        return new Intl.DateTimeFormat(
            "en-IN",
            {

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit"

            }
        )
        .format(
            date
        );

    } catch (error) {

        return date.toLocaleString();

    }

}


/*
|--------------------------------------------------------------------------
| ESCAPE HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/*
|--------------------------------------------------------------------------
| DASHBOARD MESSAGE
|--------------------------------------------------------------------------
*/

function showDashboardMessage(
    message
) {

    const element =
        document.getElementById(
            "dashboardMessage"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.hidden =
        false;


    clearTimeout(
        showDashboardMessage.timer
    );


    showDashboardMessage.timer =
        setTimeout(
            function () {

                element.hidden =
                    true;

            },
            6000
        );

}
