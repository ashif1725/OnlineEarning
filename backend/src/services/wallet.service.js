"use strict";

const pool =
    require(
        "../config/db"
    );


/*
|--------------------------------------------------------------------------
| GET WALLET SUMMARY
|--------------------------------------------------------------------------
*/

async function getWalletSummary({
    userId
}) {

    const result =
        await pool.query(
            `
            SELECT

                w.id AS wallet_id,

                w.currency,

                w.status,

                wb.available_balance,

                wb.pending_balance

            FROM wallets w

            INNER JOIN wallet_balances wb
                ON wb.wallet_id = w.id

            WHERE w.user_id = $1

            LIMIT 1
            `,
            [
                userId
            ]
        );


    if (
        result.rowCount === 0
    ) {

        const error =
            new Error(
                "WALLET_NOT_FOUND"
            );

        error.code =
            "WALLET_NOT_FOUND";

        throw error;
    }


    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| GET TRANSACTION HISTORY
|--------------------------------------------------------------------------
*/

async function getTransactionHistory({
    userId
}) {

    const result =
        await pool.query(
            `
            SELECT

                wt.id,

                wt.transaction_type,

                wt.amount,

                wt.currency,

                wt.balance_before,

                wt.balance_after,

                wt.reference_type,

                wt.description,

                wt.created_at

            FROM wallet_transactions wt

            WHERE wt.user_id = $1

            ORDER BY
                wt.created_at DESC
            `,
            [
                userId
            ]
        );


    return result.rows;
}


module.exports = {

    getWalletSummary,

    getTransactionHistory

};
