"use strict";

const express = require("express");

const {
    requireAuth
} = require("../middleware/auth");


const router =
    express.Router();


router.get(
    "/me",
    requireAuth,
    async (req, res) => {

        res.json({

            success: true,

            user: {
                userId:
                    req.user.userId,

                name:
                    req.user.name,

                email:
                    req.user.email,

                phone:
                    req.user.phone,

                role:
                    req.user.role,

                accountStatus:
                    req.user.accountStatus,

                emailVerified:
                    Boolean(
                        req.user.emailVerifiedAt
                    )
            }

        });

    }
);


module.exports = router;
