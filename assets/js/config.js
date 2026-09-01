/* =========================================================
   SkillEarn Hub
   assets/js/config.js
   ========================================================= */

"use strict";

/*
 * Backend API configuration
 *
 * Change only API_BASE_URL if your backend is hosted
 * somewhere else.
 */

const SKILLEARN_CONFIG = {

    // Backend API base URL
    API_BASE_URL: "http://localhost:3000/api",

    // Authentication endpoints
    AUTH: {
        REGISTER: "/auth/register",
        LOGIN: "/auth/login",
        LOGOUT: "/auth/logout",
        ME: "/auth/me",
        FORGOT_PASSWORD: "/auth/forgot-password",
        RESET_PASSWORD: "/auth/reset-password"
    },

    // Request settings
    REQUEST: {
        TIMEOUT: 15000,
        CREDENTIALS: "include"
    },

    // Local storage keys
    STORAGE: {
        TOKEN: "skillearn_access_token",
        USER: "skillearn_user"
    }

};


/*
 * Helper function to create a complete API URL.
 *
 * Example:
 * apiUrl("/auth/login")
 *
 * becomes:
 * http://localhost:3000/api/auth/login
 */

function apiUrl(endpoint) {

    const baseUrl = SKILLEARN_CONFIG.API_BASE_URL.replace(/\/+$/, "");

    const path = String(endpoint || "").replace(/^\/+/, "");

    return `${baseUrl}/${path}`;
}


/*
 * Get saved authentication token.
 */

function getAuthToken() {

    return localStorage.getItem(
        SKILLEARN_CONFIG.STORAGE.TOKEN
    );

}


/*
 * Save authentication token.
 */

function setAuthToken(token) {

    if (!token) {
        localStorage.removeItem(
            SKILLEARN_CONFIG.STORAGE.TOKEN
        );

        return;
    }

    localStorage.setItem(
        SKILLEARN_CONFIG.STORAGE.TOKEN,
        token
    );

}


/*
 * Remove authentication token.
 */

function removeAuthToken() {

    localStorage.removeItem(
        SKILLEARN_CONFIG.STORAGE.TOKEN
    );

}


/*
 * Get saved user.
 */

function getSavedUser() {

    const user = localStorage.getItem(
        SKILLEARN_CONFIG.STORAGE.USER
    );

    if (!user) {
        return null;
    }

    try {

        return JSON.parse(user);

    } catch (error) {

        console.error(
            "Invalid saved user data:",
            error
        );

        localStorage.removeItem(
            SKILLEARN_CONFIG.STORAGE.USER
        );

        return null;
    }

}


/*
 * Save user information.
 */

function setSavedUser(user) {

    if (!user) {

        localStorage.removeItem(
            SKILLEARN_CONFIG.STORAGE.USER
        );

        return;
    }

    localStorage.setItem(
        SKILLEARN_CONFIG.STORAGE.USER,
        JSON.stringify(user)
    );

}


/*
 * Remove saved user.
 */

function removeSavedUser() {

    localStorage.removeItem(
        SKILLEARN_CONFIG.STORAGE.USER
    );

}


/*
 * Clear complete authentication data.
 */

function clearAuthData() {

    removeAuthToken();
    removeSavedUser();

}


/*
 * Build default API headers.
 */

function getApiHeaders() {

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    const token = getAuthToken();

    if (token) {

        headers.Authorization = `Bearer ${token}`;

    }

    return headers;

}


/*
 * Export configuration for auth.js
 *
 * These variables are intentionally global because
 * config.js is loaded before auth.js in the HTML files.
 */

window.SKILLEARN_CONFIG = SKILLEARN_CONFIG;
window.apiUrl = apiUrl;

window.getAuthToken = getAuthToken;
window.setAuthToken = setAuthToken;
window.removeAuthToken = removeAuthToken;

window.getSavedUser = getSavedUser;
window.setSavedUser = setSavedUser;
window.removeSavedUser = removeSavedUser;

window.clearAuthData = clearAuthData;
window.getApiHeaders = getApiHeaders;
