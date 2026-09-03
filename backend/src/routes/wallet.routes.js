"use strict";


const express =
    require(
        "express"
    );


const router =
    express.Router();


const controller =
    require(
        "../controllers/wallet.controller"
    );


const {
    requireAuth
} =
    require(
        "../middleware/auth.middleware"
    );


/*
|--------------------------------------------------------------------------
| GET WALLET
|--------------------------------------------------------------------------
*/

router.get(

    "/",

    requireAuth,

    controller.wallet

);


/*
|--------------------------------------------------------------------------
| GET TRANSACTION HISTORY
|--------------------------------------------------------------------------
*/

router.get(

    "/transactions",

    requireAuth,

    controller.transactions

);


/*
|--------------------------------------------------------------------------
| SEND MONEY
|--------------------------------------------------------------------------
*/

router.post(

    "/send",

    requireAuth,

    controller.send

);


module.exports =
    router;
