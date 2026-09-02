"use strict";


const withdrawalService =
    require(
        "../services/withdrawal.service"
    );


/* =========================================================
   GET AUTHENTICATED USER ID
========================================================= */

function getAuthenticatedUserId(
    req
) {

    return (

        req.user?.id ||

        req.user?.userId ||

        req.user?.user_id ||

        req.user?.sub ||

        null

    );

}


/* =========================================================
   GET AUTHENTICATED ADMIN ID
========================================================= */

function getAuthenticatedAdminId(
    req
) {

    return (

        req.user?.id ||

        req.user?.userId ||

        req.user?.user_id ||

        req.user?.sub ||

        null

    );

}


/* =========================================================
   CREATE WITHDRAWAL REQUEST
========================================================= */

async function createWithdrawal(
    req,
    res,
    next
) {

    try {

        const userId =
            getAuthenticatedUserId(
                req
            );


        if (!userId) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "UNAUTHORIZED",

                message:
                    "Authentication is required."

            });

        }


        const {

            amount,

            paymentMethod,

            paymentDetails

        } =
            req.body || {};


        const withdrawal =
            await withdrawalService
                .createWithdrawalRequest({

                    userId,

                    amount,

                    paymentMethod,

                    paymentDetails

                });


        return res.status(201).json({

            success:
                true,

            message:
                "Withdrawal request created successfully.",

            withdrawal

        });

    } catch (error) {

        return handleWithdrawalError(
            error,
            res,
            next
        );

    }

}


/* =========================================================
   GET CURRENT USER WITHDRAWALS
========================================================= */

async function getMyWithdrawals(
    req,
    res,
    next
) {

    try {

        const userId =
            getAuthenticatedUserId(
                req
            );


        if (!userId) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "UNAUTHORIZED",

                message:
                    "Authentication is required."

            });

        }


        const withdrawals =
            await withdrawalService
                .getUserWithdrawals({

                    userId

                });


        return res.status(200).json({

            success:
                true,

            withdrawals

        });

    } catch (error) {

        return handleWithdrawalError(
            error,
            res,
            next
        );

    }

}


/* =========================================================
   ADMIN GET PENDING WITHDRAWALS
========================================================= */

async function getPendingWithdrawals(
    req,
    res,
    next
) {

    try {

        const withdrawals =
            await withdrawalService
                .getPendingWithdrawals();


        return res.status(200).json({

            success:
                true,

            withdrawals

        });

    } catch (error) {

        return handleWithdrawalError(
            error,
            res,
            next
        );

    }

}


/* =========================================================
   ADMIN APPROVE WITHDRAWAL
========================================================= */

async function approveWithdrawal(
    req,
    res,
    next
) {

    try {

        const adminUserId =
            getAuthenticatedAdminId(
                req
            );


        if (!adminUserId) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "UNAUTHORIZED",

                message:
                    "Authentication is required."

            });

        }


        const withdrawalId =
            req.params
                ?.withdrawalId;


        if (!withdrawalId) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "INVALID_WITHDRAWAL_ID",

                message:
                    "Withdrawal ID is required."

            });

        }


        const result =
            await withdrawalService
                .approveWithdrawalRequest({

                    withdrawalId,

                    adminUserId

                });


        return res.status(200).json({

            success:
                true,

            message:
                "Withdrawal approved successfully.",

            ...result

        });

    } catch (error) {

        return handleWithdrawalError(
            error,
            res,
            next
        );

    }

}


/* =========================================================
   ADMIN REJECT WITHDRAWAL
========================================================= */

async function rejectWithdrawal(
    req,
    res,
    next
) {

    try {

        const adminUserId =
            getAuthenticatedAdminId(
                req
            );


        if (!adminUserId) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "UNAUTHORIZED",

                message:
                    "Authentication is required."

            });

        }


        const withdrawalId =
            req.params
                ?.withdrawalId;


        const reason =
            req.body
                ?.reason;


        if (!withdrawalId) {

            return res.status(400).json({

                success:
                    false,

                error:
                    "INVALID_WITHDRAWAL_ID",

                message:
                    "Withdrawal ID is required."

            });

        }


        const result =
            await withdrawalService
                .rejectWithdrawalRequest({

                    withdrawalId,

                    adminUserId,

                    reason

                });


        return res.status(200).json({

            success:
                true,

            message:
                "Withdrawal rejected successfully.",

            ...result

        });

    } catch (error) {

        return handleWithdrawalError(
            error,
            res,
            next
        );

    }

}


/* =========================================================
   ERROR HANDLER
========================================================= */

function handleWithdrawalError(
    error,
    res,
    next
) {

    console.error(
        "WITHDRAWAL CONTROLLER ERROR:",
        error
    );


    const code =
        error?.code ||
        error?.message;


    const errorMap = {

        UNAUTHORIZED:
            {
                status: 401,
                message:
                    "Authentication is required."
            },


        WALLET_NOT_FOUND:
            {
                status: 404,
                message:
                    "Wallet not found."
            },


        WALLET_BALANCE_NOT_FOUND:
            {
                status: 404,
                message:
                    "Wallet balance not found."
            },


        WITHDRAWAL_NOT_FOUND:
            {
                status: 404,
                message:
                    "Withdrawal request not found."
            },


        WITHDRAWAL_ALREADY_PROCESSED:
            {
                status: 409,
                message:
                    "This withdrawal request has already been processed."
            },


        INVALID_WITHDRAWAL_AMOUNT:
            {
                status: 400,
                message:
                    "Please enter a valid withdrawal amount."
            },


        INVALID_PAYMENT_METHOD:
            {
                status: 400,
                message:
                    "Please select a valid payment method."
            },


        INVALID_PAYMENT_DETAILS:
            {
                status: 400,
                message:
                    "Payment details are required."
            },


        INSUFFICIENT_BALANCE:
            {
                status: 400,
                message:
                    "Insufficient wallet balance."
            },


        WALLET_INACTIVE:
            {
                status: 400,
                message:
                    "Wallet is not active."
            }

    };


    const mappedError =
        errorMap[
            code
        ];


    if (mappedError) {

        return res.status(
            mappedError.status
        )
        .json({

            success:
                false,

            error:
                code,

            message:
                mappedError.message

        });

    }


    /*
    ---------------------------------------------------------
    Unknown error:
    pass to global Express error handler
    ---------------------------------------------------------
    */

    return next(
        error
    );

}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    createWithdrawal,

    getMyWithdrawals,

    getPendingWithdrawals,

    approveWithdrawal,

    rejectWithdrawal

};
