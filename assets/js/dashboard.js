"use strict";

document.addEventListener("DOMContentLoaded", function () {

    loadUserData();

    const logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            logoutUser
        );
    }
});


function loadUserData() {

    let user = null;

    try {
        const storedUser =
            sessionStorage.getItem("skillEarnUser");

        if (storedUser) {
            user = JSON.parse(storedUser);
        }
    } catch (error) {
        console.error(
            "Unable to read user session:",
            error
        );
    }


    if (!user) {
        window.location.href =
            "../login.html";

        return;
    }


    setText(
        "userName",
        user.fullName || "User"
    );


    setText(
        "userId",
        user.publicUserId || user.id || "—"
    );


    setText(
        "userEmail",
        user.email || "—"
    );


    setText(
        "accountStatus",
        "Active"
    );


    setText(
        "emailStatus",
        "Not Verified"
    );
}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value || "—";
    }
}


async function logoutUser() {

    const logoutButton =
        document.getElementById("logoutButton");


    if (logoutButton) {
        logoutButton.disabled = true;
        logoutButton.textContent =
            "Logging out...";
    }


    try {

        await fetch(
            "https://skillearnhub-1.onrender.com/api/auth/logout",
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Accept":
                        "application/json"
                }
            }
        );

    } catch (error) {

        console.warn(
            "Logout API error:",
            error
        );

    } finally {

        try {
            sessionStorage.removeItem(
                "skillEarnUser"
            );
        } catch (error) {
            console.warn(
                "Unable to clear session:",
                error
            );
        }


        window.location.href =
            "../login.html";
    }
}
