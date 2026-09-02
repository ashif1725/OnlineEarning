"use strict";


const express =
    require("express");


const router =
    express.Router();


const {
    createDeposit,
    getMyDeposits
} =
    require(
        "../controllers/deposit.controller"
    );


const {
    requireAuth
} =
    require(
        "../middleware/auth.middleware"
    );


/*
|--------------------------------------------------------------------------
| CREATE DEPOSIT REQUEST
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    requireAuth,
    createDeposit
);


/*
|--------------------------------------------------------------------------
| GET MY DEPOSIT REQUESTS
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    requireAuth,
    getMyDeposits
);


module.exports =
    router;
