"use strict";

const express =
    require("express");


const router =
    express.Router();


const {
    createDeposit,
    getDeposits,
    approveDeposit
} = require(
    "../controllers/deposit.controller"
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
| USER DEPOSIT HISTORY
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    requireAuth,
    getDeposits
);


/*
|--------------------------------------------------------------------------
| ADMIN APPROVE
|--------------------------------------------------------------------------
*/

router.post(
    "/:depositId/approve",
    requireAuth,
    approveDeposit
);


module.exports =
    router;
