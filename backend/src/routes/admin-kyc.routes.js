"use strict";

const express = require("express");

const {
    requireAuth
} = require("../middleware/auth");

const {
    requireAdmin
} = require("../middleware/admin");

const {
    reviewKyc
} = require("../services/admin-kyc.service");


const router = express.Router();


router.post(
    "/:kycId/review",
    requireAuth,
    requireAdmin,

    async (req, res) => {

        try {

            const result =
                await reviewKyc({

                    kycId:
                        req.params.kycId,

                    adminUserId:
                        req.user.id,

                    decision:
                        req.body.decision,

                    adminNote:
                        req.body.adminNote,

                    rejectionReason:
                        req.body.rejectionReason,

                    ipAddress:
                        req.ip,

                    userAgent:
                        req.get(
                            "user-agent"
                        )
                });


            res.json({

                success: true,

                kyc: result

            });


        } catch (error) {

            const statusMap = {

                KYC_NOT_FOUND: 404,

                KYC_ALREADY_REVIEWED: 409,

                INVALID_KYC_DECISION: 400,

                REJECTION_REASON_REQUIRED: 400

            };


            const status =
                statusMap[
                    error.message
                ] || 500;


            res.status(status).json({

                success: false,

                error:
                    status === 500
                        ? "KYC_REVIEW_FAILED"
                        : error.message
            });
        }
    }
);


module.exports = router;
