"use strict";

const depositService =
    require(
        "../services/deposit.service"
    );


/*
|--------------------------------------------------------------------------
| GET PENDING DEPOSITS
|--------------------------------------------------------------------------
*/

async function getPendingDeposits(
    req,
    res
) {

    try {

        const deposits =
            await depositService
                .getPendingDeposits();


        return res.json({

            success:
                true,

            deposits

        });


    } catch (error) {

        return res.status(500).json({

            success:
                false,

            message:
                "Unable to load deposits"

        });

    }

}


/*
|--------------------------------------------------------------------------
| APPROVE DEPOSIT
|--------------------------------------------------------------------------
*/

async function approveDeposit(
    req,
    res
) {

    try {

        const result =
            await depositService
                .approveDepositRequest({

                    depositId:
                        req.params.depositId,

                    adminUserId:
                        req.user.id

                });


        return res.json({

            success:
                true,

            message:
                "Deposit approved successfully",

            result

        });


    } catch (error) {

        return res.status(400).json({

            success:
                false,

            code:
                error.code ||
                "DEPOSIT_APPROVAL_FAILED",

            message:
                error.message

        });

    }

}


/*
|--------------------------------------------------------------------------
| REJECT DEPOSIT
|--------------------------------------------------------------------------
*/

async function rejectDeposit(
    req,
    res
) {

    try {

        const result =
            await depositService
                .rejectDepositRequest({

                    depositId:
                        req.params.depositId,

                    adminUserId:
                        req.user.id,

                    reason:
                        req.body.reason

                });


        return res.json({

            success:
                true,

            message:
                "Deposit rejected successfully",

            result

        });


    } catch (error) {

        return res.status(400).json({

            success:
                false,

            message:
                error.message

        });

    }

}


module.exports = {

    getPendingDeposits,

    approveDeposit,

    rejectDeposit

};
