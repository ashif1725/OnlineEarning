"use strict";


const express =
    require(
        "express"
    );


const router =
    express.Router();


const {

    requireAuth,

    requireAdmin

} =
    require(
        "../middleware/auth.middleware"
    );


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
| GET PENDING DEPOSITS
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

                deposits

            });


        } catch (error) {

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
                    "Unable to load pending deposits."

            });

        }

    }

);


/*
|--------------------------------------------------------------------------
| APPROVE DEPOSIT
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

            const result =
                await approveDepositRequest({

                    depositId:
                        req.params.depositId,

                    adminUserId:
                        req.user.id

                });


            return res.status(200).json({

                success:
                    true,

                message:
                    "Deposit approved successfully.",

                result

            });


        } catch (error) {

            console.error(
                "APPROVE DEPOSIT ERROR:",
                error
            );


            const errorCode =
                error.code ||
                error.message;


            const statusMap = {

                DEPOSIT_NOT_FOUND:
                    404,

                DEPOSIT_ALREADY_PROCESSED:
                    409,

                WALLET_NOT_FOUND:
                    500,

                WALLET_BALANCE_NOT_FOUND:
                    500

            };


            const statusCode =
                statusMap[
                    errorCode
                ] || 500;


            return res
                .status(
                    statusCode
                )
                .json({

                    success:
                        false,

                    error:
                        errorCode ||
                        "DEPOSIT_APPROVAL_FAILED",

                    message:

                        statusCode === 500

                            ? "Deposit approval failed."

                            : errorCode

                });

        }

    }

);


/*
|--------------------------------------------------------------------------
| REJECT DEPOSIT
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

            const result =
                await rejectDepositRequest({

                    depositId:
                        req.params.depositId,

                    adminUserId:
                        req.user.id,

                    reason:
                        req.body?.reason ||
                        null

                });


            return res.status(200).json({

                success:
                    true,

                message:
                    "Deposit rejected successfully.",

                result

            });


        } catch (error) {

            console.error(
                "REJECT DEPOSIT ERROR:",
                error
            );


            const errorCode =
                error.code ||
                error.message;


            const statusMap = {

                DEPOSIT_NOT_FOUND:
                    404,

                DEPOSIT_ALREADY_PROCESSED:
                    409

            };


            const statusCode =
                statusMap[
                    errorCode
                ] || 500;


            return res
                .status(
                    statusCode
                )
                .json({

                    success:
                        false,

                    error:
                        errorCode ||
                        "DEPOSIT_REJECTION_FAILED"

                });

        }

    }

);


module.exports =
    router;
