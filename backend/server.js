"use strict";


/*
|--------------------------------------------------------------------------
| ENVIRONMENT
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


/*
|--------------------------------------------------------------------------
| APP
|--------------------------------------------------------------------------
*/

const app =
    express();


const PORT =
    Number(
        process.env.PORT || 8080
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
|
| Required when deployed behind Render / reverse proxy.
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
|
| FRONTEND_ORIGIN can contain one origin:
|
| https://example.com
|
| FRONTEND_ORIGINS can contain multiple origins:
|
| https://example.com,https://www.example.com
|
|--------------------------------------------------------------------------
*/

const configuredOrigins =
    [

        process.env.FRONTEND_ORIGIN,

        ...(String(
            process.env.FRONTEND_ORIGINS ||
            ""
        )
        .split(","))

    ]
    .map(
        function (origin) {

            return String(
                origin || ""
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

                        ? developmentOrigins

                        : []
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
    ----------------------------------------------------------------------
    Requests without Origin header:
    - Render health checks
    - curl
    - server-to-server requests
    ----------------------------------------------------------------------
    */

    if (!origin) {

        return callback(
            null,
            true
        );

    }


    const normalizedOrigin =
        String(origin)
            .trim()
            .replace(
                /\/+$/,
                ""
            );


    /*
    ----------------------------------------------------------------------
    Explicitly configured frontend
    ----------------------------------------------------------------------
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
    ----------------------------------------------------------------------
    Helpful development fallback
    ----------------------------------------------------------------------
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


    methods: [

        "GET",

        "POST",

        "PUT",

        "PATCH",

        "DELETE",

        "OPTIONS"

    ],


    allowedHeaders: [

        "Content-Type",

        "Authorization",

        "Accept"

    ],


    exposedHeaders: [

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
|
| Useful on Render logs while debugging API requests.
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


        next();

    }
);


/*
|--------------------------------------------------------------------------
| ROOT API INFORMATION
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
| POST /api/auth/register
| POST /api/auth/login
| POST /api/auth/logout
| GET  /api/auth/me
|
*/

app.use(
    "/api/auth",

    authRoutes
);


/*
|--------------------------------------------------------------------------
| DEPOSIT ROUTES
|--------------------------------------------------------------------------
|
| POST /api/deposits
| GET  /api/deposits
|
*/

app.use(
    "/api/deposits",

    depositRoutes
);


/*
|--------------------------------------------------------------------------
| WITHDRAWAL ROUTES
|--------------------------------------------------------------------------
|
| USER:
|
| POST /api/withdrawals
| GET  /api/withdrawals
|
| ADMIN:
|
| GET  /api/withdrawals/admin/pending
|
| POST /api/withdrawals/admin/:withdrawalId/approve
|
| POST /api/withdrawals/admin/:withdrawalId/reject
|
*/

app.use(
    "/api/withdrawals",

    withdrawalRoutes
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
        ------------------------------------------------------------------
        CORS error
        ------------------------------------------------------------------
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

                ? rawStatus

                : 500;


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

                        ? err.message

                        : "Internal server error."

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
            allowedOrigins.length

                ? allowedOrigins

                : [
                    "No production origin configured"
                ]
        );


        console.log(
            "========================================"
        );

    }

);
