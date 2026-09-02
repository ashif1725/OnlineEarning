"use strict";

const {
    createDepositRequest,
    approveDepositRequest,
    getUserDeposits
} = require(
    "../services/deposit.service"
);


/*
|--------------------------------------------------------------------------
| CREATE DEPOSIT
|--------------------------------------------------------------------------
*/

async function createDeposit(
    req,
    res
) {

    try {

        const result =
            await createDepositRequest(
                {
                    userId:
                        req.user.id,

                    amount:
                        req.body.amount
                }
            );


        return res.status(201).json(
            {
                success: true,

                message:
                    "Deposit request created successfully",

                deposit:
                    result
            }
        );


    } catch (error) {

        console.error(
            "CREATE DEPOSIT ERROR:",
            error
        );


        return res.status(400).json(
            {
                success: false,

                code:
                    error.code ||
                    "DEPOSIT_REQUEST_FAILED",

                message:
                    error.message
            }
        );
    }
}


/*
|--------------------------------------------------------------------------
| USER DEPOSIT HISTORY
|--------------------------------------------------------------------------
*/

async function getDeposits(
    req,
    res
) {

    try {

        const deposits =
            await getUserDeposits(
                {
                    userId:
                        req.user.id
                }
            );


        return res.json(
            {
                success: true,

                deposits
            }
        );


    } catch (error) {

        console.error(
            "GET DEPOSITS ERROR:",
            error
        );


        return res.status(500).json(
            {
                success: false,

                code:
                    "DEPOSITS_FETCH_FAILED"
            }
        );
    }
}


/*
|--------------------------------------------------------------------------
| ADMIN APPROVE DEPOSIT
|--------------------------------------------------------------------------
*/

async function approveDeposit(
    req,
    res
) {

    try {

        const result =
            await approveDepositRequest(
                {
                    depositId:
                        req.params.depositId,

                    adminUserId:
                        req.user.id
                }
            );


        return res.json(
            {
                success: true,

                message:
                    "Deposit approved successfully",

                result
            }
        );


    } catch (error) {

        console.error(
            "APPROVE DEPOSIT ERROR:",
            error
        );


        return res.status(400).json(
            {
                success: false,

                code:
                    error.code ||
                    "DEPOSIT_APPROVAL_FAILED",

                message:
                    error.message
            }
        );
    }
}


module.exports = {
    createDeposit,
    getDeposits,
    approveDeposit
};
