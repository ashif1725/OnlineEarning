"use strict";


const express =
    require(
        "express"
    );


const router =
    express.Router();


const authMiddleware =
    require(
        "../middleware/auth.middleware"
    );


const walletService =
    require(
        "../services/wallet.service"
    );


/*
|--------------------------------------------------------------------------
| GET AUTHENTICATED USER ID
|--------------------------------------------------------------------------
|
| Different auth implementations may store the authenticated
| user's database UUID in different properties.
|
| This helper keeps wallet routes compatible while ensuring
| the database UUID is passed to wallet.service.
|
*/

function getAuthenticatedUserId(
    req
) {

    const user =
        req.user ||
        {};


    const userId =

        user.id ||

        user.user_id ||

        user.userId ||

        user.user?.id ||

        user.user?.user_id ||

        null;


    if (
        !userId
    ) {

        const error =
            new Error(
                "Authenticated user ID is missing."
            );


        error.status =
            401;


        error.code =
            "AUTH_USER_ID_MISSING";


        throw error;

    }


    return userId;

}


/*
|--------------------------------------------------------------------------
| GET WALLET
|--------------------------------------------------------------------------
|
| GET /api/wallet
|
*/

router.get(

    "/",

    authMiddleware,

    async function (
        req,
        res
    ) {

        try {


            const userId =
                getAuthenticatedUserId(
                    req
                );


            console.log(
                "GET WALLET USER ID:",
                userId
            );


            const wallet =
                await walletService.getWallet(
                    userId
                );


            return res.status(
                200
            )
            .json({

                success:
                    true,

                wallet:

                    wallet

            });


        } catch (
            error
        ) {


            console.error(
                "GET WALLET ROUTE ERROR:",
                error
            );


            const status =

                error.status ||

                (

                    error.code ===
                    "WALLET_NOT_FOUND"

                        ?

                        404

                        :

                        500

                );


            return res.status(
                status
            )
            .json({

                success:
                    false,

                message:

                    error.message ||

                    "Unable to load wallet.",

                code:

                    error.code ||

                    "GET_WALLET_FAILED"

            });

        }

    }

);


/*
|--------------------------------------------------------------------------
| GET WALLET TRANSACTIONS
|--------------------------------------------------------------------------
|
| GET /api/wallet/transactions
|
| Optional:
|
| ?limit=50
|
*/

router.get(

    "/transactions",

    authMiddleware,

    async function (
        req,
        res
    ) {

        try {


            const userId =
                getAuthenticatedUserId(
                    req
                );


            let limit =
                Number(
                    req.query.limit
                );


            if (

                !Number.isInteger(
                    limit
                )

                ||

                limit <= 0

            ) {

                limit =
                    50;

            }


            if (
                limit > 100
            ) {

                limit =
                    100;

            }


            console.log(
                "GET WALLET TRANSACTIONS USER ID:",
                userId
            );


            const transactions =
                await walletService.getTransactions(

                    userId,

                    limit

                );


            return res.status(
                200
            )
            .json({

                success:
                    true,

                transactions:

                    transactions

            });


        } catch (
            error
        ) {


            console.error(
                "GET WALLET TRANSACTIONS ROUTE ERROR:",
                error
            );


            return res.status(

                error.status ||

                500

            )
            .json({

                success:
                    false,

                message:

                    error.message ||

                    "Unable to load wallet transactions.",

                code:

                    error.code ||

                    "GET_WALLET_TRANSACTIONS_FAILED"

            });

        }

    }

);


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports =
    router;
