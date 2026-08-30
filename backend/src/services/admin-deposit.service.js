"use strict";

const pool = require("../config/db");

const {
    createAuditLog
} = require("./audit.service");


async function approveDeposit({
    depositId,
    adminUserId,
    ipAddress,
    userAgent,
    adminNote
}) {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");


        /*
         * Lock deposit row.
         *
         * This prevents two admins/processes
         * from approving the same deposit
         * simultaneously.
         */

        const depositResult =
            await client.query(
                `
                SELECT
                    d.*,

                    u.public_user_id,
                    u.full_name,

                    w.id AS wallet_id

                FROM deposits d

                JOIN users u
                    ON u.id = d.user_id

                JOIN wallets w
                    ON w.user_id = d.user_id

                WHERE d.deposit_id = $1

                FOR UPDATE
                `,
                [depositId]
            );


        if (depositResult.rowCount === 0) {

            throw new Error(
                "DEPOSIT_NOT_FOUND"
            );
        }


        const deposit =
            depositResult.rows[0];


        /*
         * Never approve an already
         * processed deposit.
         */

        if (deposit.status !== "PENDING") {

            throw new Error(
                "DEPOSIT_ALREADY_PROCESSED"
            );
        }


        /*
         * Lock wallet balance.
         */

        const balanceResult =
            await client.query(
                `
                SELECT
                    wallet_id,
                    available_balance,
                    pending_balance,
                    currency

                FROM wallet_balances

                WHERE wallet_id = $1

                FOR UPDATE
                `,
                [deposit.wallet_id]
            );


        if (balanceResult.rowCount === 0) {

            throw new Error(
                "WALLET_BALANCE_NOT_FOUND"
            );
        }


        const balance =
            balanceResult.rows[0];


        /*
         * Create a unique internal
         * transaction ID.
         */

        const transactionId =
            `DEP-${deposit.deposit_id}`;


        /*
         * Create transaction.
         */

        const transactionResult =
            await client.query(
                `
                INSERT INTO transactions (
                    transaction_id,
                    type,
                    status,
                    currency,
                    amount,
                    receiver_user_id,
                    description
                )
                VALUES (
                    $1,
                    'DEPOSIT',
                    'SUCCESS',
                    $2,
                    $3,
                    $4,
                    $5
                )
                RETURNING id
                `,
                [
                    transactionId,
                    deposit.currency,
                    deposit.amount,
                    deposit.user_id,
                    "Deposit approved"
                ]
            );


        const transactionUuid =
            transactionResult.rows[0].id;


        /*
         * Credit wallet.
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
                deposit.amount,
                deposit.wallet_id
            ]
        );


        /*
         * Ledger CREDIT.
         */

        const ledgerResult =
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

                RETURNING id
                `,
                [
                    transactionUuid,
                    deposit.amount,
                    deposit.currency,
                    deposit.wallet_id
                ]
            );


        if (ledgerResult.rowCount !== 1) {

            throw new Error(
                "LEDGER_ACCOUNT_ERROR"
            );
        }


        /*
         * Update deposit.
         */

        const updatedDeposit =
            await client.query(
                `
                UPDATE deposits

                SET
                    status = 'APPROVED',
                    admin_note = $1,
                    reviewed_at = NOW(),
                    reviewed_by = $2,
                    updated_at = NOW()

                WHERE id = $3

                RETURNING
                    deposit_id,
                    status,
                    amount,
                    currency,
                    reviewed_at
                `,
                [
                    adminNote || null,
                    adminUserId,
                    deposit.id
                ]
            );


        /*
         * Immutable audit record.
         */

        await createAuditLog(
            client,
            {
                actorUserId:
                    adminUserId,

                action:
                    "DEPOSIT_APPROVED",

                entityType:
                    "DEPOSIT",

                entityId:
                    deposit.deposit_id,

                beforeData: {
                    status:
                        deposit.status,

                    amount:
                        deposit.amount
                },

                afterData: {
                    status:
                        "APPROVED",

                    transactionId
                },

                ipAddress,

                userAgent
            }
        );


        await client.query("COMMIT");


        return {
            deposit:
                updatedDeposit.rows[0],

            transactionId,

            creditedAmount:
                deposit.amount
        };


    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
}


module.exports = {
    approveDeposit
};
