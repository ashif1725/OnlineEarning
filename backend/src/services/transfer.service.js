"use strict";

const crypto = require("crypto");

const pool = require("../config/db");


function generateTransactionId() {

    const random =
        crypto
            .randomBytes(6)
            .toString("hex")
            .toUpperCase();

    return `TXN-${Date.now()}-${random}`;
}


async function transferMoney({
    senderUserId,
    receiverUserId,
    amount,
    idempotencyKey,
    description
}) {

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        throw new Error(
            "INVALID_AMOUNT"
        );
    }


    if (
        senderUserId ===
        receiverUserId
    ) {
        throw new Error(
            "SELF_TRANSFER_NOT_ALLOWED"
        );
    }


    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        /*
         * Idempotency protection
         */

        if (idempotencyKey) {

            const existing =
                await client.query(
                    `
                    SELECT
                        transaction_id,
                        status
                    FROM transactions
                    WHERE idempotency_key = $1
                    LIMIT 1
                    `,
                    [idempotencyKey]
                );


            if (existing.rowCount > 0) {

                await client.query(
                    "COMMIT"
                );

                return existing.rows[0];
            }
        }


        /*
         * Find sender wallet
         */

        const sender =
            await client.query(
                `
                SELECT
                    w.id AS wallet_id,
                    w.currency,
                    b.available_balance

                FROM wallets w

                JOIN wallet_balances b
                    ON b.wallet_id = w.id

                WHERE w.user_id = $1

                FOR UPDATE
                `,
                [senderUserId]
            );


        if (sender.rowCount === 0) {

            throw new Error(
                "SENDER_WALLET_NOT_FOUND"
            );
        }


        /*
         * Find receiver wallet
         */

        const receiver =
            await client.query(
                `
                SELECT
                    w.id AS wallet_id,
                    w.currency

                FROM wallets w

                WHERE w.user_id = $1

                FOR UPDATE
                `,
                [receiverUserId]
            );


        if (receiver.rowCount === 0) {

            throw new Error(
                "RECEIVER_WALLET_NOT_FOUND"
            );
        }


        const senderWallet =
            sender.rows[0];

        const receiverWallet =
            receiver.rows[0];


        /*
         * Currency check
         */

        if (
            senderWallet.currency !==
            receiverWallet.currency
        ) {

            throw new Error(
                "CURRENCY_MISMATCH"
            );
        }


        /*
         * Balance check
         */

        const balance =
            Number(
                senderWallet.available_balance
            );


        if (balance < amount) {

            throw new Error(
                "INSUFFICIENT_BALANCE"
            );
        }


        const transactionId =
            generateTransactionId();


        /*
         * Create transaction
         */

        const transaction =
            await client.query(
                `
                INSERT INTO transactions (
                    transaction_id,
                    type,
                    status,
                    currency,
                    amount,
                    sender_user_id,
                    receiver_user_id,
                    description,
                    idempotency_key
                )
                VALUES (
                    $1,
                    'INTERNAL_TRANSFER',
                    'PENDING',
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7
                )
                RETURNING id
                `,
                [
                    transactionId,
                    senderWallet.currency,
                    amount,
                    senderUserId,
                    receiverUserId,
                    description || null,
                    idempotencyKey || null
                ]
            );


        const transactionUuid =
            transaction.rows[0].id;


        /*
         * Debit sender
         */

        await client.query(
            `
            UPDATE wallet_balances
            SET
                available_balance =
                    available_balance - $1,
                updated_at = NOW()

            WHERE wallet_id = $2
            `,
            [
                amount,
                senderWallet.wallet_id
            ]
        );


        /*
         * Credit receiver
         */

        await client.query(
            `
            UPDATE wallet_balances
            SET
                available_balance =
                    available_balance + $1,
                updated_at = NOW()

            WHERE wallet_id = $2
            `,
            [
                amount,
                receiverWallet.wallet_id
            ]
        );


        /*
         * Ledger: DEBIT sender
         */

        await client.query(
            `
            INSERT INTO ledger_entries (
                transaction_id,
                ledger_account_id,
                entry_type,
                amount,
                currency
            )

            SELECT
                $1,
                id,
                'DEBIT',
                $2,
                $3

            FROM ledger_accounts

            WHERE wallet_id = $4
            `,
            [
                transactionUuid,
                amount,
                senderWallet.currency,
                senderWallet.wallet_id
            ]
        );


        /*
         * Ledger: CREDIT receiver
         */

        await client.query(
            `
            INSERT INTO ledger_entries (
                transaction_id,
                ledger_account_id,
                entry_type,
                amount,
                currency
            )

            SELECT
                $1,
                id,
                'CREDIT',
                $2,
                $3

            FROM ledger_accounts

            WHERE wallet_id = $4
            `,
            [
                transactionUuid,
                amount,
                receiverWallet.currency,
                receiverWallet.wallet_id
            ]
        );


        /*
         * Transaction completed
         */

        await client.query(
            `
            UPDATE transactions
            SET
                status = 'SUCCESS',
                updated_at = NOW()

            WHERE id = $1
            `,
            [transactionUuid]
        );


        /*
         * Transaction event
         */

        await client.query(
            `
            INSERT INTO transaction_events (
                transaction_id,
                event_type,
                event_data
            )
            VALUES (
                $1,
                'TRANSFER_COMPLETED',
                $2
            )
            `,
            [
                transactionUuid,
                JSON.stringify({
                    amount,
                    currency:
                        senderWallet.currency
                })
            ]
        );


        await client.query(
            "COMMIT"
        );


        return {
            transactionId,
            status: "SUCCESS",
            amount,
            currency:
                senderWallet.currency
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


module.exports = {
    transferMoney
};
