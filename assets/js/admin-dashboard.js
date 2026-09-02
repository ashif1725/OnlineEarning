"use strict";


function adminElement(id) {

    return document.getElementById(id);

}


function setAdminText(
    id,
    value
) {

    const element =
        adminElement(id);


    if (!element) {

        return;

    }


    element.textContent =
        value ||
        "—";

}


async function loadAdminDashboard() {

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
            result?.user;


        if (!user) {

            throw new Error(
                "Unable to load user."
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

            alert(
                "Administrator access is required."
            );


            window.location.href =
                "../user/dashboard.html";

            return;

        }


        window.setSavedUser(
            user
        );


        const name =
            user.fullName ||
            "Admin";


        const email =
            user.email ||
            "—";


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
            user.role
        );


        const avatar =
            adminElement(
                "adminAvatar"
            );


        if (avatar) {

            avatar.textContent =
                name
                    .charAt(0)
                    .toUpperCase();

        }


    } catch (error) {

        console.error(
            "ADMIN DASHBOARD ERROR:",
            error
        );


        window.clearAuthData();


        window.location.href =
            "../login.html";

    }

}


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


                window.location.href =
                    "../login.html";

            }

        }
    );

}


document.addEventListener(
    "DOMContentLoaded",
    async function () {

        await loadAdminDashboard();

        setupAdminLogout();

    }
);
