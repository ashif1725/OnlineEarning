"use strict";


/* =========================================================
   SKILLEARN HUB CONFIG
========================================================= */

const SKILLEARN_CONFIG = {

    API_BASE_URL:
        "https://skillearnhub-1.onrender.com",

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
            .replace(
                /\/+$/,
                ""
            );


    const path =
        String(
            endpoint ||
            ""
        )
        .replace(
            /^\/+/,
            ""
        );


    return `${base}/${path}`;

}


/* =========================================================
   TOKEN
========================================================= */

function getAuthToken() {

    try {

        return localStorage.getItem(
            SKILLEARN_CONFIG
                .STORAGE
                .TOKEN
        );

    } catch (error) {

        return null;

    }

}


function setAuthToken(token) {

    try {

        if (!token) {

            removeAuthToken();

            return;

        }


        localStorage.setItem(

            SKILLEARN_CONFIG
                .STORAGE
                .TOKEN,

            String(
                token
            )

        );

    } catch (error) {

        console.error(
            "TOKEN SAVE ERROR:",
            error
        );

    }

}


function removeAuthToken() {

    try {

        localStorage.removeItem(

            SKILLEARN_CONFIG
                .STORAGE
                .TOKEN

        );

    } catch (error) {

        console.warn(
            "TOKEN REMOVE ERROR:",
            error
        );

    }

}


/* =========================================================
   USER STORAGE
========================================================= */

function getSavedUser() {

    try {

        const value =
            localStorage.getItem(

                SKILLEARN_CONFIG
                    .STORAGE
                    .USER

            );


        if (!value) {

            return null;

        }


        return JSON.parse(
            value
        );


    } catch (error) {

        removeSavedUser();

        return null;

    }

}


function setSavedUser(user) {

    try {

        if (!user) {

            removeSavedUser();

            return;

        }


        localStorage.setItem(

            SKILLEARN_CONFIG
                .STORAGE
                .USER,

            JSON.stringify(
                user
            )

        );

    } catch (error) {

        console.error(
            "USER SAVE ERROR:",
            error
        );

    }

}


function removeSavedUser() {

    try {

        localStorage.removeItem(

            SKILLEARN_CONFIG
                .STORAGE
                .USER

        );

    } catch (error) {

        console.warn(
            "USER REMOVE ERROR:",
            error
        );

    }

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
            "SESSION CLEAR ERROR:",
            error
        );

    }

}


/* =========================================================
   HEADERS
========================================================= */

function getApiHeaders() {

    const headers = {

        Accept:
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

        data.data?.token ||

        data.data?.accessToken ||

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


    if (
        data.user &&
        typeof data.user === "object"
    ) {

        return data.user;

    }


    if (
        data.data?.user &&
        typeof data.data.user === "object"
    ) {

        return data.data.user;

    }


    return null;

}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const url =
        apiUrl(
            endpoint
        );


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
            options.method ||
            "GET",

        credentials:
            options.credentials ||
            SKILLEARN_CONFIG
                .REQUEST
                .CREDENTIALS,

        headers: {

            ...getApiHeaders(),

            ...(
                options.headers ||
                {}
            )

        },

        signal:
            controller.signal

    };


    if (

        options.body !==
        undefined &&

        options.body !==
        null

    ) {

        if (
            options.body instanceof
            FormData
        ) {

            requestOptions.body =
                options.body;

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
            "Unable to connect to the server."
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
        ) ||
        "";


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


    if (!response.ok) {

        const message =

            data?.message ||

            data?.error ||

            `Request failed (${response.status})`;


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
       LOGIN TOKEN SAVE
    */

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
   EXPORTS
========================================================= */

window.SKILLEARN_CONFIG =
    SKILLEARN_CONFIG;


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
