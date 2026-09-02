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
    helmet()
);


/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

const allowedOrigin =
    process.env.FRONTEND_ORIGIN;


/*
|--------------------------------------------------------------------------
| CORS OPTIONS
|--------------------------------------------------------------------------
*/

const corsOptions = {

    origin:
        allowedOrigin ||
        "http://localhost:3000",


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

        "Authorization"

    ]

};


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
                "healthy"

        });

    }
);


/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
|
| /api/auth/register
| /api/auth/login
| /api/auth/logout
| /api/auth/me
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
| Example:
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
| USER
|
| POST /api/withdrawals
| GET  /api/withdrawals
|
| ADMIN
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
                "API endpoint not found"

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


        const statusCode =
            Number(
                err?.status ||
                err?.statusCode ||
                500
            );


        return res.status(
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
            `SkillEarn Hub API running on port ${PORT}`
        );

    }
);
