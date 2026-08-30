"use strict";

const crypto = require("crypto");
const pool = require("../config/db");


function generateDepositId() {

    const random =
        crypto
            .randomBytes(6)
            .toString("hex")
            .toUpperCase();

    return `DEP-${Date.now()}-${random}`;
}


async function createDeposit({
    userId,
    paymentMethodId,
    amount,
    utrNumber,
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


        const method =
            await client.query(
                `
                SELECT
                    id,
                    method_type,
                    is_active
                FROM payment_methods
                WHERE id = $1
                FOR SHARE
                `,
                [paymentMethodId]
            );


        if (
            method.rowCount === 0 ||
            !method.rows[0].is_active
        ) {

            throw new Error(
                "PAYMENT_METHOD_UNAVAILABLE"
            );
        }


        if (utrNumber) {

            const existing =
                await client.query(
                    `
                    SELECT id
                    FROM deposits
                    WHERE utr_number = $1
                    LIMIT 1
                    `,
                    [utrNumber]
                );


            if (existing.rowCount > 0) {

                throw new Error(
                    "UTR_ALREADY_USED"
                );
            }
        }


        const depositId =
            generateDepositId();


        const result =
            await client.query(
                `
                INSERT INTO deposits (
                    deposit_id,
                    user_id,
                    payment_method_id,
                    amount,
                    currency,
                    utr_number,
                    status,
                    user_note
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    'INR',
                    $5,
                    'PENDING',
                    $6
                )
                RETURNING
                    deposit_id,
                    amount,
                    currency,
                    utr_number,
                    status,
                    submitted_at
                `,
                [
                    depositId,
                    userId,
                    paymentMethodId,
                    amount,
                    utrNumber || null,
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
    createDeposit
};
