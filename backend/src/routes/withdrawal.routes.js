"use strict";

const express =
    require("express");

const router =
    express.Router();

const withdrawalController =
    require(
        "../controllers/withdrawal.controller"
    );

const requireAuth =
    require(
        "../middleware/auth.middleware"
    );

const requireAdmin =
    require(
        "../middleware/admin"
    );





/*
|--------------------------------------------------------------------------
| ADMIN MIDDLEWARE
|--------------------------------------------------------------------------
*/

const requireAdmin =
    require(
        "../middleware/admin"
    );


/*
|--------------------------------------------------------------------------
| USER: CREATE WITHDRAWAL REQUEST
|--------------------------------------------------------------------------
|
| POST /api/withdrawals
|
*/

router.post(
    "/",

    requireAuth,

    withdrawalController
        .createWithdrawal
);


/*
|--------------------------------------------------------------------------
| USER: GET MY WITHDRAWALS
|--------------------------------------------------------------------------
|
| GET /api/withdrawals
|
*/

router.get(
    "/",

    requireAuth,

    withdrawalController
        .getMyWithdrawals
);


/*
|--------------------------------------------------------------------------
| ADMIN: GET PENDING WITHDRAWALS
|--------------------------------------------------------------------------
|
| GET /api/withdrawals/admin/pending
|
*/

router.get(
    "/admin/pending",

    requireAuth,

    requireAdmin,

    withdrawalController
        .getPendingWithdrawals
);


/*
|--------------------------------------------------------------------------
| ADMIN: APPROVE WITHDRAWAL
|--------------------------------------------------------------------------
|
| POST /api/withdrawals/admin/:withdrawalId/approve
|
*/

router.post(
    "/admin/:withdrawalId/approve",

    requireAuth,

    requireAdmin,

    withdrawalController
        .approveWithdrawal
);


/*
|--------------------------------------------------------------------------
| ADMIN: REJECT WITHDRAWAL
|--------------------------------------------------------------------------
|
| POST /api/withdrawals/admin/:withdrawalId/reject
|
*/

router.post(
    "/admin/:withdrawalId/reject",

    requireAuth,

    requireAdmin,

    withdrawalController
        .rejectWithdrawal
);


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports =
    router;
