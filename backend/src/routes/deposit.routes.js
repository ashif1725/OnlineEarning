"use strict";


const depositService =
    require(
        "../services/deposit.service"
    );


/*
|--------------------------------------------------------------------------
| CREATE DEPOSIT REQUEST
|--------------------------------------------------------------------------
*/

async function createDepositRequest(
    req,
    res
) {

    try {

        const amount =
            req.body?.amount;


        if (

            amount ===
            undefined

            ||

            amount ===
            null

            ||

            amount ===
            ""

        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Deposit amount is required."

            });

        }


        const deposit =
            await depositService
                .createDepositRequest({

                    userId:
                        req.user.id,

                    amount:
                        amount

                });


        return res.status(201).json({

            success:
                true,

            message:
                "Deposit request created successfully.",

            deposit

        });


    } catch (
        error
    ) {

        console.error(
            "CREATE DEPOSIT CONTROLLER ERROR:",
            error
        );


        return res.status(400).json({

            success:
                false,

            code:

                error.code ||

                "CREATE_DEPOSIT_FAILED",

            message:

                error.message ||

                "Unable to create deposit request."

        });

    }

}


/*
|--------------------------------------------------------------------------
| GET CURRENT USER DEPOSIT REQUESTS
|--------------------------------------------------------------------------
*/

async function getUserDepositRequests(
    req,
    res
) {

    try {

        const deposits =
            await depositService
                .getUserDepositRequests({

                    userId:
                        req.user.id

                });


        return res.status(200).json({

            success:
                true,

            deposits

        });


    } catch (
        error
    ) {

        console.error(
            "GET USER DEPOSITS ERROR:",
            error
        );


        return res.status(500).json({

            success:
                false,

            message:
                "Unable to load deposit requests."

        });

    }

}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

    createDepositRequest,

    getUserDepositRequests

};
