"use strict";

const express = require("express");

const {
    requireAuth
} = require("../middleware/auth");

const {
    requireAdmin
} = require("../middleware/admin");

const {
    getPendingDeposits,
    approveDepositRequest,
    rejectDepositRequest
} = require("../services/deposit.service");


const router = express.Router();


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

    async (req, res) => {

        try {

            const deposits =
                await getPendingDeposits();

            return res.status(200).json({

                success: true,

                deposits

            });

        } catch (error) {

            console.error(
                "GET PENDING DEPOSITS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "ADMIN_DEPOSITS_FETCH_FAILED"

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

    async (req, res) => {

        try {

            const result =
                await approveDepositRequest({

                    depositId:
                        req.params.depositId,

                    adminUserId:
                        req.user.id

                });


            return res.status(200).json({

                success: true,

                message:
                    "Deposit approved successfully.",

                result

            });

        } catch (error) {

            console.error(
                "APPROVE DEPOSIT ERROR:",
                error
            );


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


            const status =
                statusMap[
                    error.code ||
                    error.message
                ] || 500;


            return res.status(status).json({

                success: false,

                error:
                    error.code ||
                    error.message ||
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
| POST /api/admin/deposits/:depositId/reject
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
                        req.body?.reason

                });


            return res.status(200).json({

                success: true,

                message:
                    "Deposit rejected successfully.",

                result

            });

        } catch (error) {

            console.error(
                "REJECT DEPOSIT ERROR:",
                error
            );


            const statusMap = {

                DEPOSIT_NOT_FOUND:
                    404,

                DEPOSIT_ALREADY_PROCESSED:
                    409

            };


            const status =
                statusMap[
                    error.code ||
                    error.message
                ] || 500;


            return res.status(status).json({

                success: false,

                error:
                    error.code ||
                    error.message ||
                    "DEPOSIT_REJECTION_FAILED"

            });

        }

    }
);


module.exports = router;
