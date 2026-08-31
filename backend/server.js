"use strict";

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const authRoutes = require("./src/routes/auth.routes");

const app = express();

const PORT = Number(process.env.PORT || 8080);

app.disable("x-powered-by");

/* =========================================
   SECURITY HEADERS
========================================= */

app.use(
    helmet()
);


/* =========================================
   CORS
========================================= */

const allowedOrigin =
    process.env.FRONTEND_ORIGIN ||
    "http://localhost:3000";

app.use(
    cors({
        origin: allowedOrigin,
        credentials: true
    })
);


/* =========================================
   BODY PARSER
========================================= */

app.use(
    express.json({
        limit: "100kb"
    })
);


/* =========================================
   HEALTH CHECK
========================================= */

app.get(
    "/api/health",
    (req, res) => {

        res.status(200).json({
            success: true,
            service: "SkillEarn Hub API",
            status: "healthy"
        });

    }
);


/* =========================================
   AUTH ROUTES
========================================= */

app.use(
    "/api/auth",
    authRoutes
);


/* =========================================
   404 HANDLER
========================================= */

app.use(
    (req, res) => {

        res.status(404).json({
            success: false,
            error: "NOT_FOUND"
        });

    }
);


/* =========================================
   GLOBAL ERROR HANDLER
========================================= */

app.use(
    (err, req, res, next) => {

        console.error(
            "Unhandled server error:",
            err
        );

        res.status(500).json({
            success: false,
            error: "INTERNAL_SERVER_ERROR"
        });

    }
);


/* =========================================
   START SERVER
========================================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `SkillEarn API running on port ${PORT}`
        );

    }
);
