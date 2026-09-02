"use strict";


const pool =
    require(
        "../config/db"
    );


/* =========================================================
   CREATE ERROR
========================================================= */

function createServiceError(
    code
) {

    const error =
        new Error(
            code
        );


    error.code =
        code;


    return error;

}


/* =========================================================
   NORMALIZE AMOUNT
========================================================= */

function normalizeAmount(
    value
) {

    const amount =
        Number(
            value
        );


    if (

        !Number.isFinite(
            amount
        )

        ||

        amount <= 0

    ) {

        throw createServiceError(
            "INVALID_WITHDRAWAL_AMOUNT"
        );

    }


    return amount;

}


/* =========================================================
   NORMALIZE PAYMENT METHOD
========================================================= */

function normalizePaymentMethod(
    paymentMethod
) {

    const method =
        String(
            paymentMethod || ""
        )
        .trim()
        .toLowerCase();


    if (!method) {

        throw createServiceError(
            "INVALID_PAYMENT_METHOD"
        );

    }


    /*
    ---------------------------------------------------------
    Allowed methods

    More methods can be added later if needed.
    ---------------------------------------------------------
    */

    const allowedMethods = [

        "upi",

        "bank",

        "bank_transfer"

    ];


    if (
        !allowedMethods.includes(
            method
        )
    ) {

        throw createServiceError(
            "INVALID_PAYMENT_METHOD"
        );

    }


    return method;

}


/* =========================================================
   NORMALIZE PAYMENT DETAILS
========================================================= */

function normalizePaymentDetails(
    paymentDetails
) {

    const details =
        String(
            paymentDetails || ""
        )
        .trim();


    if (!details) {

        throw createServiceError(
            "INVALID_PAYMENT_DETAILS"
        );

    }


    if (
        details.length > 500
    ) {

        throw createServiceError(
            "INVALID_PAYMENT_DETAILS"
        );

    }


    return details;

}


/* =========================================================
   CREATE WITHDRAWAL REQUEST
========================================================= */

async function createWithdrawalRequest({

    userId,

    amount,

    paymentMethod,

    paymentDetails

}) {

    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        /*
        -----------------------------------------------------
        Validate amount
        -----------------------------------------------------
        */

        const withdrawalAmount =
            normalizeAmount(
                amount
            );


        /*
        -----------------------------------------------------
        Validate payment method
        -----------------------------------------------------
        */

        const normalizedPaymentMethod =
            normalizePaymentMethod(
                paymentMethod
            );


        /*
        -----------------------------------------------------
        Validate payment details
        -----------------------------------------------------
        */

        const normalizedPaymentDetails =
            normalizePaymentDetails(
                paymentDetails
            );


        /*
        -----------------------------------------------------
        Lock wallet
        -----------------------------------------------------
        */

        const walletResult =
            await client.query(
                `
                SELECT
                    id,
                    user_id,
                    currency,
                    status
                FROM wallets
                WHERE user_id = $1
                LIMIT 1
                FOR UPDATE
                `,
                [
                    userId
                ]
            );


        if (
            walletResult.rowCount === 0
        ) {

            throw createServiceError(
                "WALLET_NOT_FOUND"
            );

        }


        const wallet =
            walletResult.rows[0];


        /*
        -----------------------------------------------------
        Check wallet status
        -----------------------------------------------------
        */

        if (
            String(
                wallet.status
            )
            .toLowerCase() !==
            "active"
        ) {

            throw createServiceError(
                "WALLET_INACTIVE"
            );

        }


        /*
        -----------------------------------------------------
        Lock wallet balance
        -----------------------------------------------------
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
                [
                    wallet.id
                ]
            );


        if (
            balanceResult.rowCount === 0
        ) {

            throw createServiceError(
                "WALLET_BALANCE_NOT_FOUND"
            );

        }


        const balance =
            balanceResult.rows[0];


        const availableBefore =
            Number(
                balance.available_balance
            );


        const pendingBefore =
            Number(
                balance.pending_balance
            );


        /*
        -----------------------------------------------------
        Check sufficient balance
        -----------------------------------------------------
        */

        if (
            availableBefore <
            withdrawalAmount
        ) {

            throw createServiceError(
                "INSUFFICIENT_BALANCE"
            );

        }


        /*
        -----------------------------------------------------
        Move funds:

        available_balance decreases

        pending_balance increases

        This prevents user from spending the same money
        while withdrawal is pending.
        -----------------------------------------------------
        */

        const availableAfter =
            availableBefore -
            withdrawalAmount;


        const pendingAfter =
            pendingBefore +
            withdrawalAmount;


        await client.query(
            `
            UPDATE wallet_balances
            SET
                available_balance = $1,
                pending_balance = $2
            WHERE wallet_id = $3
            `,
            [

                availableAfter,

                pendingAfter,

                wallet.id

            ]
        );


        /*
        -----------------------------------------------------
        Create withdrawal request
        -----------------------------------------------------
        */

        const withdrawalResult =
            await client.query(
                `
                INSERT INTO withdrawal_requests (
                    user_id,
                    wallet_id,
                    amount,
                    currency,
                    payment_method,
                    payment_details,
                    status
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    'pending'
                )
                RETURNING
                    id,
                    user_id,
                    wallet_id,
                    amount,
                    currency,
                    payment_method,
                    payment_details,
                    status,
                    requested_at
                `,
                [

                    userId,

                    wallet.id,

                    withdrawalAmount,

                    wallet.currency,

                    normalizedPaymentMethod,

                    normalizedPaymentDetails

                ]
            );


        const withdrawal =
            withdrawalResult.rows[0];


        /*
        -----------------------------------------------------
        Create wallet transaction

        Transaction represents funds moving
        from available balance to pending withdrawal.
        -----------------------------------------------------
        */

        await client.query(
            `
            INSERT INTO wallet_transactions (
                wallet_id,
                user_id,
                transaction_type,
                amount,
                currency,
                balance_before,
                balance_after,
                reference_type,
                reference_id,
                description
            )
            VALUES (
                $1,
                $2,
                'withdrawal_request',
                $3,
                $4,
                $5,
                $6,
                'withdrawal',
                $7,
                'Withdrawal request created'
            )
            `,
            [

                wallet.id,

                userId,

                withdrawalAmount,

                wallet.currency,

                availableBefore,

                availableAfter,

                withdrawal.id

            ]
        );


        /*
        -----------------------------------------------------
        Audit log
        -----------------------------------------------------
        */

        await client.query(
            `
            INSERT INTO audit_logs (
                actor_user_id,
                action,
                entity_type,
                entity_id
            )
            VALUES (
                $1,
                'WITHDRAWAL_REQUEST_CREATED',
                'WITHDRAWAL_REQUEST',
                $2
            )
            `,
            [

                userId,

                String(
                    withdrawal.id
                )

            ]
        );


        await client.query(
            "COMMIT"
        );


        return {

            withdrawal,

            balance: {

                availableBefore,

                availableAfter,

                pendingBefore,

                pendingAfter

            }

        };


    } catch (error) {

        await client.query(
            "ROLLBACK"
        );


        console.error(
            "CREATE WITHDRAWAL ERROR:",
            error
        );


        throw error;


    } finally {

        client.release();

    }

}


/* =========================================================
   GET USER WITHDRAWALS
========================================================= */

async function getUserWithdrawals({

    userId

}) {

    const result =
        await pool.query(
            `
            SELECT
                id,
                amount,
                currency,
                payment_method,
                payment_details,
                status,
                requested_at,
                processed_at,
                processed_by,
                rejection_reason
            FROM withdrawal_requests
            WHERE user_id = $1
            ORDER BY requested_at DESC
            `,
            [
                userId
            ]
        );


    return result.rows;

}


/* =========================================================
   GET PENDING WITHDRAWALS FOR ADMIN
========================================================= */

async function getPendingWithdrawals() {

    const result =
        await pool.query(
            `
            SELECT

                w.id,

                w.user_id,

                w.wallet_id,

                w.amount,

                w.currency,

                w.payment_method,

                w.payment_details,

                w.status,

                w.requested_at,

                u.public_user_id,

                u.full_name,

                u.email,

                wa.available_balance,

                wa.pending_balance

            FROM withdrawal_requests w

            INNER JOIN users u
                ON u.id = w.user_id

            INNER JOIN wallet_balances wa
                ON wa.wallet_id = w.wallet_id

            WHERE w.status = 'pending'

            ORDER BY
                w.requested_at ASC
            `
        );


    return result.rows;

}


/* =========================================================
   APPROVE WITHDRAWAL REQUEST
========================================================= */

async function approveWithdrawalRequest({

    withdrawalId,

    adminUserId

}) {

    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        /*
        -----------------------------------------------------
        Lock withdrawal request
        -----------------------------------------------------
        */

        const withdrawalResult =
            await client.query(
                `
                SELECT
                    id,
                    user_id,
                    wallet_id,
                    amount,
                    currency,
                    status
                FROM withdrawal_requests
                WHERE id = $1
                FOR UPDATE
                `,
                [
                    withdrawalId
                ]
            );


        if (
            withdrawalResult.rowCount === 0
        ) {

            throw createServiceError(
                "WITHDRAWAL_NOT_FOUND"
            );

        }


        const withdrawal =
            withdrawalResult.rows[0];


        /*
        -----------------------------------------------------
        Only pending withdrawals can be approved
        -----------------------------------------------------
        */

        if (
            withdrawal.status !==
            "pending"
        ) {

            throw createServiceError(
                "WITHDRAWAL_ALREADY_PROCESSED"
            );

        }


        /*
        -----------------------------------------------------
        Lock wallet
        -----------------------------------------------------
        */

        const walletResult =
            await client.query(
                `
                SELECT
                    id,
                    user_id,
                    currency,
                    status
                FROM wallets
                WHERE id = $1
                FOR UPDATE
                `,
                [
                    withdrawal.wallet_id
                ]
            );


        if (
            walletResult.rowCount === 0
        ) {

            throw createServiceError(
                "WALLET_NOT_FOUND"
            );

        }


        const wallet =
            walletResult.rows[0];


        /*
        -----------------------------------------------------
        Lock balance
        -----------------------------------------------------
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
                [
                    wallet.id
                ]
            );


        if (
            balanceResult.rowCount === 0
        ) {

            throw createServiceError(
                "WALLET_BALANCE_NOT_FOUND"
            );

        }


        const balance =
            balanceResult.rows[0];


        const availableBefore =
            Number(
                balance.available_balance
            );


        const pendingBefore =
            Number(
                balance.pending_balance
            );


        const withdrawalAmount =
            Number(
                withdrawal.amount
            );


        /*
        -----------------------------------------------------
        Safety check

        Pending balance should contain
        this withdrawal amount.
        -----------------------------------------------------
        */

        if (
            pendingBefore <
            withdrawalAmount
        ) {

            throw createServiceError(
                "INSUFFICIENT_BALANCE"
            );

        }


        /*
        -----------------------------------------------------
        On approval:

        available balance stays unchanged

        pending balance decreases

        Funds are now considered withdrawn.
        -----------------------------------------------------
        */

        const availableAfter =
            availableBefore;


        const pendingAfter =
            pendingBefore -
            withdrawalAmount;


        await client.query(
            `
            UPDATE wallet_balances
            SET
                pending_balance = $1
            WHERE wallet_id = $2
            `,
            [

                pendingAfter,

                wallet.id

            ]
        );


        /*
        -----------------------------------------------------
        Create wallet transaction
        -----------------------------------------------------
        */

        const transactionResult =
            await client.query(
                `
                INSERT INTO wallet_transactions (
                    wallet_id,
                    user_id,
                    transaction_type,
                    amount,
                    currency,
                    balance_before,
                    balance_after,
                    reference_type,
                    reference_id,
                    description
                )
                VALUES (
                    $1,
                    $2,
                    'withdrawal',
                    $3,
                    $4,
                    $5,
                    $6,
                    'withdrawal',
                    $7,
                    'Withdrawal approved by administrator'
                )
                RETURNING
                    id,
                    wallet_id,
                    user_id,
                    transaction_type,
                    amount,
                    currency,
                    balance_before,
                    balance_after,
                    reference_type,
                    reference_id,
                    description,
                    created_at
                `,
                [

                    wallet.id,

                    withdrawal.user_id,

                    withdrawalAmount,

                    withdrawal.currency,

                    availableBefore,

                    availableAfter,

                    withdrawal.id

                ]
            );


        const transaction =
            transactionResult.rows[0];


        /*
        -----------------------------------------------------
        Update withdrawal request
        -----------------------------------------------------
        */

        await client.query(
            `
            UPDATE withdrawal_requests
            SET
                status = 'approved',
                processed_at = NOW(),
                processed_by = $1
            WHERE id = $2
            `,
            [

                adminUserId,

                withdrawal.id

            ]
        );


        /*
        -----------------------------------------------------
        Audit log
        -----------------------------------------------------
        */

        await client.query(
            `
            INSERT INTO audit_logs (
                actor_user_id,
                action,
                entity_type,
                entity_id
            )
            VALUES (
                $1,
                'WITHDRAWAL_APPROVED',
                'WITHDRAWAL_REQUEST',
                $2
            )
            `,
            [

                adminUserId,

                String(
                    withdrawal.id
                )

            ]
        );


        await client.query(
            "COMMIT"
        );


        return {

            withdrawalId:
                withdrawal.id,

            transaction,

            balance: {

                availableBefore,

                availableAfter,

                pendingBefore,

                pendingAfter

            }

        };


    } catch (error) {

        await client.query(
            "ROLLBACK"
        );


        console.error(
            "APPROVE WITHDRAWAL ERROR:",
            error
        );


        throw error;


    } finally {

        client.release();

    }

}


/* =========================================================
   REJECT WITHDRAWAL REQUEST
========================================================= */

async function rejectWithdrawalRequest({

    withdrawalId,

    adminUserId,

    reason

}) {

    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        /*
        -----------------------------------------------------
        Lock withdrawal request
        -----------------------------------------------------
        */

        const withdrawalResult =
            await client.query(
                `
                SELECT
                    id,
                    user_id,
                    wallet_id,
                    amount,
                    currency,
                    status
                FROM withdrawal_requests
                WHERE id = $1
                FOR UPDATE
                `,
                [
                    withdrawalId
                ]
            );


        if (
            withdrawalResult.rowCount === 0
        ) {

            throw createServiceError(
                "WITHDRAWAL_NOT_FOUND"
            );

        }


        const withdrawal =
            withdrawalResult.rows[0];


        /*
        -----------------------------------------------------
        Only pending withdrawal can be rejected
        -----------------------------------------------------
        */

        if (
            withdrawal.status !==
            "pending"
        ) {

            throw createServiceError(
                "WITHDRAWAL_ALREADY_PROCESSED"
            );

        }


        /*
        -----------------------------------------------------
        Lock wallet balance
        -----------------------------------------------------
        */

        const balanceResult =
            await client.query(
                `
                SELECT
                    wallet_id,
                    available_balance,
                    pending_balance
                FROM wallet_balances
                WHERE wallet_id = $1
                FOR UPDATE
                `,
                [
                    withdrawal.wallet_id
                ]
            );


        if (
            balanceResult.rowCount === 0
        ) {

            throw createServiceError(
                "WALLET_BALANCE_NOT_FOUND"
            );

        }


        const balance =
            balanceResult.rows[0];


        const availableBefore =
            Number(
                balance.available_balance
            );


        const pendingBefore =
            Number(
                balance.pending_balance
            );


        const withdrawalAmount =
            Number(
                withdrawal.amount
            );


        /*
        -----------------------------------------------------
        Safety check
        -----------------------------------------------------
        */

        if (
            pendingBefore <
            withdrawalAmount
        ) {

            throw createServiceError(
                "INSUFFICIENT_BALANCE"
            );

        }


        /*
        -----------------------------------------------------
        Return rejected amount:

        available balance increases

        pending balance decreases
        -----------------------------------------------------
        */

        const availableAfter =
            availableBefore +
            withdrawalAmount;


        const pendingAfter =
            pendingBefore -
            withdrawalAmount;


        await client.query(
            `
            UPDATE wallet_balances
            SET
                available_balance = $1,
                pending_balance = $2
            WHERE wallet_id = $3
            `,
            [

                availableAfter,

                pendingAfter,

                withdrawal.wallet_id

            ]
        );


        /*
        -----------------------------------------------------
        Wallet transaction
        -----------------------------------------------------
        */

        await client.query(
            `
            INSERT INTO wallet_transactions (
                wallet_id,
                user_id,
                transaction_type,
                amount,
                currency,
                balance_before,
                balance_after,
                reference_type,
                reference_id,
                description
            )
            VALUES (
                $1,
                $2,
                'withdrawal_reversed',
                $3,
                $4,
                $5,
                $6,
                'withdrawal',
                $7,
                'Withdrawal rejected and funds returned'
            )
            `,
            [

                withdrawal.wallet_id,

                withdrawal.user_id,

                withdrawalAmount,

                withdrawal.currency,

                availableBefore,

                availableAfter,

                withdrawal.id

            ]
        );


        /*
        -----------------------------------------------------
        Update withdrawal request
        -----------------------------------------------------
        */

        await client.query(
            `
            UPDATE withdrawal_requests
            SET
                status = 'rejected',
                processed_at = NOW(),
                processed_by = $1,
                rejection_reason = $2
            WHERE id = $3
            `,
            [

                adminUserId,

                reason
                    ? String(
                        reason
                    )
                    .trim()
                    .slice(
                        0,
                        500
                    )
                    : null,

                withdrawal.id

            ]
        );


        /*
        -----------------------------------------------------
        Audit log
        -----------------------------------------------------
        */

        await client.query(
            `
            INSERT INTO audit_logs (
                actor_user_id,
                action,
                entity_type,
                entity_id
            )
            VALUES (
                $1,
                'WITHDRAWAL_REJECTED',
                'WITHDRAWAL_REQUEST',
                $2
            )
            `,
            [

                adminUserId,

                String(
                    withdrawal.id
                )

            ]
        );


        await client.query(
            "COMMIT"
        );


        return {

            success:
                true,

            withdrawalId:
                withdrawal.id,

            balance: {

                availableBefore,

                availableAfter,

                pendingBefore,

                pendingAfter

            }

        };


    } catch (error) {

        await client.query(
            "ROLLBACK"
        );


        console.error(
            "REJECT WITHDRAWAL ERROR:",
            error
        );


        throw error;


    } finally {

        client.release();

    }

}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    createWithdrawalRequest,

    getUserWithdrawals,

    getPendingWithdrawals,

    approveWithdrawalRequest,

    rejectWithdrawalRequest

};
