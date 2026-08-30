"use strict";

const pool = require("../config/db");

const {
    encrypt
} = require("../utils/encryption");


function normalizeIfsc(ifsc) {

    return ifsc
        .trim()
        .toUpperCase();
}


async function addBankAccount({
    userId,
    accountHolderName,
    accountNumber,
    ifscCode,
    bankName,
    accountType
}) {

    const cleanAccount =
        accountNumber
            .replace(/\s+/g, "")
            .trim();


    const cleanIfsc =
        normalizeIfsc(ifscCode);


    if (
        !/^[0-9]{9,18}$/.test(
            cleanAccount
        )
    ) {
        throw new Error(
            "INVALID_ACCOUNT_NUMBER"
        );
    }


    if (
        !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
            cleanIfsc
        )
    ) {
        throw new Error(
            "INVALID_IFSC"
        );
    }


    const encryptedAccount =
        encrypt(cleanAccount);


    const last4 =
        cleanAccount.slice(-4);


    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        const result =
            await client.query(
                `
                INSERT INTO bank_accounts (
                    user_id,
                    account_holder_name,
                    account_number_encrypted,
                    account_number_last4,
                    ifsc_code,
                    bank_name,
                    account_type,
                    status
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    'PENDING'
                )
                RETURNING
                    id,
                    account_holder_name,
                    account_number_last4,
                    ifsc_code,
                    bank_name,
                    account_type,
                    status,
                    created_at
                `,
                [
                    userId,
                    accountHolderName,
                    encryptedAccount,
                    last4,
                    cleanIfsc,
                    bankName || null,
                    accountType || "SAVINGS"
                ]
            );


        await client.query(
            "COMMIT"
        );


        return result.rows[0];


    } catch (error) {

        await client.query(
            "ROLLBACK"
        );

        throw error;

    } finally {

        client.release();
    }
}


async function getUserBankAccounts(
    userId
) {

    const result =
        await pool.query(
            `
            SELECT
                id,
                account_holder_name,
                account_number_last4,
                ifsc_code,
                bank_name,
                account_type,
                status,
                is_primary,
                verified_at,
                created_at

            FROM bank_accounts

            WHERE user_id = $1

            ORDER BY
                created_at DESC
            `,
            [userId]
        );


    return result.rows;
}


module.exports = {
    addBankAccount,
    getUserBankAccounts
};
