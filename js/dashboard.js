/*

* =========================================================
* SKILLEARN HUB
* USER DASHBOARD UI
* 
* This file handles dashboard navigation and presentation.
* It does not contain wallet/account financial logic.
* =========================================================
  */

"use strict";

/* =========================================================
ELEMENTS
========================================================= */

const sidebar = document.getElementById("dashboardSidebar");
const overlay = document.getElementById("sidebarOverlay");
const menuButton = document.getElementById("mobileMenuButton");
const closeButton = document.getElementById("sidebarClose");
const logoutButton = document.getElementById("logoutButton");

/* =========================================================
MOBILE SIDEBAR
========================================================= */

function openSidebar() {

if (!sidebar || !overlay) return;

sidebar.classList.add("open");
overlay.classList.add("open");

document.body.style.overflow = "hidden";

}

function closeSidebar() {

if (!sidebar || !overlay) return;

sidebar.classList.remove("open");
overlay.classList.remove("open");

document.body.style.overflow = "";

}

if (menuButton) {
menuButton.addEventListener("click", openSidebar);
}

if (closeButton) {
closeButton.addEventListener("click", closeSidebar);
}

if (overlay) {
overlay.addEventListener("click", closeSidebar);
}

/* =========================================================
CLOSE SIDEBAR AFTER NAVIGATION
========================================================= */

document.querySelectorAll(".dashboard-nav a").forEach(link => {

link.addEventListener("click", () => {
    closeSidebar();
});

});

/* =========================================================
LOGOUT UI
========================================================= */

if (logoutButton) {

logoutButton.addEventListener("click", () => {

    /*
     * Real logout/session destruction will be connected
     * to the authentication provider later.
     */

    const shouldLogout = window.confirm(
        "Are you sure you want to sign out?"
    );

    if (!shouldLogout) return;

    window.location.href = "login.html";

});

}

/* =========================================================
DEMO USER DISPLAY

IMPORTANT:
No sensitive authentication information is stored here.
These are only presentation placeholders until the real
authenticated user profile is connected.
========================================================= */

function getDisplayName() {

return "Welcome User";

}

function getInitial(name) {

if (!name || !name.trim()) {
    return "A";
}

return name.trim().charAt(0).toUpperCase();

}

function updateUserInterface() {

const displayName = getDisplayName();
const initial = getInitial(displayName);

const sidebarName =
    document.getElementById("sidebarUserName");

const topbarName =
    document.getElementById("topbarUserName");

const sidebarAvatar =
    document.getElementById("sidebarAvatar");

const topbarAvatar =
    document.getElementById("topbarAvatar");

const greeting =
    document.getElementById("dashboardGreeting");


if (sidebarName) {
    sidebarName.textContent = displayName;
}

if (topbarName) {
    topbarName.textContent = displayName;
}

if (sidebarAvatar) {
    sidebarAvatar.textContent = initial;
}

if (topbarAvatar) {
    topbarAvatar.textContent = initial;
}

if (greeting) {
    greeting.textContent = "Welcome back";
}

}

updateUserInterface();

/* =========================================================
TOPBAR PROFILE
========================================================= */

const topbarProfile =
document.getElementById("topbarProfile");

if (topbarProfile) {

topbarProfile.addEventListener("click", () => {

    window.location.href = "profile.html";

});

}

/* =========================================================
KEYBOARD ACCESSIBILITY
========================================================= */

document.addEventListener("keydown", event => {

if (event.key === "Escape") {
    closeSidebar();
}

});
