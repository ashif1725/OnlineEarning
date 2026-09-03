"use strict";


/* =========================================================
   ELEMENT
========================================================= */

function adminElement(
    id
) {

    return document.getElementById(
        id
    );

}



/* =========================================================
   SET TEXT
========================================================= */

function setAdminText(
    id,
    value
) {

    const element =
        adminElement(
            id
        );


    if (!element) {

        return;

    }


    element.textContent =

        value !== undefined &&
        value !== null &&
        String(
            value
        ).trim()

            ? value

            : "—";

}



/* =========================================================
   REDIRECT LOGIN
========================================================= */

function redirectToLogin() {

    window.location.assign(
        "../login.html"
    );

}



/* =========================================================
   GET SAVED ADMIN
========================================================= */

function getSavedAdmin() {

    if (

        typeof window.getSavedUser !==
        "function"

    ) {

        return null;

    }


    const user =
        window.getSavedUser();


    if (!user) {

        return null;

    }


    const role =
        String(

            user.role ||
            ""

        )
        .trim()
        .toLowerCase();


    if (

        role === "admin" ||

        role === "administrator"

    ) {

        return user;

    }


    return null;

}



/* =========================================================
   RENDER ADMIN
========================================================= */

function renderAdmin(
    user
) {

    if (!user) {

        return;

    }


    const name =

        user.fullName ||

        user.full_name ||

        "Admin";


    const email =

        user.email ||

        "—";


    const role =

        user.role ||

        "admin";


    setAdminText(
        "adminName",
        name
    );


    setAdminText(
        "adminEmail",
        email
    );


    setAdminText(
        "adminWelcomeName",
        name
    );


    setAdminText(
        "adminProfileEmail",
        email
    );


    setAdminText(
        "adminRole",
        role
    );


    const avatar =
        adminElement(
            "adminAvatar"
        );


    if (avatar) {

        avatar.textContent =
            String(
                name
            )
            .charAt(0)
            .toUpperCase();

    }

}



/* =========================================================
   LOAD ADMIN
========================================================= */

async function loadAdminDashboard() {

    const savedAdmin =
        getSavedAdmin();


    if (savedAdmin) {

        renderAdmin(
            savedAdmin
        );

    }


    try {

        const result =
            await window.apiRequest(

                "/api/auth/me",

                {
                    method:
                        "GET"
                }

            );


        const user =
            window.extractUser(
                result
            );


        if (!user) {

            throw new Error(
                "Unable to load administrator account."
            );

        }


        const role =
            String(

                user.role ||

                ""

            )
            .trim()
            .toLowerCase();


        if (

            role !== "admin" &&

            role !== "administrator"

        ) {

            window.location.assign(
                "../user/dashboard.html"
            );

            return;

        }


        window.setSavedUser(
            user
        );


        renderAdmin(
            user
        );


    } catch (error) {

        console.error(
            "ADMIN DASHBOARD ERROR:",
            error
        );


        if (

            error?.status === 401 ||

            error?.status === 403

        ) {

            window.clearAuthData();

            redirectToLogin();

            return;

        }


        if (!savedAdmin) {

            redirectToLogin();

        }

    }

}



/* =========================================================
   MOBILE MENU
========================================================= */

function setupMobileMenu() {

    const button =
        adminElement(
            "mobileMenuButton"
        );


    const sidebar =
        adminElement(
            "dashboardSidebar"
        );


    const overlay =
        adminElement(
            "sidebarOverlay"
        );


    if (

        !button ||

        !sidebar ||

        !overlay

    ) {

        return;

    }


    function openMenu() {

        sidebar.classList.add(
            "open"
        );


        overlay.classList.add(
            "visible"
        );

    }


    function closeMenu() {

        sidebar.classList.remove(
            "open"
        );


        overlay.classList.remove(
            "visible"
        );

    }


    button.addEventListener(

        "click",

        function () {

            if (

                sidebar.classList.contains(
                    "open"
                )

            ) {

                closeMenu();

            } else {

                openMenu();

            }

        }

    );


    overlay.addEventListener(

        "click",

        closeMenu

    );


    return {

        closeMenu

    };

}



/* =========================================================
   SHOW SECTION
========================================================= */

function showAdminSection(
    targetId
) {

    const sections =
        document.querySelectorAll(
            ".dashboard-section"
        );


    sections.forEach(

        function (
            section
        ) {

            section.classList.remove(
                "active-section"
            );

        }

    );


    const target =
        document.getElementById(
            targetId
        );


    if (target) {

        target.classList.add(
            "active-section"
        );

    }


    const items =
        document.querySelectorAll(
            ".dashboard-nav a[href^='#']"
        );


    items.forEach(

        function (
            item
        ) {

            const href =
                item.getAttribute(
                    "href"
                );


            if (

                href ===
                "#" + targetId

            ) {

                item.classList.add(
                    "active"
                );

            } else {

                item.classList.remove(
                    "active"
                );

            }

        }

    );


    history.replaceState(

        null,

        "",

        "#" +
        targetId

    );


    if (

        targetId ===
        "users"

    ) {

        loadUsers();

    }

}



/* =========================================================
   ADMIN NAVIGATION
========================================================= */

function setupAdminNavigation(
    mobileMenu
) {

    const items =
        document.querySelectorAll(
            ".dashboard-nav a[href^='#']"
        );


    items.forEach(

        function (
            item
        ) {

            item.addEventListener(

                "click",

                function (
                    event
                ) {

                    event.preventDefault();


                    const targetId =
                        item
                            .getAttribute(
                                "href"
                            )
                            .replace(
                                "#",
                                ""
                            );


                    showAdminSection(
                        targetId
                    );


                    if (

                        mobileMenu &&
                        typeof mobileMenu.closeMenu ===
                        "function"

                    ) {

                        mobileMenu.closeMenu();

                    }

                }

            );

        }

    );


    const hash =
        window.location.hash
            .replace(
                "#",
                ""
            );


    if (

        hash === "users" ||

        hash === "deposits" ||

        hash === "overview"

    ) {

        showAdminSection(
            hash
        );

    }

}



/* =========================================================
   USERS MESSAGE
========================================================= */

function showUsersMessage(
    message
) {

    const element =
        adminElement(
            "usersMessage"
        );


    if (!element) {

        return;

    }


    if (!message) {

        element.style.display =
            "none";

        element.textContent =
            "";

        return;

    }


    element.style.display =
        "block";


    element.textContent =
        message;

}



/* =========================================================
   LOAD USERS
========================================================= */

async function loadUsers() {

    const usersList =
        adminElement(
            "usersList"
        );


    if (!usersList) {

        return;

    }


    usersList.innerHTML =

        `
        <div class="empty-state">

            <strong>
                Loading users...
            </strong>

            <p>
                Please wait.
            </p>

        </div>
        `;


    showUsersMessage(
        ""
    );


    try {

        const result =
            await window.apiRequest(

                "/api/admin/users",

                {
                    method:
                        "GET"
                }

            );


        const users =
            Array.isArray(
                result?.users
            )

                ? result.users

                : [];


        if (
            users.length === 0
        ) {

            usersList.innerHTML =

                `
                <div class="empty-state">

                    <strong>
                        No users found
                    </strong>

                    <p>
                        There are currently no users.
                    </p>

                </div>
                `;


            return;

        }


        usersList.innerHTML =
            "";


        users.forEach(

            function (
                user
            ) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "content-card";


                const name =

                    user.full_name ||

                    user.fullName ||

                    "Unknown User";


                const email =

                    user.email ||

                    "—";


                const publicUserId =

                    user.public_user_id ||

                    user.publicUserId ||

                    "—";


                const status =

                    user.account_status ||

                    "unknown";


                card.innerHTML =

                    `
                    <strong>
                        ${escapeHtml(name)}
                    </strong>

                    <p>
                        ${escapeHtml(email)}
                    </p>

                    <p>
                        User ID:
                        ${escapeHtml(publicUserId)}
                    </p>

                    <p>
                        Status:
                        ${escapeHtml(status)}
                    </p>
                    `;


                usersList.appendChild(
                    card
                );

            }

        );


    } catch (error) {

        console.error(
            "LOAD USERS ERROR:",
            error
        );


        usersList.innerHTML =

            `
            <div class="empty-state">

                <strong>
                    Unable to load users
                </strong>

                <p>
                    Please try again.
                </p>

            </div>
            `;


        showUsersMessage(
            error?.message ||
            "Users could not be loaded."
        );

    }

}



/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value === undefined ||
        value === null

            ? ""

            : String(
                value
            );


    return div.innerHTML;

}



/* =========================================================
   REFRESH USERS
========================================================= */

function setupUsersRefresh() {

    const button =
        adminElement(
            "refreshUsersButton"
        );


    if (!button) {

        return;

    }


    button.addEventListener(

        "click",

        async function () {

            button.disabled =
                true;


            try {

                await loadUsers();

            } finally {

                button.disabled =
                    false;

            }

        }

    );

}



/* =========================================================
   LOGOUT
========================================================= */

function setupAdminLogout() {

    const button =
        adminElement(
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


            try {

                await window.apiRequest(

                    "/api/auth/logout",

                    {
                        method:
                            "POST"
                    }

                );

            } catch (error) {

                console.warn(
                    "ADMIN LOGOUT ERROR:",
                    error
                );

            } finally {

                window.clearAuthData();

                redirectToLogin();

            }

        }

    );

}



/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    async function () {

        const mobileMenu =
            setupMobileMenu();


        setupAdminNavigation(
            mobileMenu
        );


        setupAdminLogout();


        setupUsersRefresh();


        await loadAdminDashboard();

    }

);
