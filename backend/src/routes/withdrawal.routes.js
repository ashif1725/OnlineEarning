"use strict";

const express = require("express");
const { z } = require("zod");

const {
    requireAuth
} = require("../middleware/auth");

const {
    createWithdrawal
} = require("../services/withdrawal.service");


const router = express.Router();


const withdrawalSchema =
    z.object({

        bankAccountId:
            z.string().uuid(),

        amount:
            z.number()
                .positive()
                .finite(),

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
                withdrawalSchema.safeParse(
                    req.body
                );


            if (!parsed.success) {

                return res.status(400).json({
                    success: false,
                    error:
                        "INVALID_WITHDRAWAL_REQUEST"
                });
            }


            const withdrawal =
                await createWithdrawal({

                    userId:
                        req.user.id,

                    ...parsed.data
                });


            res.status(201).json({

                success: true,

                withdrawal
            });


        } catch (error) {

            const statusMap = {

                INVALID_AMOUNT: 400,

                BANK_ACCOUNT_NOT_FOUND: 404,

                BANK_ACCOUNT_NOT_VERIFIED: 409,

                WALLET_NOT_FOUND: 404,

                INSUFFICIENT_BALANCE: 409

            };


            const status =
                statusMap[error.message] || 500;


            res.status(status).json({

                success: false,

                error:
                    status === 500
                        ? "WITHDRAWAL_CREATION_FAILED"
                        : error.message
            });
        }
    }
);


module.exports = router;
