"use strict";

const pool = require("../config/db");


async function getWalletByUserId(userId) {

    const result = await pool.query(
        `
        SELECT
            w.id,
            w.user_id,
            w.currency,
            w.status,
            COALESCE(
                b.available_balance,
                0
            ) AS available_balance,
            COALESCE(
                b.pending_balance,
                0
            ) AS pending_balance

        FROM wallets w

        LEFT JOIN wallet_balances b
            ON b.wallet_id = w.id

        WHERE w.user_id = $1

        LIMIT 1
        `,
        [userId]
    );


    if (result.rowCount === 0) {
        return null;
    }


    return result.rows[0];
}


async function ensureWalletBalance(
    client,
    walletId
) {

    await client.query(
        `
        INSERT INTO wallet_balances (
            wallet_id,
            available_balance,
            pending_balance,
            currency
        )
        SELECT
            id,
            0,
            0,
            currency
        FROM wallets
        WHERE id = $1

        ON CONFLICT (wallet_id)
        DO NOTHING
        `,
        [walletId]
    );
}


module.exports = {
    getWalletByUserId,
    ensureWalletBalance
};
