"use strict";

const express = require("express");
const { z } = require("zod");

const {
    requireAuth
} = require("../middleware/auth");

const {
    createDeposit
} = require("../services/deposit.service");


const router = express.Router();


const depositSchema =
    z.object({

        paymentMethodId:
            z.string().uuid(),

        amount:
            z.number()
                .positive()
                .finite(),

        utrNumber:
            z.string()
                .trim()
                .min(6)
                .max(100),

        userNote:
            z.string()
                .trim()
                .max(500)
                .optional()

    });


router.post(
    "/",
    requireAuth,
    async (req, res) => {

        try {

            const parsed =
                depositSchema.safeParse(
                    req.body
                );


            if (!parsed.success) {

                return res.status(400).json({
                    success: false,
                    error: "INVALID_DEPOSIT_REQUEST"
                });
            }


            const deposit =
                await createDeposit({

                    userId:
                        req.user.id,

                    paymentMethodId:
                        parsed.data.paymentMethodId,

                    amount:
                        parsed.data.amount,

                    utrNumber:
                        parsed.data.utrNumber,

                    userNote:
                        parsed.data.userNote
                });


            res.status(201).json({

                success: true,

                deposit
            });


        } catch (error) {

            const statusMap = {

                INVALID_AMOUNT: 400,

                PAYMENT_METHOD_UNAVAILABLE: 400,

                UTR_ALREADY_USED: 409

            };


            const status =
                statusMap[error.message] || 500;


            res.status(status).json({

                success: false,

                error:
                    status === 500
                        ? "DEPOSIT_CREATION_FAILED"
                        : error.message

            });
        }
    }
);


module.exports = router;
