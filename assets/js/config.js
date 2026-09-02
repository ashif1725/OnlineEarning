/* =========================================================
   SkillEarn Hub
   assets/js/config.js

   STEP 5
   Central frontend configuration
   ========================================================= */

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

    }

};


/* =========================================================
   API URL
   ========================================================= */

function apiUrl(endpoint) {

    const base =
        SKILLEARN_CONFIG.API_BASE_URL
            .replace(/\/+$/, "");

    const path =
        String(endpoint || "")
            .replace(/^\/+/, "");

    return `${base}/${path}`;
}


/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest(endpoint, options = {}) {

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => controller.abort(),
            SKILLEARN_CONFIG.REQUEST.TIMEOUT
        );


    const requestOptions = {

        method:
            options.method || "GET",

        credentials:
            SKILLEARN_CONFIG.REQUEST.CREDENTIALS,

        headers: {

            "Accept":
                "application/json",

            ...(options.headers || {})

        },

        signal:
            controller.signal

    };


    if (options.body !== undefined) {

        requestOptions.headers[
            "Content-Type"
        ] =
            "application/json";

        requestOptions.body =
            typeof options.body === "string"
                ? options.body
                : JSON.stringify(options.body);
    }


    try {

        const response =
            await fetch(
                apiUrl(endpoint),
                requestOptions
            );


        let data = null;


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            try {

                data =
                    await response.json();

            } catch {

                data = null;
            }

        } else {

            const text =
                await response.text();

            data =
                text
                    ? { message: text }
                    : null;
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

        clearTimeout(timeout);
    }
}


/* =========================================================
   SAVED USER
   ========================================================= */

function getSavedUser() {

    try {

        const data =
            sessionStorage.getItem(
                "skillEarnUser"
            );

        return data
            ? JSON.parse(data)
            : null;

    } catch {

        return null;
    }
}


function setSavedUser(user) {

    if (!user) {

        sessionStorage.removeItem(
            "skillEarnUser"
        );

        return;
    }


    try {

        sessionStorage.setItem(
            "skillEarnUser",
            JSON.stringify(user)
        );

    } catch (error) {

        console.warn(
            "Unable to save user:",
            error
        );
    }
}


function removeSavedUser() {

    sessionStorage.removeItem(
        "skillEarnUser"
    );
}


/* =========================================================
   CLEAR AUTH
   ========================================================= */

function clearAuthData() {

    removeSavedUser();

    localStorage.removeItem(
        "skillearn_access_token"
    );

    localStorage.removeItem(
        "skillearn_user"
    );
}


/* =========================================================
   GLOBAL CONFIG
   ========================================================= */

window.SKILLEARN_CONFIG =
    SKILLEARN_CONFIG;

window.APP_CONFIG = {

    API_BASE_URL:
        SKILLEARN_CONFIG.API_BASE_URL

};

window.apiUrl =
    apiUrl;

window.apiRequest =
    apiRequest;

window.getSavedUser =
    getSavedUser;

window.setSavedUser =
    setSavedUser;

window.removeSavedUser =
    removeSavedUser;

window.clearAuthData =
    clearAuthData;
