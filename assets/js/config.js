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

        /*
        -----------------------------------------------------
        JWT is sent through Authorization header.

        Do not depend on cross-origin cookies.
        -----------------------------------------------------
        */

        CREDENTIALS:
            "omit"

    },


    STORAGE: {

        TOKEN:
            "skillearn_access_token",


        USER:
            "skillearn_user"

    }

};


/* =========================================================
   API BASE URL
========================================================= */

window.API_URL =
    String(
        SKILLEARN_CONFIG.API_BASE_URL
    )
    .replace(
        /\/+$/,
        ""
    );


/* =========================================================
   BUILD API URL
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
        .trim()
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
   GET TOKEN
========================================================= */

function getAuthToken() {

    try {

        const token =

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
            );


        if (
            !token
        ) {

            return null;

        }


        return String(
            token
        )
        .trim()

        ||

        null;


    } catch (
        error
    ) {

        console.error(
            "TOKEN READ ERROR:",
            error
        );


        return null;

    }

}


/* =========================================================
   SAVE TOKEN
========================================================= */

function setAuthToken(
    token
) {

    try {

        if (
            !token
        ) {

            return false;

        }


        const value =
            String(
                token
            )
            .trim();


        if (
            !value
        ) {

            return false;

        }


        /*
        -----------------------------------------------------
        Primary token
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


        return true;


    } catch (
        error
    ) {

        console.error(
            "TOKEN SAVE ERROR:",
            error
        );


        return false;

    }

}


/* =========================================================
   REMOVE TOKEN
========================================================= */

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
   GET SAVED USER
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


        const user =
            JSON.parse(
                value
            );


        if (

            !user ||

            typeof user !==
            "object"

        ) {

            return null;

        }


        return user;


    } catch (
        error
    ) {

        console.warn(
            "USER READ ERROR:",
            error
        );


        return null;

    }

}


/* =========================================================
   SAVE USER
========================================================= */

function setSavedUser(
    user
) {

    try {

        if (

            !user ||

            typeof user !==
            "object"

        ) {

            return false;

        }


        const value =
            JSON.stringify(
                user
            );


        localStorage.setItem(

            SKILLEARN_CONFIG
                .STORAGE
                .USER,

            value

        );


        localStorage.setItem(

            "skilllearn_user",

            value

        );


        return true;


    } catch (
        error
    ) {

        console.error(
            "USER SAVE ERROR:",
            error
        );


        return false;

    }

}


/* =========================================================
   REMOVE SAVED USER
========================================================= */

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


    /*
    ---------------------------------------------------------
    JWT AUTHORIZATION HEADER
    ---------------------------------------------------------
    */

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
        !data ||
        typeof data !== "object"
    ) {

        return null;

    }


    const token =

        data.token ||

        data.accessToken ||

        data.access_token ||

        data.jwt ||

        data.data?.token ||

        data.data?.accessToken ||

        data.data?.access_token ||

        data.data?.jwt ||

        null;


    if (
        !token
    ) {

        return null;

    }


    return String(
        token
    )
    .trim()

    ||

    null;

}


/* =========================================================
   EXTRACT USER
========================================================= */

function extractUser(
    data
) {

    if (
        !data ||
        typeof data !== "object"
    ) {

        return null;

    }


    const user =

        data.user ||

        data.data?.user ||

        data.data?.profile ||

        data.profile ||

        null;


    if (

        !user ||

        typeof user !==
        "object"

    ) {

        return null;

    }


    return user;

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

            Number(
                options.timeout
            )

            ||

            SKILLEARN_CONFIG
                .REQUEST
                .TIMEOUT

        );


    const requestOptions = {

        method:

            String(
                options.method ||
                "GET"
            )
            .toUpperCase(),


        /*
        -----------------------------------------------------
        Do not depend on Render cross-origin cookies.
        -----------------------------------------------------
        */

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
    REQUEST BODY
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

            if (

                !requestOptions.headers[
                    "Content-Type"
                ]

            ) {

                requestOptions.headers[
                    "Content-Type"
                ] =
                    "application/json";

            }


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


        console.error(
            "API CONNECTION ERROR:",
            {
                endpoint,
                url,
                error
            }
        );


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
        String(

            response.headers.get(
                "content-type"
            )

            ||

            ""

        )
        .toLowerCase();


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

            const responseText =
                await response.text();


            data =

                responseText

                    ?

                    {

                        message:
                            responseText

                    }

                    :

                    null;

        }


    } catch (
        error
    ) {

        console.warn(
            "API RESPONSE PARSE ERROR:",
            error
        );


        data =
            null;

    }


    /*
    ---------------------------------------------------------
    DEBUG LOG
    ---------------------------------------------------------
    */

    console.log(
        "API RESPONSE:",
        {

            endpoint,

            status:
                response.status,

            ok:
                response.ok,

            data

        }
    );


    /*
    ---------------------------------------------------------
    HTTP ERROR
    ---------------------------------------------------------
    */

    if (
        !response.ok
    ) {

        const message =

            data?.message ||

            data?.error ||

            data?.details ||

            `Request failed (${response.status})`;


        const apiError =
            new Error(
                message
            );


        apiError.status =
            response.status;


        apiError.data =
            data;


        /*
        -----------------------------------------------------
        IMPORTANT

        DO NOT CLEAR AUTH AUTOMATICALLY HERE.

        A temporary server issue, wallet error,
        database error, CORS issue or timeout must NOT
        automatically log the user out.
        -----------------------------------------------------
        */


        throw apiError;

    }


    /*
    ---------------------------------------------------------
    SAVE TOKEN IF RESPONSE CONTAINS NEW TOKEN
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
    SAVE USER IF RESPONSE CONTAINS USER
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
   AUTH STATUS
========================================================= */

function isAuthenticated() {

    const token =
        getAuthToken();


    return Boolean(
        token
    );

}


/* =========================================================
   PUBLIC EXPORTS
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


window.isAuthenticated =
    isAuthenticated;
