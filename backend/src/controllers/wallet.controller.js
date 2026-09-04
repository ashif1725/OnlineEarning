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

        console.log(
            "================================"
        );

        console.log(
            "WALLET REQUEST RECEIVED"
        );

        console.log(
            "AUTHENTICATED USER ID:",
            req.user?.id || null
        );

        console.log(
            "AUTHENTICATED USER EMAIL:",
            req.user?.email || null
        );

        console.log(
            "AUTHENTICATED PUBLIC USER ID:",
            req.user?.public_user_id ||
            req.user?.publicUserId ||
            null
        );


        if (
            !req.user?.id
        ) {

            console.log(
                "WALLET ERROR: AUTHENTICATED USER ID IS MISSING"
            );

            console.log(
                "================================"
            );


            return res.status(
                401
            )
            .json({

                success:
                    false,

                error:
                    "AUTHENTICATION_REQUIRED",

                message:
                    "Authenticated user was not found."

            });

        }


        const data =
            await getWallet(
                req.user.id
            );


        console.log(
            "WALLET ID:",
            data.wallet_id
        );

        console.log(
            "WALLET USER ID:",
            data.user_id
        );

        console.log(
            "WALLET AVAILABLE BALANCE:",
            data.available_balance
        );

        console.log(
            "WALLET PENDING BALANCE:",
            data.pending_balance
        );

        console.log(
            "WALLET CURRENCY:",
            data.currency
        );

        console.log(
            "WALLET DATABASE RESULT:",
            data
        );

        console.log(
            "================================"
        );


        return res.status(
            200
        )
        .json({

            success:
                true,

            wallet:
                data

        });


    } catch (
        error
    ) {

        console.error(
            "================================"
        );

        console.error(
            "WALLET ERROR CODE:",
            error.code ||
            null
        );

        console.error(
            "WALLET ERROR STATUS:",
            error.status ||
            null
        );

        console.error(
            "WALLET ERROR MESSAGE:",
            error.message
        );

        console.error(
            "WALLET ERROR:",
            error
        );

        console.error(
            "================================"
        );


        const status =
            Number(
                error.status
            ) ||

            (

                error.code ===
                "WALLET_NOT_FOUND"

                    ?

                    404

                    :

                    error.code ===
                    "WALLET_BALANCE_NOT_FOUND"

                        ?

                        404

                        :

                        error.code ===
                        "UNAUTHORIZED"

                            ?

                            401

                            :

                            500

            );


        return res.status(
            status
        )
        .json({

            success:
                false,

            error:
                error.code ||
                "WALLET_LOAD_FAILED",

            message:
                error.message ||
                "Unable to load wallet."

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


        if (

            !receiverUserId

            ||

            amount ===
            undefined

            ||

            amount ===
            null

        ) {

            return res.status(
                400
            )
            .json({

                success:
                    false,

                message:
                    "Receiver and amount are required."

            });

        }


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


        return res.status(
            200
        )
        .json({

            success:
                true,

            message:

                result.duplicate

                    ?

                    "Transaction already processed."

                    :

                    "Money sent successfully.",

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


        const statusMap =
            {

                INSUFFICIENT_BALANCE:
                    400,

                SELF_TRANSFER:
                    400,

                INVALID_AMOUNT:
                    400,

                USER_REQUIRED:
                    400,

                CURRENCY_MISMATCH:
                    400,

                WALLET_NOT_FOUND:
                    404,

                RECEIVER_WALLET_NOT_FOUND:
                    404,

                WALLET_BALANCE_NOT_FOUND:
                    404,

                WALLET_NOT_ACTIVE:
                    403,

                RECEIVER_WALLET_NOT_ACTIVE:
                    403

            };


        return res.status(
            statusMap[
                error.code
            ]

            ||

            error.status

            ||

            500
        )
        .json({

            success:
                false,

            error:
                error.code ||
                "TRANSFER_FAILED",

            message:
                error.message ||
                "Transfer failed."

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

        if (
            !req.user?.id
        ) {

            return res.status(
                401
            )
            .json({

                success:
                    false,

                error:
                    "AUTHENTICATION_REQUIRED",

                message:
                    "Authenticated user was not found."

            });

        }


        const rows =
            await getTransactions(

                req.user.id,

                req.query.limit

            );


        return res.status(
            200
        )
        .json({

            success:
                true,

            transactions:
                rows

        });


    } catch (
        error
    ) {

        console.error(
            "TRANSACTION HISTORY ERROR:",
            error
        );


        return res.status(
            error.status ||
            500
        )
        .json({

            success:
                false,

            error:
                error.code ||
                "TRANSACTION_HISTORY_FAILED",

            message:
                error.message ||
                "Unable to load transactions."

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
