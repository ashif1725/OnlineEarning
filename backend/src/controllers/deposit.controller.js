"use strict";


const depositService =
    require(
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

        const deposit =
            await depositService
                .createDepositRequest({

                    userId:
                        req.user.id,

                    amount:
                        req.body.amount

                });


        return res.status(201).json({

            success:
                true,

            message:
                "Deposit request created successfully",

            deposit:
                deposit

        });


    } catch (error) {

        console.error(
            "CREATE DEPOSIT CONTROLLER ERROR:",
            error
        );


        return res.status(400).json({

            success:
                false,

            code:
                error.code ||
                "DEPOSIT_REQUEST_FAILED",

            message:
                error.message ||
                "Unable to create deposit request"

        });

    }

}


/*
|--------------------------------------------------------------------------
| GET MY DEPOSITS
|--------------------------------------------------------------------------
*/

async function getMyDeposits(
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


        return res.json({

            success:
                true,

            deposits:
                deposits

        });


    } catch (error) {

        console.error(
            "GET DEPOSITS ERROR:",
            error
        );


        return res.status(500).json({

            success:
                false,

            message:
                "Unable to load deposits"

        });

    }

}


module.exports = {

    createDeposit,

    getMyDeposits

};
