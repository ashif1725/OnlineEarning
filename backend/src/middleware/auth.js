"use strict";

const {
    getSession
} = require("../services/session.service");


function requireAuth(req, res, next) {

    const token =
        req.cookies?.skillearn_session;


    if (!token) {

        return res.status(401).json({
            success: false,
            error: "AUTHENTICATION_REQUIRED"
        });
    }


    getSession(token)
        .then(session => {

            if (!session) {

                return res.status(401).json({
                    success: false,
                    error: "INVALID_SESSION"
                });
            }


            req.user = {
                id: session.user_id,

                userId:
                    session.public_user_id,

                name:
                    session.full_name,

                email:
                    session.email,

                phone:
                    session.phone,

                role:
                    session.role,

                accountStatus:
                    session.account_status,

                emailVerifiedAt:
                    session.email_verified_at
            };


            next();

        })
        .catch(error => {

            console.error(error);

            res.status(500).json({
                success: false,
                error: "AUTHENTICATION_FAILED"
            });

        });
}


module.exports = {
    requireAuth
};
