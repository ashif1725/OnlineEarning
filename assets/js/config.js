"use strict";


/*
|--------------------------------------------------------------------------
| SkillEarn Hub
| Frontend Configuration
|--------------------------------------------------------------------------
*/


const SKILLEARN_CONFIG = {

    /*
     * Production Backend
     */
    API_BASE_URL:
        "https://skillearnhub-1.onrender.com",


    /*
     * Authentication endpoints
     */
    AUTH: {

        REGISTER:
            "/api/auth/register",

        LOGIN:
            "/api/auth/login",

        LOGOUT:
            "/api/auth/logout",

        ME:
            "/api/auth/me",

        FORGOT_PASSWORD:
            "/api/auth/forgot-password",

        RESET_PASSWORD:
            "/api/auth/reset-password"

    },


    /*
     * Request configuration
     */
    REQUEST: {

        TIMEOUT:
            15000,

        CREDENTIALS:
            "include"

    }

};


/*
|--------------------------------------------------------------------------
| API URL
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| API HEADERS
|--------------------------------------------------------------------------
|
| IMPORTANT:
| No Authorization token is required.
|
| Authentication is handled by the
| HTTP-only skillearn_session cookie.
|
|--------------------------------------------------------------------------
*/

function getApiHeaders() {

    return {

        "Accept":
            "application/json",

        "Content-Type":
            "application/json"

    };
}


/*
|--------------------------------------------------------------------------
| CLEAR OLD AUTH DATA
|--------------------------------------------------------------------------
|
| This removes old token-based data from
| your previous frontend version.
|
|--------------------------------------------------------------------------
*/

function clearAuthData() {

    try {

        localStorage.removeItem(
            "skillearn_access_token"
        );

        localStorage.removeItem(
            "skillearn_user"
        );

        sessionStorage.removeItem(
            "skillEarnUser"
        );

    } catch (error) {

        console.warn(
            "Unable to clear local auth data:",
            error
        );
    }
}


/*
|--------------------------------------------------------------------------
| GLOBAL CONFIG
|--------------------------------------------------------------------------
*/

window.APP_CONFIG = {

    API_BASE_URL:
        SKILLEARN_CONFIG.API_BASE_URL

};


window.SKILLEARN_CONFIG =
    SKILLEARN_CONFIG;


window.apiUrl =
    apiUrl;


window.getApiHeaders =
    getApiHeaders;


window.clearAuthData =
    clearAuthData;
