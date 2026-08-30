"use strict";

const pool = require("../config/db");

const {
    generateSessionToken,
    hashToken,
    getSessionExpiry
} = require("../utils/session");


async function createSession({
    userId,
    ipAddress,
    userAgent
}) {

    const token =
        generateSessionToken();

    const tokenHash =
        hashToken(token);

    const expiry =
        getSessionExpiry();


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
        `,
        [
            userId,
            tokenHash,
            ipAddress || null,
            userAgent || null,
            expiry
        ]
    );


    return {
        token,
        expiresAt: expiry
    };
}


async function getSession(token) {

    if (!token) {
        return null;
    }


    const tokenHash =
        hashToken(token);


    const result =
        await pool.query(
            `
            SELECT
                s.id AS session_id,
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

            WHERE s.session_token_hash = $1

            LIMIT 1
            `,
            [tokenHash]
        );


    if (result.rowCount === 0) {
        return null;
    }


    const session =
        result.rows[0];


    if (session.revoked_at) {
        return null;
    }


    if (
        new Date(session.expires_at)
        <= new Date()
    ) {
        return null;
    }


    await pool.query(
        `
        UPDATE user_sessions
        SET last_used_at = NOW()
        WHERE id = $1
        `,
        [session.session_id]
    );


    return session;
}


async function revokeSession(token) {

    if (!token) {
        return;
    }


    const tokenHash =
        hashToken(token);


    await pool.query(
        `
        UPDATE user_sessions
        SET revoked_at = NOW()
        WHERE session_token_hash = $1
        `,
        [tokenHash]
    );
}


module.exports = {
    createSession,
    getSession,
    revokeSession
};
