"use strict";


/* =========================================================
   SKILLEARN HUB — ADMIN DASHBOARD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        /* =================================================
           API SAFETY CHECK
        ================================================= */

        if (
            typeof window.apiRequest !==
            "function"
        ) {

            console.error(
                "ADMIN DASHBOARD ERROR: window.apiRequest is not available."
            );

            return;

        }


        /* =================================================
           ELEMENTS
        ================================================= */

        const sidebar =
            document.getElementById(
                "dashboardSidebar"
            );


        const overlay =
            document.getElementById(
                "sidebarOverlay"
            );


        const mobileMenuButton =
            document.getElementById(
                "mobileMenuButton"
            );


        const navItems =
            document.querySelectorAll(
                ".nav-item[data-section]"
            );


        const sections =
            document.querySelectorAll(
                ".dashboard-section"
            );


        const quickActionButtons =
            document.querySelectorAll(
                "[data-open-section]"
            );


        /* =================================================
           MOBILE SIDEBAR
        ================================================= */

        function openSidebar() {

            if (
                sidebar
            ) {

                sidebar.classList.add(
                    "open"
                );

            }


            if (
                overlay
            ) {

                overlay.classList.add(
                    "visible"
                );

            }

        }


        function closeSidebar() {

            if (
                sidebar
            ) {

                sidebar.classList.remove(
                    "open"
                );

            }


            if (
                overlay
            ) {

                overlay.classList.remove(
                    "visible"
                );

            }

        }


        if (
            mobileMenuButton
        ) {

            mobileMenuButton.addEventListener(
                "click",
                function () {

                    if (

                        sidebar &&

                        sidebar.classList.contains(
                            "open"
                        )

                    ) {

                        closeSidebar();

                    }

                    else {

                        openSidebar();

                    }

                }
            );

        }


        if (
            overlay
        ) {

            overlay.addEventListener(
                "click",
                closeSidebar
            );

        }


        /* =================================================
           SECTION NAVIGATION
        ================================================= */

        function showSection(
            sectionId
        ) {

            sections.forEach(
                function (
                    section
                ) {

                    section.classList.remove(
                        "active-section"
                    );

                }
            );


            const targetSection =
                document.getElementById(
                    sectionId
                );


            if (
                targetSection
            ) {

                targetSection.classList.add(
                    "active-section"
                );

            }


            navItems.forEach(
                function (
                    item
                ) {

                    item.classList.remove(
                        "active"
                    );


                    if (

                        item.dataset.section ===
                        sectionId

                    ) {

                        item.classList.add(
                            "active"
                        );

                    }

                }
            );


            closeSidebar();


            window.scrollTo({

                top:
                    0,

                behavior:
                    "smooth"

            });


            /*
            ---------------------------------------------
            LOAD USERS
            ---------------------------------------------
            */

            if (
                sectionId ===
                "users"
            ) {

                loadUsers();

            }


            /*
            ---------------------------------------------
            LOAD DEPOSITS
            ---------------------------------------------
            */

            if (
                sectionId ===
                "deposits"
            ) {

                loadDeposits();

            }

        }


        navItems.forEach(
            function (
                item
            ) {

                item.addEventListener(
                    "click",
                    function (
                        event
                    ) {

                        event.preventDefault();


                        const sectionId =
                            item.dataset.section;


                        if (
                            !sectionId
                        ) {

                            return;

                        }


                        showSection(
                            sectionId
                        );


                        window.history.replaceState(

                            null,

                            "",

                            "#" +
                            sectionId

                        );

                    }
                );

            }
        );


        /* =================================================
           QUICK ACTIONS
        ================================================= */

        quickActionButtons.forEach(
            function (
                button
            ) {

                button.addEventListener(
                    "click",
                    function () {

                        const sectionId =
                            button.dataset.openSection;


                        if (
                            !sectionId
                        ) {

                            return;

                        }


                        showSection(
                            sectionId
                        );


                        window.history.replaceState(

                            null,

                            "",

                            "#" +
                            sectionId

                        );

                    }
                );

            }
        );


        /* =================================================
           HELPERS
        ================================================= */

        function setText(
            id,
            value
        ) {

            const element =
                document.getElementById(
                    id
                );


            if (
                element
            ) {

                element.textContent =
                    value ===
                    undefined ||

                    value ===
                    null

                        ?

                        ""

                        :

                        String(
                            value
                        );

            }

        }


        function getInitial(
            name
        ) {

            if (
                !name
            ) {

                return "A";

            }


            return String(
                name
            )
            .trim()
            .charAt(
                0
            )
            .toUpperCase();

        }


        function escapeHtml(
            value
        ) {

            const div =
                document.createElement(
                    "div"
                );


            div.textContent =

                value === null ||

                value === undefined

                    ?

                    ""

                    :

                    String(
                        value
                    );


            return div.innerHTML;

        }


        function escapeAttribute(
            value
        ) {

            return escapeHtml(
                value
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


        function formatAmount(
            amount
        ) {

            const number =
                Number(
                    amount ||
                    0
                );


            if (
                Number.isNaN(
                    number
                )
            ) {

                return "₹0.00";

            }


            return "₹" +
                number.toLocaleString(
                    "en-IN",
                    {

                        minimumFractionDigits:
                            2,

                        maximumFractionDigits:
                            2

                    }
                );

        }


        function formatDate(
            value
        ) {

            if (
                !value
            ) {

                return "—";

            }


            try {

                const date =
                    new Date(
                        value
                    );


                if (

                    Number.isNaN(
                        date.getTime()
                    )

                ) {

                    return String(
                        value
                    );

                }


                return date.toLocaleString(
                    "en-IN",
                    {

                        dateStyle:
                            "medium",

                        timeStyle:
                            "short"

                    }
                );

            }

            catch (
                error
            ) {

                return String(
                    value
                );

            }

        }


        function getApiErrorMessage(
            error,
            fallback
        ) {

            return (

                error?.data?.message ||

                error?.data?.error ||

                error?.message ||

                fallback

            );

        }


        function getArrayFromResponse(
            data,
            key
        ) {

            if (
                Array.isArray(
                    data?.[key]
                )
            ) {

                return data[
                    key
                ];

            }


            if (
                Array.isArray(
                    data?.data
                )
            ) {

                return data.data;

            }


            if (
                Array.isArray(
                    data
                )
            ) {

                return data;

            }


            return [];

        }


        /* =================================================
           ADMIN MESSAGE
        ================================================= */

        function showMessage(
            message,
            type =
                "info"
        ) {

            let container =
                document.getElementById(
                    "adminActionMessage"
                );


            if (
                !container
            ) {

                container =
                    document.createElement(
                        "div"
                    );


                container.id =
                    "adminActionMessage";


                container.style.position =
                    "fixed";


                container.style.left =
                    "20px";


                container.style.right =
                    "20px";


                container.style.bottom =
                    "20px";


                container.style.zIndex =
                    "9999";


                container.style.padding =
                    "16px";


                container.style.borderRadius =
                    "12px";


                container.style.fontWeight =
                    "700";


                container.style.textAlign =
                    "center";


                container.style.boxShadow =
                    "0 10px 30px rgba(0,0,0,0.15)";


                document.body.appendChild(
                    container
                );

            }


            container.textContent =
                message ||
                "";


            if (
                type ===
                "success"
            ) {

                container.style.background =
                    "#dcfce7";


                container.style.color =
                    "#166534";


                container.style.border =
                    "1px solid #86efac";

            }

            else if (
                type ===
                "error"
            ) {

                container.style.background =
                    "#fee2e2";


                container.style.color =
                    "#991b1b";


                container.style.border =
                    "1px solid #fca5a5";

            }

            else {

                container.style.background =
                    "#dbeafe";


                container.style.color =
                    "#1e40af";


                container.style.border =
                    "1px solid #93c5fd";

            }


            container.style.display =
                "block";


            window.clearTimeout(
                window.__adminMessageTimer
            );


            window.__adminMessageTimer =
                window.setTimeout(
                    function () {

                        if (
                            container
                        ) {

                            container.style.display =
                                "none";

                        }

                    },
                    3500
                );

        }


        /* =================================================
           LOAD ADMIN PROFILE
        ================================================= */

        function loadAdminProfile() {

            try {

                const user =

                    typeof window.getSavedUser ===
                    "function"

                        ?

                        window.getSavedUser()

                        :

                        null;


                if (
                    !user
                ) {

                    return;

                }


                const name =

                    user.full_name ||

                    user.fullName ||

                    user.name ||

                    "Admin";


                const email =

                    user.email ||

                    "—";


                const role =

                    user.role ||

                    user.userRole ||

                    user.user_role ||

                    "admin";


                setText(
                    "adminName",
                    name
                );


                setText(
                    "adminEmail",
                    email
                );


                setText(
                    "adminWelcomeName",
                    name
                );


                setText(
                    "adminProfileName",
                    name
                );


                setText(
                    "adminProfileEmail",
                    email
                );


                setText(
                    "adminRole",
                    role
                );


                setText(
                    "topbarName",
                    name
                );


                setText(
                    "adminAvatar",
                    getInitial(
                        name
                    )
                );


                setText(
                    "topbarAvatar",
                    getInitial(
                        name
                    )
                );

            }

            catch (
                error
            ) {

                console.error(
                    "ADMIN PROFILE ERROR:",
                    error
                );

            }

        }


        /* =================================================
           USERS
        ================================================= */

        async function loadUsers() {

            const usersList =
                document.getElementById(
                    "usersList"
                );


            const usersMessage =
                document.getElementById(
                    "usersMessage"
                );


            if (
                !usersList
            ) {

                return;

            }


            usersList.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        ⏳
                    </div>

                    <strong>
                        Loading users...
                    </strong>

                </div>

            `;


            try {

                const data =
                    await window.apiRequest(

                        "/api/admin/users",

                        {

                            method:
                                "GET"

                        }

                    );


                const users =
                    getArrayFromResponse(
                        data,
                        "users"
                    );


                setText(
                    "totalUsers",
                    users.length
                );


                renderUsers(
                    users
                );


                if (
                    usersMessage
                ) {

                    usersMessage.style.display =
                        "none";

                }

            }

            catch (
                error
            ) {

                console.error(
                    "LOAD USERS ERROR:",
                    error
                );


                const errorMessage =
                    getApiErrorMessage(

                        error,

                        "Unable to load users"

                    );


                usersList.innerHTML = `

                    <div class="empty-state">

                        <div class="empty-icon">
                            ⚠️
                        </div>

                        <strong>
                            Unable to load users
                        </strong>

                        <p>
                            ${escapeHtml(
                                errorMessage
                            )}
                        </p>

                    </div>

                `;


                if (
                    usersMessage
                ) {

                    usersMessage.style.display =
                        "block";


                    usersMessage.textContent =
                        errorMessage;

                }

            }

        }


        function renderUsers(
            users
        ) {

            const usersList =
                document.getElementById(
                    "usersList"
                );


            if (
                !usersList
            ) {

                return;

            }


            if (

                !Array.isArray(
                    users
                ) ||

                users.length ===
                0

            ) {

                usersList.innerHTML = `

                    <div class="empty-state">

                        <div class="empty-icon">
                            👥
                        </div>

                        <strong>
                            No users found
                        </strong>

                    </div>

                `;


                return;

            }


            usersList.innerHTML =
                users.map(
                    function (
                        user
                    ) {

                        const userId =

                            user.id ||

                            user.user_id ||

                            user.public_user_id ||

                            "";


                        const name =

                            user.full_name ||

                            user.fullName ||

                            user.name ||

                            "User";


                        const email =

                            user.email ||

                            "—";


                        const status =
                            String(

                                user.status ||

                                "active"

                            )
                            .trim()
                            .toLowerCase();


                        return `

                            <div
                                class="content-card"
                                style="
                                    margin-bottom:12px;
                                    padding:20px;
                                "
                            >

                                <strong
                                    style="
                                        font-size:20px;
                                    "
                                >
                                    ${escapeHtml(
                                        name
                                    )}
                                </strong>


                                <p>

                                    Email:

                                    ${escapeHtml(
                                        email
                                    )}

                                </p>


                                <p>

                                    Status:

                                    <strong>

                                        ${escapeHtml(
                                            status
                                        )}

                                    </strong>

                                </p>


                                <div
                                    style="
                                        display:flex;
                                        gap:10px;
                                        flex-wrap:wrap;
                                        margin-top:15px;
                                    "
                                >

                                    <button
                                        type="button"
                                        class="admin-user-action"
                                        data-user-id="${escapeAttribute(
                                            userId
                                        )}"
                                        data-user-status="active"
                                    >

                                        Unblock / Activate

                                    </button>


                                    <button
                                        type="button"
                                        class="admin-user-action"
                                        data-user-id="${escapeAttribute(
                                            userId
                                        )}"
                                        data-user-status="blocked"
                                    >

                                        Block

                                    </button>

                                </div>

                            </div>

                        `;

                    }
                )
                .join(
                    ""
                );


            bindUserActionButtons();

        }


        function bindUserActionButtons() {

            document
                .querySelectorAll(
                    ".admin-user-action"
                )
                .forEach(
                    function (
                        button
                    ) {

                        button.addEventListener(
                            "click",
                            async function () {

                                const userId =
                                    button.dataset.userId;


                                const status =
                                    button.dataset.userStatus;


                                if (
                                    !userId
                                ) {

                                    showMessage(

                                        "User ID not found.",

                                        "error"

                                    );


                                    return;

                                }


                                const confirmed =
                                    window.confirm(

                                        status ===
                                        "blocked"

                                            ?

                                            "Are you sure you want to block this user?"

                                            :

                                            "Are you sure you want to activate this user?"

                                    );


                                if (
                                    !confirmed
                                ) {

                                    return;

                                }


                                const originalText =
                                    button.textContent;


                                button.disabled =
                                    true;


                                button.textContent =
                                    "Processing...";


                                try {

                                    await window.apiRequest(

                                        "/api/admin/users/" +

                                        encodeURIComponent(
                                            userId
                                        ) +

                                        "/status",

                                        {

                                            method:
                                                "PATCH",

                                            body:
                                                {

                                                    status:
                                                        status

                                                }

                                        }

                                    );


                                    showMessage(

                                        status ===
                                        "blocked"

                                            ?

                                            "User blocked successfully."

                                            :

                                            "User activated successfully.",

                                        "success"

                                    );


                                    await loadUsers();

                                }

                                catch (
                                    error
                                ) {

                                    console.error(
                                        "UPDATE USER ERROR:",
                                        error
                                    );


                                    showMessage(

                                        getApiErrorMessage(

                                            error,

                                            "Unable to update user status"

                                        ),

                                        "error"

                                    );


                                    button.disabled =
                                        false;


                                    button.textContent =
                                        originalText;

                                }

                            }
                        );

                    }
                );

        }


        /* =================================================
           DEPOSITS
        ================================================= */

        async function loadDeposits() {

            const depositsList =
                document.getElementById(
                    "depositsList"
                );


            if (
                !depositsList
            ) {

                return;

            }


            depositsList.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        ⏳
                    </div>

                    <strong>
                        Loading deposit requests...
                    </strong>

                </div>

            `;


            try {

                /*
                ---------------------------------------------
                EXACT BACKEND ENDPOINT:
                GET /api/admin/deposits/pending
                ---------------------------------------------
                */

                const data =
                    await window.apiRequest(

                        "/api/admin/deposits/pending",

                        {

                            method:
                                "GET"

                        }

                    );


                const deposits =
                    getArrayFromResponse(
                        data,
                        "deposits"
                    );


                setText(
                    "pendingDeposits",
                    deposits.length
                );


                /*
                Current backend endpoint returns pending
                deposits only.
                */

                setText(
                    "totalDeposits",
                    deposits.length
                );


                renderDeposits(
                    deposits
                );

            }

            catch (
                error
            ) {

                console.error(
                    "LOAD DEPOSITS ERROR:",
                    error
                );


                const errorMessage =
                    getApiErrorMessage(

                        error,

                        "Unable to load deposits"

                    );


                depositsList.innerHTML = `

                    <div class="empty-state">

                        <div class="empty-icon">
                            ⚠️
                        </div>

                        <strong>
                            Unable to load deposits
                        </strong>

                        <p>
                            ${escapeHtml(
                                errorMessage
                            )}
                        </p>

                    </div>

                `;

            }

        }


        /* =================================================
           RENDER DEPOSITS
        ================================================= */

        function renderDeposits(
            deposits
        ) {

            const depositsList =
                document.getElementById(
                    "depositsList"
                );


            if (
                !depositsList
            ) {

                return;

            }


            if (

                !Array.isArray(
                    deposits
                ) ||

                deposits.length ===
                0

            ) {

                depositsList.innerHTML = `

                    <div class="empty-state">

                        <div class="empty-icon">
                            💳
                        </div>

                        <strong>
                            No pending deposit requests
                        </strong>

                        <p>
                            New customer deposit requests will appear here.
                        </p>

                    </div>

                `;


                return;

            }


            depositsList.innerHTML =
                deposits.map(
                    function (
                        deposit
                    ) {

                        const depositId =

                            deposit.id ||

                            deposit.deposit_id ||

                            deposit.public_deposit_id ||

                            "";


                        const name =

                            deposit.user_name ||

                            deposit.full_name ||

                            deposit.user_full_name ||

                            deposit.name ||

                            deposit.customer_name ||

                            "User";


                        const email =

                            deposit.user_email ||

                            deposit.email ||

                            "—";


                        const amount =

                            deposit.amount ||

                            deposit.deposit_amount ||

                            0;


                        const status =

                            deposit.status ||

                            "pending";


                        const utr =

                            deposit.utr_number ||

                            deposit.utr ||

                            deposit.transaction_id ||

                            deposit.transaction_reference ||

                            deposit.payment_reference ||

                            deposit.reference_number ||

                            "Not provided";


                        const paymentMethod =

                            deposit.payment_method ||

                            deposit.method ||

                            "UPI";


                        const upiId =

                            deposit.upi_id ||

                            deposit.payment_upi_id ||

                            deposit.sender_upi_id ||

                            "—";


                        const proofUrl =

                            deposit.payment_proof_url ||

                            deposit.proof_url ||

                            deposit.screenshot_url ||

                            deposit.payment_screenshot_url ||

                            null;


                        const createdAt =

                            deposit.created_at ||

                            deposit.createdAt ||

                            deposit.requested_at ||

                            deposit.requestedAt ||

                            null;


                        const safeDepositId =
                            escapeAttribute(
                                depositId
                            );


                        return `

                            <div
                                class="content-card deposit-request-card"
                                style="
                                    margin-bottom:18px;
                                    padding:22px;
                                    border:1px solid #d7dce5;
                                    border-radius:24px;
                                "
                            >

                                <div
                                    style="
                                        display:flex;
                                        justify-content:space-between;
                                        gap:15px;
                                        align-items:flex-start;
                                        flex-wrap:wrap;
                                    "
                                >

                                    <div>

                                        <strong
                                            style="
                                                font-size:22px;
                                            "
                                        >

                                            ${escapeHtml(
                                                name
                                            )}

                                        </strong>


                                        <p>

                                            ${escapeHtml(
                                                email
                                            )}

                                        </p>

                                    </div>


                                    <div>

                                        <strong>

                                            ${escapeHtml(
                                                String(
                                                    status
                                                )
                                            )}

                                        </strong>

                                    </div>

                                </div>


                                <hr
                                    style="
                                        margin:18px 0;
                                        border:0;
                                        border-top:1px solid #e5e7eb;
                                    "
                                >


                                <p>

                                    <strong>
                                        Amount:
                                    </strong>

                                    ${escapeHtml(
                                        formatAmount(
                                            amount
                                        )
                                    )}

                                </p>


                                <p>

                                    <strong>
                                        Payment Method:
                                    </strong>

                                    ${escapeHtml(
                                        paymentMethod
                                    )}

                                </p>


                                <p>

                                    <strong>
                                        UTR / Transaction ID:
                                    </strong>

                                    ${escapeHtml(
                                        utr
                                    )}

                                </p>


                                <p>

                                    <strong>
                                        UPI ID:
                                    </strong>

                                    ${escapeHtml(
                                        upiId
                                    )}

                                </p>


                                <p>

                                    <strong>
                                        Requested:
                                    </strong>

                                    ${escapeHtml(
                                        formatDate(
                                            createdAt
                                        )
                                    )}

                                </p>


                                ${

                                    proofUrl

                                        ?

                                        `

                                            <div
                                                style="
                                                    margin-top:20px;
                                                "
                                            >

                                                <strong>
                                                    Payment Proof / Screenshot
                                                </strong>


                                                <div
                                                    style="
                                                        margin-top:10px;
                                                    "
                                                >

                                                    <a
                                                        href="${escapeAttribute(
                                                            proofUrl
                                                        )}"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >

                                                        View Payment Proof / QR

                                                    </a>

                                                </div>

                                            </div>

                                        `

                                        :

                                        `

                                            <p
                                                style="
                                                    margin-top:18px;
                                                "
                                            >

                                                <strong>
                                                    Payment Proof:
                                                </strong>

                                                Not uploaded

                                            </p>

                                        `

                                }


                                <div
                                    style="
                                        display:flex;
                                        gap:12px;
                                        flex-wrap:wrap;
                                        margin-top:24px;
                                    "
                                >

                                    <button
                                        type="button"
                                        class="deposit-approve-button"
                                        data-deposit-id="${safeDepositId}"
                                    >

                                        ✓ Approve Deposit

                                    </button>


                                    <button
                                        type="button"
                                        class="deposit-reject-button"
                                        data-deposit-id="${safeDepositId}"
                                    >

                                        ✕ Reject Deposit

                                    </button>

                                </div>

                            </div>

                        `;

                    }
                )
                .join(
                    ""
                );


            bindDepositActionButtons();

        }


        /* =================================================
           DEPOSIT BUTTON EVENTS
        ================================================= */

        function bindDepositActionButtons() {

            document
                .querySelectorAll(
                    ".deposit-approve-button"
                )
                .forEach(
                    function (
                        button
                    ) {

                        button.addEventListener(
                            "click",
                            function () {

                                approveDeposit(

                                    button.dataset.depositId,

                                    button

                                );

                            }
                        );

                    }
                );


            document
                .querySelectorAll(
                    ".deposit-reject-button"
                )
                .forEach(
                    function (
                        button
                    ) {

                        button.addEventListener(
                            "click",
                            function () {

                                rejectDeposit(

                                    button.dataset.depositId,

                                    button

                                );

                            }
                        );

                    }
                );

        }


        /* =================================================
           APPROVE DEPOSIT
        ================================================= */

        async function approveDeposit(
            depositId,
            button
        ) {

            if (
                !depositId
            ) {

                showMessage(

                    "Deposit ID not found.",

                    "error"

                );


                return;

            }


            const confirmed =
                window.confirm(

                    "Are you sure you want to approve this deposit? Customer wallet will be credited."

                );


            if (
                !confirmed
            ) {

                return;

            }


            const originalText =
                button.textContent;


            button.disabled =
                true;


            button.textContent =
                "Approving...";


            try {

                /*
                ---------------------------------------------
                EXACT BACKEND ENDPOINT:
                POST /api/admin/deposits/:depositId/approve
                ---------------------------------------------
                */

                const data =
                    await window.apiRequest(

                        "/api/admin/deposits/" +

                        encodeURIComponent(
                            depositId
                        ) +

                        "/approve",

                        {

                            method:
                                "POST",

                            body:
                                {}

                        }

                    );


                showMessage(

                    data?.message ||

                    "Deposit approved successfully.",

                    "success"

                );


                await loadDeposits();

            }

            catch (
                error
            ) {

                console.error(
                    "APPROVE DEPOSIT ERROR:",
                    error
                );


                showMessage(

                    getApiErrorMessage(

                        error,

                        "Deposit approval failed."

                    ),

                    "error"

                );


                button.disabled =
                    false;


                button.textContent =
                    originalText;

            }

        }


        /* =================================================
           REJECT DEPOSIT
        ================================================= */

        async function rejectDeposit(
            depositId,
            button
        ) {

            if (
                !depositId
            ) {

                showMessage(

                    "Deposit ID not found.",

                    "error"

                );


                return;

            }


            const reason =
                window.prompt(

                    "Enter rejection reason (optional):",

                    ""

                );


            if (
                reason ===
                null
            ) {

                return;

            }


            const confirmed =
                window.confirm(

                    "Are you sure you want to reject this deposit request?"

                );


            if (
                !confirmed
            ) {

                return;

            }


            const originalText =
                button.textContent;


            button.disabled =
                true;


            button.textContent =
                "Rejecting...";


            try {

                /*
                ---------------------------------------------
                EXACT BACKEND ENDPOINT:
                POST /api/admin/deposits/:depositId/reject
                ---------------------------------------------
                */

                const data =
                    await window.apiRequest(

                        "/api/admin/deposits/" +

                        encodeURIComponent(
                            depositId
                        ) +

                        "/reject",

                        {

                            method:
                                "POST",

                            body:

                                {

                                    reason:
                                        String(
                                            reason ||
                                            ""
                                        )
                                        .trim() ||
                                        null

                                }

                        }

                    );


                showMessage(

                    data?.message ||

                    "Deposit rejected successfully.",

                    "success"

                );


                await loadDeposits();

            }

            catch (
                error
            ) {

                console.error(
                    "REJECT DEPOSIT ERROR:",
                    error
                );


                showMessage(

                    getApiErrorMessage(

                        error,

                        "Deposit rejection failed."

                    ),

                    "error"

                );


                button.disabled =
                    false;


                button.textContent =
                    originalText;

            }

        }


        /* =================================================
           REFRESH USERS
        ================================================= */

        const refreshUsersButton =
            document.getElementById(
                "refreshUsersButton"
            );


        if (
            refreshUsersButton
        ) {

            refreshUsersButton.addEventListener(

                "click",

                function () {

                    loadUsers();

                }

            );

        }


        /* =================================================
           REFRESH DEPOSITS
        ================================================= */

        const refreshDepositsButton =
            document.getElementById(
                "refreshDepositsButton"
            );


        if (
            refreshDepositsButton
        ) {

            refreshDepositsButton.addEventListener(

                "click",

                function () {

                    loadDeposits();

                }

            );

        }


        /* =================================================
           LOGOUT
        ================================================= */

        /*
        auth.js already handles:

        [data-action="logout"]

        Therefore we do not create another
        conflicting logout listener here.
        */


        /* =================================================
           INITIALIZATION
        ================================================= */

        loadAdminProfile();


        const hash =
            window.location.hash
                .replace(
                    "#",
                    ""
                );


        if (

            hash &&

            document.getElementById(
                hash
            )

        ) {

            showSection(
                hash
            );

        }


        else {

            const activeSection =
                document.querySelector(
                    ".dashboard-section.active-section"
                );


            if (

                activeSection &&

                activeSection.id ===
                "users"

            ) {

                loadUsers();

            }


            if (

                activeSection &&

                activeSection.id ===
                "deposits"

            ) {

                loadDeposits();

            }

        }


    }
);
