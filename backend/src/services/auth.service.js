"use strict";

const pool = require("../config/db");

const {
    hashPassword,
    verifyPassword
} = require("../utils/security");

const {
    generatePublicUserId
} = require("../utils/user-id");


async function registerUser({
    fullName,
    email,
    phone,
    password
}) {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");


        const normalizedEmail =
            email.trim().toLowerCase();

        const normalizedPhone =
            phone.trim();


        const existing =
            await client.query(
                `
                SELECT id
                FROM users
                WHERE email = $1
                   OR phone = $2
                LIMIT 1
                `,
                [
                    normalizedEmail,
                    normalizedPhone
                ]
            );


        if (existing.rowCount > 0) {

            const error =
                new Error("ACCOUNT_ALREADY_EXISTS");

            error.code =
                "ACCOUNT_ALREADY_EXISTS";

            throw error;
        }


        const passwordHash =
            await hashPassword(password);


        let publicUserId;

        for (let attempt = 0; attempt < 5; attempt++) {

            const candidate =
                generatePublicUserId();

            const collision =
                await client.query(
                    `
                    SELECT 1
                    FROM users
                    WHERE public_user_id = $1
                    LIMIT 1
                    `,
                    [candidate]
                );

            if (collision.rowCount === 0) {

                publicUserId = candidate;

                break;
            }
        }


        if (!publicUserId) {
            throw new Error(
                "USER_ID_GENERATION_FAILED"
            );
        }


        const userResult =
            await client.query(
                `
                INSERT INTO users (
                    public_user_id,
                    full_name,
                    email,
                    phone,
                    password_hash,
                    role,
                    account_status
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    'user',
                    'active'
                )
                RETURNING
                    id,
                    public_user_id,
                    full_name,
                    email,
                    phone,
                    role,
                    account_status,
                    created_at
                `,
                [
                    publicUserId,
                    fullName.trim(),
                    normalizedEmail,
                    normalizedPhone,
                    passwordHash
                ]
            );


        const user =
            userResult.rows[0];


        await client.query(
            `
            INSERT INTO user_security (
                user_id
            )
            VALUES ($1)
            `,
            [user.id]
        );


        await client.query(
            `
            INSERT INTO wallets (
                user_id,
                currency,
                status
            )
            VALUES (
                $1,
                'INR',
                'active'
            )
            `,
            [user.id]
        );


        const walletResult =
            await client.query(
                `
                SELECT id
                FROM wallets
                WHERE user_id = $1
                `,
                [user.id]
            );


        await client.query(
            `
            INSERT INTO ledger_accounts (
                wallet_id,
                currency,
                status
            )
            VALUES (
                $1,
                'INR',
                'active'
            )
            `,
            [walletResult.rows[0].id]
        );


        await client.query(
            `
            INSERT INTO audit_logs (
                actor_user_id,
                action,
                entity_type,
                entity_id
            )
            VALUES (
                $1,
                'USER_REGISTERED',
                'USER',
                $1
            )
            `,
            [user.id]
        );


        await client.query("COMMIT");


        return user;

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
}


async function authenticateUser({
    email,
    password
}) {

    const result =
        await pool.query(
            `
            SELECT
                id,
                public_user_id,
                full_name,
                email,
                phone,
                password_hash,
                role,
                account_status
            FROM users
            WHERE email = $1
            LIMIT 1
            `,
            [
                email.trim().toLowerCase()
            ]
        );


    if (result.rowCount === 0) {

        throw new Error(
            "INVALID_CREDENTIALS"
        );
    }


    const user =
        result.rows[0];


    if (user.account_status !== "active") {

        throw new Error(
            "ACCOUNT_UNAVAILABLE"
        );
    }


    const valid =
        await verifyPassword(
            password,
            user.password_hash
        );


    if (!valid) {

        throw new Error(
            "INVALID_CREDENTIALS"
        );
    }


    return {
        id: user.id,
        publicUserId: user.public_user_id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role
    };
}


module.exports = {
    registerUser,
    authenticateUser
};
