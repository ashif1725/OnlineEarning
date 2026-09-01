"use strict";

const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("postgresql://skillearnhub_user:mTJIupbBYD72we6v7Siv5kDsRf2YCWCE@dpg-daag68lg1s2s73d39ah0-a/skillearnhub");
}

const pool = new Pool({
    connectionString: databaseUrl,

    ssl:
        process.env.NODE_ENV === "production"
            ? {
                rejectUnauthorized: false
            }
            : false,

    max: 10,

    idleTimeoutMillis: 30_000,

    connectionTimeoutMillis: 10_000
});

pool.on("error", (error) => {
    console.error(
        "Unexpected PostgreSQL pool error:",
        error
    );
});

module.exports = pool;
