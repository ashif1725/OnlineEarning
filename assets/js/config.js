"use strict";


const SKILLEARN_CONFIG = {

    API_BASE_URL:
        "https://skillearnhub-1.onrender.com",

    AUTH: {

        REGISTER:
            "/api/auth/register",

        LOGIN:
            "/api/auth/login",

        LOGOUT:
            "/api/auth/logout",

        ME:
            "/api/auth/me"

    },

    REQUEST: {

        TIMEOUT:
            15000,

        CREDENTIALS:
            "include"

    },

    STORAGE: {

        TOKEN:
            "skillearn_access_token",

        USER:
            "skillearn_user"

    }

};


/* =========================================================
   API URL
========================================================= */

function apiUrl(endpoint) {

    const base =
        SKILLEARN_CONFIG
            .API_BASE_URL
            .replace(/\/+$/, "");


    const path =
        String(endpoint || "")
            .replace(/^\/+/, "");


    return `${base}/${path}`;
}


/* =========================================================
   TOKEN
========================================================= */

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


/* =========================================================
   USER
========================================================= */

function getSavedUser() {

    const value =
        localStorage.getItem(
            SKILLEARN_CONFIG.STORAGE.USER
        );


    if (!value) {
        return null;
    }


    try {

        return JSON.parse(value);

    } catch (error) {

        localStorage.removeItem(
            SKILLEARN_CONFIG.STORAGE.USER
        );

        return null;
    }
}


function setSavedUser(user) {

    if (!user) {

        removeSavedUser();

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


/* =========================================================
   CLEAR AUTH
========================================================= */

function clearAuthData() {

    removeAuthToken();

    removeSavedUser();

    sessionStorage.removeItem(
        "skillEarnUser"
    );
}


/* =========================================================
   API HEADERS
========================================================= */

function getApiHeaders() {

    const headers = {

        "Accept":
            "application/json",

        "Content-Type":
            "application/json"

    };


    const token =
        getAuthToken();


    /*
     * Keep this for future token-based APIs.
     *
     * Current authentication uses HTTP-only cookie.
     */

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;
    }


    return headers;
}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.SKILLEARN_CONFIG =
    SKILLEARN_CONFIG;


window.APP_CONFIG = {

    API_BASE_URL:
        SKILLEARN_CONFIG.API_BASE_URL

};


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
