/* =========================================================
   SkillEarn Hub
   assets/js/config.js
   ========================================================= */

"use strict";

/*
 * =========================================================
 * PRODUCTION BACKEND CONFIGURATION
 * =========================================================
 */

const SKILLEARN_CONFIG = {

    /*
     * IMPORTANT:
     * केवल public backend URL रखें।
     *
     * कोई DATABASE_URL
     * कोई password
     * कोई JWT secret
     * कोई private API key
     * यहाँ नहीं रखना है।
     */

    API_BASE_URL:
        "https://skillearnhub-1.onrender.com",

    /*
     * Authentication endpoints
     */

    AUTH: {

        REGISTER:
            "/auth/register",

        LOGIN:
            "/auth/login",

        LOGOUT:
            "/auth/logout",

        ME:
            "/auth/me",

        FORGOT_PASSWORD:
            "/auth/forgot-password",

        RESET_PASSWORD:
            "/auth/reset-password"
    },

    /*
     * Request settings
     */

    REQUEST: {

        TIMEOUT:
            15000,

        CREDENTIALS:
            "include"
    },

    /*
     * Local storage keys
     */

    STORAGE: {

        TOKEN:
            "skillearn_access_token",

        USER:
            "skillearn_user"
    }

};


/*
 * =========================================================
 * BACKWARD COMPATIBILITY
 * =========================================================
 *
 * auth.js currently reads:
 *
 * window.APP_CONFIG.API_BASE_URL
 *
 * इसलिए APP_CONFIG भी expose किया गया है।
 */

window.APP_CONFIG = {

    API_BASE_URL:
        SKILLEARN_CONFIG.API_BASE_URL

};


/*
 * =========================================================
 * API URL HELPER
 * =========================================================
 */

function apiUrl(endpoint) {

    const baseUrl =
        SKILLEARN_CONFIG.API_BASE_URL
            .replace(/\/+$/, "");

    const path =
        String(endpoint || "")
            .replace(/^\/+/, "");

    return `${baseUrl}/${path}`;
}


/*
 * =========================================================
 * AUTH TOKEN
 * =========================================================
 */

function getAuthToken() {

    return localStorage.getItem(
        SKILLEARN_CONFIG.STORAGE.TOKEN
    );

}


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


function removeAuthToken() {

    localStorage.removeItem(
        SKILLEARN_CONFIG.STORAGE.TOKEN
    );

}


/*
 * =========================================================
 * SAVED USER
 * =========================================================
 */

function getSavedUser() {

    const user =
        localStorage.getItem(
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


function removeSavedUser() {

    localStorage.removeItem(
        SKILLEARN_CONFIG.STORAGE.USER
    );

}


/*
 * =========================================================
 * CLEAR AUTH DATA
 * =========================================================
 */

function clearAuthData() {

    removeAuthToken();

    removeSavedUser();

}


/*
 * =========================================================
 * API HEADERS
 * =========================================================
 */

function getApiHeaders() {

    const headers = {

        "Content-Type":
            "application/json",

        "Accept":
            "application/json"

    };

    const token =
        getAuthToken();

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }

    return headers;

}


/*
 * =========================================================
 * GLOBAL EXPORTS
 * =========================================================
 */

window.SKILLEARN_CONFIG =
    SKILLEARN_CONFIG;

window.apiUrl =
    apiUrl;

window.getAuthToken =
    getAuthToken;

window.setAuthToken =
    setAuthToken;

window.removeAuthToken =
    removeAuthToken;

window.getSavedUser =
    getSavedUser;

window.setSavedUser =
    setSavedUser;

window.removeSavedUser =
    removeSavedUser;

window.clearAuthData =
    clearAuthData;

window.getApiHeaders =
    getApiHeaders;
