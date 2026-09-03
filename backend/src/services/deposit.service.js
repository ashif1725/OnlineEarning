"use strict";


const pool =
    require(
        "../config/db"
    );


/*
|--------------------------------------------------------------------------
| CREATE DEPOSIT REQUEST
|--------------------------------------------------------------------------
*/

async function createDepositRequest({
    userId,
    amount
}) {

    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        const numericAmount =
            Number(
                amount
            );


        if (

            !Number.isFinite(
                numericAmount
            )

            ||

            numericAmount <= 0

        ) {

            const error =
                new Error(
                    "Invalid deposit amount."
                );


            error.code =
                "INVALID_DEPOSIT_AMOUNT";


            throw error;

        }


        /*
        --------------------------------------------------------------
        FIND USER WALLET
        --------------------------------------------------------------
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

            const error =
                new Error(
                    "Wallet not found."
                );


            error.code =
                "WALLET_NOT_FOUND";


            throw error;

        }


        const wallet =
            walletResult.rows[0];


        if (

            String(
                wallet.status
            )
            .toLowerCase()

            !==

            "active"

        ) {

            const error =
                new Error(
                    "Wallet is not active."
                );


            error.code =
                "WALLET_INACTIVE";


            throw error;

        }


        /*
        --------------------------------------------------------------
        CREATE DEPOSIT
        --------------------------------------------------------------
        */

        const depositResult =
            await client.query(

                `
                INSERT INTO deposit_requests (
                    user_id,
                    wallet_id,
                    amount,
                    currency,
                    status
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    'pending'
                )
                RETURNING
                    id,
                    user_id,
                    wallet_id,
                    amount,
                    currency,
                    status,
                    requested_at
                `,

                [

                    userId,

                    wallet.id,

                    numericAmount,

                    wallet.currency

                ]

            );


        const deposit =
            depositResult.rows[0];


        /*
        --------------------------------------------------------------
        AUDIT LOG
        --------------------------------------------------------------
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
                'DEPOSIT_REQUEST_CREATED',
                'DEPOSIT_REQUEST',
                $2
            )
            `,

            [

                userId,

                String(
                    deposit.id
                )

            ]

        );


        await client.query(
            "COMMIT"
        );


        return deposit;


    } catch (
        error
    ) {

        await client.query(
            "ROLLBACK"
        );


        console.error(
            "CREATE DEPOSIT ERROR:",
            error
        );


        throw error;


    } finally {

        client.release();

    }

}


/*
|--------------------------------------------------------------------------
| GET USER DEPOSIT REQUESTS
|--------------------------------------------------------------------------
*/

async function getUserDepositRequests({
    userId
}) {

    const result =
        await pool.query(

            `
            SELECT
                id,
                amount,
                currency,
                status,
                requested_at,
                verified_at,
                rejection_reason
            FROM deposit_requests
            WHERE user_id = $1
            ORDER BY requested_at DESC
            `,

            [
                userId
            ]

        );


    return result.rows;

}


/*
|--------------------------------------------------------------------------
| ADMIN APPROVE DEPOSIT
|--------------------------------------------------------------------------
*/

async function approveDepositRequest({
    depositId,
    adminUserId
}) {

    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        /*
        --------------------------------------------------------------
        LOCK DEPOSIT
        --------------------------------------------------------------
        */

        const depositResult =
            await client.query(

                `
                SELECT
                    id,
                    user_id,
                    wallet_id,
                    amount,
                    currency,
                    status
                FROM deposit_requests
                WHERE id = $1
                FOR UPDATE
                `,

                [
                    depositId
                ]

            );


        if (
            depositResult.rowCount === 0
        ) {

            const error =
                new Error(
                    "Deposit request not found."
                );


            error.code =
                "DEPOSIT_NOT_FOUND";


            throw error;

        }


        const deposit =
            depositResult.rows[0];


        /*
        --------------------------------------------------------------
        ONLY PENDING DEPOSITS
        --------------------------------------------------------------
        */

        if (

            String(
                deposit.status
            )
            .toLowerCase()

            !==

            "pending"

        ) {

            const error =
                new Error(
                    "This deposit has already been processed."
                );


            error.code =
                "DEPOSIT_ALREADY_PROCESSED";


            throw error;

        }


        /*
        --------------------------------------------------------------
        VALIDATE DEPOSIT AMOUNT
        --------------------------------------------------------------
        */

        const depositAmount =
            Number(
                deposit.amount
            );


        if (

            !Number.isFinite(
                depositAmount
            )

            ||

            depositAmount <= 0

        ) {

            const error =
                new Error(
                    "Invalid deposit amount."
                );


            error.code =
                "INVALID_DEPOSIT_AMOUNT";


            throw error;

        }


        /*
        --------------------------------------------------------------
        LOCK WALLET
        --------------------------------------------------------------
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
                    deposit.wallet_id
                ]

            );


        if (
            walletResult.rowCount === 0
        ) {

            const error =
                new Error(
                    "Wallet not found for this deposit."
                );


            error.code =
                "WALLET_NOT_FOUND";


            throw error;

        }


        const wallet =
            walletResult.rows[0];


        /*
        --------------------------------------------------------------
        SECURITY CHECK
        --------------------------------------------------------------
        */

        if (

            String(
                wallet.user_id
            )

            !==

            String(
                deposit.user_id
            )

        ) {

            const error =
                new Error(
                    "Deposit wallet does not belong to the deposit user."
                );


            error.code =
                "WALLET_USER_MISMATCH";


            throw error;

        }


        /*
        --------------------------------------------------------------
        CHECK WALLET STATUS
        --------------------------------------------------------------
        */

        if (

            String(
                wallet.status
            )
            .toLowerCase()

            !==

            "active"

        ) {

            const error =
                new Error(
                    "Wallet is not active."
                );


            error.code =
                "WALLET_INACTIVE";


            throw error;

        }


        /*
        --------------------------------------------------------------
        LOCK WALLET BALANCE
        --------------------------------------------------------------
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

            const error =
                new Error(
                    "Wallet balance record not found."
                );


            error.code =
                "WALLET_BALANCE_NOT_FOUND";


            throw error;

        }


        const balance =
            balanceResult.rows[0];


        const balanceBefore =
            Number(
                balance.available_balance
            );


        if (

            !Number.isFinite(
                balanceBefore
            )

        ) {

            const error =
                new Error(
                    "Wallet balance is invalid."
                );


            error.code =
                "INVALID_WALLET_BALANCE";


            throw error;

        }


        const balanceAfter =
            balanceBefore +
            depositAmount;


        /*
        --------------------------------------------------------------
        UPDATE WALLET BALANCE
        --------------------------------------------------------------
        */

        await client.query(

            `
            UPDATE wallet_balances
            SET
                available_balance = $1
            WHERE wallet_id = $2
            `,

            [

                balanceAfter,

                wallet.id

            ]

        );


        /*
|--------------------------------------------------------------------------
| CREATE WALLET TRANSACTION
|--------------------------------------------------------------------------
*/

const transactionResult =
    await client.query(

        `
        INSERT INTO wallet_transactions (
            wallet_id,
            transaction_type,
            amount,
            currency,
            status,
            reference_type,
            reference_id,
            description
        )
        VALUES (
            $1,
            'deposit',
            $2,
            $3,
            'completed',
            'deposit',
            $4,
            'Deposit approved by administrator'
        )
        RETURNING
            id,
            wallet_id,
            transaction_type,
            amount,
            currency,
            status,
            reference_type,
            reference_id,
            description,
            created_at
        `,

        [

            wallet.id,

            depositAmount,

            deposit.currency,

            deposit.id

        ]

    );


const transaction =
    transactionResult.rows[0];


        /*
        --------------------------------------------------------------
        MARK DEPOSIT AS APPROVED
        --------------------------------------------------------------
        */

        const updateDepositResult =
            await client.query(

                `
                UPDATE deposit_requests
                SET
                    status = 'approved',
                    verified_at = NOW(),
                    verified_by = $1
                WHERE
                    id = $2
                    AND status = 'pending'
                RETURNING
                    id,
                    status,
                    verified_at,
                    verified_by
                `,

                [

                    adminUserId,

                    deposit.id

                ]

            );


        if (
            updateDepositResult.rowCount === 0
        ) {

            const error =
                new Error(
                    "Deposit status could not be updated."
                );


            error.code =
                "DEPOSIT_UPDATE_FAILED";


            throw error;

        }


        /*
        --------------------------------------------------------------
        AUDIT LOG
        --------------------------------------------------------------
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
                'DEPOSIT_APPROVED',
                'DEPOSIT_REQUEST',
                $2
            )
            `,

            [

                adminUserId,

                String(
                    deposit.id
                )

            ]

        );


        await client.query(
            "COMMIT"
        );


        return {

            success:
                true,

            depositId:
                deposit.id,

            transaction,

            balance: {

                before:
                    balanceBefore,

                after:
                    balanceAfter

            }

        };


    } catch (
        error
    ) {

        try {

            await client.query(
                "ROLLBACK"
            );

        } catch (
            rollbackError
        ) {

            console.error(
                "APPROVE DEPOSIT ROLLBACK ERROR:",
                rollbackError
            );

        }


        console.error(
            "APPROVE DEPOSIT ERROR:",
            {

                message:
                    error.message,

                code:
                    error.code,

                detail:
                    error.detail,

                table:
                    error.table,

                column:
                    error.column,

                constraint:
                    error.constraint

            }
        );


        throw error;


    } finally {

        client.release();

    }

}


/*
|--------------------------------------------------------------------------
| ADMIN REJECT DEPOSIT
|--------------------------------------------------------------------------
*/

async function rejectDepositRequest({
    depositId,
    adminUserId,
    reason
}) {

    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        const result =
            await client.query(

                `
                SELECT
                    id,
                    status
                FROM deposit_requests
                WHERE id = $1
                FOR UPDATE
                `,

                [
                    depositId
                ]

            );


        if (
            result.rowCount === 0
        ) {

            const error =
                new Error(
                    "Deposit request not found."
                );


            error.code =
                "DEPOSIT_NOT_FOUND";


            throw error;

        }


        const deposit =
            result.rows[0];


        if (

            String(
                deposit.status
            )
            .toLowerCase()

            !==

            "pending"

        ) {

            const error =
                new Error(
                    "This deposit has already been processed."
                );


            error.code =
                "DEPOSIT_ALREADY_PROCESSED";


            throw error;

        }


        await client.query(

            `
            UPDATE deposit_requests
            SET
                status = 'rejected',
                verified_at = NOW(),
                verified_by = $1,
                rejection_reason = $2
            WHERE id = $3
            `,

            [

                adminUserId,

                reason ||
                null,

                depositId

            ]

        );


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
                'DEPOSIT_REJECTED',
                'DEPOSIT_REQUEST',
                $2
            )
            `,

            [

                adminUserId,

                String(
                    depositId
                )

            ]

        );


        await client.query(
            "COMMIT"
        );


        return {

            success:
                true

        };


    } catch (
        error
    ) {

        try {

            await client.query(
                "ROLLBACK"
            );

        } catch (
            rollbackError
        ) {

            console.error(
                "REJECT DEPOSIT ROLLBACK ERROR:",
                rollbackError
            );

        }


        console.error(
            "REJECT DEPOSIT ERROR:",
            error
        );


        throw error;


    } finally {

        client.release();

    }

}


/*
|--------------------------------------------------------------------------
| GET PENDING DEPOSITS FOR ADMIN
|--------------------------------------------------------------------------
*/

async function getPendingDeposits() {

    const result =
        await pool.query(

            `
            SELECT
                d.id,
                d.user_id,
                d.wallet_id,
                d.amount,
                d.currency,
                d.status,
                d.requested_at,

                u.public_user_id,
                u.full_name,
                u.email,

                w.id AS wallet_id

            FROM deposit_requests d

            INNER JOIN users u
                ON u.id = d.user_id

            INNER JOIN wallets w
                ON w.id = d.wallet_id

            WHERE d.status = 'pending'

            ORDER BY
                d.requested_at ASC
            `

        );


    return result.rows;

}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

    createDepositRequest,

    getUserDepositRequests,

    approveDepositRequest,

    rejectDepositRequest,

    getPendingDeposits

};
