"use strict";

const express =
    require("express");


const router =
    express.Router();


const controller =
    require(
        "../controllers/admin.deposit.controller"
    );


const requireAuth =
    require(
        "../middleware/auth.middleware"
    );


const requireAdmin =
    require(
        "../middleware/admin.middleware"
    );


router.get(
    "/deposits/pending",
    requireAuth,
    requireAdmin,
    controller.getPendingDeposits
);


router.post(
    "/deposits/:depositId/approve",
    requireAuth,
    requireAdmin,
    controller.approveDeposit
);


router.post(
    "/deposits/:depositId/reject",
    requireAuth,
    requireAdmin,
    controller.rejectDeposit
);


module.exports =
    router;
