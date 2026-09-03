"use strict";

const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/wallet.controller"
);

/*
|--------------------------------------------------------------------------
| AUTH MIDDLEWARE
|--------------------------------------------------------------------------
*/

const {
    requireAuth
} = require(
    "../middleware/auth.middleware"
);


/*
|--------------------------------------------------------------------------
| GET WALLET
|--------------------------------------------------------------------------
|
| GET /api/wallet
|
*/

router.get(
    "/",
    requireAuth,
    controller.getWallet
);


/*
|--------------------------------------------------------------------------
| GET WALLET TRANSACTIONS
|--------------------------------------------------------------------------
|
| GET /api/wallet/transactions
|
*/

router.get(
    "/transactions",
    requireAuth,
    controller.getTransactions
);


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = router;
