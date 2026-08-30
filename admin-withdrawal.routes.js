"use strict";

const express = require("express");

const {
    requireAuth
} = require("../middleware/auth");

const {
    requireAdmin
} = require("../middleware/admin");

const {
    rejectWithdrawal
} = require("../services/admin-withdrawal.service");


const router = express.Router();


router.post(
    "/:withdrawalId/reject",
    requireAuth,
    requireAdmin,

    async (req, res) => {

        try {

            const result =
                await rejectWithdrawal({

                    withdrawalId:
                        req.params.withdrawalId,

                    adminUserId:
                        req.user.id,

                    adminNote:
                        req.body?.adminNote,

                    ipAddress:
                        req.ip,

                    userAgent:
                        req.get(
                            "user-agent"
                        )
                });


            res.json({
                success: true,
                result
            });


        } catch (error) {

            const status =
                error.message ===
                "WITHDRAWAL_NOT_FOUND"
                    ? 404
                    : error.message ===
                      "WITHDRAWAL_ALREADY_PROCESSED"
                        ? 409
                        : 500;


            res.status(status).json({

                success: false,

                error:
                    status === 500
                        ? "WITHDRAWAL_REJECTION_FAILED"
                        : error.message
            });
        }
    }
);


module.exports = router;
