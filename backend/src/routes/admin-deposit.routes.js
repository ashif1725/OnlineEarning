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


/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
|
| IMPORTANT:
| इन require paths को अपने existing middleware file names के अनुसार
| same रखें। नीचे common structure दिया गया है।
|
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
        "../middleware/admin.middleware"
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
                await depositService
                    .getPendingDeposits();


            return res.status(200).json({

                success:
                    true,

                deposits

            });


        } catch (
            error
        ) {

            console.error(
                "GET PENDING DEPOSITS ERROR:",
                {

                    message:
                        error.message,

                    code:
                        error.code,

                    detail:
                        error.detail

                }
            );


            return res.status(500).json({

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
                req.params.depositId;


            const adminUserId =
                req.user?.id;


            if (
                !depositId
            ) {

                return res.status(400).json({

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

                return res.status(401).json({

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


            return res.status(200).json({

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
                {

                    message:
                        error.message,

                    code:
                        error.code,

                    detail:
                        error.detail,

                    table:
                        error.table,

                    column:
                        error.column,

                    constraint:
                        error.constraint

                }
            );


            const knownClientErrors =
                [

                    "DEPOSIT_NOT_FOUND",

                    "DEPOSIT_ALREADY_PROCESSED",

                    "INVALID_DEPOSIT_AMOUNT",

                    "WALLET_NOT_FOUND",

                    "WALLET_USER_MISMATCH",

                    "WALLET_INACTIVE",

                    "WALLET_BALANCE_NOT_FOUND",

                    "INVALID_WALLET_BALANCE",

                    "DEPOSIT_UPDATE_FAILED"

                ];


            const statusCode =

                knownClientErrors.includes(
                    error.code
                )

                    ?

                    400

                    :

                    500;


            return res.status(
                statusCode
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
                req.params.depositId;


            const adminUserId =
                req.user?.id;


            const reason =
                req.body?.reason ||
                null;


            if (
                !depositId
            ) {

                return res.status(400).json({

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

                return res.status(401).json({

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


            return res.status(200).json({

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
                {

                    message:
                        error.message,

                    code:
                        error.code,

                    detail:
                        error.detail

                }
            );


            return res.status(400).json({

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
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports =
    router;
