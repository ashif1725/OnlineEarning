"use strict";

const express = require("express");
const { z } = require("zod");

const {
    requireAuth
} = require("../middleware/auth");

const {
    addBankAccount,
    getUserBankAccounts
} = require("../services/bank-account.service");


const router = express.Router();


const bankSchema =
    z.object({

        accountHolderName:
            z.string()
                .trim()
                .min(2)
                .max(150),

        accountNumber:
            z.string()
                .trim()
                .min(9)
                .max(18),

        ifscCode:
            z.string()
                .trim()
                .min(11)
                .max(11),

        bankName:
            z.string()
                .trim()
                .max(150)
                .optional(),

        accountType:
            z.enum([
                "SAVINGS",
                "CURRENT"
            ])
            .optional()

    });


router.get(
    "/",
    requireAuth,
    async (req, res) => {

        try {

            const accounts =
                await getUserBankAccounts(
                    req.user.id
                );


            res.json({
                success: true,
                accounts
            });


        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                error:
                    "BANK_ACCOUNTS_FETCH_FAILED"
            });
        }
    }
);


router.post(
    "/",
    requireAuth,
    async (req, res) => {

        try {

            const parsed =
                bankSchema.safeParse(
                    req.body
                );


            if (!parsed.success) {

                return res.status(400).json({
                    success: false,
                    error:
                        "INVALID_BANK_DETAILS"
                });
            }


            const account =
                await addBankAccount({

                    userId:
                        req.user.id,

                    ...parsed.data
                });


            res.status(201).json({

                success: true,

                account

            });


        } catch (error) {

            const status =
                [
                    "INVALID_ACCOUNT_NUMBER",
                    "INVALID_IFSC"
                ].includes(
                    error.message
                )
                    ? 400
                    : 500;


            res.status(status).json({

                success: false,

                error:
                    status === 500
                        ? "BANK_ACCOUNT_CREATION_FAILED"
                        : error.message
            });
        }
    }
);


module.exports = router;
