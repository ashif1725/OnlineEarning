"use strict";

const express = require("express");

const {
    requireAuth
} = require("../middleware/auth.middleware");

const {
    requireAdmin
} = require("../middleware/admin");

const {
    getPendingDeposits,
    approveDepositRequest,
    rejectDepositRequest
} = require("../services/deposit.service");


const router =
    express.Router();


/*
|--------------------------------------------------------------------------
| GET PENDING DEPOSIT REQUESTS
|--------------------------------------------------------------------------
|
| GET /api/admin/deposit-requests/pending
|
*/

router.get(
    "/pending",

    requireAuth,

    requireAdmin,

    async (req, res) => {

        try {

            const deposits =
                await getPendingDeposits();


            return res.json({

                success:
                    true,

                deposits:
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
                    "PENDING_DEPOSITS_FETCH_FAILED"

            });

        }

    }
);


/*
|--------------------------------------------------------------------------
| APPROVE DEPOSIT REQUEST
|--------------------------------------------------------------------------
|
| POST /api/admin/deposit-requests/:depositId/approve
|
*/

router.post(
    "/:depositId/approve",

    requireAuth,

    requireAdmin,

    async (req, res) => {

        try {

            const result =
                await approveDepositRequest({

                    depositId:
                        req.params.depositId,

                    adminUserId:
                        req.user.id

                });


            return res.json({

                success:
                    true,

                message:
                    "Deposit approved successfully.",

                result:
                    result

            });


        } catch (error) {

            console.error(
                "APPROVE DEPOSIT ERROR:",
                error
            );


            const status =
                error.code ===
                "DEPOSIT_NOT_FOUND"
                    ? 404
                    : error.code ===
                      "DEPOSIT_ALREADY_PROCESSED"
                        ? 409
                        : 500;


            return res.status(status).json({

                success:
                    false,

                error:
                    error.code ||
                    "DEPOSIT_APPROVAL_FAILED"

            });

        }

    }
);


/*
|--------------------------------------------------------------------------
| REJECT DEPOSIT REQUEST
|--------------------------------------------------------------------------
|
| POST /api/admin/deposit-requests/:depositId/reject
|
*/

router.post(
    "/:depositId/reject",

    requireAuth,

    requireAdmin,

    async (req, res) => {

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


            return res.json({

                success:
                    true,

                message:
                    "Deposit rejected successfully.",

                result:
                    result

            });


        } catch (error) {

            console.error(
                "REJECT DEPOSIT ERROR:",
                error
            );


            const status =
                error.code ===
                "DEPOSIT_NOT_FOUND"
                    ? 404
                    : error.code ===
                      "DEPOSIT_ALREADY_PROCESSED"
                        ? 409
                        : 500;


            return res.status(status).json({

                success:
                    false,

                error:
                    error.code ||
                    "DEPOSIT_REJECTION_FAILED"

            });

        }

    }
);


module.exports =
    router;
