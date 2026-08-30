"use strict";

const express = require("express");

const {
    requireAuth
} = require("../middleware/auth");

const {
    findRecipientByUserId
} = require("../services/recipient.service");


const router = express.Router();


router.get(
    "/:userId",
    requireAuth,
    async (req, res) => {

        try {

            const recipient =
                await findRecipientByUserId(
                    req.params.userId
                );


            if (!recipient) {

                return res.status(404).json({
                    success: false,
                    error: "USER_NOT_FOUND"
                });
            }


            res.json({
                success: true,

                recipient: {
                    userId:
                        recipient.userId,

                    name:
                        recipient.name
                }
            });


        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                error: "RECIPIENT_LOOKUP_FAILED"
            });
        }
    }
);


module.exports = router;
