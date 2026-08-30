"use strict";

const express = require("express");

const {
    requireAuth
} = require("../middleware/auth");

const {
    generateUserQr
} = require("../services/qr.service");


const router = express.Router();


router.get(
    "/my",
    requireAuth,
    async (req, res) => {

        try {

            const qr =
                await generateUserQr(
                    req.user.userId
                );


            res.json({
                success: true,
                qr
            });


        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                error: "QR_GENERATION_FAILED"
            });
        }
    }
);


module.exports = router;
