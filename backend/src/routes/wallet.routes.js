"use strict";

const express = require("express");

const {
    requireAuth
} = require("../middleware/auth");

const {
    getWalletByUserId
} = require("../services/wallet.service");


const router = express.Router();


router.get(
    "/",
    requireAuth,
    async (req, res) => {

        try {

            const wallet =
                await getWalletByUserId(
                    req.user.id
                );


            if (!wallet) {

                return res.status(404).json({
                    success: false,
                    error: "WALLET_NOT_FOUND"
                });
            }


            res.json({

                success: true,

                wallet: {
                    currency:
                        wallet.currency,

                    availableBalance:
                        wallet.available_balance,

                    pendingBalance:
                        wallet.pending_balance,

                    status:
                        wallet.status
                }

            });


        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                error: "WALLET_FETCH_FAILED"
            });
        }
    }
);


module.exports = router;
