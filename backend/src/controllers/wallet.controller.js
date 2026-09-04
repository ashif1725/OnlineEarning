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
            "WALLET REQUEST USER:",
            req.user
        );

        console.log(
            "WALLET REQUEST USER ID:",
            req.user?.id
        );


        const data =
            await getWallet(
                req.user.id
            );


        console.log(
            "WALLET DATABASE RESULT:",
            data
        );

        console.log(
            "================================"
        );


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
            "WALLET ERROR:",
            error
        );


        return res.status(500).json({

            success:
                false,

            message:
                "Unable to load wallet",

            error:
                error.message

        });

    }

}


/*
|--------------------------------------------------------------------------
| SEND MONEY
|--------------------------------------------------------------------------
*/

async function send(req, res) {

    try {

        const {
            receiverUserId,
            amount,
            description
        } = req.body;


        const idempotencyKey =
            req.get(
                "Idempotency-Key"
            );


        if (
            !receiverUserId ||
            !amount
        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Receiver and amount are required"

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


        return res.status(200).json({

            success:
                true,

            message:
                result.duplicate
                    ? "Transaction already processed"
                    : "Money sent successfully",

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


        if (
            error.code ===
            "INSUFFICIENT_BALANCE"
        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Insufficient wallet balance"

            });

        }


        if (
            error.code ===
            "SELF_TRANSFER"
        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "You cannot send money to yourself"

            });

        }


        if (
            error.code ===
            "WALLET_NOT_ACTIVE"
        ) {

            return res.status(403).json({

                success:
                    false,

                message:
                    "Wallet is not active"

            });

        }


        if (
            error.code ===
            "INVALID_AMOUNT"
        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Invalid amount"

            });

        }


        return res.status(500).json({

            success:
                false,

            message:
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

        const rows =
            await getTransactions(

                req.user.id,

                req.query.limit

            );


        return res.status(200).json({

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


        return res.status(500).json({

            success:
                false,

            message:
                "Unable to load transactions"

        });

    }

}


module.exports = {

    wallet,

    send,

    transactions

};
