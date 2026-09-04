"use strict";

require("dotenv").config();


const express =
    require("express");


const helmet =
    require("helmet");


const cors =
    require("cors");


const cookieParser =
    require("cookie-parser");


/*
|--------------------------------------------------------------------------
| APP
|--------------------------------------------------------------------------
*/

const app =
    express();


const PORT =
    Number(
        process.env.PORT ||
        10000
    );


/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
*/

const authRoutes =
    require(
        "./src/routes/auth.routes"
    );


const profileRoutes =
    require(
        "./src/routes/profile.routes"
    );


const walletRoutes =
    require(
        "./src/routes/wallet.routes"
    );


const transferRoutes =
    require(
        "./src/routes/transfer.routes"
    );


const recipientRoutes =
    require(
        "./src/routes/recipient.routes"
    );


const transactionRoutes =
    require(
        "./src/routes/transaction.routes"
    );


const paymentMethodRoutes =
    require(
        "./src/routes/payment-method.routes"
    );


const depositRoutes =
    require(
        "./src/routes/deposit.routes"
    );


const adminDepositRoutes =
    require(
        "./src/routes/admin-deposit.routes"
    );


const adminDepositListRoutes =
    require(
        "./src/routes/admin-deposits-list.routes"
    );


const bankAccountRoutes =
    require(
        "./src/routes/bank-account.routes"
    );


const withdrawalRoutes =
    require(
        "./src/routes/withdrawal.routes"
    );


const adminWithdrawalRoutes =
    require(
        "./src/routes/admin-withdrawal.routes"
    );


const adminUsersRoutes =
    require(
        "./src/routes/admin-users.routes"
    );


const kycRoutes =
    require(
        "./src/routes/kyc.routes"
    );


const adminKycRoutes =
    require(
        "./src/routes/admin-kyc.routes"
    );


/*
|--------------------------------------------------------------------------
| SECURITY
|--------------------------------------------------------------------------
*/

app.disable(
    "x-powered-by"
);


app.use(
    helmet()
);


/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

const allowedOrigins =
    [
        "https://ashif1725.github.io"
    ];


/*
|--------------------------------------------------------------------------
| ADD ENV FRONTEND ORIGIN
|--------------------------------------------------------------------------
*/

if (
    process.env.FRONTEND_ORIGIN
) {

    const frontendOrigin =
        String(
            process.env.FRONTEND_ORIGIN
        )
        .trim()
        .replace(
            /\/+$/,
            ""
        );


    if (
        frontendOrigin &&
        !allowedOrigins.includes(
            frontendOrigin
        )
    ) {

        allowedOrigins.push(
            frontendOrigin
        );

    }

}


app.use(

    cors(

        {

            origin:

                function (
                    origin,
                    callback
                ) {


                    /*
                    ----------------------------------------------------------
                    Allow server-to-server requests
                    and tools without Origin header
                    ----------------------------------------------------------
                    */

                    if (
                        !origin
                    ) {

                        callback(
                            null,
                            true
                        );

                        return;

                    }


                    const normalizedOrigin =
                        String(
                            origin
                        )
                        .replace(
                            /\/+$/,
                            ""
                        );


                    if (

                        allowedOrigins.includes(
                            normalizedOrigin
                        )

                    ) {

                        callback(
                            null,
                            true
                        );

                        return;

                    }


                    console.warn(
                        "CORS BLOCKED ORIGIN:",
                        origin
                    );


                    callback(

                        new Error(
                            "Origin not allowed by CORS."
                        )

                    );

                },


            credentials:
                true,


            methods:
                [

                    "GET",

                    "POST",

                    "PUT",

                    "PATCH",

                    "DELETE",

                    "OPTIONS"

                ],


            allowedHeaders:
                [

                    "Content-Type",

                    "Authorization",

                    "Accept"

                ]

        }

    )

);


/*
|--------------------------------------------------------------------------
| BODY PARSERS
|--------------------------------------------------------------------------
*/

app.use(

    express.json(

        {

            limit:
                "1mb"

        }

    )

);


app.use(

    express.urlencoded(

        {

            extended:
                false,

            limit:
                "1mb"

        }

    )

);


app.use(
    cookieParser()
);


/*
|--------------------------------------------------------------------------
| ROOT
|--------------------------------------------------------------------------
*/

app.get(

    "/",

    function (
        req,
        res
    ) {

        res.json(

            {

                success:
                    true,

                service:
                    "SkillEarn Hub API",

                status:
                    "running"

            }

        );

    }

);


/*
|--------------------------------------------------------------------------
| HEALTH
|--------------------------------------------------------------------------
*/

app.get(

    "/api/health",

    function (
        req,
        res
    ) {

        res.json(

            {

                success:
                    true,

                service:
                    "SkillEarn Hub API",

                status:
                    "healthy"

            }

        );

    }

);


/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

app.use(

    "/api/auth",

    authRoutes

);


/*
|--------------------------------------------------------------------------
| PROFILE
|--------------------------------------------------------------------------
*/

app.use(

    "/api/profile",

    profileRoutes

);


/*
|--------------------------------------------------------------------------
| WALLET
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This route is mounted ONLY ONCE.
|
| GET /api/wallet
| GET /api/wallet/transactions
|
*/

app.use(

    "/api/wallet",

    walletRoutes

);


/*
|--------------------------------------------------------------------------
| TRANSFERS
|--------------------------------------------------------------------------
*/

app.use(

    "/api/transfers",

    transferRoutes

);


app.use(

    "/api/recipients",

    recipientRoutes

);


/*
|--------------------------------------------------------------------------
| TRANSACTIONS
|--------------------------------------------------------------------------
*/

app.use(

    "/api/transactions",

    transactionRoutes

);


/*
|--------------------------------------------------------------------------
| PAYMENT METHODS
|--------------------------------------------------------------------------
*/

app.use(

    "/api/payment-methods",

    paymentMethodRoutes

);


/*
|--------------------------------------------------------------------------
| DEPOSITS
|--------------------------------------------------------------------------
|
| Mounted ONLY ONCE.
|
*/

app.use(

    "/api/deposits",

    depositRoutes

);


/*
|--------------------------------------------------------------------------
| ADMIN DEPOSITS
|--------------------------------------------------------------------------
*/

app.use(

    "/api/admin/deposits",

    adminDepositListRoutes

);


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
| WITHDRAWALS
|--------------------------------------------------------------------------
*/

app.use(

    "/api/withdrawals",

    withdrawalRoutes

);


/*
|--------------------------------------------------------------------------
| ADMIN WITHDRAWALS
|--------------------------------------------------------------------------
*/

app.use(

    "/api/admin/withdrawals",

    adminWithdrawalRoutes

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
| 404 API HANDLER
|--------------------------------------------------------------------------
*/

app.use(

    "/api",

    function (
        req,
        res
    ) {

        res.status(
            404
        )
        .json(

            {

                success:
                    false,

                error:
                    "API_ROUTE_NOT_FOUND",

                message:
                    "API route not found."

            }

        );

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


        if (
            res.headersSent
        ) {

            return next(
                error
            );

        }


        const status =

            Number.isInteger(
                error.status
            )

                ?

                error.status

                :

                500;


        res.status(
            status
        )
        .json(

            {

                success:
                    false,

                error:

                    error.code ||

                    "INTERNAL_SERVER_ERROR",


                message:

                    status >= 500

                        ?

                        "Internal server error."

                        :

                        (

                            error.message ||

                            "Request failed."

                        )

            }

        );

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
            "========================================"
        );


        console.log(
            "SkillEarn Hub API started successfully"
        );


        console.log(
            "Port:",
            PORT
        );


        console.log(
            "Environment:",

            process.env.NODE_ENV ||
            "development"
        );


        console.log(
            "Allowed frontend origins:"
        );


        console.log(
            allowedOrigins
        );


        console.log(
            "========================================"
        );


        console.log(
            "API Root:"
        );


        console.log(
            `http://localhost:${PORT}/`
        );


        console.log(
            "Health:"
        );


        console.log(
            `http://localhost:${PORT}/api/health`
        );


        console.log(
            "Wallet:"
        );


        console.log(
            `http://localhost:${PORT}/api/wallet`
        );


        console.log(
            "Wallet transactions:"
        );


        console.log(
            `http://localhost:${PORT}/api/wallet/transactions`
        );


        console.log(
            "Admin users:"
        );


        console.log(
            `http://localhost:${PORT}/api/admin/users`
        );


        console.log(
            "Admin pending deposits:"
        );


        console.log(
            `http://localhost:${PORT}/api/admin/deposits/pending`
        );


        console.log(
            "========================================"
        );

    }

);
