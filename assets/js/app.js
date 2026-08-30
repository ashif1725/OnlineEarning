"use strict";

/*
 * SkillEarn Hub
 * Application Bootstrap
 *
 * IMPORTANT:
 * Financial operations must NOT be implemented
 * in client-side JavaScript.
 */

document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});


function initializeApp() {
    setCurrentYear();
}


function setCurrentYear() {
    const yearElement = document.getElementById("currentYear");

    if (!yearElement) {
        return;
    }

    yearElement.textContent = new Date().getFullYear();
}
