"use strict";

const {
    getSession
} = require("../services/session.service");


async function requireAuth(req, res, next) {

    try {

        const token =
            req.cookies &&
            req.cookies.skillearn_session;


        if (!token) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }


        const session =
            await getSession(token);


        if (!session) {

            return res.status(401).json({
                success: false,
                message: "Session expired or invalid"
            });
        }


        /*
         * Attach authenticated session
         * to request.
         */

        req.auth = {
            sessionId:
                session.session_id,

            userId:
                session.user_id,

            publicUserId:
                session.public_user_id,

            fullName:
                session.full_name,

            email:
                session.email,

            phone:
                session.phone,

            role:
                session.role,

            accountStatus:
                session.account_status,

            emailVerified:
                Boolean(
                    session.email_verified_at
                )
        };


        next();


    } catch (error) {

        console.error(
            "AUTH MIDDLEWARE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Authentication service error"
        });
    }
}


module.exports = {
    requireAuth
};
