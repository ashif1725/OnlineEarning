"use strict";


/*
|--------------------------------------------------------------------------
| EXPRESS
|--------------------------------------------------------------------------
*/

const express =
    require(
        "express"
    );


const router =
    express.Router();


/*
|--------------------------------------------------------------------------
| AUTH MIDDLEWARE
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Same middleware file use करो जो admin-users.routes.js में use हो रही है.
|
*/

const {

    requireAuth,

    requireAdmin

} =
    require(
        "../middleware/auth.middleware"
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
| GET PENDING DEPOSIT REQUESTS
|--------------------------------------------------------------------------
|
| GET /api/admin/deposits/pending
|
*/

router.get(

    "/pending",

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

                "GET PENDING DEPOSITS ERROR:",

                error

            );


            return res.status(500).json({

                success:
                    false,

                error:
                    "ADMIN_DEPOSITS_FETCH_FAILED",

                message:
                    "Unable to load pending deposit requests."

            });

        }

    }

);


/*
|--------------------------------------------------------------------------
| APPROVE DEPOSIT REQUEST
|--------------------------------------------------------------------------
|
| POST /api/admin/deposits/:depositId/approve
|
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
                String(
                    req.params.depositId ||
                    ""
                )
                .trim();


            if (
                !depositId
            ) {

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "DEPOSIT_ID_REQUIRED",

                    message:
                        "Deposit ID is required."

                });

            }


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
                    result || null

            });

        } catch (
            error
        ) {

            console.error(

                "APPROVE DEPOSIT ERROR:",

                error

            );


            const errorCode =
                error?.code ||
                error?.message ||
                "DEPOSIT_APPROVAL_FAILED";


            const statusMap = {

                DEPOSIT_NOT_FOUND:
                    404,

                DEPOSIT_ALREADY_PROCESSED:
                    409,

                INVALID_DEPOSIT_STATUS:
                    409,

                WALLET_NOT_FOUND:
                    500,

                WALLET_BALANCE_NOT_FOUND:
                    500

            };


            const statusCode =
                statusMap[
                    errorCode
                ]
                ||
                500;


            return res
                .status(
                    statusCode
                )
                .json({

                    success:
                        false,

                    error:
                        errorCode,

                    message:

                        statusCode === 404

                            ? "Deposit request not found."

                            : statusCode === 409

                                ? "This deposit request has already been processed."

                                : "Unable to approve deposit."

                });

        }

    }

);


/*
|--------------------------------------------------------------------------
| REJECT DEPOSIT REQUEST
|--------------------------------------------------------------------------
|
| POST /api/admin/deposits/:depositId/reject
|
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
                String(
                    req.params.depositId ||
                    ""
                )
                .trim();


            if (
                !depositId
            ) {

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "DEPOSIT_ID_REQUIRED",

                    message:
                        "Deposit ID is required."

                });

            }


            const reason =

                req.body &&
                typeof req.body.reason ===
                "string"

                    ?

                    req.body.reason
                        .trim()

                    :

                    null;


            const result =
                await rejectDepositRequest({

                    depositId:
                        depositId,

                    adminUserId:
                        req.user.id,

                    reason:
                        reason ||
                        null

                });


            return res.status(200).json({

                success:
                    true,

                message:
                    "Deposit rejected successfully.",

                result:
                    result || null

            });

        } catch (
            error
        ) {

            console.error(

                "REJECT DEPOSIT ERROR:",

                error

            );


            const errorCode =
                error?.code ||
                error?.message ||
                "DEPOSIT_REJECTION_FAILED";


            const statusMap = {

                DEPOSIT_NOT_FOUND:
                    404,

                DEPOSIT_ALREADY_PROCESSED:
                    409,

                INVALID_DEPOSIT_STATUS:
                    409

            };


            const statusCode =
                statusMap[
                    errorCode
                ]
                ||
                500;


            return res
                .status(
                    statusCode
                )
                .json({

                    success:
                        false,

                    error:
                        errorCode,

                    message:

                        statusCode === 404

                            ? "Deposit request not found."

                            : statusCode === 409

                                ? "This deposit request has already been processed."

                                : "Unable to reject deposit."

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
