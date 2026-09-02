"use strict";


/* =========================================================
   ADMIN ELEMENT
========================================================= */

function adminElement(id) {

    return document.getElementById(
        id
    );

}


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
        String(value).trim()

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

    /*
       Show saved admin immediately.
    */

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


        /*
           If token is invalid, login again.
        */

        if (

            error?.status === 401 ||

            error?.status === 403

        ) {

            window.clearAuthData();

            redirectToLogin();

            return;

        }


        /*
           Network problem:
           Keep saved admin visible.
        */

        if (!savedAdmin) {

            redirectToLogin();

        }

    }

}


/* =========================================================
   ADMIN NAVIGATION
========================================================= */

function setupAdminNavigation() {

    const items =
        document.querySelectorAll(
            ".dashboard-nav a[href^='#']"
        );


    items.forEach(

        function (item) {

            item.addEventListener(

                "click",

                function (event) {

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


                    const target =
                        document.getElementById(
                            targetId
                        );


                    if (!target) {
                        return;
                    }


                    document
                        .querySelectorAll(
                            ".dashboard-content section"
                        )
                        .forEach(

                            function (section) {

                                section.style.display =
                                    "none";

                            }

                        );


                    target.style.display =
                        "block";


                    items.forEach(

                        function (nav) {

                            nav.classList.remove(
                                "active"
                            );

                        }

                    );


                    item.classList.add(
                        "active"
                    );


                    history.replaceState(

                        null,

                        "",

                        "#" +
                        targetId

                    );

                }

            );

        }

    );


    const sections =
        document.querySelectorAll(
            ".dashboard-content section"
        );


    sections.forEach(

        function (
            section,
            index
        ) {

            section.style.display =

                index === 0

                    ? "block"

                    : "none";

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

        setupAdminNavigation();

        setupAdminLogout();

        await loadAdminDashboard();

    }

);
