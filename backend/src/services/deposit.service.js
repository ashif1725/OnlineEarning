"use strict";

const pool =
    require("../config/db");


/*
|--------------------------------------------------------------------------
| CREATE DEPOSIT REQUEST
|--------------------------------------------------------------------------
*/

async function createDepositRequest({
    userId,
    amount
}) {

    const client =
        await pool.connect();

    try {

        await client.query(
            "BEGIN"
        );


        /*
        |--------------------------------------------------------------------------
        | VALIDATE AMOUNT
        |--------------------------------------------------------------------------
        */

        const numericAmount =
            Number(amount);


        if (
            !Number.isFinite(
                numericAmount
            ) ||
            numericAmount <= 0
        ) {

            const error =
                new Error(
                    "INVALID_DEPOSIT_AMOUNT"
                );

            error.code =
                "INVALID_DEPOSIT_AMOUNT";

            throw error;
        }


        /*
        |--------------------------------------------------------------------------
        | FIND USER WALLET
        |--------------------------------------------------------------------------
        */

        const walletResult =
            await client.query(
                `
                SELECT
                    id,
                    currency,
                    status
                FROM wallets
                WHERE user_id = $1
                LIMIT 1
                `,
                [
                    userId
                ]
            );


        if (
            walletResult.rowCount === 0
        ) {

            const error =
                new Error(
                    "WALLET_NOT_FOUND"
                );

            error.code =
                "WALLET_NOT_FOUND";

            throw error;
        }


        const wallet =
            walletResult.rows[0];


        /*
        |--------------------------------------------------------------------------
        | CHECK WALLET STATUS
        |--------------------------------------------------------------------------
        */

        if (
            wallet.status !==
            "active"
        ) {

            const error =
                new Error(
                    "WALLET_NOT_ACTIVE"
                );

            error.code =
                "WALLET_NOT_ACTIVE";

            throw error;
        }


        /*
        |--------------------------------------------------------------------------
        | CREATE DEPOSIT REQUEST
        |--------------------------------------------------------------------------
        */

        const depositResult =
            await client.query(
                `
                INSERT INTO deposit_requests (
                    user_id,
                    wallet_id,
                    amount,
                    status
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    'pending'
                )
                RETURNING
                    id,
                    user_id,
                    wallet_id,
                    amount,
                    status,
                    created_at
                `,
                [
                    userId,
                    wallet.id,
                    numericAmount
                ]
            );


        await client.query(
            "COMMIT"
        );


        return
            depositResult.rows[0];


    } catch (error) {

        await client.query(
            "ROLLBACK"
        );

        throw error;


    } finally {

        client.release();
    }
}


/*
|--------------------------------------------------------------------------
| APPROVE DEPOSIT
|--------------------------------------------------------------------------
*/

async function approveDepositRequest({
    depositId,
    adminUserId
}) {

    const client =
        await pool.connect();

    try {

        await client.query(
            "BEGIN"
        );


        /*
        |--------------------------------------------------------------------------
        | LOCK DEPOSIT ROW
        |--------------------------------------------------------------------------
        */

        const depositResult =
            await client.query(
                `
                SELECT
                    id,
                    user_id,
                    wallet_id,
                    amount,
                    status
                FROM deposit_requests
                WHERE id = $1
                FOR UPDATE
                `,
                [
                    depositId
                ]
            );


        if (
            depositResult.rowCount === 0
        ) {

            const error =
                new Error(
                    "DEPOSIT_NOT_FOUND"
                );

            error.code =
                "DEPOSIT_NOT_FOUND";

            throw error;
        }


        const deposit =
            depositResult.rows[0];


        /*
        |--------------------------------------------------------------------------
        | CHECK STATUS
        |--------------------------------------------------------------------------
        */

        if (
            deposit.status !==
            "pending"
        ) {

            const error =
                new Error(
                    "DEPOSIT_ALREADY_PROCESSED"
                );

            error.code =
                "DEPOSIT_ALREADY_PROCESSED";

            throw error;
        }


        /*
        |--------------------------------------------------------------------------
        | CREATE TRANSACTION
        |--------------------------------------------------------------------------
        */

        const transactionResult =
            await client.query(
                `
                INSERT INTO wallet_transactions (
                    wallet_id,
                    transaction_type,
                    amount,
                    currency,
                    status,
                    reference_type,
                    reference_id,
                    description
                )
                VALUES (
                    $1,
                    'deposit',
                    $2,
                    'INR',
                    'completed',
                    'deposit_request',
                    $3,
                    'Deposit approved'
                )
                RETURNING
                    id,
                    wallet_id,
                    amount,
                    transaction_type,
                    status,
                    created_at
                `,
                [
                    deposit.wallet_id,
                    deposit.amount,
                    deposit.id
                ]
            );


        const transaction =
            transactionResult.rows[0];


        /*
        |--------------------------------------------------------------------------
        | UPDATE WALLET BALANCE
        |--------------------------------------------------------------------------
        */

        const balanceResult =
            await client.query(
                `
                UPDATE wallet_balances
                SET
                    available_balance =
                        available_balance + $1
                WHERE wallet_id = $2
                RETURNING
                    wallet_id,
                    available_balance,
                    pending_balance,
                    currency
                `,
                [
                    deposit.amount,
                    deposit.wallet_id
                ]
            );


        if (
            balanceResult.rowCount === 0
        ) {

            const error =
                new Error(
                    "WALLET_BALANCE_NOT_FOUND"
                );

            error.code =
                "WALLET_BALANCE_NOT_FOUND";

            throw error;
        }


        const balance =
            balanceResult.rows[0];


        /*
        |--------------------------------------------------------------------------
        | MARK DEPOSIT APPROVED
        |--------------------------------------------------------------------------
        */

        await client.query(
            `
            UPDATE deposit_requests
            SET
                status = 'approved',
                approved_by = $1,
                approved_at = NOW(),
                updated_at = NOW()
            WHERE id = $2
            `,
            [
                adminUserId,
                deposit.id
            ]
        );


        await client.query(
            "COMMIT"
        );


        return {
            depositId:
                deposit.id,

            transaction,

            balance
        };


    } catch (error) {

        await client.query(
            "ROLLBACK"
        );

        throw error;


    } finally {

        client.release();
    }
}


/*
|--------------------------------------------------------------------------
| GET USER DEPOSITS
|--------------------------------------------------------------------------
*/

async function getUserDeposits({
    userId
}) {

    const result =
        await pool.query(
            `
            SELECT
                id,
                amount,
                status,
                payment_reference,
                admin_note,
                approved_at,
                rejected_at,
                created_at
            FROM deposit_requests
            WHERE user_id = $1
            ORDER BY created_at DESC
            `,
            [
                userId
            ]
        );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
    createDepositRequest,
    approveDepositRequest,
    getUserDeposits
};
