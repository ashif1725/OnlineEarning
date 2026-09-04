"use strict";


const pool =
    require(
        "../config/db"
    );


/*
|--------------------------------------------------------------------------
| HELPERS
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
| GET WALLET
|--------------------------------------------------------------------------
*/

async function getWallet(
    userId
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


    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |
    | This query uses the CURRENT wallet architecture:
    |
    | users
    |   ->
    | wallets
    |   ->
    | wallet_balances
    |--------------------------------------------------------------------------
    */


    const result =
        await pool.query(

            `
            SELECT

                w.id
                    AS wallet_id,

                w.user_id,

                w.currency,

                w.status,

                COALESCE(
                    wb.available_balance,
                    0
                )
                    AS available_balance,

                COALESCE(
                    wb.pending_balance,
                    0
                )
                    AS pending_balance,

                COALESCE(
                    wb.currency,
                    w.currency,
                    'INR'
                )
                    AS balance_currency,

                wb.updated_at
                    AS balance_updated_at

            FROM wallets w

            LEFT JOIN wallet_balances wb

                ON wb.wallet_id =
                    w.id

            WHERE
                w.user_id = $1

            LIMIT 1
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


    const wallet =
        result.rows[0];


    /*
    |--------------------------------------------------------------------------
    | NORMALIZE NUMERIC VALUES
    |--------------------------------------------------------------------------
    */

    const availableBalance =
        Number(
            wallet.available_balance
        );


    const pendingBalance =
        Number(
            wallet.pending_balance
        );


    return {

        wallet_id:
            wallet.wallet_id,

        user_id:
            wallet.user_id,

        currency:

            wallet.balance_currency ||

            wallet.currency ||

            "INR",

        status:
            wallet.status,

        available_balance:

            Number.isFinite(
                availableBalance
            )

                ?

                availableBalance

                :

                0,

        pending_balance:

            Number.isFinite(
                pendingBalance
            )

                ?

                pendingBalance

                :

                0,

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

    if (
        !userId
    ) {

        throw createServiceError(

            "UNAUTHORIZED",

            "Authenticated user ID is missing.",

            401

        );

    }


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

            INNER JOIN wallets w

                ON w.id =
                    wt.wallet_id

            WHERE
                w.user_id = $1

            ORDER BY
                wt.created_at DESC

            LIMIT $2
            `,

            [

                userId,

                safeLimit

            ]

        );


    return result.rows.map(

        function (
            transaction
        ) {

            const amount =
                Number(
                    transaction.amount
                );


            return {

                ...transaction,

                amount:

                    Number.isFinite(
                        amount
                    )

                        ?

                        amount

                        :

                        0

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


    if (
        !senderUserId
    ) {

        throw createServiceError(

            "UNAUTHORIZED",

            "Sender user ID is missing.",

            401

        );

    }


    if (
        !receiverUserId
    ) {

        throw createServiceError(

            "RECEIVER_REQUIRED",

            "Receiver user ID is required.",

            400

        );

    }


    const numericAmount =
        Number(
            amount
        );


    /*
    |--------------------------------------------------------------------------
    | VALIDATE AMOUNT
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | PREVENT SELF TRANSFER
    |--------------------------------------------------------------------------
    */

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
        |--------------------------------------------------------------------------
        | FIND SENDER WALLET
        |--------------------------------------------------------------------------
        */

        const senderWalletResult =
            await client.query(

                `
                SELECT

                    id,

                    user_id,

                    currency,

                    status

                FROM wallets

                WHERE
                    user_id = $1

                LIMIT 1

                FOR UPDATE
                `,

                [
                    senderUserId
                ]

            );


        if (
            senderWalletResult.rowCount === 0
        ) {

            throw createServiceError(

                "WALLET_NOT_FOUND",

                "Sender wallet not found.",

                404

            );

        }


        const senderWallet =
            senderWalletResult.rows[0];


        /*
        |--------------------------------------------------------------------------
        | CHECK SENDER STATUS
        |--------------------------------------------------------------------------
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


        /*
        |--------------------------------------------------------------------------
        | FIND RECEIVER WALLET
        |--------------------------------------------------------------------------
        */

        const receiverWalletResult =
            await client.query(

                `
                SELECT

                    id,

                    user_id,

                    currency,

                    status

                FROM wallets

                WHERE
                    user_id = $1

                LIMIT 1

                FOR UPDATE
                `,

                [
                    receiverUserId
                ]

            );


        if (
            receiverWalletResult.rowCount === 0
        ) {

            throw createServiceError(

                "RECEIVER_WALLET_NOT_FOUND",

                "Receiver wallet not found.",

                404

            );

        }


        const receiverWallet =
            receiverWalletResult.rows[0];


        /*
        |--------------------------------------------------------------------------
        | CHECK RECEIVER STATUS
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | CHECK CURRENCY
        |--------------------------------------------------------------------------
        */

        if (

            String(
                senderWallet.currency
            )

            !==

            String(
                receiverWallet.currency
            )

        ) {

            throw createServiceError(

                "CURRENCY_MISMATCH",

                "Wallet currencies do not match.",

                400

            );

        }


        /*
        |--------------------------------------------------------------------------
        | LOCK SENDER BALANCE
        |--------------------------------------------------------------------------
        */

        const senderBalanceResult =
            await client.query(

                `
                SELECT

                    wallet_id,

                    available_balance,

                    pending_balance,

                    currency

                FROM wallet_balances

                WHERE
                    wallet_id = $1

                FOR UPDATE
                `,

                [
                    senderWallet.id
                ]

            );


        if (
            senderBalanceResult.rowCount === 0
        ) {

            throw createServiceError(

                "WALLET_BALANCE_NOT_FOUND",

                "Sender wallet balance not found.",

                404

            );

        }


        const senderBalance =
            senderBalanceResult.rows[0];


        /*
        |--------------------------------------------------------------------------
        | LOCK RECEIVER BALANCE
        |--------------------------------------------------------------------------
        */

        const receiverBalanceResult =
            await client.query(

                `
                SELECT

                    wallet_id,

                    available_balance,

                    pending_balance,

                    currency

                FROM wallet_balances

                WHERE
                    wallet_id = $1

                FOR UPDATE
                `,

                [
                    receiverWallet.id
                ]

            );


        if (
            receiverBalanceResult.rowCount === 0
        ) {

            throw createServiceError(

                "WALLET_BALANCE_NOT_FOUND",

                "Receiver wallet balance not found.",

                404

            );

        }


        const receiverBalance =
            receiverBalanceResult.rows[0];


        const senderAvailable =
            Number(
                senderBalance.available_balance
            );


        const receiverAvailable =
            Number(
                receiverBalance.available_balance
            );


        /*
        |--------------------------------------------------------------------------
        | VALIDATE DATABASE BALANCES
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | CHECK SENDER BALANCE
        |--------------------------------------------------------------------------
        */

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
        |--------------------------------------------------------------------------
        | UPDATE SENDER BALANCE
        |--------------------------------------------------------------------------
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

                senderWallet.id

            ]

        );


        /*
        |--------------------------------------------------------------------------
        | UPDATE RECEIVER BALANCE
        |--------------------------------------------------------------------------
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

                receiverWallet.id

            ]

        );


        /*
        |--------------------------------------------------------------------------
        | CREATE SENDER TRANSACTION
        |--------------------------------------------------------------------------
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

                RETURNING
                    *
                `,

                [

                    senderWallet.id,

                    numericAmount,

                    senderWallet.currency,

                    description ||
                    "Money sent"

                ]

            );


        /*
        |--------------------------------------------------------------------------
        | CREATE RECEIVER TRANSACTION
        |--------------------------------------------------------------------------
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

                RETURNING
                    *
                `,

                [

                    receiverWallet.id,

                    numericAmount,

                    receiverWallet.currency,

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

                senderTransactionResult
                    .rows[0],

            receiverTransaction:

                receiverTransactionResult
                    .rows[0],

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
                    error.column

            }

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
