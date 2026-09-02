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

    setupDemoForms();


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
    | Load authenticated user
    |--------------------------------------------------------------------------
    */

    await loadDashboard();

    /*
    |--------------------------------------------------------------------------
    | Load deposit history
    |--------------------------------------------------------------------------
    */

    await loadMyDeposits();

}


/*
|--------------------------------------------------------------------------
| LOAD DASHBOARD
|--------------------------------------------------------------------------
*/

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

                    method:
                        "GET",

                    credentials:
                        "include",

                    headers:
                        {
                            "Accept":
                                "application/json"
                        }

                }
            );


        /*
        |--------------------------------------------------------------------------
        | Session invalid
        |--------------------------------------------------------------------------
        */

        if (
            response.status === 401
        ) {

            clearLocalAuth();

            redirectToLogin();

            return;

        }


        if (!response.ok) {

            throw new Error(
                `Dashboard API failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        const user =
            data &&
            data.user
                ? data.user
                : null;


        if (!user) {

            throw new Error(
                "User data not found"
            );

        }


        /*
        |--------------------------------------------------------------------------
        | Save fresh user
        |--------------------------------------------------------------------------
        */

        if (
            typeof window.setSavedUser ===
            "function"
        ) {

            window.setSavedUser(
                user
            );

        }


        renderUser(
            user
        );


    } catch (error) {

        console.error(
            "DASHBOARD LOAD ERROR:",
            error
        );


        const savedUser =
            typeof window.getSavedUser ===
            "function"
                ? window.getSavedUser()
                : null;


        /*
        |--------------------------------------------------------------------------
        | If cached user exists
        |--------------------------------------------------------------------------
        */

        if (savedUser) {

            renderUser(
                savedUser
            );

            showDashboardMessage(
                "Live account data could not be refreshed."
            );

            return;

        }


        /*
        |--------------------------------------------------------------------------
        | No authenticated user
        |--------------------------------------------------------------------------
        */

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


    const fullName =
        user.fullName ||
        user.full_name ||
        "User";


    const email =
        user.email ||
        "—";


    const phone =
        user.phone ||
        "—";


    const publicUserId =
        user.publicUserId ||
        user.public_user_id ||
        user.userId ||
        "—";


    const accountStatus =
        user.accountStatus ||
        user.account_status ||
        "Active";


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
    | Main dashboard
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
    | Sidebar
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
    | Topbar
    |--------------------------------------------------------------------------
    */

    setText(
        "topbarUserName",
        fullName
    );


    /*
    |--------------------------------------------------------------------------
    | Wallet
    |--------------------------------------------------------------------------
    */

    setText(
        "walletAccountStatus",
        accountStatus
    );


    /*
    |--------------------------------------------------------------------------
    | Receive
    |--------------------------------------------------------------------------
    */

    setText(
        "receiveUserId",
        publicUserId
    );


    /*
    |--------------------------------------------------------------------------
    | Profile
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
    | Avatar
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
| INITIAL
|--------------------------------------------------------------------------
*/

function getInitial(name) {

    const value =
        String(
            name || "U"
        ).trim();


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
    | Quick action buttons
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

                        openSection(
                            button.dataset.openSection
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
    | Update URL hash without reload
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


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


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

                overlay.hidden = false;

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

                    overlay.hidden = true;

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


    try {

        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Logging out...";

        }


        const url =
            typeof window.apiUrl === "function"
                ? window.apiUrl(
                    "/api/auth/logout"
                )
                : "https://skillearnhub-1.onrender.com/api/auth/logout";


        await fetch(
            url,
            {

                method:
                    "POST",

                credentials:
                    "include",

                headers:
                    {
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

        clearLocalAuth();

        redirectToLogin();

    }

}


/*
|--------------------------------------------------------------------------
| CLEAR LOCAL AUTH
|--------------------------------------------------------------------------
*/

function clearLocalAuth() {

    try {

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


        sessionStorage.removeItem(
            "skillEarnUser"
        );

    } catch (error) {

        console.warn(
            "Unable to clear local authentication data:",
            error
        );

    }

}


/*
|--------------------------------------------------------------------------
| REDIRECT
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
| FORM HANDLERS
|--------------------------------------------------------------------------
*/

function setupDemoForms() {

    const sendForm =
        document.getElementById(
            "sendMoneyForm"
        );


    const depositForm =
        document.getElementById(
            "depositForm"
        );


    const withdrawForm =
        document.getElementById(
            "withdrawForm"
        );


    /*
    |--------------------------------------------------------------------------
    | CREATE DEPOSIT REQUEST
    |--------------------------------------------------------------------------
    */

    if (depositForm) {

        depositForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const amountInput =
                    document.getElementById(
                        "depositAmount"
                    );


                const submitButton =
                    depositForm.querySelector(
                        'button[type="submit"]'
                    );


                const amount =
                    Number(
                        amountInput.value
                    );


                /*
                ----------------------------------------------------------
                | VALIDATE AMOUNT
                ----------------------------------------------------------
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


                const originalButtonText =
                    submitButton
                        ? submitButton.textContent
                        : "Create Deposit Request";


                if (submitButton) {

                    submitButton.disabled =
                        true;


                    submitButton.textContent =
                        "Creating request...";

                }


                try {

                    const url =
                        typeof window.apiUrl ===
                        "function"
                            ? window.apiUrl(
                                "/api/deposits"
                            )
                            : "https://skillearnhub-1.onrender.com/api/deposits";


                    const response =
                        await fetch(
                            url,
                            {

                                method:
                                    "POST",

                                credentials:
                                    "include",

                                headers:
                                    {
                                        "Content-Type":
                                            "application/json",

                                        "Accept":
                                            "application/json"
                                    },

                                body:
                                    JSON.stringify(
                                        {
                                            amount:
                                                amount
                                        }
                                    )

                            }
                        );


                    /*
                    ------------------------------------------------------
                    | SAFELY PARSE RESPONSE
                    ------------------------------------------------------
                    */

                    let data =
                        null;


                    try {

                        data =
                            await response.json();

                    } catch (parseError) {

                        console.error(
                            "DEPOSIT RESPONSE PARSE ERROR:",
                            parseError
                        );

                    }


                    if (!response.ok) {

                        throw new Error(
                            data &&
                            data.message
                                ? data.message
                                : `Deposit request failed (${response.status})`
                        );

                    }


                    /*
                    ------------------------------------------------------
                    | SUCCESS
                    ------------------------------------------------------
                    */

                    amountInput.value =
                        "";


                    showDashboardMessage(
                        data &&
                        data.message
                            ? data.message
                            : "Deposit request created successfully. It is now pending admin verification."
                    );


                    /*
                    ------------------------------------------------------
                    | REFRESH DEPOSIT HISTORY
                    ------------------------------------------------------
                    */

                    await loadMyDeposits();


                } catch (error) {

                    console.error(
                        "CREATE DEPOSIT REQUEST ERROR:",
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
                            originalButtonText;

                    }

                }

            }
        );

    }


    /*
    |--------------------------------------------------------------------------
    | SEND MONEY
    |--------------------------------------------------------------------------
    */

    if (sendForm) {

        sendForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                showDashboardMessage(
                    "Send Money API will be connected next."
                );

            }
        );

    }


    /*
    |--------------------------------------------------------------------------
    | WITHDRAW
    |--------------------------------------------------------------------------
    */

    if (withdrawForm) {

        withdrawForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                showDashboardMessage(
                    "Withdrawal API will be connected next."
                );

            }
        );

    }

}


/*
|--------------------------------------------------------------------------
| LOAD MY DEPOSITS
|--------------------------------------------------------------------------
*/

async function loadMyDeposits() {

    try {

        const url =
            typeof window.apiUrl ===
            "function"
                ? window.apiUrl(
                    "/api/deposits"
                )
                : "https://skillearnhub-1.onrender.com/api/deposits";


        const response =
            await fetch(
                url,
                {

                    method:
                        "GET",

                    credentials:
                        "include",

                    headers:
                        {
                            "Accept":
                                "application/json"
                        }

                }
            );


        /*
        |--------------------------------------------------------------------------
        | AUTH FAILED
        |--------------------------------------------------------------------------
        */

        if (
            response.status ===
            401
        ) {

            console.warn(
                "Deposit API authentication failed."
            );

            return [];

        }


        let data =
            null;


        try {

            data =
                await response.json();

        } catch (parseError) {

            console.error(
                "DEPOSIT LIST PARSE ERROR:",
                parseError
            );

            return [];

        }


        if (!response.ok) {

            throw new Error(
                data &&
                data.message
                    ? data.message
                    : "Unable to load deposit requests"
            );

        }


        const deposits =
            Array.isArray(
                data.deposits
            )
                ? data.deposits
                : [];


        console.log(
            "MY DEPOSITS:",
            deposits
        );


        return deposits;


    } catch (error) {

        console.error(
            "LOAD DEPOSITS ERROR:",
            error
        );


        return [];

    }

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
            5000
        );

}


/*
|--------------------------------------------------------------------------
| OPEN HASHED SECTION
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


/*
|--------------------------------------------------------------------------
| HASH CHANGE
|--------------------------------------------------------------------------
*/

window.addEventListener(
    "hashchange",
    function () {

        openInitialHash();

    }
);


/*
|--------------------------------------------------------------------------
| INITIAL HASH
|--------------------------------------------------------------------------
*/

openInitialHash();
