"use strict";


/* =========================================================
   ADMIN MIDDLEWARE
========================================================= */


/* =========================================================
   NORMALIZE ROLE
========================================================= */

function normalizeRole(
    value
) {

    return String(
        value || ""
    )
    .trim()
    .toLowerCase();

}


/* =========================================================
   GET ROLE FROM AUTHENTICATED USER
========================================================= */

function getUserRole(
    req
) {

    return normalizeRole(

        req.user?.role ||

        req.user?.userRole ||

        req.user?.user_role ||

        req.user?.accountRole ||

        req.user?.account_role ||

        ""

    );

}


/* =========================================================
   CHECK ADMIN ROLE
========================================================= */

function isAdminRole(
    role
) {

    const normalizedRole =
        normalizeRole(
            role
        );


    return (

        normalizedRole ===
        "admin"

        ||

        normalizedRole ===
        "administrator"

    );

}


/* =========================================================
   REQUIRE ADMIN
========================================================= */

function requireAdmin(
    req,
    res,
    next
) {

    /*
    ---------------------------------------------------------
    Authentication middleware must run before this middleware.
    ---------------------------------------------------------
    */

    if (!req.user) {

        return res.status(401).json({

            success:
                false,

            error:
                "UNAUTHORIZED",

            message:
                "Authentication is required."

        });

    }


    const role =
        getUserRole(
            req
        );


    /*
    ---------------------------------------------------------
    Allow admin only
    ---------------------------------------------------------
    */

    if (
        !isAdminRole(
            role
        )
    ) {

        return res.status(403).json({

            success:
                false,

            error:
                "FORBIDDEN",

            message:
                "Administrator access is required."

        });

    }


    /*
    ---------------------------------------------------------
    Attach normalized role
    ---------------------------------------------------------
    */

    req.user.role =
        "admin";


    return next();

}


/* =========================================================
   EXPORTS
========================================================= */

module.exports =
    requireAdmin;


module.exports.requireAdmin =
    requireAdmin;


module.exports.getUserRole =
    getUserRole;


module.exports.isAdminRole =
    isAdminRole;
