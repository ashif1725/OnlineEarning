"use strict";


require(
    "dotenv"
)
.config();


const express =
    require(
        "express"
    );


const helmet =
    require(
        "helmet"
    );


const cors =
    require(
        "cors"
    );


const cookieParser =
    require(
        "cookie-parser"
    );


const app =
    express();


/*
|--------------------------------------------------------------------------
| PORT
|--------------------------------------------------------------------------
*/

const PORT =
    Number(
        process.env.PORT ||
        10000
    );


/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This server uses ONLY:
|
| ./src/routes/
|
| Do NOT mix:
|
| ./routes/
|
| with:
|
| ./src/routes/
|
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
| BASIC SECURITY
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
    String(
        process.env.FRONTEND_ORIGIN ||
        "https://ashif1725.github.io"
    )
    .split(
        ","
    )
    .map(
        function (
            origin
        ) {

            return origin.trim();

        }
    )
    .filter(
        Boolean
    );


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
                    Allow requests without Origin
                    ----------------------------------------------------------
                    */

                    if (
                        !origin
                    ) {

                        return callback(
                            null,
                            true
                        );

                    }


                    if (

                        allowedOrigins.includes(
                            origin
                        )

                    ) {

                        return callback(
                            null,
                            true
                        );

                    }


                    return callback(

                        new Error(
                            "CORS origin not allowed."
                        )

                    );


                },


            credentials:
                true

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
    cookieParser()
);


/*
|--------------------------------------------------------------------------
| HEALTH
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


app.use(

    "/api/transactions",

    transactionRoutes

);


/*
|--------------------------------------------------------------------------
| DEPOSITS
|--------------------------------------------------------------------------
*/

app.use(

    "/api/deposits",

    depositRoutes

);


/*
|--------------------------------------------------------------------------
| ADMIN DEPOSITS
|--------------------------------------------------------------------------
|
| Both admin deposit route modules may contain
| different endpoints.
|
| They are mounted only once.
|
*/

app.use(

    "/api/admin/deposits",

    adminDepositRoutes

);


app.use(

    "/api/admin/deposits",

    adminDepositListRoutes

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
| 404 HANDLER
|--------------------------------------------------------------------------
*/

app.use(

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

                message:
                    "API endpoint not found."

            }

        );

    }

);


/*
|--------------------------------------------------------------------------
| ERROR HANDLER
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


        const status =
            Number(
                error.status ||
                500
            );


        res.status(
            status
        )
        .json(

            {

                success:
                    false,

                message:

                    status === 500

                        ?

                        "Internal server error."

                        :

                        error.message ||

                        "Request failed."

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

            "Allowed frontend origins:",

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
