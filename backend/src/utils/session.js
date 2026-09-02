"use strict";

/* =========================================================
   SkillEarn Hub
   Session Utilities
========================================================= */

const crypto =
    require("crypto");


/* =========================================================
   SESSION CONFIGURATION
========================================================= */

/*
|--------------------------------------------------------------------------
| SESSION_DAYS
|--------------------------------------------------------------------------
|
| Default:
| 7 days
|
| Optional environment variable:
| SESSION_DAYS=7
|--------------------------------------------------------------------------
*/

const DEFAULT_SESSION_DAYS =
    7;


function getSessionDays() {

    const value =
        Number(
            process.env.SESSION_DAYS
        );


    if (
        Number.isFinite(value) &&
        value > 0
    ) {

        return Math.floor(
            value
        );

    }


    return DEFAULT_SESSION_DAYS;

}


/* =========================================================
   GENERATE SESSION TOKEN
========================================================= */

/*
|--------------------------------------------------------------------------
| Generates a cryptographically secure random token.
|
| Raw token:
| - Sent to frontend after login
| - Stored in cookie
|
| Database:
| - Only SHA-256 hash is stored
|--------------------------------------------------------------------------
*/

function generateSessionToken() {

    return crypto
        .randomBytes(
            32
        )
        .toString(
            "base64url"
        );

}


/* =========================================================
   HASH SESSION TOKEN
========================================================= */

/*
|--------------------------------------------------------------------------
| IMPORTANT
|--------------------------------------------------------------------------
|
| The same hash function must be used when:
|
| 1. Creating session
| 2. Finding session
| 3. Revoking session
|
| Database stores only the hash.
|--------------------------------------------------------------------------
*/

function hashToken(
    token
) {

    if (!token) {

        throw new Error(
            "SESSION_TOKEN_REQUIRED"
        );

    }


    return crypto
        .createHash(
            "sha256"
        )
        .update(
            String(token),
            "utf8"
        )
        .digest(
            "hex"
        );

}


/* =========================================================
   GET SESSION EXPIRY
========================================================= */

function getSessionExpiry() {

    const expiry =
        new Date();


    const sessionDays =
        getSessionDays();


    expiry.setDate(

        expiry.getDate() +

        sessionDays

    );


    return expiry;

}


/* =========================================================
   GET SESSION MAX AGE
========================================================= */

/*
|--------------------------------------------------------------------------
| Returns session duration in milliseconds.
|
| Useful for cookies.
|--------------------------------------------------------------------------
*/

function getSessionMaxAge() {

    const sessionDays =
        getSessionDays();


    return (

        sessionDays *

        24 *

        60 *

        60 *

        1000

    );

}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    generateSessionToken,

    hashToken,

    getSessionExpiry,

    getSessionMaxAge

};
