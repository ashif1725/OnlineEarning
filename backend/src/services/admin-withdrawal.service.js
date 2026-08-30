"use strict";

const pool = require("../config/db");

const {
    createAuditLog
} = require("./audit.service");


async function rejectWithdrawal({
    withdrawalId,
    adminUserId,
    adminNote,
    ipAddress,
    userAgent
}) {

    const client =
        await pool.connect();

    try {

        await client.query("BEGIN");


        const result =
            await client.query(
                `
                SELECT
                    w.*,
                    wb.id AS wallet_id

                FROM withdrawals w

                JOIN wallets wa
                    ON wa.user_id = w.user_id

                JOIN wallet_balances wb
                    ON wb.wallet_id = wa.id

                WHERE w.withdrawal_id = $1

                FOR UPDATE
                `,
                [withdrawalId]
            );


        if (result.rowCount === 0) {

            throw new Error(
                "WITHDRAWAL_NOT_FOUND"
            );
        }


        const withdrawal =
            result.rows[0];


        if (
            withdrawal.status !==
            "PENDING"
        ) {

            throw new Error(
                "WITHDRAWAL_ALREADY_PROCESSED"
            );
        }


        /*
         * Return reserved amount.
         */

        await client.query(
            `
            UPDATE wallet_balances

            SET
                available_balance =
                    available_balance + $1,

                pending_balance =
                    pending_balance - $1,

                updated_at = NOW()

            WHERE wallet_id = $2
            `,
            [
                withdrawal.amount,
                withdrawal.wallet_id
            ]
        );


        await client.query(
            `
            UPDATE withdrawals

            SET
                status = 'REJECTED',
                admin_note = $1,
                reviewed_by = $2,
                reviewed_at = NOW(),
                updated_at = NOW()

            WHERE withdrawal_id = $3
            `,
            [
                adminNote || null,
                adminUserId,
                withdrawalId
            ]
        );


        await createAuditLog(
            client,
            {
                actorUserId:
                    adminUserId,

                action:
                    "WITHDRAWAL_REJECTED",

                entityType:
                    "WITHDRAWAL",

                entityId:
                    withdrawalId,

                beforeData: {
                    status:
                        withdrawal.status,

                    amount:
                        withdrawal.amount
                },

                afterData: {
                    status:
                        "REJECTED"
                },

                ipAddress,

                userAgent
            }
        );


        await client.query(
            "COMMIT"
        );


        return {
            withdrawalId,
            status: "REJECTED"
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
    rejectWithdrawal
};
