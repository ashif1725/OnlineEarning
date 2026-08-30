"use strict";

const crypto = require("crypto");
const pool = require("../config/db");


function generateWithdrawalId() {

    return (
        "WDR-" +
        Date.now() +
        "-" +
        crypto
            .randomBytes(6)
            .toString("hex")
            .toUpperCase()
    );
}


async function createWithdrawal({
    userId,
    bankAccountId,
    amount,
    userNote
}) {

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        throw new Error(
            "INVALID_AMOUNT"
        );
    }


    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        const account =
            await client.query(
                `
                SELECT
                    id,
                    user_id,
                    status

                FROM bank_accounts

                WHERE id = $1

                FOR SHARE
                `,
                [bankAccountId]
            );


        if (
            account.rowCount === 0 ||
            account.rows[0].user_id !== userId
        ) {
            throw new Error(
                "BANK_ACCOUNT_NOT_FOUND"
            );
        }


        if (
            account.rows[0].status !==
            "VERIFIED"
        ) {
            throw new Error(
                "BANK_ACCOUNT_NOT_VERIFIED"
            );
        }


        /*
         * Lock wallet balance.
         */

        const wallet =
            await client.query(
                `
                SELECT
                    w.id AS wallet_id,
                    b.available_balance,
                    b.currency

                FROM wallets w

                JOIN wallet_balances b
                    ON b.wallet_id = w.id

                WHERE w.user_id = $1

                FOR UPDATE
                `,
                [userId]
            );


        if (wallet.rowCount === 0) {

            throw new Error(
                "WALLET_NOT_FOUND"
            );
        }


        const walletData =
            wallet.rows[0];


        const available =
            Number(
                walletData.available_balance
            );


        if (available < amount) {

            throw new Error(
                "INSUFFICIENT_BALANCE"
            );
        }


        /*
         * For now fee is zero.
         * Later Admin can configure
         * withdrawal fees.
         */

        const fee = 0;

        const netAmount =
            amount - fee;


        const withdrawalId =
            generateWithdrawalId();


        /*
         * Reserve amount by moving it
         * from available → pending.
         */

        await client.query(
            `
            UPDATE wallet_balances

            SET
                available_balance =
                    available_balance - $1,

                pending_balance =
                    pending_balance + $1,

                updated_at = NOW()

            WHERE wallet_id = $2
            `,
            [
                amount,
                walletData.wallet_id
            ]
        );


        /*
         * Create withdrawal request.
         */

        const result =
            await client.query(
                `
                INSERT INTO withdrawals (
                    withdrawal_id,
                    user_id,
                    bank_account_id,
                    amount,
                    fee,
                    net_amount,
                    currency,
                    status,
                    user_note
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    'PENDING',
                    $8
                )
                RETURNING
                    withdrawal_id,
                    amount,
                    fee,
                    net_amount,
                    currency,
                    status,
                    created_at
                `,
                [
                    withdrawalId,
                    userId,
                    bankAccountId,
                    amount,
                    fee,
                    netAmount,
                    walletData.currency,
                    userNote || null
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


module.exports = {
    createWithdrawal
};
