"use strict";

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./src/routes/auth.routes");


/*
|--------------------------------------------------------------------------
| APP
|--------------------------------------------------------------------------
*/

const app = express();

const PORT =
    Number(process.env.PORT || 8080);

app.disable("x-powered-by");


/*
|--------------------------------------------------------------------------
| TRUST PROXY
|--------------------------------------------------------------------------
|
| Render runs behind a proxy.
|
*/

app.set("trust proxy", 1);


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
    process.env.FRONTEND_ORIGIN ||
    "http://localhost:3000";

app.use(
    cors({
        origin: allowedOrigin,
        credentials: true,
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
            "Accept",
            "Authorization"
        ]
    })
);


/*
|--------------------------------------------------------------------------
| BODY PARSER
|--------------------------------------------------------------------------
*/

app.use(
    express.json({
        limit: "100kb"
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
    (req, res) => {

        return res.status(200).json({

            success: true,

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
*/

app.use(
    "/api/auth",
    authRoutes
);


/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use(
    (req, res) => {

        return res.status(404).json({

            success: false,

            error:
                "NOT_FOUND",

            message:
                "The requested endpoint was not found."

        });
    }
);


/*
|--------------------------------------------------------------------------
| GLOBAL ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use(
    (err, req, res, next) => {

        console.error(
            "Unhandled server error:",
            err
        );

        return res.status(500).json({

            success: false,

            error:
                "INTERNAL_SERVER_ERROR",

            message:
                "An unexpected server error occurred."

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
    () => {

        console.log(
            `SkillEarn API running on port ${PORT}`
        );

        console.log(
            `Frontend origin: ${allowedOrigin}`
        );
    }
);
