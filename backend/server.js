"use strict";

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");


/*
|--------------------------------------------------------------------------
| EXPRESS APP
|--------------------------------------------------------------------------
*/

const app = express();

const PORT = Number(
    process.env.PORT || 8080
);


/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
*/

app.use(
    helmet()
);

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    cookieParser()
);


/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
*/

const authRoutes =
    require("./src/routes/auth.routes");

const profileRoutes =
    require("./src/routes/profile.routes");

const walletRoutes =
    require("./src/routes/wallet.routes");

const transferRoutes =
    require("./src/routes/transfer.routes");

const recipientRoutes =
    require("./src/routes/recipient.routes");

const transactionRoutes =
    require("./src/routes/transaction.routes");

const paymentMethodRoutes =
    require("./src/routes/payment-method.routes");

const depositRoutes =
    require("./src/routes/deposit.routes");

const adminDepositRoutes =
    require("./src/routes/admin-deposit.routes");

const bankAccountRoutes =
    require("./src/routes/bank-account.routes");

const kycRoutes =
    require("./src/routes/kyc.routes");

const adminKycRoutes =
    require("./src/routes/admin-kyc.routes");

const adminUsersRoutes =
    require("./src/routes/admin-users.routes");


/*
|--------------------------------------------------------------------------
| API ROUTES
|--------------------------------------------------------------------------
*/

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/profile",
    profileRoutes
);

app.use(
    "/api/wallet",
    walletRoutes
);

app.use(
    "/api/transfers",
    transferRoutes
);

app.use(
    "/api/recipients",
    recipientRoutes
);

app.use(
    "/api/transactions",
    transactionRoutes
);

app.use(
    "/api/payment-methods",
    paymentMethodRoutes
);

app.use(
    "/api/deposits",
    depositRoutes
);


/*
|--------------------------------------------------------------------------
| ADMIN DEPOSITS
|--------------------------------------------------------------------------
|
| GET
| /api/admin/deposits
|
| POST
| /api/admin/deposits/:depositId/approve
|
| POST
| /api/admin/deposits/:depositId/reject
|
*/

app.use(
    "/api/admin/deposits",
    adminDepositRoutes
);


/*
|--------------------------------------------------------------------------
| BANK ACCOUNTS
|--------------------------------------------------------------------------
*/

app.use(
    "/api/bank-accounts",
    bankAccountRoutes
);


/*
|--------------------------------------------------------------------------
| KYC
|--------------------------------------------------------------------------
*/

app.use(
    "/api/kyc",
    kycRoutes
);

app.use(
    "/api/admin/kyc",
    adminKycRoutes
);


/*
|--------------------------------------------------------------------------
| ADMIN USERS
|--------------------------------------------------------------------------
*/

app.use(
    "/api/admin/users",
    adminUsersRoutes
);


/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get(
    "/api/health",
    function (req, res) {

        return res.status(200).json({

            success: true,

            message:
                "SkillEarn Hub API is running"

        });

    }
);


/*
|--------------------------------------------------------------------------
| ROOT
|--------------------------------------------------------------------------
*/

app.get(
    "/",
    function (req, res) {

        return res.status(200).json({

            success: true,

            message:
                "SkillEarn Hub Backend API"

        });

    }
);


/*
|--------------------------------------------------------------------------
| 404 API HANDLER
|--------------------------------------------------------------------------
*/

app.use(
    function (req, res) {

        return res.status(404).json({

            success: false,

            error:
                "ROUTE_NOT_FOUND",

            message:
                "API route not found."

        });

    }
);


/*
|--------------------------------------------------------------------------
| GLOBAL ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use(
    function (
        error,
        req,
        res,
        next
    ) {

        console.error(
            "SERVER ERROR:",
            error
        );

        return res.status(
            error.status || 500
        ).json({

            success: false,

            error:
                error.code ||
                "INTERNAL_SERVER_ERROR",

            message:
                error.message ||
                "Internal server error."

        });

    }
);


/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

app.listen(
    PORT,
    function () {

        console.log(
            `SkillEarn Hub API running on port ${PORT}`
        );

    }
);
