document.addEventListener("DOMContentLoaded", function () {


    /* =========================================
       ELEMENTS
    ========================================= */

    const sidebar = document.getElementById(
        "dashboardSidebar"
    );


    const overlay = document.getElementById(
        "sidebarOverlay"
    );


    const mobileMenuButton = document.getElementById(
        "mobileMenuButton"
    );


    const navItems = document.querySelectorAll(
        ".nav-item[data-section]"
    );


    const sections = document.querySelectorAll(
        ".dashboard-section"
    );


    const quickActionButtons = document.querySelectorAll(
        "[data-open-section]"
    );


    /* =========================================
       MOBILE MENU
    ========================================= */

    function openSidebar() {

        if (sidebar) {

            sidebar.classList.add("open");

        }


        if (overlay) {

            overlay.classList.add("visible");

        }

    }



    function closeSidebar() {

        if (sidebar) {

            sidebar.classList.remove("open");

        }


        if (overlay) {

            overlay.classList.remove("visible");

        }

    }



    if (mobileMenuButton) {

        mobileMenuButton.addEventListener(
            "click",
            function () {

                if (
                    sidebar &&
                    sidebar.classList.contains("open")
                ) {

                    closeSidebar();

                } else {

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

    function showSection(sectionId) {


        sections.forEach(
            function (section) {

                section.classList.remove(
                    "active-section"
                );

            }
        );


        const targetSection = document.getElementById(
            sectionId
        );


        if (targetSection) {

            targetSection.classList.add(
                "active-section"
            );

        }



        navItems.forEach(
            function (item) {

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

            top: 0,

            behavior: "smooth"

        });


        if (sectionId === "users") {

            loadUsers();

        }


        if (sectionId === "deposits") {

            loadDeposits();

        }

    }



    navItems.forEach(
        function (item) {


            item.addEventListener(
                "click",
                function (event) {


                    event.preventDefault();


                    const sectionId =
                        item.dataset.section;


                    showSection(
                        sectionId
                    );


                    window.history.replaceState(
                        null,
                        "",
                        "#" + sectionId
                    );

                }
            );


        }
    );



    /* =========================================
       QUICK ACTION BUTTONS
    ========================================= */

    quickActionButtons.forEach(
        function (button) {


            button.addEventListener(
                "click",
                function () {


                    const sectionId =
                        button.dataset.openSection;


                    showSection(
                        sectionId
                    );

                }
            );


        }
    );



    /* =========================================
       LOAD ADMIN PROFILE
    ========================================= */

    function loadAdminProfile() {


        try {


            const storedUser =
                localStorage.getItem(
                    "skilllearn_user"
                );


            if (!storedUser) {

                return;

            }


            const user =
                JSON.parse(
                    storedUser
                );


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


        } catch (error) {

            console.error(
                "Admin profile error:",
                error
            );

        }

    }



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


        if (!name) {

            return "A";

        }


        return name
            .trim()
            .charAt(0)
            .toUpperCase();

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


            const apiUrl =
                window.API_URL ||
                "";


            if (!apiUrl) {

                throw new Error(
                    "API URL not configured"
                );

            }


            const response =
                await fetch(
                    apiUrl + "/admin/users",
                    {

                        headers: getHeaders()

                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Unable to load users"
                );

            }


            const data =
                await response.json();


            const users =
                data.users ||
                data ||
                [];


            setText(
                "totalUsers",
                users.length
            );


            renderUsers(
                users
            );


        } catch (error) {


            console.error(
                error
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
                        Check backend API connection.
                    </p>

                </div>

            `;


            if (usersMessage) {

                usersMessage.style.display =
                    "block";


                usersMessage.textContent =
                    error.message;

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
            !Array.isArray(users) ||
            users.length === 0
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
                function (user) {


                    return `

                        <div
                            class="content-card"
                            style="margin-bottom: 12px;"
                        >

                            <strong>
                                ${
                                    escapeHtml(
                                        user.full_name ||
                                        user.name ||
                                        "User"
                                    )
                                }
                            </strong>

                            <p>
                                ${
                                    escapeHtml(
                                        user.email ||
                                        ""
                                    )
                                }
                            </p>

                        </div>

                    `;


                }
            ).join("");

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


            const apiUrl =
                window.API_URL ||
                "";


            if (!apiUrl) {

                throw new Error(
                    "API URL not configured"
                );

            }


            const response =
                await fetch(
                    apiUrl + "/admin/deposits",
                    {

                        headers: getHeaders()

                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Unable to load deposits"
                );

            }


            const data =
                await response.json();


            const deposits =
                data.deposits ||
                data ||
                [];


            setText(
                "pendingDeposits",
                deposits.length
            );


            setText(
                "totalDeposits",
                deposits.length
            );


            renderDeposits(
                deposits
            );


        } catch (error) {


            console.error(
                error
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
                        Check backend API connection.
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
            !Array.isArray(deposits) ||
            deposits.length === 0
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
                function (deposit) {


                    return `

                        <div
                            class="content-card"
                            style="margin-bottom: 12px;"
                        >

                            <strong>
                                ${
                                    escapeHtml(
                                        deposit.user_name ||
                                        deposit.name ||
                                        "User"
                                    )
                                }
                            </strong>

                            <p>
                                Amount:
                                ${
                                    escapeHtml(
                                        String(
                                            deposit.amount ||
                                            0
                                        )
                                    )
                                }
                            </p>

                            <p>
                                Status:
                                ${
                                    escapeHtml(
                                        deposit.status ||
                                        "pending"
                                    )
                                }
                            </p>

                        </div>

                    `;


                }
            ).join("");

    }



    /* =========================================
       REFRESH BUTTONS
    ========================================= */

    const refreshUsersButton =
        document.getElementById(
            "refreshUsersButton"
        );


    if (refreshUsersButton) {

        refreshUsersButton.addEventListener(
            "click",
            loadUsers
        );

    }



    const refreshDepositsButton =
        document.getElementById(
            "refreshDepositsButton"
        );


    if (refreshDepositsButton) {

        refreshDepositsButton.addEventListener(
            "click",
            loadDeposits
        );

    }



    /* =========================================
       LOGOUT
    ========================================= */

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {


        logoutButton.addEventListener(
            "click",
            function () {


                localStorage.removeItem(
                    "skilllearn_user"
                );


                localStorage.removeItem(
                    "skilllearn_token"
                );


                localStorage.removeItem(
                    "token"
                );


                window.location.href =
                    "../login.html";


            }
        );


    }



    /* =========================================
       AUTHORIZATION HEADERS
    ========================================= */

    function getHeaders() {


        const token =
            localStorage.getItem(
                "skilllearn_token"
            ) ||
            localStorage.getItem(
                "token"
            );


        const headers = {

            "Content-Type":
                "application/json"

        };


        if (token) {

            headers.Authorization =
                "Bearer " + token;

        }


        return headers;

    }



    /* =========================================
       HTML ESCAPE
    ========================================= */

    function escapeHtml(
        value
    ) {


        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            value;


        return div.innerHTML;

    }



    /* =========================================
       INITIALIZE
    ========================================= */

    loadAdminProfile();


    const hash =
        window.location.hash.replace(
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


});
