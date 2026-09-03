"use strict";


/*
|--------------------------------------------------------------------------
| ENVIRONMENT
|--------------------------------------------------------------------------
*/

require(
    "dotenv"
).config();


/*
|--------------------------------------------------------------------------
| PACKAGES
|--------------------------------------------------------------------------
*/

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
        8080
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


const adminDepositRequestsRoutes =
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


/*
|--------------------------------------------------------------------------
| TRUST PROXY
|--------------------------------------------------------------------------
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

        crossOriginResourcePolicy:
            false

    })

);


/*
|--------------------------------------------------------------------------
| ALLOWED FRONTEND ORIGINS
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
| LOCAL DEVELOPMENT ORIGINS
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
| FINAL ALLOWED ORIGINS
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
    Allow requests without Origin.
    Render health checks, curl, Postman, server requests.
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
    Allow configured frontend origins.
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
    Development fallback.
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
| CORS OPTIONS
|--------------------------------------------------------------------------
*/

const corsOptions = {


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
*/

app.use(

    cors(
        corsOptions
    )

);


/*
|--------------------------------------------------------------------------
| HANDLE PREFLIGHT
|--------------------------------------------------------------------------
*/

app.options(

    "*",

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

        console.log(
            `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
        );


        return next();

    }

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
|
| /api/auth/*
|
*/

app.use(

    "/api/auth",

    authRoutes

);


/*
|--------------------------------------------------------------------------
| USER DEPOSIT ROUTES
|--------------------------------------------------------------------------
|
| /api/deposits/*
|
*/

app.use(

    "/api/deposits",

    depositRoutes

);


/*
|--------------------------------------------------------------------------
| USER WITHDRAWAL ROUTES
|--------------------------------------------------------------------------
|
| /api/withdrawals/*
|
*/

app.use(

    "/api/withdrawals",

    withdrawalRoutes

);


/*
|--------------------------------------------------------------------------
| ADMIN USER ROUTES
|--------------------------------------------------------------------------
|
| GET   /api/admin/users
| GET   /api/admin/users/:userId
| PATCH /api/admin/users/:userId/status
|
*/

app.use(

    "/api/admin/users",

    adminUsersRoutes

);


/*
|--------------------------------------------------------------------------
| ADMIN DEPOSIT ROUTES
|--------------------------------------------------------------------------
|
| GET  /api/admin/deposits/pending
| POST /api/admin/deposits/:depositId/approve
| POST /api/admin/deposits/:depositId/reject
|
*/

app.use(

    "/api/admin/deposits",

    adminDepositRequestsRoutes

);


/*
|--------------------------------------------------------------------------
| API 404 HANDLER
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
            err
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
        -----------------------------------------------------
        CORS ERROR
        -----------------------------------------------------
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

                    err?.message &&

                    statusCode < 500

                        ?

                        err.message

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
                "Allowed frontend origins:"
            );


            console.log(

                allowedOrigins.length

                    ?

                    allowedOrigins

                    :

                    "No production frontend origin configured"

            );


            console.log(
                "========================================"
            );


            console.log(
                "Health endpoint:"
            );


            console.log(
                `/api/health`
            );


            console.log(
                "========================================"
            );


            console.log(
                "Admin users endpoint:"
            );


            console.log(
                `/api/admin/users`
            );


            console.log(
                "========================================"
            );


            console.log(
                "Admin pending deposits endpoint:"
            );


            console.log(
                `/api/admin/deposits/pending`
            );


            console.log(
                "========================================"
            );


            console.log(
                "Admin approve deposit endpoint:"
            );


            console.log(
                `/api/admin/deposits/:depositId/approve`
            );


            console.log(
                "========================================"
            );


            console.log(
                "Admin reject deposit endpoint:"
            );


            console.log(
                `/api/admin/deposits/:depositId/reject`
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
        `${signal} received. Shutting down server...`
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
