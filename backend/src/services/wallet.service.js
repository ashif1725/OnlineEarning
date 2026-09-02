"use strict";

const pool =
    require(
        "../config/db"
    );


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


module.exports = {
    getWalletSummary
};
