"use strict";

const express = require("express");

const router = express.Router();

const controller =
    require("../controllers/wallet.controller");

const {
    requireAuth
} = require("../middleware/auth.middleware");


router.get(
    "/",
    requireAuth,
    controller.wallet
);


router.get(
    "/transactions",
    requireAuth,
    controller.transactions
);


module.exports = router;
