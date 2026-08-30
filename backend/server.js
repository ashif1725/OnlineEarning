"use strict";

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const app = express();

const PORT = Number(process.env.PORT || 8080);

app.disable("x-powered-by");

app.use(
    helmet()
);

app.use(
    cors({
        origin: process.env.FRONTEND_ORIGIN,
        credentials: true
    })
);

app.use(
    express.json({
        limit: "100kb"
    })
);

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

app.use(
    (err, req, res, next) => {

        console.error(err);

        res.status(500).json({
            success: false,
            error: "INTERNAL_SERVER_ERROR"
        });

    }
);


app.listen(
    PORT,
    () => {

        console.log(
            `SkillEarn API running on port ${PORT}`
        );

    }
);
