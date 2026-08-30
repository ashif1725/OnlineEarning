const {
    revokeSession
} = require("../services/session.service");


async function logout(req, res) {

    try {

        const token =
            req.cookies?.skillearn_session;


        await revokeSession(token);


        res.clearCookie(
            "skillearn_session",
            {
                httpOnly: true,
                secure:
                    process.env.NODE_ENV ===
                    "production",
                sameSite: "lax",
                path: "/"
            }
        );


        res.json({
            success: true,
            message: "Logged out successfully."
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            error: "LOGOUT_FAILED"
        });
    }
}
