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
   GLOBAL API URL
========================================================= */

window.API_URL =
    SKILLEARN_CONFIG
        .API_BASE_URL
        .replace(
            /\/+$/,
            ""
        );


/* =========================================================
   API URL
========================================================= */

function apiUrl(
    endpoint
) {

    const base =
        window.API_URL;


    const path =
        String(
            endpoint ||
            ""
        )
        .replace(
            /^\/+/,
            ""
        );


    if (
        !path
    ) {

        return base;

    }


    return (
        base +
        "/" +
        path
    );

}


/* =========================================================
   TOKEN
========================================================= */

function getAuthToken() {

    try {

        return (

            localStorage.getItem(
                SKILLEARN_CONFIG
                    .STORAGE
                    .TOKEN
            )

            ||

            localStorage.getItem(
                "skilllearn_token"
            )

            ||

            localStorage.getItem(
                "token"
            )

            ||

            null

        );

    } catch (
        error
    ) {

        return null;

    }

}


function setAuthToken(
    token
) {

    try {

        if (
            !token
        ) {

            removeAuthToken();

            return;

        }


        const value =
            String(
                token
            );


        /*
        -----------------------------------------------------
        Main token key
        -----------------------------------------------------
        */

        localStorage.setItem(

            SKILLEARN_CONFIG
                .STORAGE
                .TOKEN,

            value

        );


        /*
        -----------------------------------------------------
        Compatibility keys
        Admin dashboard old/new code दोनों के लिए
        -----------------------------------------------------
        */

        localStorage.setItem(

            "skilllearn_token",

            value

        );


        localStorage.setItem(

            "token",

            value

        );


    } catch (
        error
    ) {

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


        localStorage.removeItem(
            "skilllearn_token"
        );


        localStorage.removeItem(
            "token"
        );


    } catch (
        error
    ) {

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

            )

            ||

            localStorage.getItem(
                "skilllearn_user"
            );


        if (
            !value
        ) {

            return null;

        }


        return JSON.parse(
            value
        );


    } catch (
        error
    ) {

        removeSavedUser();

        return null;

    }

}


function setSavedUser(
    user
) {

    try {

        if (
            !user
        ) {

            removeSavedUser();

            return;

        }


        const value =
            JSON.stringify(
                user
            );


        /*
        -----------------------------------------------------
        Main user key
        -----------------------------------------------------
        */

        localStorage.setItem(

            SKILLEARN_CONFIG
                .STORAGE
                .USER,

            value

        );


        /*
        -----------------------------------------------------
        Compatibility key for admin dashboard
        -----------------------------------------------------
        */

        localStorage.setItem(

            "skilllearn_user",

            value

        );


    } catch (
        error
    ) {

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


        localStorage.removeItem(
            "skilllearn_user"
        );


    } catch (
        error
    ) {

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


    } catch (
        error
    ) {

        console.warn(

            "SESSION CLEAR ERROR:",

            error

        );

    }

}


/* =========================================================
   API HEADERS
========================================================= */

function getApiHeaders() {

    const headers = {

        Accept:
            "application/json"

    };


    const token =
        getAuthToken();


    if (
        token
    ) {

        headers.Authorization =
            "Bearer " +
            token;

    }


    return headers;

}


/* =========================================================
   EXTRACT TOKEN
========================================================= */

function extractToken(
    data
) {

    if (
        !data
    ) {

        return null;

    }


    return (

        data.token ||

        data.accessToken ||

        data.access_token ||

        data.data?.token ||

        data.data?.accessToken ||

        data.data?.access_token ||

        null

    );

}


/* =========================================================
   EXTRACT USER
========================================================= */

function extractUser(
    data
) {

    if (
        !data
    ) {

        return null;

    }


    if (

        data.user &&

        typeof data.user ===
        "object"

    ) {

        return data.user;

    }


    if (

        data.data?.user &&

        typeof data.data.user ===
        "object"

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


    /*
    ---------------------------------------------------------
    BODY
    ---------------------------------------------------------
    */

    if (

        options.body !==
        undefined

        &&

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


    } catch (
        error
    ) {


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
        )
        ||
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

                    ?

                    {

                        message:
                            text

                    }

                    :

                    null;

        }


    } catch (
        error
    ) {

        data =
            null;

    }


    /*
    ---------------------------------------------------------
    ERROR RESPONSE
    ---------------------------------------------------------
    */

    if (
        !response.ok
    ) {

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
    ---------------------------------------------------------
    SAVE LOGIN TOKEN
    ---------------------------------------------------------
    */

    const token =
        extractToken(
            data
        );


    if (
        token
    ) {

        setAuthToken(
            token
        );

    }


    /*
    ---------------------------------------------------------
    SAVE LOGIN USER
    ---------------------------------------------------------
    */

    const user =
        extractUser(
            data
        );


    if (
        user
    ) {

        setSavedUser(
            user
        );

    }


    return data;

}


/* =========================================================
   EXPORTS
========================================================= */

window.SKILLEARN_CONFIG =
    SKILLEARN_CONFIG;


window.API_URL =
    SKILLEARN_CONFIG
        .API_BASE_URL
        .replace(
            /\/+$/,
            ""
        );


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
