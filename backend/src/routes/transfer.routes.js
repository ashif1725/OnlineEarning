"use strict";

const express = require("express");
const { z } = require("zod");

const {
    requireAuth
} = require("../middleware/auth");

const {
    transferMoney
} = require("../services/transfer.service");


const router = express.Router();


const transferSchema =
    z.object({

        receiverUserId:
            z.string()
                .min(5)
                .max(32),

        amount:
            z.number()
                .positive()
                .finite(),

        description:
            z.string()
                .max(255)
                .optional()

    });


router.post(
    "/send",
    requireAuth,
    async (req, res) => {

        try {

            const parsed =
                transferSchema.safeParse(
                    req.body
                );


            if (!parsed.success) {

                return res.status(400).json({
                    success: false,
                    error: "INVALID_REQUEST"
                });
            }


            const {
                receiverUserId,
                amount,
                description
            } = parsed.data;


            const result =
                await transferMoney({

                    senderUserId:
                        req.user.id,

                    receiverUserId,

                    amount,

                    idempotencyKey:
                        req.get(
                            "Idempotency-Key"
                        ),

                    description
                });


            res.status(201).json({

                success: true,

                transaction: result

            });


        } catch (error) {

            const errors = {

                INVALID_AMOUNT: 400,

                SELF_TRANSFER_NOT_ALLOWED: 400,

                RECEIVER_WALLET_NOT_FOUND: 404,

                SENDER_WALLET_NOT_FOUND: 404,

                INSUFFICIENT_BALANCE: 409,

                CURRENCY_MISMATCH: 409

            };


            const status =
                errors[error.message] || 500;


            res.status(status).json({

                success: false,

                error:
                    status === 500
                        ? "TRANSFER_FAILED"
                        : error.message

            });
        }
    }
);


module.exports = router;
