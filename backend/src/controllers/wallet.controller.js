"use strict";


const {

    getWallet,

    sendMoney,

    getTransactions

} =
    require(
        "../services/wallet.service"
    );


/*
|--------------------------------------------------------------------------
| GET WALLET
|--------------------------------------------------------------------------
*/

async function wallet(
    req,
    res
) {

    try {


        /*
        ----------------------------------------------------------
        DEBUG:
        AUTHENTICATED USER
        ----------------------------------------------------------
        */

        console.log(
            "========================================"
        );


        console.log(
            "WALLET DEBUG USER ID:",
            req.user?.id
        );


        console.log(
            "WALLET DEBUG USER:",
            req.user
        );


        /*
        ----------------------------------------------------------
        GET WALLET
        ----------------------------------------------------------
        */

        const data =
            await getWallet(
                req.user.id
            );


        /*
        ----------------------------------------------------------
        DEBUG:
        WALLET DATA RETURNED BY SERVICE
        ----------------------------------------------------------
        */

        console.log(
            "WALLET DEBUG DATA:",
            data
        );


        console.log(
            "WALLET DEBUG WALLET ID:",
            data?.wallet_id
        );


        console.log(
            "WALLET DEBUG AVAILABLE BALANCE:",
            data?.available_balance
        );


        console.log(
            "WALLET DEBUG PENDING BALANCE:",
            data?.pending_balance
        );


        console.log(
            "WALLET DEBUG CURRENCY:",
            data?.currency
        );


        console.log(
            "========================================"
        );


        /*
        ----------------------------------------------------------
        RESPONSE
        ----------------------------------------------------------
        */

        return res.status(200).json({

            success:
                true,

            wallet:
                data

        });


    } catch (
        error
    ) {


        console.error(
            "========================================"
        );


        console.error(
            "WALLET ERROR:",
            error
        );


        console.error(
            "WALLET ERROR MESSAGE:",
            error?.message
        );


        console.error(
            "WALLET ERROR CODE:",
            error?.code
        );


        console.error(
            "WALLET ERROR STACK:",
            error?.stack
        );


        console.error(
            "========================================"
        );


        return res.status(500).json({

            success:
                false,

            message:
                error?.message ||
                "Unable to load wallet"

        });

    }

}


/*
|--------------------------------------------------------------------------
| SEND MONEY
|--------------------------------------------------------------------------
*/

async function send(
    req,
    res
) {

    try {


        const {

            receiverUserId,

            amount,

            description

        } =
            req.body;


        const idempotencyKey =
            req.get(
                "Idempotency-Key"
            );


        /*
        ----------------------------------------------------------
        VALIDATE REQUEST
        ----------------------------------------------------------
        */

        if (

            !receiverUserId ||

            amount ===
            undefined ||

            amount ===
            null ||

            amount === ""

        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Receiver and amount are required"

            });

        }


        /*
        ----------------------------------------------------------
        SEND MONEY
        ----------------------------------------------------------
        */

        const result =
            await sendMoney({

                senderUserId:
                    req.user.id,

                receiverUserId:
                    receiverUserId,

                amount:
                    amount,

                description:
                    description,

                idempotencyKey:
                    idempotencyKey

            });


        /*
        ----------------------------------------------------------
        SUCCESS
        ----------------------------------------------------------
        */

        return res.status(200).json({

            success:
                true,

            message:

                result?.duplicate

                    ?

                    "Transaction already processed"

                    :

                    "Money sent successfully",

            transaction:
                result

        });


    } catch (
        error
    ) {


        console.error(
            "SEND MONEY ERROR:",
            error
        );


        console.error(
            "SEND MONEY ERROR CODE:",
            error?.code
        );


        /*
        ----------------------------------------------------------
        INSUFFICIENT BALANCE
        ----------------------------------------------------------
        */

        if (

            error?.code ===
            "INSUFFICIENT_BALANCE"

        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Insufficient wallet balance"

            });

        }


        /*
        ----------------------------------------------------------
        SELF TRANSFER
        ----------------------------------------------------------
        */

        if (

            error?.code ===
            "SELF_TRANSFER"

        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "You cannot send money to yourself"

            });

        }


        /*
        ----------------------------------------------------------
        WALLET NOT ACTIVE
        ----------------------------------------------------------
        */

        if (

            error?.code ===
            "WALLET_NOT_ACTIVE"

        ) {

            return res.status(403).json({

                success:
                    false,

                message:
                    "Wallet is not active"

            });

        }


        /*
        ----------------------------------------------------------
        INVALID AMOUNT
        ----------------------------------------------------------
        */

        if (

            error?.code ===
            "INVALID_AMOUNT"

        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Invalid amount"

            });

        }


        /*
        ----------------------------------------------------------
        RECEIVER WALLET NOT FOUND
        ----------------------------------------------------------
        */

        if (

            error?.code ===
            "RECEIVER_WALLET_NOT_FOUND"

        ) {

            return res.status(404).json({

                success:
                    false,

                message:
                    "Receiver wallet not found"

            });

        }


        /*
        ----------------------------------------------------------
        SENDER WALLET NOT FOUND
        ----------------------------------------------------------
        */

        if (

            error?.code ===
            "WALLET_NOT_FOUND"

        ) {

            return res.status(404).json({

                success:
                    false,

                message:
                    "Wallet not found"

            });

        }


        /*
        ----------------------------------------------------------
        CURRENCY MISMATCH
        ----------------------------------------------------------
        */

        if (

            error?.code ===
            "CURRENCY_MISMATCH"

        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Wallet currencies do not match"

            });

        }


        /*
        ----------------------------------------------------------
        FALLBACK
        ----------------------------------------------------------
        */

        return res.status(500).json({

            success:
                false,

            message:
                error?.message ||
                "Transfer failed"

        });

    }

}


/*
|--------------------------------------------------------------------------
| TRANSACTIONS
|--------------------------------------------------------------------------
*/

async function transactions(
    req,
    res
) {

    try {


        /*
        ----------------------------------------------------------
        DEBUG
        ----------------------------------------------------------
        */

        console.log(
            "TRANSACTION DEBUG USER ID:",
            req.user?.id
        );


        /*
        ----------------------------------------------------------
        GET TRANSACTIONS
        ----------------------------------------------------------
        */

        const rows =
            await getTransactions(

                req.user.id,

                req.query.limit

            );


        /*
        ----------------------------------------------------------
        DEBUG
        ----------------------------------------------------------
        */

        console.log(
            "TRANSACTION DEBUG COUNT:",
            Array.isArray(
                rows
            )

                ?

                rows.length

                :

                0
        );


        /*
        ----------------------------------------------------------
        RESPONSE
        ----------------------------------------------------------
        */

        return res.status(200).json({

            success:
                true,

            transactions:

                Array.isArray(
                    rows
                )

                    ?

                    rows

                    :

                    []

        });


    } catch (
        error
    ) {


        console.error(
            "TRANSACTION HISTORY ERROR:",
            error
        );


        console.error(
            "TRANSACTION HISTORY ERROR MESSAGE:",
            error?.message
        );


        console.error(
            "TRANSACTION HISTORY ERROR CODE:",
            error?.code
        );


        return res.status(500).json({

            success:
                false,

            message:
                error?.message ||
                "Unable to load transactions"

        });

    }

}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

    wallet,

    send,

    transactions

};
