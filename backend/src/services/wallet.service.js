"use strict";

const pool =
    require("../config/db");

const {
    generateTransactionId,
    normalizeAmount
} =
    require("../utils/wallet");


/*
|--------------------------------------------------------------------------
| Ensure Wallet Exists
|--------------------------------------------------------------------------
*/

async function ensureWallet(
    userId,
    client = pool
) {

    const result =
        await client.query(
            `
            INSERT INTO wallet_accounts (
                user_id
            )
            VALUES ($1)
            ON CONFLICT (user_id)
            DO UPDATE SET
                updated_at = NOW()
            RETURNING
                id,
                user_id,
                currency,
                status
            `,
            [userId]
        );


    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Get Wallet
|--------------------------------------------------------------------------
*/

async function getWallet(userId) {

    const wallet =
        await ensureWallet(userId);


    const balanceResult =
        await pool.query(
            `
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN entry_type = 'credit'
                            THEN amount
                            ELSE -amount
                        END
                    ),
                    0
                ) AS balance
            FROM wallet_ledger
            WHERE wallet_id = $1
            `,
            [wallet.id]
        );


    return {

        id:
            wallet.id,

        userId:
            wallet.user_id,

        currency:
            wallet.currency,

        status:
            wallet.status,

        balance:
            Number(
                balanceResult.rows[0].balance
            )

    };
}


/*
|--------------------------------------------------------------------------
| Send Money
|--------------------------------------------------------------------------
*/

async function sendMoney({
    senderUserId,
    receiverUserId,
    amount,
    description,
    idempotencyKey
}) {

    const normalizedAmount =
        normalizeAmount(amount);


    if (!normalizedAmount) {

        const error =
            new Error(
                "INVALID_AMOUNT"
            );

        error.code =
            "INVALID_AMOUNT";

        throw error;
    }


    if (
        !senderUserId ||
        !receiverUserId
    ) {

        const error =
            new Error(
                "USER_REQUIRED"
            );

        error.code =
            "USER_REQUIRED";

        throw error;
    }


    if (
        String(senderUserId) ===
        String(receiverUserId)
    ) {

        const error =
            new Error(
                "SELF_TRANSFER"
            );

        error.code =
            "SELF_TRANSFER";

        throw error;
    }


    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        /*
        |--------------------------------------------------------------------------
        | Idempotency Check
        |--------------------------------------------------------------------------
        */

        if (idempotencyKey) {

            const existing =
                await client.query(
                    `
                    SELECT
                        id,
                        status,
                        amount
                    FROM wallet_transactions
                    WHERE idempotency_key = $1
                    LIMIT 1
                    `,
                    [idempotencyKey]
                );


            if (existing.rowCount > 0) {

                await client.query(
                    "COMMIT"
                );

                return {
                    transaction:
                        existing.rows[0],

                    duplicate:
                        true
                };
            }
        }


        /*
        |--------------------------------------------------------------------------
        | Get Sender
        |--------------------------------------------------------------------------
        */

        const sender =
            await ensureWallet(
                senderUserId,
                client
            );


        /*
        |--------------------------------------------------------------------------
        | Get Receiver
        |--------------------------------------------------------------------------
        */

        const receiver =
            await ensureWallet(
                receiverUserId,
                client
            );


        /*
        |--------------------------------------------------------------------------
        | Lock wallets
        |--------------------------------------------------------------------------
        */

        const walletRows =
            await client.query(
                `
                SELECT
                    id,
                    user_id,
                    status
                FROM wallet_accounts
                WHERE id IN ($1, $2)
                ORDER BY id
                FOR UPDATE
                `,
                [
                    sender.id,
                    receiver.id
                ]
            );


        if (
            walletRows.rowCount !== 2
        ) {

            throw new Error(
                "WALLET_NOT_FOUND"
            );
        }


        if (
            sender.status !== "active" ||
            receiver.status !== "active"
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
        | Calculate Sender Balance
        |--------------------------------------------------------------------------
        */

        const senderBalanceResult =
            await client.query(
                `
                SELECT
                    COALESCE(
                        SUM(
                            CASE
                                WHEN entry_type = 'credit'
                                THEN amount
                                ELSE -amount
                            END
                        ),
                        0
                    ) AS balance
                FROM wallet_ledger
                WHERE wallet_id = $1
                `,
                [sender.id]
            );


        const senderBalance =
            Number(
                senderBalanceResult
                    .rows[0]
                    .balance
            );


        /*
        |--------------------------------------------------------------------------
        | Insufficient Balance
        |--------------------------------------------------------------------------
        */

        if (
            senderBalance <
            normalizedAmount
        ) {

            const error =
                new Error(
                    "INSUFFICIENT_BALANCE"
                );

            error.code =
                "INSUFFICIENT_BALANCE";

            throw error;
        }


        /*
        |--------------------------------------------------------------------------
        | Transaction ID
        |--------------------------------------------------------------------------
        */

        const transactionId =
            generateTransactionId();


        /*
        |--------------------------------------------------------------------------
        | New Balances
        |--------------------------------------------------------------------------
        */

        const senderNewBalance =
            Number(
                (
                    senderBalance -
                    normalizedAmount
                ).toFixed(2)
            );


        const receiverBalanceResult =
            await client.query(
                `
                SELECT
                    COALESCE(
                        SUM(
                            CASE
                                WHEN entry_type = 'credit'
                                THEN amount
                                ELSE -amount
                            END
                        ),
                        0
                    ) AS balance
                FROM wallet_ledger
                WHERE wallet_id = $1
                `,
                [receiver.id]
            );


        const receiverBalance =
            Number(
                receiverBalanceResult
                    .rows[0]
                    .balance
            );


        const receiverNewBalance =
            Number(
                (
                    receiverBalance +
                    normalizedAmount
                ).toFixed(2)
            );


        /*
        |--------------------------------------------------------------------------
        | Create Transaction
        |--------------------------------------------------------------------------
        */

        await client.query(
            `
            INSERT INTO wallet_transactions (
                id,
                sender_wallet_id,
                receiver_wallet_id,
                sender_user_id,
                receiver_user_id,
                transaction_type,
                amount,
                currency,
                status,
                idempotency_key,
                description,
                completed_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                'send',
                $6,
                'POINT',
                'completed',
                $7,
                $8,
                NOW()
            )
            `,
            [
                transactionId,
                sender.id,
                receiver.id,
                senderUserId,
                receiverUserId,
                normalizedAmount,
                idempotencyKey || null,
                description ||
                    "Wallet transfer"
            ]
        );


        /*
        |--------------------------------------------------------------------------
        | Sender Ledger
        |--------------------------------------------------------------------------
        */

        await client.query(
            `
            INSERT INTO wallet_ledger (
                wallet_id,
                user_id,
                transaction_id,
                entry_type,
                amount,
                balance_after,
                description
            )
            VALUES (
                $1,
                $2,
                $3,
                'debit',
                $4,
                $5,
                $6
            )
            `,
            [
                sender.id,
                senderUserId,
                transactionId,
                normalizedAmount,
                senderNewBalance,
                description ||
                    "Money sent"
            ]
        );


        /*
        |--------------------------------------------------------------------------
        | Receiver Ledger
        |--------------------------------------------------------------------------
        */

        await client.query(
            `
            INSERT INTO wallet_ledger (
                wallet_id,
                user_id,
                transaction_id,
                entry_type,
                amount,
                balance_after,
                description
            )
            VALUES (
                $1,
                $2,
                $3,
                'credit',
                $4,
                $5,
                $6
            )
            `,
            [
                receiver.id,
                receiverUserId,
                transactionId,
                normalizedAmount,
                receiverNewBalance,
                description ||
                    "Money received"
            ]
        );


        await client.query(
            "COMMIT"
        );


        return {

            transactionId,

            amount:
                normalizedAmount,

            currency:
                "POINT",

            status:
                "completed",

            senderBalance:
                senderNewBalance

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
| Transaction History
|--------------------------------------------------------------------------
*/

async function getTransactions(
    userId,
    limit = 20
) {

    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 20,
                1
            ),
            100
        );


    const result =
        await pool.query(
            `
            SELECT
                t.id,
                t.transaction_type,
                t.amount,
                t.currency,
                t.status,
                t.description,
                t.created_at,

                su.public_user_id
                    AS sender_public_user_id,

                ru.public_user_id
                    AS receiver_public_user_id

            FROM wallet_transactions t

            LEFT JOIN users su
                ON su.id = t.sender_user_id

            LEFT JOIN users ru
                ON ru.id = t.receiver_user_id

            WHERE
                t.sender_user_id = $1
                OR
                t.receiver_user_id = $1

            ORDER BY
                t.created_at DESC

            LIMIT $2
            `,
            [
                userId,
                safeLimit
            ]
        );


    return result.rows;
}


module.exports = {

    ensureWallet,

    getWallet,

    sendMoney,

    getTransactions

};
