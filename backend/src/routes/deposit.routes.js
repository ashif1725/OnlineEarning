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


const requireAuth =
    require(
        "../middleware/auth.middleware"
    );


router.post(
    "/",
    requireAuth,
    createDeposit
);


router.get(
    "/",
    requireAuth,
    getMyDeposits
);


module.exports =
    router;
