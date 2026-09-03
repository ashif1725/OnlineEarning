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


const developmentOrigins =
    [

        "http://localhost:3000",

        "http://127.0.0.1:3000",

        "http://localhost:5173",

        "http://127.0.0.1:5173",

        "http://localhost:5500",

        "http://127.0.0.1:5500"

    ];


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
| CORS
|--------------------------------------------------------------------------
*/

function validateCorsOrigin(
    origin,
    callback
) {

    if (!origin) {

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


app.use(

    cors({

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

    })

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
| HEALTH
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

    adminDepositRequestsRoutes

);


/*
|--------------------------------------------------------------------------
| API 404
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


        return res.status(500).json({

            success:
                false,

            error:
                err?.code ||
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

    "0.0.0.0",

    function () {

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

    }

);
