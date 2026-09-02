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
    getPendingWithdrawals,
    approveWithdrawal,
    rejectWithdrawal
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
| GET CURRENT USER WITHDRAWALS
|--------------------------------------------------------------------------
*/

router.get(
    "/my",
    requireAuth,
    getMyWithdrawals
);


/*
|--------------------------------------------------------------------------
| ADMIN GET PENDING WITHDRAWALS
|--------------------------------------------------------------------------
*/

router.get(
    "/admin/pending",
    requireAuth,
    requireAdmin,
    getPendingWithdrawals
);


/*
|--------------------------------------------------------------------------
| ADMIN APPROVE WITHDRAWAL
|--------------------------------------------------------------------------
*/

router.post(
    "/admin/:withdrawalId/approve",
    requireAuth,
    requireAdmin,
    approveWithdrawal
);


/*
|--------------------------------------------------------------------------
| ADMIN REJECT WITHDRAWAL
|--------------------------------------------------------------------------
*/

router.post(
    "/admin/:withdrawalId/reject",
    requireAuth,
    requireAdmin,
    rejectWithdrawal
);


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports =
    router;
