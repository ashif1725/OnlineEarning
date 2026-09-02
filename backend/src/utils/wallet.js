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

            JOIN wallet_balances wb
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
| GET WALLET TRANSACTION HISTORY
|--------------------------------------------------------------------------
*/

async function getWalletTransactions({
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

                wt.status,

                wt.description,

                wt.created_at

            FROM wallet_transactions wt

            JOIN wallets w
                ON w.id = wt.wallet_id

            WHERE w.user_id = $1

            ORDER BY
                wt.created_at DESC

            LIMIT 50
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

    getWalletSummary,

    getWalletTransactions

};
