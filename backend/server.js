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


const walletRoutes =
    require(
        "./src/routes/wallet.routes"
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
| ROUTE MODULE NORMALIZER
|--------------------------------------------------------------------------
|
| Supports:
|
| module.exports = router;
|
| module.exports = {
|     router
| };
|
| module.exports = {
|     default: router
| };
|
|--------------------------------------------------------------------------
*/

function getExpressRouter(
    routeModule,
    routeName
) {

    /*
    ----------------------------------------------------------
    Direct Router export
    ----------------------------------------------------------
    */

    if (
        typeof routeModule ===
        "function"
    ) {

        return routeModule;

    }


    /*
    ----------------------------------------------------------
    Object containing router
    ----------------------------------------------------------
    */

    if (

        routeModule &&

        typeof routeModule.router ===
        "function"

    ) {

        return routeModule.router;

    }


    /*
    ----------------------------------------------------------
    Default export containing router
    ----------------------------------------------------------
    */

    if (

        routeModule &&

        typeof routeModule.default ===
        "function"

    ) {

        return routeModule.default;

    }


    /*
    ----------------------------------------------------------
    Invalid export
    ----------------------------------------------------------
    */

    console.error(
        "========================================"
    );


    console.error(
        "INVALID ROUTE EXPORT DETECTED"
    );


    console.error(
        "Route file:",
        routeName
    );


    console.error(
        "Received type:",
        typeof routeModule
    );


    console.error(
        "Received value:",
        routeModule
    );


    console.error(
        "========================================"
    );


    throw new TypeError(

        "Invalid Express Router export from " +
        routeName +
        ". The route file must export an Express router."

    );

}


/*
|--------------------------------------------------------------------------
| NORMALIZE ROUTES
|--------------------------------------------------------------------------
*/

const normalizedAuthRoutes =
    getExpressRouter(

        authRoutes,

        "./src/routes/auth.routes"

    );


const normalizedDepositRoutes =
    getExpressRouter(

        depositRoutes,

        "./src/routes/deposit.routes"

    );


const normalizedWithdrawalRoutes =
    getExpressRouter(

        withdrawalRoutes,

        "./src/routes/withdrawal.routes"

    );


const normalizedAdminUsersRoutes =
    getExpressRouter(

        adminUsersRoutes,

        "./src/routes/admin-users.routes"

    );


const normalizedAdminDepositRoutes =
    getExpressRouter(

        adminDepositRequestsRoutes,

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
    Requests without Origin:
    Render health checks, curl, Postman, server-to-server.
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
    Allowed configured origin
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
    Development fallback
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
| ROOT
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
        .json({

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

        return res.status(
            200
        )
        .json({

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

    normalizedAuthRoutes

);


/*
|--------------------------------------------------------------------------
| USER DEPOSIT ROUTES
|--------------------------------------------------------------------------
*/

app.use(

    "/api/deposits",

    normalizedDepositRoutes

);


/*
|--------------------------------------------------------------------------
| WALLET ROUTES
|--------------------------------------------------------------------------
*/

app.use(

    "/api/wallet",

    walletRoutes

);

/*
|--------------------------------------------------------------------------
| USER WITHDRAWAL ROUTES
|--------------------------------------------------------------------------
*/

app.use(

    "/api/withdrawals",

    normalizedWithdrawalRoutes

);


/*
|--------------------------------------------------------------------------
| ADMIN USER ROUTES
|--------------------------------------------------------------------------
*/

app.use(

    "/api/admin/users",

    normalizedAdminUsersRoutes

);


/*
|--------------------------------------------------------------------------
| ADMIN DEPOSIT ROUTES
|--------------------------------------------------------------------------
*/

app.use(

    "/api/admin/deposits",

    normalizedAdminDepositRoutes

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

        return res.status(
            404
        )
        .json({

            success:
                false,

            error:
                "NOT_FOUND",

            message:

                `API endpoint not found: ` +
                `${req.method} ${req.originalUrl}`

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

            "UNHANDLED SERVER ERROR:",

            err

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

            return res.status(
                403
            )
            .json({

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
            "Allowed frontend origins:"
        );


        console.log(

            allowedOrigins.length > 0

                ?

                allowedOrigins

                :

                [

                    "No frontend origin configured"

                ]

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
