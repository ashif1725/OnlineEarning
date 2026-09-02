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


const authRoutes =
    require(
        "./src/routes/auth.routes"
    );


const depositRoutes =
    require(
        "./src/routes/deposit.routes"
    );


const adminDepositRoutes =
    require(
        "./src/routes/admin-deposit.routes"
    );


const app =
    express();


const PORT =
    Number(
        process.env.PORT || 8080
    );


/* =========================================================
   TRUST PROXY
========================================================= */

app.set(
    "trust proxy",
    1
);


/* =========================================================
   SECURITY
========================================================= */

app.disable(
    "x-powered-by"
);


app.use(
    helmet()
);


/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [

    "https://ashif1725.github.io",

    "http://localhost:3000",

    "http://127.0.0.1:3000"

];


if (process.env.FRONTEND_ORIGIN) {

    allowedOrigins.push(
        process.env.FRONTEND_ORIGIN
    );

}


app.use(

    cors({

        origin:
            function (
                origin,
                callback
            ) {

                if (!origin) {

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
                        "CORS origin not allowed"
                    )
                );

            },

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

    })

);


/* =========================================================
   BODY PARSER
========================================================= */

app.use(

    express.json({

        limit:
            "100kb"

    })

);


app.use(
    cookieParser()
);


/* =========================================================
   HEALTH
========================================================= */

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


/* =========================================================
   AUTH
========================================================= */

app.use(

    "/api/auth",

    authRoutes

);


/* =========================================================
   DEPOSITS
========================================================= */

app.use(

    "/api/deposits",

    depositRoutes

);


/* =========================================================
   ADMIN DEPOSITS
========================================================= */

app.use(

    "/api/admin/deposits",

    adminDepositRoutes

);


/* =========================================================
   404
========================================================= */

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


/* =========================================================
   ERROR HANDLER
========================================================= */

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


        return res.status(500).json({

            success:
                false,

            error:
                "INTERNAL_SERVER_ERROR",

            message:
                "Internal server error"

        });

    }

);


/* =========================================================
   START
========================================================= */

app.listen(

    PORT,

    "0.0.0.0",

    function () {

        console.log(

            `SkillEarn API running on port ${PORT}`

        );

    }

);
