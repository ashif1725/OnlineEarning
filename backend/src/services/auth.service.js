"use strict";

/* =========================================================
   SkillEarn Hub
   Authentication Service
========================================================= */

const pool =
    require("../config/db");


const {
    hashPassword,
    verifyPassword
} = require("../utils/security");


const {
    generatePublicUserId
} = require("../utils/user-id");


/* =========================================================
   NORMALIZE ROLE
========================================================= */

function normalizeRole(role) {

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
   NORMALIZE ACCOUNT STATUS
========================================================= */

function normalizeAccountStatus(
    status
) {

    return String(
        status ||
        "active"
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   REGISTER USER
========================================================= */

async function registerUser({
    fullName,
    email,
    phone,
    password
}) {

    const client =
        await pool.connect();


    try {

        /* =================================================
           BEGIN TRANSACTION
        ================================================= */

        await client.query(
            "BEGIN"
        );


        /* =================================================
           NORMALIZE INPUT
        ================================================= */

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        const normalizedPhone =
            String(phone)
                .trim();


        const normalizedFullName =
            String(fullName)
                .trim();


        /* =================================================
           CHECK EXISTING ACCOUNT
        ================================================= */

        const existing =
            await client.query(

                `
                SELECT
                    id
                FROM users
                WHERE
                    email = $1
                    OR phone = $2
                LIMIT 1
                `,

                [
                    normalizedEmail,
                    normalizedPhone
                ]

            );


        if (
            existing.rowCount > 0
        ) {

            const error =
                new Error(
                    "ACCOUNT_ALREADY_EXISTS"
                );


            error.code =
                "ACCOUNT_ALREADY_EXISTS";


            throw error;

        }


        /* =================================================
           HASH PASSWORD
        ================================================= */

        const passwordHash =
            await hashPassword(
                password
            );


        /* =================================================
           GENERATE UNIQUE PUBLIC USER ID
        ================================================= */

        let publicUserId =
            null;


        for (
            let attempt = 0;
            attempt < 5;
            attempt++
        ) {

            const candidate =
                generatePublicUserId();


            const collision =
                await client.query(

                    `
                    SELECT
                        1
                    FROM users
                    WHERE
                        public_user_id = $1
                    LIMIT 1
                    `,

                    [
                        candidate
                    ]

                );


            if (
                collision.rowCount === 0
            ) {

                publicUserId =
                    candidate;

                break;

            }

        }


        if (
            !publicUserId
        ) {

            const error =
                new Error(
                    "USER_ID_GENERATION_FAILED"
                );


            error.code =
                "USER_ID_GENERATION_FAILED";


            throw error;

        }


        /* =================================================
           CREATE USER

           New registrations are always normal users.
           Admin role should only be assigned securely by
           an administrator/database process.
        ================================================= */

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
                    normalizedFullName,
                    normalizedEmail,
                    normalizedPhone,
                    passwordHash
                ]

            );


        if (
            userResult.rowCount === 0
        ) {

            const error =
                new Error(
                    "USER_CREATION_FAILED"
                );


            error.code =
                "USER_CREATION_FAILED";


            throw error;

        }


        const user =
            userResult.rows[0];


        /* =================================================
           CREATE USER SECURITY RECORD
        ================================================= */

        await client.query(

            `
            INSERT INTO user_security (
                user_id
            )
            VALUES (
                $1
            )
            `,

            [
                user.id
            ]

        );


        /* =================================================
           CREATE WALLET
        ================================================= */

        const walletResult =
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
                RETURNING
                    id,
                    currency,
                    status
                `,

                [
                    user.id
                ]

            );


        if (
            walletResult.rowCount === 0
        ) {

            const error =
                new Error(
                    "WALLET_CREATION_FAILED"
                );


            error.code =
                "WALLET_CREATION_FAILED";


            throw error;

        }


        const wallet =
            walletResult.rows[0];


        /* =================================================
           CREATE INITIAL WALLET BALANCE
        ================================================= */

        await client.query(

            `
            INSERT INTO wallet_balances (
                wallet_id,
                available_balance,
                pending_balance,
                currency
            )
            VALUES (
                $1,
                0,
                0,
                $2
            )
            ON CONFLICT (
                wallet_id
            )
            DO NOTHING
            `,

            [
                wallet.id,
                wallet.currency
            ]

        );


        /* =================================================
           CREATE LEDGER ACCOUNT
        ================================================= */

        await client.query(

            `
            INSERT INTO ledger_accounts (
                wallet_id,
                currency,
                status
            )
            VALUES (
                $1,
                $2,
                'active'
            )
            `,

            [
                wallet.id,
                wallet.currency
            ]

        );


        /* =================================================
           CREATE AUDIT LOG
        ================================================= */

        await client.query(

            `
            INSERT INTO audit_logs (
                actor_user_id,
                action,
                entity_type
            )
            VALUES (
                $1::uuid,
                'USER_REGISTERED',
                'USER'
            )
            `,

            [
                user.id
            ]

        );


        /* =================================================
           COMMIT
        ================================================= */

        await client.query(
            "COMMIT"
        );


        /* =================================================
           RETURN SAFE USER
        ================================================= */

        return {

            id:
                user.id,

            publicUserId:
                user.public_user_id,

            fullName:
                user.full_name,

            email:
                user.email,

            phone:
                user.phone,

            role:
                normalizeRole(
                    user.role
                ),

            accountStatus:
                normalizeAccountStatus(
                    user.account_status
                ),

            createdAt:
                user.created_at

        };


    } catch (error) {

        /* =================================================
           ROLLBACK
        ================================================= */

        try {

            await client.query(
                "ROLLBACK"
            );

        } catch (
            rollbackError
        ) {

            console.error(
                "REGISTER ROLLBACK ERROR:",
                rollbackError
            );

        }


        /* =================================================
           POSTGRES UNIQUE VIOLATION
        ================================================= */

        if (
            error?.code ===
            "23505"
        ) {

            const duplicateError =
                new Error(
                    "ACCOUNT_ALREADY_EXISTS"
                );


            duplicateError.code =
                "ACCOUNT_ALREADY_EXISTS";


            throw duplicateError;

        }


        console.error(
            "REGISTER DATABASE ERROR:",
            error
        );


        throw error;


    } finally {

        client.release();

    }

}


/* =========================================================
   AUTHENTICATE USER
========================================================= */

async function authenticateUser({
    email,
    password
}) {

    const normalizedEmail =
        String(email)
            .trim()
            .toLowerCase();


    /* =====================================================
       FIND USER
    ===================================================== */

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
            WHERE
                email = $1
            LIMIT 1
            `,

            [
                normalizedEmail
            ]

        );


    /* =====================================================
       USER NOT FOUND
    ===================================================== */

    if (
        result.rowCount === 0
    ) {

        const error =
            new Error(
                "INVALID_CREDENTIALS"
            );


        error.code =
            "INVALID_CREDENTIALS";


        throw error;

    }


    const user =
        result.rows[0];


    /* =====================================================
       ACCOUNT STATUS
    ===================================================== */

    const accountStatus =
        normalizeAccountStatus(
            user.account_status
        );


    if (
        accountStatus !==
        "active"
    ) {

        const error =
            new Error(
                "ACCOUNT_DISABLED"
            );


        error.code =
            "ACCOUNT_DISABLED";


        throw error;

    }


    /* =====================================================
       VERIFY PASSWORD
    ===================================================== */

    const valid =
        await verifyPassword(

            password,

            user.password_hash

        );


    if (!valid) {

        const error =
            new Error(
                "INVALID_CREDENTIALS"
            );


        error.code =
            "INVALID_CREDENTIALS";


        throw error;

    }


    /* =====================================================
       RETURN SAFE USER

       Never return password_hash.
    ===================================================== */

    return {

        id:
            user.id,

        publicUserId:
            user.public_user_id,

        fullName:
            user.full_name,

        email:
            user.email,

        phone:
            user.phone,

        role:
            normalizeRole(
                user.role
            ),

        accountStatus

    };

}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    registerUser,

    authenticateUser,

    normalizeRole,

    normalizeAccountStatus

};
