"use strict";


document.addEventListener(
    "DOMContentLoaded",
    function () {


        /* =========================================
           ELEMENTS
        ========================================= */

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


        const refreshUsersButton =
            document.getElementById(
                "refreshUsersButton"
            );


        const refreshDepositsButton =
            document.getElementById(
                "refreshDepositsButton"
            );


        const logoutButton =
            document.getElementById(
                "logoutButton"
            );


        /* =========================================
           HELPERS
        ========================================= */

        function setText(
            id,
            value
        ) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.textContent =
                    value;

            }

        }



        function getInitial(
            name
        ) {

            return String(
                name ||
                "Admin"
            )
            .trim()
            .charAt(0)
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
                String(
                    value ??
                    ""
                );


            return div.innerHTML;

        }



        function getRole(
            user
        ) {

            return String(

                user?.role ||

                user?.userRole ||

                user?.user_role ||

                ""

            )
            .trim()
            .toLowerCase();

        }



        /* =========================================
           ADMIN AUTH CHECK
        ========================================= */

        function getAdminUser() {

            if (
                typeof window.getSavedUser !==
                "function"
            ) {

                return null;

            }


            return window.getSavedUser();

        }



        function redirectToLogin() {

            if (
                typeof window.clearAuthData ===
                "function"
            ) {

                window.clearAuthData();

            }


            window.location.assign(
                "../login.html"
            );

        }



        function validateAdmin() {

            const user =
                getAdminUser();


            const token =
                typeof window.getAuthToken ===
                "function"

                    ? window.getAuthToken()

                    : null;


            if (
                !user ||
                !token
            ) {

                redirectToLogin();

                return null;

            }


            const role =
                getRole(
                    user
                );


            if (

                role !== "admin" &&

                role !== "administrator"

            ) {

                window.location.assign(
                    "../user/dashboard.html"
                );

                return null;

            }


            return user;

        }



        /* =========================================
           MOBILE SIDEBAR
        ========================================= */

        function openSidebar() {

            if (sidebar) {

                sidebar.classList.add(
                    "open"
                );

            }


            if (overlay) {

                overlay.classList.add(
                    "visible"
                );

                overlay.hidden =
                    false;

            }

        }



        function closeSidebar() {

            if (sidebar) {

                sidebar.classList.remove(
                    "open"
                );

            }


            if (overlay) {

                overlay.classList.remove(
                    "visible"
                );

                overlay.hidden =
                    true;

            }

        }



        if (mobileMenuButton) {

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



        if (overlay) {

            overlay.addEventListener(

                "click",

                closeSidebar

            );

        }



        /* =========================================
           SECTION NAVIGATION
        ========================================= */

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


            if (targetSection) {

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


            if (
                sectionId ===
                "users"
            ) {

                loadUsers();

            }


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



        /* =========================================
           QUICK ACTIONS
        ========================================= */

        quickActionButtons.forEach(

            function (
                button
            ) {

                button.addEventListener(

                    "click",

                    function () {

                        const sectionId =
                            button.dataset
                                .openSection;


                        if (
                            sectionId
                        ) {

                            showSection(
                                sectionId
                            );

                        }

                    }

                );

            }

        );



        /* =========================================
           LOAD ADMIN PROFILE
        ========================================= */

        function loadAdminProfile(
            user
        ) {

            if (!user) {

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
                getRole(
                    user
                ) ||

                "admin";


            const initial =
                getInitial(
                    name
                );


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
                initial
            );


            setText(
                "topbarAvatar",
                initial
            );

        }



        /* =========================================
           USERS
        ========================================= */

        async function loadUsers() {

            const usersList =
                document.getElementById(
                    "usersList"
                );


            const usersMessage =
                document.getElementById(
                    "usersMessage"
                );


            if (!usersList) {

                return;

            }


            if (usersMessage) {

                usersMessage.style.display =
                    "none";


                usersMessage.textContent =
                    "";

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
                    Array.isArray(
                        data
                    )

                        ? data

                        : (

                            data?.users ||

                            data?.data?.users ||

                            data?.data ||

                            []

                        );


                setText(
                    "totalUsers",
                    Array.isArray(
                        users
                    )

                        ? users.length

                        : 0
                );


                renderUsers(
                    users
                );

            }

            catch (
                error
            ) {

                console.error(
                    "LOAD USERS ERROR:",
                    error
                );


                if (
                    error?.status ===
                    401
                ) {

                    redirectToLogin();

                    return;

                }


                if (
                    error?.status ===
                    403
                ) {

                    usersList.innerHTML = `

                        <div class="empty-state">

                            <div class="empty-icon">
                                🔒
                            </div>

                            <strong>
                                Admin access denied
                            </strong>

                            <p>
                                Your account does not have permission
                                to view users.
                            </p>

                        </div>

                    `;

                    return;

                }


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
                                error?.message ||
                                "Please check the backend API."
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
                        error?.message ||
                        "Unable to load users.";

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


            if (!usersList) {

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

                        <p>
                            Registered users will appear here.
                        </p>

                    </div>

                `;


                return;

            }


            usersList.innerHTML =
                users.map(

                    function (
                        user
                    ) {

                        const name =
                            user.full_name ||

                            user.fullName ||

                            user.name ||

                            "User";


                        const email =
                            user.email ||
                            "—";


                        const userId =
                            user.public_user_id ||

                            user.publicUserId ||

                            user.id ||

                            "—";


                        const role =
                            user.role ||
                            "user";


                        return `

                            <div
                                class="content-card"
                                style="margin-bottom: 12px;"
                            >

                                <strong>
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
                                    User ID:
                                    ${escapeHtml(
                                        userId
                                    )}
                                </p>

                                <p>
                                    Role:
                                    ${escapeHtml(
                                        role
                                    )}
                                </p>

                            </div>

                        `;

                    }

                )
                .join(
                    ""
                );

        }



        /* =========================================
           DEPOSITS
        ========================================= */

        async function loadDeposits() {

            const depositsList =
                document.getElementById(
                    "depositsList"
                );


            if (!depositsList) {

                return;

            }


            depositsList.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        ⏳
                    </div>

                    <strong>
                        Loading deposits...
                    </strong>

                </div>

            `;


            try {

                const data =
                    await window.apiRequest(

                        "/api/admin/deposits",

                        {

                            method:
                                "GET"

                        }

                    );


                const deposits =
                    Array.isArray(
                        data
                    )

                        ? data

                        : (

                            data?.deposits ||

                            data?.data?.deposits ||

                            data?.data ||

                            []

                        );


                const pending =
                    Array.isArray(
                        deposits
                    )

                        ? deposits.filter(

                            function (
                                deposit
                            ) {

                                return String(

                                    deposit.status ||
                                    ""

                                )
                                .toLowerCase() ===
                                "pending";

                            }

                        ).length

                        : 0;


                setText(
                    "pendingDeposits",
                    pending
                );


                setText(
                    "totalDeposits",

                    Array.isArray(
                        deposits
                    )

                        ? deposits.length

                        : 0

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


                if (
                    error?.status ===
                    401
                ) {

                    redirectToLogin();

                    return;

                }


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

                                error?.message ||

                                "Please check the backend API."

                            )}
                        </p>

                    </div>

                `;

            }

        }



        function renderDeposits(
            deposits
        ) {

            const depositsList =
                document.getElementById(
                    "depositsList"
                );


            if (!depositsList) {

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
                            No deposit requests
                        </strong>

                        <p>
                            New deposit requests will appear here.
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

                        const name =
                            deposit.user_name ||

                            deposit.userName ||

                            deposit.full_name ||

                            deposit.name ||

                            "User";


                        const amount =
                            deposit.amount ??
                            0;


                        const status =
                            deposit.status ||
                            "pending";


                        return `

                            <div
                                class="content-card"
                                style="margin-bottom: 12px;"
                            >

                                <strong>
                                    ${escapeHtml(
                                        name
                                    )}
                                </strong>

                                <p>
                                    Amount:
                                    ₹${escapeHtml(
                                        amount
                                    )}
                                </p>

                                <p>
                                    Status:
                                    ${escapeHtml(
                                        status
                                    )}
                                </p>

                            </div>

                        `;

                    }

                )
                .join(
                    ""
                );

        }



        /* =========================================
           REFRESH
        ========================================= */

        if (
            refreshUsersButton
        ) {

            refreshUsersButton.addEventListener(

                "click",

                loadUsers

            );

        }


        if (
            refreshDepositsButton
        ) {

            refreshDepositsButton.addEventListener(

                "click",

                loadDeposits

            );

        }



        /* =========================================
           LOGOUT
        ========================================= */

        if (
            logoutButton
        ) {

            logoutButton.addEventListener(

                "click",

                async function () {

                    if (

                        window.SkillEarnAuth &&

                        typeof window.SkillEarnAuth.logout ===
                        "function"

                    ) {

                        await window.SkillEarnAuth.logout();

                        return;

                    }


                    redirectToLogin();

                }

            );

        }



        /* =========================================
           INITIALIZE
        ========================================= */

        const admin =
            validateAdmin();


        if (!admin) {

            return;

        }


        loadAdminProfile(
            admin
        );


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

    }
);
