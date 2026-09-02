"use strict";


/*
|--------------------------------------------------------------------------
| DATABASE
|--------------------------------------------------------------------------
*/

const pool =
    require(
        "../config/db"
    );


/*
|--------------------------------------------------------------------------
| SESSION UTILITIES
|--------------------------------------------------------------------------
*/

const {
    generateSessionToken,
    hashToken,
    getSessionExpiry
} = require(
    "../utils/session"
);


/*
|--------------------------------------------------------------------------
| CREATE SESSION
|--------------------------------------------------------------------------
*/

async function createSession({
    userId,
    ipAddress,
    userAgent
}) {

    if (!userId) {

        const error =
            new Error(
                "USER_ID_REQUIRED"
            );

        error.code =
            "USER_ID_REQUIRED";

        throw error;

    }


    /*
    ---------------------------------------------------------
    Generate secure token
    ---------------------------------------------------------
    */

    const token =
        generateSessionToken();


    /*
    ---------------------------------------------------------
    Store only hashed token in database
    ---------------------------------------------------------
    */

    const tokenHash =
        hashToken(
            token
        );


    /*
    ---------------------------------------------------------
    Calculate expiry
    ---------------------------------------------------------
    */

    const expiresAt =
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

                expiresAt

            ]

        );


    if (
        result.rowCount === 0
    ) {

        const error =
            new Error(
                "SESSION_CREATION_FAILED"
            );

        error.code =
            "SESSION_CREATION_FAILED";

        throw error;

    }


    const session =
        result.rows[0];


    /*
    ---------------------------------------------------------
    Return RAW token only once.

    Database stores only hash.
    ---------------------------------------------------------
    */

    return {

        id:
            session.id,

        userId:
            session.user_id,

        token:
            token,

        expiresAt:
            session.expires_at,

        createdAt:
            session.created_at

    };

}


/*
|--------------------------------------------------------------------------
| GET SESSION
|--------------------------------------------------------------------------
|
| Used by:
|
| - requireAuth middleware
| - optionalAuth middleware
|
| Returns a FLAT session object containing:
|
| Session:
| - session_id
| - user_id
| - expires_at
|
| User:
| - public_user_id
| - full_name
| - email
| - phone
| - role
| - account_status
| - email_verified_at
|
|--------------------------------------------------------------------------
*/

async function getSession(
    token
) {

    if (!token) {

        return null;

    }


    /*
    ---------------------------------------------------------
    Hash incoming raw token before lookup
    ---------------------------------------------------------
    */

    const tokenHash =
        hashToken(
            token
        );


    /*
    ---------------------------------------------------------
    Find session and user
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

                s.created_at
                    AS session_created_at,

                s.last_used_at,

                u.public_user_id,

                u.full_name,

                u.email,

                u.phone,

                u.role,

                u.account_status,

                u.email_verified_at

            FROM user_sessions s

            INNER JOIN users u
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


    const session =
        result.rows[0];


    /*
    ---------------------------------------------------------
    Session revoked
    ---------------------------------------------------------
    */

    if (
        session.revoked_at
    ) {

        return null;

    }


    /*
    ---------------------------------------------------------
    Session expired
    ---------------------------------------------------------
    */

    const expiresAt =
        new Date(
            session.expires_at
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

        /*
        -----------------------------------------------------
        Mark expired session as revoked.

        This is not required for authentication, but keeps
        database state clean.
        -----------------------------------------------------
        */

        try {

            await pool.query(

                `
                UPDATE user_sessions
                SET revoked_at = NOW()
                WHERE id = $1
                  AND revoked_at IS NULL
                `,

                [
                    session.session_id
                ]

            );

        } catch (error) {

            console.warn(
                "SESSION EXPIRY CLEANUP ERROR:",
                error.message
            );

        }


        return null;

    }


    /*
    ---------------------------------------------------------
    Update last used timestamp
    ---------------------------------------------------------
    */

    try {

        await pool.query(

            `
            UPDATE user_sessions
            SET last_used_at = NOW()
            WHERE id = $1
            `,

            [
                session.session_id
            ]

        );

    } catch (error) {

        /*
        Authentication should still work even if the
        last_used_at update fails.
        */

        console.warn(
            "SESSION LAST USED UPDATE ERROR:",
            error.message
        );

    }


    /*
    ---------------------------------------------------------
    Return session
    ---------------------------------------------------------
    */

    return {

        session_id:
            session.session_id,

        user_id:
            session.user_id,

        expires_at:
            session.expires_at,

        created_at:
            session.session_created_at,

        last_used_at:
            session.last_used_at,

        public_user_id:
            session.public_user_id,

        full_name:
            session.full_name,

        email:
            session.email,

        phone:
            session.phone,

        role:
            String(
                session.role ||
                "user"
            )
            .trim()
            .toLowerCase(),

        account_status:
            session.account_status,

        email_verified_at:
            session.email_verified_at

    };

}


/*
|--------------------------------------------------------------------------
| REVOKE SESSION
|--------------------------------------------------------------------------
*/

async function revokeSession(
    token
) {

    if (!token) {

        return false;

    }


    /*
    ---------------------------------------------------------
    Hash raw token
    ---------------------------------------------------------
    */

    const tokenHash =
        hashToken(
            token
        );


    /*
    ---------------------------------------------------------
    Revoke only active session
    ---------------------------------------------------------
    */

    const result =
        await pool.query(

            `
            UPDATE user_sessions

            SET revoked_at = NOW()

            WHERE
                session_token_hash = $1

                AND revoked_at IS NULL

            RETURNING id
            `,

            [
                tokenHash
            ]

        );


    return (
        result.rowCount > 0
    );

}


/*
|--------------------------------------------------------------------------
| REVOKE ALL USER SESSIONS
|--------------------------------------------------------------------------
|
| Useful for:
|
| - Password change
| - Security reset
| - Force logout
|
|--------------------------------------------------------------------------
*/

async function revokeAllUserSessions(
    userId
) {

    if (!userId) {

        return false;

    }


    const result =
        await pool.query(

            `
            UPDATE user_sessions

            SET revoked_at = NOW()

            WHERE
                user_id = $1

                AND revoked_at IS NULL

            RETURNING id
            `,

            [
                userId
            ]

        );


    return result.rowCount;

}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

    createSession,

    getSession,

    revokeSession,

    revokeAllUserSessions

};
