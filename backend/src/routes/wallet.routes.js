"use strict";

const express =
    require("express");

const {
    wallet,
    send,
    transactions
} =
    require("../controllers/wallet.controller");

const {
    requireAuth
} =
    require("../middleware/auth");


const router =
    express.Router();


/*
|--------------------------------------------------------------------------
| GET WALLET
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    requireAuth,
    wallet
);


/*
|--------------------------------------------------------------------------
| SEND
|--------------------------------------------------------------------------
*/

router.post(
    "/send",
    requireAuth,
    send
);


/*
|--------------------------------------------------------------------------
| TRANSACTIONS
|--------------------------------------------------------------------------
*/

router.get(
    "/transactions",
    requireAuth,
    transactions
);


module.exports =
    router;
