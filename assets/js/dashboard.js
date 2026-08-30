"use strict";


document.addEventListener(
    "DOMContentLoaded",
    loadDashboard
);


async function loadDashboard() {

    try {

        const response =
            await fetch(
                "/api/profile/me",
                {
                    method: "GET",

                    credentials: "include",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (response.status === 401) {

            window.location.href =
                "../login.html";

            return;
        }


        if (!response.ok) {

            throw new Error(
                "Unable to load profile"
            );
        }


        const data =
            await response.json();


        const user =
            data.user;


        setText(
            "userName",
            user.name
        );


        setText(
            "userId",
            user.userId
        );


        setText(
            "userEmail",
            user.email
        );


        setText(
            "accountStatus",
            user.accountStatus
        );


        setText(
            "emailStatus",
            user.emailVerified
                ? "Verified"
                : "Not Verified"
        );


    } catch (error) {

        console.error(error);

    }
}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {
        element.textContent =
            value ?? "—";
    }
}


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await fetch(
                    "/api/auth/logout",
                    {
                        method: "POST",
                        credentials: "include"
                    }
                );

            } finally {

                window.location.href =
                    "../login.html";
            }

        }
    );
}
