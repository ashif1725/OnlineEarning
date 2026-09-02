"use strict";

const express =
    require("express");


const router =
    express.Router();


const controller =
    require(
        "../controllers/wallet.controller"
    );


const requireAuth =
    require(
        "../middleware/auth.middleware"
    );


router.get(
    "/",
    requireAuth,
    controller.getWallet
);


router.get(
    "/transactions",
    requireAuth,
    controller.getTransactions
);


module.exports =
    router;
