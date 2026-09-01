"use strict";

document.addEventListener("DOMContentLoaded", function () {
    loadDashboard();
    setupLogout();
});


function loadDashboard() {
    try {
        const storedUser =
            sessionStorage.getItem("skillEarnUser");

        if (!storedUser) {
            window.location.href = "../login.html";
            return;
        }

        const user = JSON.parse(storedUser);

        setText(
            "userName",
            user.fullName || user.name
        );

        setText(
            "userId",
            user.publicUserId || user.userId || user.id
        );

        setText(
            "userEmail",
            user.email
        );

        setText(
            "accountStatus",
            user.accountStatus || "Active"
        );

        setText(
            "emailStatus",
            user.emailVerified
                ? "Verified"
                : "Not Verified"
        );

    } catch (error) {
        console.error(
            "Dashboard loading error:",
            error
        );
    }
}


function setText(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value || "—";
    }
}


function setupLogout() {
    const logoutButton =
        document.getElementById("logoutButton");

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener(
        "click",
        async function () {

            const API_BASE_URL =
                "https://skillearnhub-1.onrender.com";

            try {
                await fetch(
                    API_BASE_URL +
                    "/api/auth/logout",
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
                    "Logout API request failed:",
                    error
                );
            }

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
    );
}
