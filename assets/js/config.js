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
            "application/json"

    };


    const token =
        getAuthToken();


    /*
     * Current authentication uses
     * HTTP-only cookies.
     *
     * Authorization header remains
     * available for future token APIs.
     */

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;
    }


    return headers;
}


/* =========================================================
   GLOBAL API REQUEST HELPER
========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const url =
        apiUrl(endpoint);


    const requestOptions = {

        method:
            options.method || "GET",

        credentials:
            SKILLEARN_CONFIG
                .REQUEST
                .CREDENTIALS,

        headers: {

            ...getApiHeaders(),

            ...(options.headers || {})

        }

    };


    /*
     * Add request body
     */

    if (
        options.body !== undefined &&
        options.body !== null
    ) {

        if (
            typeof options.body === "string"
        ) {

            requestOptions.body =
                options.body;

        } else {

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


    /*
     * Request timeout
     */

    const controller =
        new AbortController();


    requestOptions.signal =
        controller.signal;


    const timeout =
        setTimeout(
            function () {

                controller.abort();

            },
            SKILLEARN_CONFIG
                .REQUEST
                .TIMEOUT
        );


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

        } else {

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


    /*
     * API Error
     */

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


    /*
     * Save token if backend returns one.
     *
     * Cookie authentication continues
     * to work normally even if no token
     * is returned.
     */

    if (
        data &&
        data.token
    ) {

        setAuthToken(
            data.token
        );
    }


    return data;
}

/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {
    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => controller.abort(),
            SKILLEARN_CONFIG.REQUEST.TIMEOUT
        );

    try {
        const requestOptions = {
            method:
                options.method ||
                "GET",

            headers: {
                ...getApiHeaders(),
                ...(options.headers || {})
            },

            credentials:
                SKILLEARN_CONFIG.REQUEST.CREDENTIALS,

            signal:
                controller.signal
        };

        if (
            options.body !== undefined &&
            options.body !== null
        ) {
            requestOptions.body =
                typeof options.body === "string"
                    ? options.body
                    : JSON.stringify(
                        options.body
                    );
        }

        const response =
            await fetch(
                apiUrl(endpoint),
                requestOptions
            );

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        let data = null;

        if (
            contentType.includes(
                "application/json"
            )
        ) {
            data =
                await response.json();
        } else {
            const text =
                await response.text();

            data = {
                message: text
            };
        }

        if (!response.ok) {
            const error =
                new Error(
                    data?.message ||
                    data?.error ||
                    "Request failed"
                );

            error.status =
                response.status;

            error.data =
                data;

            throw error;
        }

        return data;

    } catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {
            throw new Error(
                "Request timed out. Please try again."
            );
        }

        throw error;

    } finally {

        clearTimeout(
            timeout
        );
    }
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
