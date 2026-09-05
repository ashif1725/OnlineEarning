"use strict";


/*
|--------------------------------------------------------------------------
| ENVIRONMENT
|--------------------------------------------------------------------------
*/

require(
    "dotenv"
)
.config();


/*
|--------------------------------------------------------------------------
| CORE
|--------------------------------------------------------------------------
*/

const express =
    require(
        "express"
    );


const cors =
    require(
        "cors"
    );


const helmet =
    require(
        "helmet"
    );


/*
|--------------------------------------------------------------------------
| DATABASE
|--------------------------------------------------------------------------
*/

const pool =
    require(
        "./src/config/db"
    );


/*
|--------------------------------------------------------------------------
| APP
|--------------------------------------------------------------------------
*/

const app =
    express();


/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const PORT =
    Number(
        process.env.PORT
    )
    ||
    10000;


const NODE_ENV =
    process.env.NODE_ENV
    ||
    "development";


/*
|--------------------------------------------------------------------------
| FRONTEND ORIGINS
|--------------------------------------------------------------------------
*/

const allowedOrigins =
    [

        "https://ashif1725.github.io",

        "http://localhost:3000",

        "http://127.0.0.1:3000",

        "http://localhost:5500",

        "http://127.0.0.1:5500"

    ];


/*
|--------------------------------------------------------------------------
| SECURITY
|--------------------------------------------------------------------------
*/

app.use(

    helmet(

        {

            crossOriginResourcePolicy:

                false

        }

    )

);


/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

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

                    Useful for:

                    - Render health checks
                    - Postman
                    - Server-to-server requests
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


                    /*
                    ----------------------------------------------------------
                    ALLOW EXACT ORIGIN
                    ----------------------------------------------------------
                    */

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


                    /*
                    ----------------------------------------------------------
                    ALLOW GITHUB PAGES
                    ----------------------------------------------------------
                    */

                    if (

                        origin.endsWith(
                            ".github.io"
                        )

                    ) {

                        return callback(

                            null,

                            true

                        );

                    }


                    /*
                    ----------------------------------------------------------
                    REJECT
                    ----------------------------------------------------------
                    */

                    console.warn(

                        "CORS BLOCKED ORIGIN:",

                        origin

                    );


                    return callback(

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
                "2mb"

        }

    )

);


app.use(

    express.urlencoded(

        {

            extended:
                true,

            limit:
                "2mb"

        }

    )

);


/*
|--------------------------------------------------------------------------
| REQUEST LOG
|--------------------------------------------------------------------------
*/

app.use(

    function (

        req,

        res,

        next

    ) {


        console.log(

            new Date()
                .toISOString(),

            req.method,

            req.originalUrl

        );


        next();

    }

);


/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get(

    "/api/health",

    async function (

        req,

        res

    ) {


        try {


            const databaseResult =
                await pool.query(

                    "SELECT NOW() AS database_time"

                );


            return res.status(
                200
            )
            .json(

                {

                    success:
                        true,

                    message:
                        "SkillEarn Hub API is healthy.",

                    environment:
                        NODE_ENV,

                    server_time:
                        new Date()
                            .toISOString(),

                    database_time:

                        databaseResult
                            .rows[0]
                            .database_time

                }

            );


        } catch (
            error
        ) {


            console.error(

                "HEALTH CHECK DATABASE ERROR:",

                error

            );


            return res.status(
                503
            )
            .json(

                {

                    success:
                        false,

                    message:
                        "API is running but database connection failed."

                }

            );


        }

    }

);


/*
|--------------------------------------------------------------------------
| API ROOT
|--------------------------------------------------------------------------
*/

app.get(

    "/",

    function (

        req,

        res

    ) {


        return res.status(
            200
        )
        .json(

            {

                success:
                    true,

                message:
                    "SkillEarn Hub API is running."

            }

        );

    }

);


/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Only ONE authoritative backend structure is used:
|
| backend/src/routes/
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
*/

const authRoutes =
    require(
        "./src/routes/auth.routes"
    );


app.use(

    "/api/auth",

    authRoutes

);


/*
|--------------------------------------------------------------------------
| WALLET ROUTES
|--------------------------------------------------------------------------
*/

const walletRoutes =
    require(
        "./src/routes/wallet.routes"
    );


app.use(

    "/api/wallet",

    walletRoutes

);


/*
|--------------------------------------------------------------------------
| DEPOSIT ROUTES
|--------------------------------------------------------------------------
*/

const depositRoutes =
    require(
        "./src/routes/deposit.routes"
    );


app.use(

    "/api/deposits",

    depositRoutes

);


/*
|--------------------------------------------------------------------------
| ADMIN USER ROUTES
|--------------------------------------------------------------------------
*/

const adminUsersRoutes =
    require(
        "./src/routes/admin-users.routes"
    );


app.use(

    "/api/admin/users",

    adminUsersRoutes

);


/*
|--------------------------------------------------------------------------
| ADMIN DEPOSIT ROUTES
|--------------------------------------------------------------------------
*/

const adminDepositRoutes =
    require(
        "./src/routes/admin-deposit.routes"
    );


app.use(

    "/api/admin/deposits",

    adminDepositRoutes

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


        return res.status(
            404
        )
        .json(

            {

                success:
                    false,

                message:
                    "API route not found.",

                path:
                    req.originalUrl

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

            {

                message:
                    error.message,

                stack:

                    NODE_ENV ===
                    "production"

                        ?

                        undefined

                        :

                        error.stack

            }

        );


        /*
        ------------------------------------------------------
        CORS ERROR
        ------------------------------------------------------
        */

        if (

            error.message ===
            "Origin not allowed by CORS."

        ) {

            return res.status(
                403
            )
            .json(

                {

                    success:
                        false,

                    message:
                        error.message

                }

            );

        }


        /*
        ------------------------------------------------------
        INVALID JSON
        ------------------------------------------------------
        */

        if (

            error instanceof
            SyntaxError

            &&

            error.status ===
            400

            &&

            "body" in
            error

        ) {

            return res.status(
                400
            )
            .json(

                {

                    success:
                        false,

                    message:
                        "Invalid JSON request body."

                }

            );

        }


        /*
        ------------------------------------------------------
        DATABASE UNIQUE ERROR
        ------------------------------------------------------
        */

        if (

            error.code ===
            "23505"

        ) {

            return res.status(
                409
            )
            .json(

                {

                    success:
                        false,

                    message:
                        "A record with this information already exists."

                }

            );

        }


        /*
        ------------------------------------------------------
        FOREIGN KEY ERROR
        ------------------------------------------------------
        */

        if (

            error.code ===
            "23503"

        ) {

            return res.status(
                400
            )
            .json(

                {

                    success:
                        false,

                    message:
                        "Invalid related record."

                }

            );

        }


        /*
        ------------------------------------------------------
        DEFAULT ERROR
        ------------------------------------------------------
        */

        const statusCode =

            Number(
                error.status
            )

            ||

            Number(
                error.statusCode
            )

            ||

            500;


        return res.status(
            statusCode
        )
        .json(

            {

                success:
                    false,

                message:

                    error.message

                    ||

                    "Internal server error."

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

    "0.0.0.0",

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
            NODE_ENV
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


/*
|--------------------------------------------------------------------------
| PROCESS ERROR HANDLERS
|--------------------------------------------------------------------------
*/

process.on(

    "unhandledRejection",

    function (
        reason
    ) {


        console.error(

            "UNHANDLED PROMISE REJECTION:",

            reason

        );

    }

);


process.on(

    "uncaughtException",

    function (
        error
    ) {


        console.error(

            "UNCAUGHT EXCEPTION:",

            error

        );

    }

);


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports =
    app;
