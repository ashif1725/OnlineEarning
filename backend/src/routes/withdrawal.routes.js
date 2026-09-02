"use strict";


const express =
    require(
        "express"
    );


const router =
    express.Router();


/*
|--------------------------------------------------------------------------
| CONTROLLER
|--------------------------------------------------------------------------
*/

const withdrawalController =
    require(
        "../controllers/withdrawal.controller"
    );


/*
|--------------------------------------------------------------------------
| AUTH MIDDLEWARE
|--------------------------------------------------------------------------
*/

const {
    requireAuth,
    requireAdmin
} = require(
    "../middleware/auth.middleware"
);


/*
|--------------------------------------------------------------------------
| CONTROLLER FUNCTIONS
|--------------------------------------------------------------------------
*/

const {
    createWithdrawal,
    getMyWithdrawals,
    getAllWithdrawals,
    updateWithdrawalStatus
} =
    withdrawalController;


/*
|--------------------------------------------------------------------------
| CREATE WITHDRAWAL
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    requireAuth,
    createWithdrawal
);


/*
|--------------------------------------------------------------------------
| GET MY WITHDRAWALS
|--------------------------------------------------------------------------
*/

router.get(
    "/my",
    requireAuth,
    getMyWithdrawals
);


/*
|--------------------------------------------------------------------------
| GET ALL WITHDRAWALS
|--------------------------------------------------------------------------
*/

router.get(
    "/admin/all",
    requireAuth,
    requireAdmin,
    getAllWithdrawals
);


/*
|--------------------------------------------------------------------------
| UPDATE WITHDRAWAL STATUS
|--------------------------------------------------------------------------
*/

router.post(
    "/admin/:id/status",
    requireAuth,
    requireAdmin,
    updateWithdrawalStatus
);


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports =
    router;
