"use strict";


const pool =
    require(
        "../config/db"
    );


/*
|--------------------------------------------------------------------------
| GET WALLET
|--------------------------------------------------------------------------
*/

async function getWallet(
    userId
) {

    const result =
        await pool.query(

            `
            SELECT

                w.id AS wallet_id,

                w.currency,

                w.status,

                COALESCE(
                    wb.available_balance,
                    0
                ) AS available_balance,

                COALESCE(
                    wb.pending_balance,
                    0
                ) AS pending_balance

            FROM wallets w

            LEFT JOIN wallet_balances wb
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
                "Wallet not found."
            );


        error.code =
            "WALLET_NOT_FOUND";


        throw error;

    }


    return result.rows[0];

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
    |--------------------------------------------------------------------------
    | wallet_transactions table does NOT contain user_id
    |
    | Therefore:
    |
    | user -> wallets -> wallet_transactions
    |--------------------------------------------------------------------------
    */

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
    --------------------------------------------------------------
    VALIDATE AMOUNT
    --------------------------------------------------------------
    */

    if (

        !Number.isFinite(
            numericAmount
        )

        ||

        numericAmount <= 0

    ) {

        const error =
            new Error(
                "Invalid amount."
            );


        error.code =
            "INVALID_AMOUNT";


        throw error;

    }


    /*
    --------------------------------------------------------------
    PREVENT SELF TRANSFER
    --------------------------------------------------------------
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

        const error =
            new Error(
                "You cannot send money to yourself."
            );


        error.code =
            "SELF_TRANSFER";


        throw error;

    }


    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        /*
        ----------------------------------------------------------
        FIND SENDER WALLET
        ----------------------------------------------------------
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

                WHERE user_id = $1

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

            const error =
                new Error(
                    "Sender wallet not found."
                );


            error.code =
                "WALLET_NOT_FOUND";


            throw error;

        }


        const senderWallet =
            senderWalletResult.rows[0];


        /*
        ----------------------------------------------------------
        CHECK SENDER WALLET STATUS
        ----------------------------------------------------------
        */

        if (

            String(
                senderWallet.status
            )
            .toLowerCase()

            !==

            "active"

        ) {

            const error =
                new Error(
                    "Sender wallet is not active."
                );


            error.code =
                "WALLET_NOT_ACTIVE";


            throw error;

        }


        /*
        ----------------------------------------------------------
        FIND RECEIVER WALLET
        ----------------------------------------------------------
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

                WHERE user_id = $1

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

            const error =
                new Error(
                    "Receiver wallet not found."
                );


            error.code =
                "RECEIVER_WALLET_NOT_FOUND";


            throw error;

        }


        const receiverWallet =
            receiverWalletResult.rows[0];


        /*
        ----------------------------------------------------------
        CHECK RECEIVER WALLET STATUS
        ----------------------------------------------------------
        */

        if (

            String(
                receiverWallet.status
            )
            .toLowerCase()

            !==

            "active"

        ) {

            const error =
                new Error(
                    "Receiver wallet is not active."
                );


            error.code =
                "WALLET_NOT_ACTIVE";


            throw error;

        }


        /*
        ----------------------------------------------------------
        CHECK CURRENCY
        ----------------------------------------------------------
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

            const error =
                new Error(
                    "Wallet currencies do not match."
                );


            error.code =
                "CURRENCY_MISMATCH";


            throw error;

        }


        /*
        ----------------------------------------------------------
        LOCK SENDER BALANCE
        ----------------------------------------------------------
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

                WHERE wallet_id = $1

                FOR UPDATE
                `,

                [
                    senderWallet.id
                ]

            );


        if (
            senderBalanceResult.rowCount === 0
        ) {

            const error =
                new Error(
                    "Sender wallet balance not found."
                );


            error.code =
                "WALLET_BALANCE_NOT_FOUND";


            throw error;

        }


        const senderBalance =
            senderBalanceResult.rows[0];


        /*
        ----------------------------------------------------------
        LOCK RECEIVER BALANCE
        ----------------------------------------------------------
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

                WHERE wallet_id = $1

                FOR UPDATE
                `,

                [
                    receiverWallet.id
                ]

            );


        if (
            receiverBalanceResult.rowCount === 0
        ) {

            const error =
                new Error(
                    "Receiver wallet balance not found."
                );


            error.code =
                "WALLET_BALANCE_NOT_FOUND";


            throw error;

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
        ----------------------------------------------------------
        CHECK BALANCE
        ----------------------------------------------------------
        */

        if (

            !Number.isFinite(
                senderAvailable
            )

            ||

            senderAvailable <
            numericAmount

        ) {

            const error =
                new Error(
                    "Insufficient wallet balance."
                );


            error.code =
                "INSUFFICIENT_BALANCE";


            throw error;

        }


        /*
        ----------------------------------------------------------
        CALCULATE NEW BALANCES
        ----------------------------------------------------------
        */

        const senderNewBalance =
            senderAvailable -
            numericAmount;


        const receiverNewBalance =
            receiverAvailable +
            numericAmount;


        /*
        ----------------------------------------------------------
        UPDATE SENDER BALANCE
        ----------------------------------------------------------
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


        /*
        ----------------------------------------------------------
        UPDATE RECEIVER BALANCE
        ----------------------------------------------------------
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

                receiverNewBalance,

                receiverWallet.id

            ]

        );


        /*
        ----------------------------------------------------------
        CREATE SENDER TRANSACTION
        ----------------------------------------------------------
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

                    senderWallet.id,

                    numericAmount,

                    senderWallet.currency,

                    description ||
                    "Money sent"

                ]

            );


        /*
        ----------------------------------------------------------
        CREATE RECEIVER TRANSACTION
        ----------------------------------------------------------
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

                    receiverWallet.id,

                    numericAmount,

                    receiverWallet.currency,

                    description ||
                    "Money received"

                ]

            );


        /*
        ----------------------------------------------------------
        COMMIT
        ----------------------------------------------------------
        */

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
