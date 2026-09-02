"use strict";

/* =========================================================
   SkillEarn Hub
   Global Configuration + API Request Helper
========================================================= */

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
            30000,

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

        removeAuthToken();

        return;
    }

    localStorage.setItem(
        SKILLEARN_CONFIG.STORAGE.TOKEN,
        String(token)
    );

}


function removeAuthToken() {

    localStorage.removeItem(
        SKILLEARN_CONFIG.STORAGE.TOKEN
    );

}


/* =========================================================
   USER STORAGE
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

        return JSON.parse(
            value
        );

    } catch (error) {

        removeSavedUser();

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

    try {

        sessionStorage.removeItem(
            "skillEarnUser"
        );

    } catch (error) {

        console.warn(
            "Unable to clear session storage:",
            error
        );

    }

}


/* =========================================================
   GET API HEADERS
========================================================= */

function getApiHeaders() {

    const headers = {

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


/* =========================================================
   EXTRACT TOKEN
========================================================= */

function extractToken(data) {

    if (!data) {

        return null;

    }


    return (

        data.token ||

        data.accessToken ||

        data.access_token ||

        data.jwt ||

        data.access?.token ||

        null

    );

}


/* =========================================================
   EXTRACT USER
========================================================= */

function extractUser(data) {

    if (!data) {

        return null;

    }


    return (

        data.user ||

        data.data?.user ||

        data.data ||

        null

    );

}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const url =
        apiUrl(endpoint);


    const controller =
        new AbortController();


    const timeout =
        setTimeout(
            function () {

                controller.abort();

            },
            SKILLEARN_CONFIG
                .REQUEST
                .TIMEOUT
        );


    const requestOptions = {

        method:
            options.method || "GET",

        credentials:
            options.credentials ||
            SKILLEARN_CONFIG
                .REQUEST
                .CREDENTIALS,

        headers: {

            ...getApiHeaders(),

            ...(options.headers || {})

        },

        signal:
            controller.signal

    };


    /* =====================================================
       REQUEST BODY
    ===================================================== */

    if (

        options.body !== undefined &&

        options.body !== null

    ) {

        if (
            options.body instanceof FormData
        ) {

            requestOptions.body =
                options.body;


            delete requestOptions.headers[
                "Content-Type"
            ];

        }

        else if (

            typeof options.body ===
            "string"

        ) {

            requestOptions.body =
                options.body;

        }

        else {

            requestOptions.headers[
                "Content-Type"
            ] =
                "application/json";


            requestOptions.body =
                JSON.stringify(
                    options.body
                );

        }

    }


    let response;


    try {

        response =
            await fetch(
                url,
                requestOptions
            );

    } catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {

            throw new Error(
                "Request timed out. Please try again."
            );

        }


        throw new Error(
            "Unable to connect to the server. Please check your internet connection and try again."
        );

    } finally {

        clearTimeout(
            timeout
        );

    }


    /* =====================================================
       RESPONSE
    ===================================================== */

    let data =
        null;


    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    try {

        if (

            contentType.includes(
                "application/json"
            )

        ) {

            data =
                await response.json();

        }

        else {

            const text =
                await response.text();


            data =
                text

                    ? {
                        message:
                            text
                    }

                    : null;

        }

    } catch (error) {

        data =
            null;

    }


    /* =====================================================
       ERROR RESPONSE
    ===================================================== */

    if (
        !response.ok
    ) {

        const message =

            data?.message ||

            data?.error ||

            data?.detail ||

            "The server returned an error. Please try again.";


        const apiError =
            new Error(
                message
            );


        apiError.status =
            response.status;


        apiError.data =
            data;


        throw apiError;

    }


    /* =====================================================
       SAVE TOKEN AUTOMATICALLY
    ===================================================== */

    const token =
        extractToken(
            data
        );


    if (token) {

        setAuthToken(
            token
        );

    }


    return data;

}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.SKILLEARN_CONFIG =
    SKILLEARN_CONFIG;


window.APP_CONFIG = {

    API_BASE_URL:
        SKILLEARN_CONFIG
            .API_BASE_URL

};


window.apiUrl =
    apiUrl;


window.apiRequest =
    apiRequest;


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


window.extractToken =
    extractToken;


window.extractUser =
    extractUser;
