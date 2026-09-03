"use strict";


/*
|--------------------------------------------------------------------------
| PACKAGES
|--------------------------------------------------------------------------
*/

const express =
    require(
        "express"
    );


/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
*/

const {
    requireAuth
} =
    require(
        "../middleware/auth.middleware"
    );


const {
    requireAdmin
} =
    require(
        "../middleware/admin"
    );


/*
|--------------------------------------------------------------------------
| DEPOSIT SERVICE
|--------------------------------------------------------------------------
*/

const {
    getPendingDeposits,
    approveDepositRequest,
    rejectDepositRequest
} =
    require(
        "../services/deposit.service"
    );


/*
|--------------------------------------------------------------------------
| ROUTER
|--------------------------------------------------------------------------
*/

const router =
    express.Router();


/*
|--------------------------------------------------------------------------
| GET ADMIN DEPOSIT REQUESTS
|--------------------------------------------------------------------------
|
| Final endpoint:
|
| GET /api/admin/deposits
|
|--------------------------------------------------------------------------
*/

router.get(

    "/",

    requireAuth,

    requireAdmin,

    async function (
        req,
        res
    ) {

        try {


            const deposits =
                await getPendingDeposits();


            return res.status(200).json({

                success:
                    true,


                deposits:
                    deposits || []

            });


        } catch (
            error
        ) {


            console.error(

                "ADMIN GET DEPOSITS ERROR:",

                error

            );


            return res.status(500).json({

                success:
                    false,


                error:
                    "DEPOSITS_FETCH_FAILED",


                message:
                    "Unable to fetch deposit requests."

            });

        }

    }

);


/*
|--------------------------------------------------------------------------
| APPROVE DEPOSIT REQUEST
|--------------------------------------------------------------------------
|
| Final endpoint:
|
| POST /api/admin/deposits/:depositId/approve
|
|--------------------------------------------------------------------------
*/

router.post(

    "/:depositId/approve",

    requireAuth,

    requireAdmin,

    async function (
        req,
        res
    ) {

        try {


            const depositId =
                req.params.depositId;


            const result =
                await approveDepositRequest({

                    depositId:
                        depositId,


                    adminUserId:
                        req.user.id

                });


            return res.status(200).json({

                success:
                    true,


                message:
                    "Deposit approved successfully.",


                result:
                    result

            });


        } catch (
            error
        ) {


            console.error(

                "ADMIN APPROVE DEPOSIT ERROR:",

                error

            );


            let statusCode =
                500;


            if (

                error.code ===
                "DEPOSIT_NOT_FOUND"

            ) {

                statusCode =
                    404;

            }


            if (

                error.code ===
                "DEPOSIT_ALREADY_PROCESSED"

            ) {

                statusCode =
                    409;

            }


            return res
                .status(
                    statusCode
                )
                .json({

                    success:
                        false,


                    error:

                        error.code ||

                        "DEPOSIT_APPROVAL_FAILED",


                    message:

                        error.message ||

                        "Unable to approve deposit."

                });

        }

    }

);


/*
|--------------------------------------------------------------------------
| REJECT DEPOSIT REQUEST
|--------------------------------------------------------------------------
|
| Final endpoint:
|
| POST /api/admin/deposits/:depositId/reject
|
|--------------------------------------------------------------------------
*/

router.post(

    "/:depositId/reject",

    requireAuth,

    requireAdmin,

    async function (
        req,
        res
    ) {

        try {


            const depositId =
                req.params.depositId;


            const reason =
                req.body?.reason ||
                null;


            const result =
                await rejectDepositRequest({

                    depositId:
                        depositId,


                    adminUserId:
                        req.user.id,


                    reason:
                        reason

                });


            return res.status(200).json({

                success:
                    true,


                message:
                    "Deposit rejected successfully.",


                result:
                    result

            });


        } catch (
            error
        ) {


            console.error(

                "ADMIN REJECT DEPOSIT ERROR:",

                error

            );


            let statusCode =
                500;


            if (

                error.code ===
                "DEPOSIT_NOT_FOUND"

            ) {

                statusCode =
                    404;

            }


            if (

                error.code ===
                "DEPOSIT_ALREADY_PROCESSED"

            ) {

                statusCode =
                    409;

            }


            return res
                .status(
                    statusCode
                )
                .json({

                    success:
                        false,


                    error:

                        error.code ||

                        "DEPOSIT_REJECTION_FAILED",


                    message:

                        error.message ||

                        "Unable to reject deposit."

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
