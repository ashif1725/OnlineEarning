"use strict";

/* =========================================================
   SkillEarn Hub
   Session Service
========================================================= */

const pool =
    require("../config/db");


const {
    generateSessionToken,
    hashToken,
    getSessionExpiry
} = require("../utils/session");


/* =========================================================
   CREATE SESSION
========================================================= */

async function createSession({
    userId,
    ipAddress,
    userAgent
}) {

    if (!userId) {

        throw new Error(
            "USER_ID_REQUIRED"
        );

    }


    /*
    ---------------------------------------------------------
    Generate secure session token
    ---------------------------------------------------------
    */

    const token =
        generateSessionToken();


    const tokenHash =
        hashToken(
            token
        );


    const expiry =
        getSessionExpiry();


    /*
    ---------------------------------------------------------
    Create database session
    ---------------------------------------------------------
    */

    const result =
        await pool.query(

            `
            INSERT INTO user_sessions (
                user_id,
                session_token_hash,
                ip_address,
                user_agent,
                expires_at
            )

            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5
            )

            RETURNING
                id,
                user_id,
                expires_at,
                created_at
            `,

            [
                userId,
                tokenHash,
                ipAddress || null,
                userAgent || null,
                expiry
            ]

        );


    const session =
        result.rows[0];


    /*
    ---------------------------------------------------------
    Return RAW token only once.

    Database stores only the hash.
    ---------------------------------------------------------
    */

    return {

        id:
            session.id,

        userId:
            session.user_id,

        token,

        expiresAt:
            session.expires_at,

        createdAt:
            session.created_at

    };

}


/* =========================================================
   NORMALIZE ROLE
========================================================= */

function normalizeRole(
    role
) {

    const value =
        String(
            role ||
            "user"
        )
            .trim()
            .toLowerCase();


    if (

        value === "admin" ||

        value === "administrator"

    ) {

        return "admin";

    }


    return "user";

}


/* =========================================================
   BUILD SESSION OBJECT
========================================================= */

function buildSession(
    row
) {

    if (!row) {

        return null;

    }


    return {

        /*
        -----------------------------------------------------
        Session information
        -----------------------------------------------------
        */

        id:
            row.session_id,


        sessionId:
            row.session_id,


        userId:
            row.user_id,


        expiresAt:
            row.expires_at,


        revokedAt:
            row.revoked_at || null,


        /*
        -----------------------------------------------------
        User information

        IMPORTANT:
        auth.middleware.js expects session.user
        -----------------------------------------------------
        */

        user: {

            id:
                row.user_id,


            publicUserId:
                row.public_user_id || null,


            fullName:
                row.full_name || null,


            email:
                row.email || null,


            phone:
                row.phone || null,


            role:
                normalizeRole(
                    row.role
                ),


            accountStatus:
                row.account_status || null,


            emailVerifiedAt:
                row.email_verified_at || null

        }

    };

}


/* =========================================================
   GET SESSION BY TOKEN
========================================================= */

async function getSessionByToken(
    token
) {

    if (!token) {

        return null;

    }


    /*
    ---------------------------------------------------------
    Hash incoming raw token.

    Database never stores the raw token.
    ---------------------------------------------------------
    */

    const tokenHash =
        hashToken(
            token
        );


    /*
    ---------------------------------------------------------
    Find session + user
    ---------------------------------------------------------
    */

    const result =
        await pool.query(

            `
            SELECT

                s.id
                    AS session_id,

                s.user_id,

                s.expires_at,

                s.revoked_at,

                u.public_user_id,

                u.full_name,

                u.email,

                u.phone,

                u.role,

                u.account_status,

                u.email_verified_at

            FROM user_sessions s

            JOIN users u

                ON u.id = s.user_id

            WHERE
                s.session_token_hash = $1

            LIMIT 1
            `,

            [
                tokenHash
            ]

        );


    /*
    ---------------------------------------------------------
    Session not found
    ---------------------------------------------------------
    */

    if (
        result.rowCount === 0
    ) {

        return null;

    }


    const row =
        result.rows[0];


    /*
    ---------------------------------------------------------
    Revoked session
    ---------------------------------------------------------
    */

    if (
        row.revoked_at
    ) {

        return null;

    }


    /*
    ---------------------------------------------------------
    Expired session
    ---------------------------------------------------------
    */

    const expiresAt =
        new Date(
            row.expires_at
        );


    if (
        Number.isNaN(
            expiresAt.getTime()
        )
    ) {

        return null;

    }


    if (
        expiresAt.getTime() <=
        Date.now()
    ) {

        return null;

    }


    /*
    ---------------------------------------------------------
    Update last used time

    Authentication should not fail only because
    last_used_at update has a temporary problem.
    ---------------------------------------------------------
    */

    try {

        await pool.query(

            `
            UPDATE user_sessions

            SET
                last_used_at = NOW()

            WHERE
                id = $1
            `,

            [
                row.session_id
            ]

        );

    } catch (error) {

        console.warn(
            "SESSION LAST USED UPDATE ERROR:",
            error.message
        );

    }


    /*
    ---------------------------------------------------------
    Return normalized session
    ---------------------------------------------------------
    */

    return buildSession(
        row
    );

}


/* =========================================================
   GET SESSION
========================================================= */

/*
|--------------------------------------------------------------------------
| Backward compatibility
|--------------------------------------------------------------------------
|
| Existing files may already use:
|
| getSession(token)
|
| New authentication middleware uses:
|
| getSessionByToken(token)
|
| Both now return the same normalized structure.
|
*/

async function getSession(
    token
) {

    return getSessionByToken(
        token
    );

}


/* =========================================================
   REVOKE SESSION
========================================================= */

async function revokeSession(
    token
) {

    if (!token) {

        return false;

    }


    const tokenHash =
        hashToken(
            token
        );


    const result =
        await pool.query(

            `
            UPDATE user_sessions

            SET
                revoked_at = NOW()

            WHERE
                session_token_hash = $1

                AND revoked_at IS NULL

            RETURNING
                id
            `,

            [
                tokenHash
            ]

        );


    return (
        result.rowCount > 0
    );

}


/* =========================================================
   REVOKE ALL USER SESSIONS
========================================================= */

/*
|--------------------------------------------------------------------------
| This is useful for:
|
| - Change password
| - Admin force logout
| - Security logout from all devices
|--------------------------------------------------------------------------
*/

async function revokeAllUserSessions(
    userId
) {

    if (!userId) {

        throw new Error(
            "USER_ID_REQUIRED"
        );

    }


    const result =
        await pool.query(

            `
            UPDATE user_sessions

            SET
                revoked_at = NOW()

            WHERE
                user_id = $1

                AND revoked_at IS NULL

            RETURNING
                id
            `,

            [
                userId
            ]

        );


    return result.rowCount;

}


/* =========================================================
   CLEAN EXPIRED SESSIONS
========================================================= */

/*
|--------------------------------------------------------------------------
| Optional maintenance helper.
|
| Can later be called by a cron job.
|--------------------------------------------------------------------------
*/

async function cleanExpiredSessions() {

    const result =
        await pool.query(

            `
            DELETE FROM user_sessions

            WHERE
                expires_at <= NOW()

                OR revoked_at IS NOT NULL
            `

        );


    return result.rowCount;

}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    /*
    ---------------------------------------------------------
    Create
    ---------------------------------------------------------
    */

    createSession,


    /*
    ---------------------------------------------------------
    Read
    ---------------------------------------------------------
    */

    getSession,

    getSessionByToken,


    /*
    ---------------------------------------------------------
    Revoke
    ---------------------------------------------------------
    */

    revokeSession,

    revokeAllUserSessions,


    /*
    ---------------------------------------------------------
    Maintenance
    ---------------------------------------------------------
    */

    cleanExpiredSessions

};
