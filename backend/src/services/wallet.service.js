"use strict";


const pool =
    require(
        "../config/db"
    );


/*
|--------------------------------------------------------------------------
| SERVICE ERROR
|--------------------------------------------------------------------------
*/

function createServiceError(
    code,
    message,
    status
) {

    const error =
        new Error(
            message
        );


    error.code =
        code;


    error.status =
        status ||
        500;


    return error;

}


/*
|--------------------------------------------------------------------------
| GET USER WALLET
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| The application must use one deterministic wallet.
|
| Priority:
|
| 1. Wallet having a wallet_balances row
| 2. Active wallet
| 3. Most recently updated balance
|
|--------------------------------------------------------------------------
*/

async function findUserWallet(
    executor,
    userId,
    forUpdate
) {

    if (
        !userId
    ) {

        throw createServiceError(

            "UNAUTHORIZED",

            "Authenticated user ID is missing.",

            401

        );

    }


    const lockClause =
        forUpdate

            ?

            "FOR UPDATE OF w, wb"

            :

            "";


    const result =
        await executor.query(

            `
            SELECT

                w.id AS wallet_id,

                w.user_id,

                w.currency AS wallet_currency,

                w.status,

                wb.wallet_id AS balance_wallet_id,

                wb.available_balance,

                wb.pending_balance,

                wb.currency AS balance_currency,

                wb.updated_at AS balance_updated_at

            FROM wallets w

            LEFT JOIN wallet_balances wb

                ON wb.wallet_id = w.id

            WHERE
                w.user_id = $1

            ORDER BY

                CASE

                    WHEN wb.wallet_id IS NOT NULL
                    THEN 0

                    ELSE 1

                END ASC,


                CASE

                    WHEN LOWER(
                        COALESCE(
                            w.status,
                            ''
                        )
                    ) = 'active'

                    THEN 0

                    ELSE 1

                END ASC,


                wb.updated_at DESC NULLS LAST,


                w.id DESC

            LIMIT 1

            ${lockClause}
            `,

            [
                userId
            ]

        );


    if (
        result.rowCount === 0
    ) {

        throw createServiceError(

            "WALLET_NOT_FOUND",

            "Wallet not found for this user.",

            404

        );

    }


    return result.rows[0];

}


/*
|--------------------------------------------------------------------------
| GET WALLET
|--------------------------------------------------------------------------
*/

async function getWallet(
    userId
) {

    const wallet =
        await findUserWallet(

            pool,

            userId,

            false

        );


    /*
    ----------------------------------------------------------
    IMPORTANT
    ----------------------------------------------------------

    Do NOT silently return zero when the balance row is missing.

    That hides database relationship problems.
    */

    if (
        !wallet.balance_wallet_id
    ) {

        throw createServiceError(

            "WALLET_BALANCE_NOT_FOUND",

            "Wallet balance record not found.",

            404

        );

    }


    const availableBalance =
        Number(
            wallet.available_balance
        );


    const pendingBalance =
        Number(
            wallet.pending_balance
        );


    if (

        !Number.isFinite(
            availableBalance
        )

    ) {

        throw createServiceError(

            "INVALID_WALLET_BALANCE",

            "Available wallet balance is invalid.",

            500

        );

    }


    if (

        !Number.isFinite(
            pendingBalance
        )

    ) {

        throw createServiceError(

            "INVALID_WALLET_BALANCE",

            "Pending wallet balance is invalid.",

            500

        );

    }


    return {

        wallet_id:
            wallet.wallet_id,


        user_id:
            wallet.user_id,


        currency:

            wallet.balance_currency ||

            wallet.wallet_currency ||

            "INR",


        status:
            wallet.status,


        available_balance:
            availableBalance,


        pending_balance:
            pendingBalance,


        updated_at:
            wallet.balance_updated_at ||
            null

    };

}


/*
|--------------------------------------------------------------------------
| GET TRANSACTIONS
|--------------------------------------------------------------------------
*/

async function getTransactions(
    userId,
    limit
) {

    let safeLimit =
        Number(
            limit
        );


    if (

        !Number.isInteger(
            safeLimit
        )

        ||

        safeLimit <= 0

    ) {

        safeLimit =
            50;

    }


    if (
        safeLimit > 100
    ) {

        safeLimit =
            100;

    }


    /*
    ----------------------------------------------------------
    Use the exact same wallet selected by getWallet().
    ----------------------------------------------------------
    */

    const wallet =
        await findUserWallet(

            pool,

            userId,

            false

        );


    const result =
        await pool.query(

            `
            SELECT

                wt.id,

                wt.wallet_id,

                wt.transaction_type,

                wt.amount,

                wt.currency,

                wt.status,

                wt.reference_type,

                wt.reference_id,

                wt.description,

                wt.created_at

            FROM wallet_transactions wt

            WHERE
                wt.wallet_id = $1

            ORDER BY
                wt.created_at DESC

            LIMIT $2
            `,

            [

                wallet.wallet_id,

                safeLimit

            ]

        );


    return result.rows.map(

        function (
            transaction
        ) {

            return {

                ...transaction,

                amount:

                    Number(
                        transaction.amount
                    )

            };

        }

    );

}


/*
|--------------------------------------------------------------------------
| SEND MONEY
|--------------------------------------------------------------------------
*/

async function sendMoney({

    senderUserId,

    receiverUserId,

    amount,

    description,

    idempotencyKey

}) {

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

        throw createServiceError(

            "INVALID_AMOUNT",

            "Invalid amount.",

            400

        );

    }


    if (

        !senderUserId ||

        !receiverUserId

    ) {

        throw createServiceError(

            "USER_REQUIRED",

            "Sender and receiver are required.",

            400

        );

    }


    if (

        String(
            senderUserId
        )

        ===

        String(
            receiverUserId
        )

    ) {

        throw createServiceError(

            "SELF_TRANSFER",

            "You cannot send money to yourself.",

            400

        );

    }


    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        /*
        ------------------------------------------------------
        Find wallets deterministically.
        ------------------------------------------------------
        */

        const senderWallet =
            await findUserWallet(

                client,

                senderUserId,

                true

            );


        const receiverWallet =
            await findUserWallet(

                client,

                receiverUserId,

                true

            );


        /*
        ------------------------------------------------------
        Wallet status
        ------------------------------------------------------
        */

        if (

            String(
                senderWallet.status
            )
            .toLowerCase()

            !==

            "active"

        ) {

            throw createServiceError(

                "WALLET_NOT_ACTIVE",

                "Sender wallet is not active.",

                403

            );

        }


        if (

            String(
                receiverWallet.status
            )
            .toLowerCase()

            !==

            "active"

        ) {

            throw createServiceError(

                "RECEIVER_WALLET_NOT_ACTIVE",

                "Receiver wallet is not active.",

                403

            );

        }


        if (

            !senderWallet.balance_wallet_id

            ||

            !receiverWallet.balance_wallet_id

        ) {

            throw createServiceError(

                "WALLET_BALANCE_NOT_FOUND",

                "Wallet balance record not found.",

                404

            );

        }


        const senderCurrency =
            senderWallet.balance_currency ||
            senderWallet.wallet_currency ||
            "INR";


        const receiverCurrency =
            receiverWallet.balance_currency ||
            receiverWallet.wallet_currency ||
            "INR";


        if (

            String(
                senderCurrency
            )

            !==

            String(
                receiverCurrency
            )

        ) {

            throw createServiceError(

                "CURRENCY_MISMATCH",

                "Wallet currencies do not match.",

                400

            );

        }


        const senderAvailable =
            Number(
                senderWallet.available_balance
            );


        const receiverAvailable =
            Number(
                receiverWallet.available_balance
            );


        if (

            !Number.isFinite(
                senderAvailable
            )

            ||

            !Number.isFinite(
                receiverAvailable
            )

        ) {

            throw createServiceError(

                "INVALID_WALLET_BALANCE",

                "Wallet balance data is invalid.",

                500

            );

        }


        if (

            senderAvailable <
            numericAmount

        ) {

            throw createServiceError(

                "INSUFFICIENT_BALANCE",

                "Insufficient wallet balance.",

                400

            );

        }


        const senderNewBalance =
            senderAvailable -
            numericAmount;


        const receiverNewBalance =
            receiverAvailable +
            numericAmount;


        /*
        ------------------------------------------------------
        UPDATE SENDER
        ------------------------------------------------------
        */

        await client.query(

            `
            UPDATE wallet_balances

            SET

                available_balance = $1,

                updated_at = NOW()

            WHERE
                wallet_id = $2
            `,

            [

                senderNewBalance,

                senderWallet.wallet_id

            ]

        );


        /*
        ------------------------------------------------------
        UPDATE RECEIVER
        ------------------------------------------------------
        */

        await client.query(

            `
            UPDATE wallet_balances

            SET

                available_balance = $1,

                updated_at = NOW()

            WHERE
                wallet_id = $2
            `,

            [

                receiverNewBalance,

                receiverWallet.wallet_id

            ]

        );


        /*
        ------------------------------------------------------
        SENDER TRANSACTION
        ------------------------------------------------------
        */

        const senderTransactionResult =
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

                    'transfer_out',

                    $2,

                    $3,

                    'completed',

                    'user_transfer',

                    NULL,

                    $4

                )

                RETURNING *
                `,

                [

                    senderWallet.wallet_id,

                    numericAmount,

                    senderCurrency,

                    description ||
                    "Money sent"

                ]

            );


        /*
        ------------------------------------------------------
        RECEIVER TRANSACTION
        ------------------------------------------------------
        */

        const receiverTransactionResult =
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

                    'transfer_in',

                    $2,

                    $3,

                    'completed',

                    'user_transfer',

                    NULL,

                    $4

                )

                RETURNING *
                `,

                [

                    receiverWallet.wallet_id,

                    numericAmount,

                    receiverCurrency,

                    description ||
                    "Money received"

                ]

            );


        await client.query(
            "COMMIT"
        );


        return {

            success:
                true,


            duplicate:
                false,


            senderTransaction:
                senderTransactionResult.rows[0],


            receiverTransaction:
                receiverTransactionResult.rows[0],


            senderBalance:
                senderNewBalance,


            receiverBalance:
                receiverNewBalance

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

                "SEND MONEY ROLLBACK ERROR:",

                rollbackError

            );

        }


        console.error(

            "SEND MONEY SERVICE ERROR:",

            error

        );


        throw error;


    } finally {

        client.release();

    }

}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

    getWallet,

    getTransactions,

    sendMoney

};
