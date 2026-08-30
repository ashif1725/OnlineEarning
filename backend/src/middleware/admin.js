"use strict";

function requireAdmin(req, res, next) {

    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: "AUTHENTICATION_REQUIRED"
        });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            error: "ADMIN_ACCESS_REQUIRED"
        });
    }

    next();
}

module.exports = {
    requireAdmin
};
