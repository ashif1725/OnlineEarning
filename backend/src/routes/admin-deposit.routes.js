"use strict";

const express = require("express");

const {
    requireAuth
} = require("../middleware/auth");

const {
    requireAdmin
} = require("../middleware/admin");

const {
    approveDeposit,
    rejectDeposit
} = require("../services/admin-deposit.service");


const router = express.Router();


/*
 * APPROVE
 */

router.post(
    "/:depositId/approve",
    requireAuth,
    requireAdmin,

    async (req, res) => {

        try {

            const result =
                await approveDeposit({

                    depositId:
                        req.params.depositId,

                    adminUserId:
                        req.user.id,

                    ipAddress:
                        req.ip,

                    userAgent:
                        req.get("user-agent"),

                    adminNote:
                        req.body?.adminNote
                });


            res.json({

                success: true,

                message:
                    "Deposit approved successfully.",

                result
            });


        } catch (error) {

            const statusMap = {

                DEPOSIT_NOT_FOUND: 404,

                DEPOSIT_ALREADY_PROCESSED: 409,

                WALLET_BALANCE_NOT_FOUND: 500,

                LEDGER_ACCOUNT_ERROR: 500

            };


            const status =
                statusMap[error.message] || 500;


            res.status(status).json({

                success: false,

                error:
                    status === 500
                        ? "DEPOSIT_APPROVAL_FAILED"
                        : error.message

            });
        }
    }
);


/*
 * REJECT
 */

router.post(
    "/:depositId/reject",
    requireAuth,
    requireAdmin,

    async (req, res) => {

        try {

            const result =
                await rejectDeposit({

                    depositId:
                        req.params.depositId,

                    adminUserId:
                        req.user.id,

                    ipAddress:
                        req.ip,

                    userAgent:
                        req.get("user-agent"),

                    adminNote:
                        req.body?.adminNote
                });


            res.json({

                success: true,

                message:
                    "Deposit rejected successfully.",

                deposit: result
            });


        } catch (error) {

            const statusMap = {

                DEPOSIT_NOT_FOUND: 404,

                DEPOSIT_ALREADY_PROCESSED: 409

            };


            const status =
                statusMap[error.message] || 500;


            res.status(status).json({

                success: false,

                error:
                    status === 500
                        ? "DEPOSIT_REJECTION_FAILED"
                        : error.message

            });
        }
    }
);


module.exports = router;
