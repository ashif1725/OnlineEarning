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

function createWalletError(
    message,
    code
) {

    const error =
        new Error(
            message
        );


    error.code =
        code;


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

        throw createWalletError(

            "Authenticated user ID is missing.",

            "AUTH_USER_ID_MISSING"

        );

    }


    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |
    | We intentionally do NOT use:
    |
    | LEFT JOIN + COALESCE(balance, 0)
    |
    | for the primary wallet read.
    |
    | If wallet_balances is missing, returning 0 hides a database
    | relationship problem.
    |--------------------------------------------------------------------------
    */

    const result =
        await pool.query(

            `
            SELECT

                w.id AS wallet_id,

                w.user_id,

                w.currency,

                w.status,

                wb.available_balance,

                wb.pending_balance,

                wb.currency AS balance_currency

            FROM wallets w

            INNER JOIN wallet_balances wb

                ON wb.wallet_id = w.id

            WHERE

                w.user_id = $1

            LIMIT 1
            `,

            [
                userId
            ]

        );


    /*
    |--------------------------------------------------------------------------
    | NO ROW FOUND
    |--------------------------------------------------------------------------
    */

    if (
        result.rowCount === 0
    ) {

        /*
        --------------------------------------------------------------
        Check separately whether:
        1. wallet does not exist
        OR
        2. wallet exists but wallet_balances row is missing
        --------------------------------------------------------------
        */

        const walletCheck =
            await pool.query(

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
                `,

                [
                    userId
                ]

            );


        if (
            walletCheck.rowCount === 0
        ) {

            throw createWalletError(

                "Wallet not found for this authenticated user.",

                "WALLET_NOT_FOUND"

            );

        }


        throw createWalletError(

            "Wallet exists but wallet balance record is missing.",

            "WALLET_BALANCE_NOT_FOUND"

        );

    }


    const wallet =
        result.rows[0];


    /*
    |--------------------------------------------------------------------------
    | CURRENCY CONSISTENCY
    |--------------------------------------------------------------------------
    */

    if (

        wallet.balance_currency

        &&

        wallet.currency

        &&

        String(
            wallet.balance_currency
        )

        !==

        String(
            wallet.currency
        )

    ) {

        throw createWalletError(

            "Wallet currency and wallet balance currency do not match.",

            "WALLET_CURRENCY_MISMATCH"

        );

    }


    /*
    |--------------------------------------------------------------------------
    | SAFE NUMERIC CONVERSION
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


    /*
    |--------------------------------------------------------------------------
    | DATABASE DATA VALIDATION
    |--------------------------------------------------------------------------
    */

    if (

        !Number.isFinite(
            availableBalance
        )

    ) {

        throw createWalletError(

            "Wallet available balance is invalid.",

            "INVALID_WALLET_BALANCE"

        );

    }


    if (

        !Number.isFinite(
            pendingBalance
        )

    ) {

        throw createWalletError(

            "Wallet pending balance is invalid.",

            "INVALID_PENDING_BALANCE"

        );

    }


    /*
    |--------------------------------------------------------------------------
    | RETURN
    |--------------------------------------------------------------------------
    */

    return {

        wallet_id:
            wallet.wallet_id,

        user_id:
            wallet.user_id,

        currency:
            wallet.currency,

        status:
            wallet.status,

        available_balance:
            availableBalance,

        pending_balance:
            pendingBalance

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

        throw createWalletError(

            "Authenticated user ID is missing.",

            "AUTH_USER_ID_MISSING"

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


    return result.rows;

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


    /*
    |--------------------------------------------------------------------------
    | VALIDATE USER IDs
    |--------------------------------------------------------------------------
    */

    if (
        !senderUserId
    ) {

        throw createWalletError(

            "Sender user ID is missing.",

            "AUTH_USER_ID_MISSING"

        );

    }


    if (
        !receiverUserId
    ) {

        throw createWalletError(

            "Receiver user ID is required.",

            "RECEIVER_REQUIRED"

        );

    }


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

        throw createWalletError(

            "Invalid amount.",

            "INVALID_AMOUNT"

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

        throw createWalletError(

            "You cannot send money to yourself.",

            "SELF_TRANSFER"

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
        | LOCK WALLETS
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

            throw createWalletError(

                "Sender wallet not found.",

                "WALLET_NOT_FOUND"

            );

        }


        const senderWallet =
            senderWalletResult.rows[0];


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

            throw createWalletError(

                "Receiver wallet not found.",

                "RECEIVER_WALLET_NOT_FOUND"

            );

        }


        const receiverWallet =
            receiverWalletResult.rows[0];


        /*
        |--------------------------------------------------------------------------
        | CHECK WALLET STATUS
        |--------------------------------------------------------------------------
        */

        if (

            String(
                senderWallet.status ||
                ""
            )
            .toLowerCase()

            !==

            "active"

        ) {

            throw createWalletError(

                "Sender wallet is not active.",

                "WALLET_NOT_ACTIVE"

            );

        }


        if (

            String(
                receiverWallet.status ||
                ""
            )
            .toLowerCase()

            !==

            "active"

        ) {

            throw createWalletError(

                "Receiver wallet is not active.",

                "WALLET_NOT_ACTIVE"

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

            throw createWalletError(

                "Wallet currencies do not match.",

                "CURRENCY_MISMATCH"

            );

        }


        /*
        |--------------------------------------------------------------------------
        | LOCK BALANCES
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

            throw createWalletError(

                "Sender wallet balance not found.",

                "WALLET_BALANCE_NOT_FOUND"

            );

        }


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

            throw createWalletError(

                "Receiver wallet balance not found.",

                "WALLET_BALANCE_NOT_FOUND"

            );

        }


        const senderBalance =
            senderBalanceResult.rows[0];


        const receiverBalance =
            receiverBalanceResult.rows[0];


        /*
        |--------------------------------------------------------------------------
        | CHECK BALANCE CURRENCY
        |--------------------------------------------------------------------------
        */

        if (

            String(
                senderBalance.currency
            )

            !==

            String(
                senderWallet.currency
            )

        ) {

            throw createWalletError(

                "Sender wallet currency mismatch.",

                "WALLET_CURRENCY_MISMATCH"

            );

        }


        if (

            String(
                receiverBalance.currency
            )

            !==

            String(
                receiverWallet.currency
            )

        ) {

            throw createWalletError(

                "Receiver wallet currency mismatch.",

                "WALLET_CURRENCY_MISMATCH"

            );

        }


        const senderAvailable =
            Number(
                senderBalance.available_balance
            );


        const receiverAvailable =
            Number(
                receiverBalance.available_balance
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

            throw createWalletError(

                "Invalid wallet balance data.",

                "INVALID_WALLET_BALANCE"

            );

        }


        /*
        |--------------------------------------------------------------------------
        | CHECK SUFFICIENT BALANCE
        |--------------------------------------------------------------------------
        */

        if (
            senderAvailable < numericAmount
        ) {

            throw createWalletError(

                "Insufficient wallet balance.",

                "INSUFFICIENT_BALANCE"

            );

        }


        /*
        |--------------------------------------------------------------------------
        | CALCULATE
        |--------------------------------------------------------------------------
        */

        const senderNewBalance =
            senderAvailable -
            numericAmount;


        const receiverNewBalance =
            receiverAvailable +
            numericAmount;


        /*
        |--------------------------------------------------------------------------
        | UPDATE BALANCES
        |--------------------------------------------------------------------------
        */

        await client.query(

            `
            UPDATE wallet_balances

            SET
                available_balance = $1

            WHERE
                wallet_id = $2
            `,

            [

                senderNewBalance,

                senderWallet.id

            ]

        );


        await client.query(

            `
            UPDATE wallet_balances

            SET
                available_balance = $1

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

                RETURNING *
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

                RETURNING *
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
