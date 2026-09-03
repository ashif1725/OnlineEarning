"use strict";


/*
|--------------------------------------------------------------------------
| LOAD ENVIRONMENT VARIABLES
|--------------------------------------------------------------------------
*/

require("dotenv").config();


/*
|--------------------------------------------------------------------------
| PACKAGES
|--------------------------------------------------------------------------
*/

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
| CREATE APP
|--------------------------------------------------------------------------
*/

const app =
    express();


const PORT =
    Number(
        process.env.PORT ||
        8080
    );


/*
|--------------------------------------------------------------------------
| LOAD ROUTES
|--------------------------------------------------------------------------
*/

const authRoutes =
    require(
        "./src/routes/auth.routes"
    );


const depositRoutes =
    require(
        "./src/routes/deposit.routes"
    );


const withdrawalRoutes =
    require(
        "./src/routes/withdrawal.routes"
    );


const adminUsersRoutes =
    require(
        "./src/routes/admin-users.routes"
    );


const adminDepositRoutes =
    require(
        "./src/routes/admin-deposit.routes"
    );


/*
|--------------------------------------------------------------------------
| SECURITY
|--------------------------------------------------------------------------
*/

app.disable(
    "x-powered-by"
);


app.set(
    "trust proxy",
    1
);


/*
|--------------------------------------------------------------------------
| HELMET
|--------------------------------------------------------------------------
*/

app.use(

    helmet({

        crossOriginResourcePolicy:
            false

    })

);


/*
|--------------------------------------------------------------------------
| CONFIGURED FRONTEND ORIGINS
|--------------------------------------------------------------------------
*/

const configuredOrigins =
    [

        process.env.FRONTEND_ORIGIN,

        ...String(
            process.env.FRONTEND_ORIGINS ||
            ""
        )
        .split(",")

    ]
    .map(

        function (
            origin
        ) {

            return String(
                origin ||
                ""
            )
            .trim()
            .replace(
                /\/+$/,
                ""
            );

        }

    )
    .filter(
        Boolean
    );


/*
|--------------------------------------------------------------------------
| DEVELOPMENT ORIGINS
|--------------------------------------------------------------------------
*/

const developmentOrigins =
    [

        "http://localhost:3000",

        "http://127.0.0.1:3000",

        "http://localhost:5173",

        "http://127.0.0.1:5173",

        "http://localhost:5500",

        "http://127.0.0.1:5500"

    ];


/*
|--------------------------------------------------------------------------
| ALLOWED ORIGINS
|--------------------------------------------------------------------------
*/

const allowedOrigins =
    Array.from(

        new Set(

            [

                ...configuredOrigins,

                ...(

                    process.env.NODE_ENV !==
                    "production"

                        ?

                        developmentOrigins

                        :

                        []

                )

            ]

        )

    );


/*
|--------------------------------------------------------------------------
| CORS ORIGIN VALIDATION
|--------------------------------------------------------------------------
*/

function validateCorsOrigin(
    origin,
    callback
) {


    /*
    ---------------------------------------------------------
    Requests without Origin.
    Examples:
    Render health checks
    curl
    Postman
    Server-to-server requests
    ---------------------------------------------------------
    */

    if (
        !origin
    ) {

        return callback(
            null,
            true
        );

    }


    const normalizedOrigin =
        String(
            origin
        )
        .trim()
        .replace(
            /\/+$/,
            ""
        );


    /*
    ---------------------------------------------------------
    Allow configured origins.
    ---------------------------------------------------------
    */

    if (

        allowedOrigins.includes(
            normalizedOrigin
        )

    ) {

        return callback(
            null,
            true
        );

    }


    /*
    ---------------------------------------------------------
    Allow all origins during development.
    ---------------------------------------------------------
    */

    if (

        process.env.NODE_ENV !==
        "production"

    ) {

        return callback(
            null,
            true
        );

    }


    console.warn(

        "CORS BLOCKED ORIGIN:",

        normalizedOrigin

    );


    return callback(

        new Error(
            "CORS origin is not allowed"
        )

    );

}


/*
|--------------------------------------------------------------------------
| CORS CONFIGURATION
|--------------------------------------------------------------------------
*/

const corsOptions =
    {

        origin:
            validateCorsOrigin,


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

            ],


        exposedHeaders:

            [

                "Content-Type"

            ],


        optionsSuccessStatus:
            204

    };


/*
|--------------------------------------------------------------------------
| ENABLE CORS
|--------------------------------------------------------------------------
|
| IMPORTANT:
| app.use(cors()) automatically handles preflight OPTIONS requests.
| Do NOT add app.options("*", ...) because Express 5 can fail
| with wildcard route syntax.
|
*/

app.use(

    cors(
        corsOptions
    )

);


/*
|--------------------------------------------------------------------------
| BODY PARSERS
|--------------------------------------------------------------------------
*/

app.use(

    express.json({

        limit:
            "100kb"

    })

);


app.use(

    express.urlencoded({

        extended:
            false,

        limit:
            "100kb"

    })

);


/*
|--------------------------------------------------------------------------
| COOKIE PARSER
|--------------------------------------------------------------------------
*/

app.use(
    cookieParser()
);


/*
|--------------------------------------------------------------------------
| REQUEST LOGGER
|--------------------------------------------------------------------------
*/

app.use(

    function (
        req,
        res,
        next
    ) {

        if (

            process.env.NODE_ENV !==
            "production"

        ) {

            console.log(

                `${req.method} ${req.originalUrl}`

            );

        }


        return next();

    }

);


/*
|--------------------------------------------------------------------------
| ROOT ENDPOINT
|--------------------------------------------------------------------------
*/

app.get(

    "/",

    function (
        req,
        res
    ) {

        return res.status(200).json({

            success:
                true,

            service:
                "SkillEarn Hub API",

            status:
                "running"

        });

    }

);


/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get(

    "/api/health",

    function (
        req,
        res
    ) {

        return res.status(200).json({

            success:
                true,

            service:
                "SkillEarn Hub API",

            status:
                "healthy",

            environment:

                process.env.NODE_ENV ||
                "development"

        });

    }

);


/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
*/

app.use(

    "/api/auth",

    authRoutes

);


/*
|--------------------------------------------------------------------------
| USER DEPOSIT ROUTES
|--------------------------------------------------------------------------
*/

app.use(

    "/api/deposits",

    depositRoutes

);


/*
|--------------------------------------------------------------------------
| USER WITHDRAWAL ROUTES
|--------------------------------------------------------------------------
*/

app.use(

    "/api/withdrawals",

    withdrawalRoutes

);


/*
|--------------------------------------------------------------------------
| ADMIN USER ROUTES
|--------------------------------------------------------------------------
*/

app.use(

    "/api/admin/users",

    adminUsersRoutes

);


/*
|--------------------------------------------------------------------------
| ADMIN DEPOSIT ROUTES
|--------------------------------------------------------------------------
*/

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

        return res.status(404).json({

            success:
                false,

            error:
                "NOT_FOUND",

            message:
                `API endpoint not found: ${req.method} ${req.originalUrl}`

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
        err,
        req,
        res,
        next
    ) {

        console.error(
            "========================================"
        );


        console.error(
            "UNHANDLED SERVER ERROR"
        );


        console.error(
            "MESSAGE:",
            err?.message
        );


        console.error(
            "CODE:",
            err?.code
        );


        console.error(
            "DETAIL:",
            err?.detail
        );


        console.error(
            "TABLE:",
            err?.table
        );


        console.error(
            "COLUMN:",
            err?.column
        );


        console.error(
            "CONSTRAINT:",
            err?.constraint
        );


        console.error(
            "========================================"
        );


        if (
            res.headersSent
        ) {

            return next(
                err
            );

        }


        /*
        ---------------------------------------------------------
        CORS ERROR
        ---------------------------------------------------------
        */

        if (

            err?.message ===
            "CORS origin is not allowed"

        ) {

            return res.status(403).json({

                success:
                    false,

                error:
                    "CORS_NOT_ALLOWED",

                message:
                    "This frontend origin is not allowed to access the API."

            });

        }


        /*
        ---------------------------------------------------------
        STATUS CODE
        ---------------------------------------------------------
        */

        const rawStatus =
            Number(

                err?.status ||

                err?.statusCode ||

                500

            );


        const statusCode =

            rawStatus >= 400 &&

            rawStatus < 600

                ?

                rawStatus

                :

                500;


        /*
        ---------------------------------------------------------
        RESPONSE
        ---------------------------------------------------------
        */

        return res
            .status(
                statusCode
            )
            .json({

                success:
                    false,

                error:

                    err?.code ||

                    "INTERNAL_SERVER_ERROR",

                message:

                    statusCode < 500

                        ?

                        (

                            err?.message ||

                            "Request failed."

                        )

                        :

                        "Internal server error."

            });

    }

);


/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

const server =
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
                `Port: ${PORT}`
            );


            console.log(

                `Environment: ${
                    process.env.NODE_ENV ||
                    "development"
                }`

            );


            console.log(
                "========================================"
            );


            console.log(
                "Configured frontend origins:"
            );


            console.log(

                allowedOrigins.length > 0

                    ?

                    allowedOrigins.join(
                        ", "
                    )

                    :

                    "No frontend origin configured"

            );


            console.log(
                "========================================"
            );


            console.log(
                "Server is ready."
            );


            console.log(
                "========================================"
            );

        }

    );


/*
|--------------------------------------------------------------------------
| GRACEFUL SHUTDOWN
|--------------------------------------------------------------------------
*/

function shutdown(
    signal
) {

    console.log(
        `${signal} received. Shutting down...`
    );


    server.close(

        function () {

            console.log(
                "HTTP server closed."
            );


            process.exit(
                0
            );

        }

    );


    setTimeout(

        function () {

            console.error(
                "Forced shutdown."
            );


            process.exit(
                1
            );

        },

        10000

    );

}


process.on(

    "SIGTERM",

    function () {

        shutdown(
            "SIGTERM"
        );

    }

);


process.on(

    "SIGINT",

    function () {

        shutdown(
            "SIGINT"
        );

    }

);
