"use strict";

/*
|--------------------------------------------------------------------------
| SkillEarn Hub - Frontend Configuration
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| API URL HELPER
|--------------------------------------------------------------------------
*/

function apiUrl(endpoint) {

    const base =
        SKILLEARN_CONFIG.API_BASE_URL
            .replace(/\/+$/, "");

    const path =
        String(endpoint || "")
            .replace(/^\/+/, "");

    return `${base}/${path}`;
}


/*
|--------------------------------------------------------------------------
| GLOBAL CONFIG
|--------------------------------------------------------------------------
*/

window.SKILLEARN_CONFIG =
    SKILLEARN_CONFIG;

window.APP_CONFIG = {

    API_BASE_URL:
        SKILLEARN_CONFIG.API_BASE_URL

};

window.apiUrl =
    apiUrl;
