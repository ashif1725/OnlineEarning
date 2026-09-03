"use strict";

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");


/*
|--------------------------------------------------------------------------
| APP
|--------------------------------------------------------------------------
*/

const app = express();

const PORT =
    Number(process.env.PORT) || 10000;


/*
|--------------------------------------------------------------------------
| TRUST PROXY
|--------------------------------------------------------------------------
|
| Render जैसे hosted environment के लिए
| proxy headers को correctly handle करने के लिए.
|
*/

app.set(
    "trust proxy",
    1
);


/*
|--------------------------------------------------------------------------
| SECURITY HEADERS
|--------------------------------------------------------------------------
*/

app.use(
    helmet({
        crossOriginResourcePolicy: false
    })
);


/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
    cors({
        origin: true,
        credentials: true
    })
);


/*
|--------------------------------------------------------------------------
| BODY PARSERS
|--------------------------------------------------------------------------
*/

app.use(
    express.json({
        limit: "2mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "2mb"
    })
);


/*
|--------------------------------------------------------------------------
| COOKIES
|--------------------------------------------------------------------------
*/

app.use(
    cookieParser()
);


/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
|
| GET /api/health
|
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
| ROOT API
|--------------------------------------------------------------------------
|
| GET /
|
*/

app.get(
    "/",
    function (req, res) {

        return res.status(200).json({
            success: true,
            name: "SkillEarn Hub API",
            status: "running"
        });

    }
);


/*
|--------------------------------------------------------------------------
| ROUTE IMPORTS
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

const authRoutes =
    require(
        "./src/routes/auth.routes"
    );


/*
|--------------------------------------------------------------------------
| PROFILE
|--------------------------------------------------------------------------
*/

const profileRoutes =
    require(
        "./src/routes/profile.routes"
    );


/*
|--------------------------------------------------------------------------
| ACCOUNT
|--------------------------------------------------------------------------
*/

const accountRoutes =
    require(
        "./src/routes/account.routes"
    );


/*
|--------------------------------------------------------------------------
| WALLET
|--------------------------------------------------------------------------
*/

const walletRoutes =
    require(
        "./src/routes/wallet.routes"
    );


/*
|--------------------------------------------------------------------------
| TRANSFER
|--------------------------------------------------------------------------
*/

const transferRoutes =
    require(
        "./src/routes/transfer.routes"
    );


/*
|--------------------------------------------------------------------------
| RECIPIENT
|--------------------------------------------------------------------------
*/

const recipientRoutes =
    require(
        "./src/routes/recipient.routes"
    );


/*
|--------------------------------------------------------------------------
| TRANSACTIONS
|--------------------------------------------------------------------------
*/

const transactionRoutes =
    require(
        "./src/routes/transaction.routes"
    );


/*
|--------------------------------------------------------------------------
| PAYMENT METHODS
|--------------------------------------------------------------------------
*/

const paymentMethodRoutes =
    require(
        "./src/routes/payment-method.routes"
    );


/*
|--------------------------------------------------------------------------
| DEPOSITS
|--------------------------------------------------------------------------
*/

const depositRoutes =
    require(
        "./src/routes/deposit.routes"
    );


/*
|--------------------------------------------------------------------------
| BANK ACCOUNTS
|--------------------------------------------------------------------------
*/

const bankAccountRoutes =
    require(
        "./src/routes/bank-account.routes"
    );


/*
|--------------------------------------------------------------------------
| KYC
|--------------------------------------------------------------------------
*/

const kycRoutes =
    require(
        "./src/routes/kyc.routes"
    );


/*
|--------------------------------------------------------------------------
| QR
|--------------------------------------------------------------------------
*/

const qrRoutes =
    require(
        "./src/routes/qr.routes"
    );


/*
|--------------------------------------------------------------------------
| ADMIN USERS
|--------------------------------------------------------------------------
*/

const adminUsersRoutes =
    require(
        "./src/routes/admin-users.routes"
    );


/*
|--------------------------------------------------------------------------
| ADMIN DEPOSITS
|--------------------------------------------------------------------------
*/

const adminDepositRoutes =
    require(
        "./src/routes/admin-deposit.routes"
    );


/*
|--------------------------------------------------------------------------
| ADMIN KYC
|--------------------------------------------------------------------------
*/

const adminKycRoutes =
    require(
        "./src/routes/admin-kyc.routes"
    );


/*
|--------------------------------------------------------------------------
| API ROUTES
|--------------------------------------------------------------------------
*/


/*
| AUTH
| /api/auth/register
| /api/auth/login
| /api/auth/me
| /api/auth/logout
*/

app.use(
    "/api/auth",
    authRoutes
);


/*
| PROFILE
| /api/profile/me
*/

app.use(
    "/api/profile",
    profileRoutes
);


/*
| ACCOUNT
| /api/account/change-password
*/

app.use(
    "/api/account",
    accountRoutes
);


/*
| WALLET
| /api/wallet
| /api/wallet/transactions
*/

app.use(
    "/api/wallet",
    walletRoutes
);


/*
| TRANSFER
| /api/transfer/send
*/

app.use(
    "/api/transfer",
    transferRoutes
);


/*
| RECIPIENT
| /api/recipients/:userId
*/

app.use(
    "/api/recipients",
    recipientRoutes
);


/*
| TRANSACTIONS
| /api/transactions
*/

app.use(
    "/api/transactions",
    transactionRoutes
);


/*
| PAYMENT METHODS
| /api/payment-methods/active
*/

app.use(
    "/api/payment-methods",
    paymentMethodRoutes
);


/*
| DEPOSITS
| /api/deposits
*/

app.use(
    "/api/deposits",
    depositRoutes
);


/*
| BANK ACCOUNTS
| /api/bank-accounts
*/

app.use(
    "/api/bank-accounts",
    bankAccountRoutes
);


/*
| KYC
| /api/kyc
| /api/kyc/submit
*/

app.use(
    "/api/kyc",
    kycRoutes
);


/*
| QR
| /api/qr/my
*/

app.use(
    "/api/qr",
    qrRoutes
);


/*
| ADMIN USERS
| /api/admin/users
*/

app.use(
    "/api/admin/users",
    adminUsersRoutes
);


/*
| ADMIN DEPOSITS
| /api/admin/deposits/pending
| /api/admin/deposits/:depositId/approve
| /api/admin/deposits/:depositId/reject
*/

app.use(
    "/api/admin/deposits",
    adminDepositRoutes
);


/*
| ADMIN KYC
| /api/admin/kyc/:kycId/review
*/

app.use(
    "/api/admin/kyc",
    adminKycRoutes
);


/*
|--------------------------------------------------------------------------
| 404 HANDLER
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
            "GLOBAL SERVER ERROR:",
            error
        );

        if (res.headersSent) {
            return next(error);
        }

        return res.status(500).json({

            success: false,

            error:
                "INTERNAL_SERVER_ERROR",

            message:
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

        console.log(
            `Health check: /api/health`
        );

    }
);
