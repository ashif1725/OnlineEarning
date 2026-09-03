"use strict";


const express =
    require(
        "express"
    );


const router =
    express.Router();


const depositService =
    require(
        "../services/deposit.service"
    );


const {

    requireAuth,

    requireAdmin

} =
    require(
        "../middleware/auth.middleware"
    );


/*
|--------------------------------------------------------------------------
| GET PENDING DEPOSITS
|--------------------------------------------------------------------------
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
                await depositService
                    .getPendingDeposits();


            return res.status(
                200
            )
            .json({

                success:
                    true,

                deposits

            });

        } catch (
            error
        ) {

            console.error(
                "GET PENDING DEPOSITS ERROR:",
                error
            );


            return res.status(
                500
            )
            .json({

                success:
                    false,

                code:
                    error.code ||
                    "LOAD_DEPOSITS_FAILED",

                message:
                    error.message ||
                    "Unable to load deposits."

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

            const depositId =
                req.params.depositId;


            const adminUserId =
                req.user?.id;


            if (
                !depositId
            ) {

                return res.status(
                    400
                )
                .json({

                    success:
                        false,

                    code:
                        "DEPOSIT_ID_REQUIRED",

                    message:
                        "Deposit ID is required."

                });

            }


            if (
                !adminUserId
            ) {

                return res.status(
                    401
                )
                .json({

                    success:
                        false,

                    code:
                        "ADMIN_AUTH_REQUIRED",

                    message:
                        "Authenticated admin user was not found."

                });

            }


            const result =
                await depositService
                    .approveDepositRequest({

                        depositId,

                        adminUserId

                    });


            return res.status(
                200
            )
            .json({

                success:
                    true,

                message:
                    "Deposit approved successfully.",

                result

            });

        } catch (
            error
        ) {

            console.error(
                "ADMIN APPROVE DEPOSIT ERROR:",
                error
            );


            return res.status(
                400
            )
            .json({

                success:
                    false,

                code:
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

            const depositId =
                req.params.depositId;


            const adminUserId =
                req.user?.id;


            const reason =
                req.body?.reason ||
                null;


            if (
                !depositId
            ) {

                return res.status(
                    400
                )
                .json({

                    success:
                        false,

                    code:
                        "DEPOSIT_ID_REQUIRED",

                    message:
                        "Deposit ID is required."

                });

            }


            if (
                !adminUserId
            ) {

                return res.status(
                    401
                )
                .json({

                    success:
                        false,

                    code:
                        "ADMIN_AUTH_REQUIRED",

                    message:
                        "Authenticated admin user was not found."

                });

            }


            const result =
                await depositService
                    .rejectDepositRequest({

                        depositId,

                        adminUserId,

                        reason

                    });


            return res.status(
                200
            )
            .json({

                success:
                    true,

                message:
                    "Deposit rejected successfully.",

                result

            });

        } catch (
            error
        ) {

            console.error(
                "ADMIN REJECT DEPOSIT ERROR:",
                error
            );


            return res.status(
                400
            )
            .json({

                success:
                    false,

                code:
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
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports =
    router;
