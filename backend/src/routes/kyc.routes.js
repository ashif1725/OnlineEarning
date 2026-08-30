"use strict";

const express = require("express");
const { z } = require("zod");

const {
    requireAuth
} = require("../middleware/auth");

const {
    getKycProfile,
    createOrUpdateKyc,
    submitKyc
} = require("../services/kyc.service");


const router = express.Router();


const kycSchema = z.object({

    fullName:
        z.string()
            .trim()
            .min(2)
            .max(150),

    dateOfBirth:
        z.string()
            .optional(),

    addressLine1:
        z.string()
            .trim()
            .min(3)
            .max(300),

    addressLine2:
        z.string()
            .trim()
            .max(300)
            .optional(),

    city:
        z.string()
            .trim()
            .min(2)
            .max(100),

    state:
        z.string()
            .trim()
            .min(2)
            .max(100),

    postalCode:
        z.string()
            .trim()
            .min(3)
            .max(20),

    country:
        z.string()
            .trim()
            .min(2)
            .max(100)
            .default("India")
});


router.get(
    "/",
    requireAuth,
    async (req, res) => {

        try {

            const kyc =
                await getKycProfile(
                    req.user.id
                );


            res.json({
                success: true,
                kyc
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                error:
                    "KYC_FETCH_FAILED"
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
                kycSchema.safeParse(
                    req.body
                );


            if (!parsed.success) {

                return res.status(400).json({
                    success: false,
                    error:
                        "INVALID_KYC_DATA"
                });
            }


            const kyc =
                await createOrUpdateKyc({

                    userId:
                        req.user.id,

                    ...parsed.data

                });


            res.status(201).json({

                success: true,

                kyc

            });


        } catch (error) {

            const status =
                error.message ===
                "KYC_CANNOT_BE_EDITED"
                    ? 409
                    : 500;


            res.status(status).json({

                success: false,

                error:
                    status === 500
                        ? "KYC_SAVE_FAILED"
                        : error.message

            });
        }
    }
);


router.post(
    "/submit",
    requireAuth,
    async (req, res) => {

        try {

            const result =
                await submitKyc(
                    req.user.id
                );


            res.json({

                success: true,

                kyc: result

            });


        } catch (error) {

            const statusMap = {

                KYC_NOT_FOUND: 404,

                KYC_ALREADY_SUBMITTED: 409,

                KYC_DOCUMENTS_REQUIRED: 400

            };


            const status =
                statusMap[
                    error.message
                ] || 500;


            res.status(status).json({

                success: false,

                error:
                    status === 500
                        ? "KYC_SUBMISSION_FAILED"
                        : error.message

            });
        }
    }
);


module.exports = router;
