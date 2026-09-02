/*
|--------------------------------------------------------------------------
| FORM HANDLERS
|--------------------------------------------------------------------------
*/

function setupDemoForms() {

    const sendForm =
        document.getElementById(
            "sendMoneyForm"
        );


    const depositForm =
        document.getElementById(
            "depositForm"
        );


    const withdrawForm =
        document.getElementById(
            "withdrawForm"
        );


    /*
    |--------------------------------------------------------------------------
    | CREATE DEPOSIT REQUEST
    |--------------------------------------------------------------------------
    */

    if (depositForm) {

        depositForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const amountInput =
                    document.getElementById(
                        "depositAmount"
                    );


                const submitButton =
                    depositForm.querySelector(
                        'button[type="submit"]'
                    );


                const amount =
                    Number(
                        amountInput.value
                    );


                /*
                ----------------------------------------------------------
                Validate amount
                ----------------------------------------------------------
                */

                if (
                    !Number.isFinite(
                        amount
                    ) ||
                    amount <= 0
                ) {

                    showDashboardMessage(
                        "Please enter a valid deposit amount."
                    );

                    return;
                }


                /*
                ----------------------------------------------------------
                Disable button
                ----------------------------------------------------------
                */

                const originalButtonText =
                    submitButton
                        ? submitButton.textContent
                        : "Create Deposit Request";


                if (submitButton) {

                    submitButton.disabled =
                        true;


                    submitButton.textContent =
                        "Creating request...";

                }


                try {

                    /*
                    ------------------------------------------------------
                    API URL
                    ------------------------------------------------------
                    */

                    const url =
                        typeof window.apiUrl ===
                        "function"
                            ? window.apiUrl(
                                "/api/deposits"
                            )
                            : "https://skillearnhub-1.onrender.com/api/deposits";


                    /*
                    ------------------------------------------------------
                    Send request
                    ------------------------------------------------------
                    */

                    const response =
                        await fetch(
                            url,
                            {

                                method:
                                    "POST",

                                credentials:
                                    "include",

                                headers:
                                    {
                                        "Content-Type":
                                            "application/json",

                                        "Accept":
                                            "application/json"
                                    },

                                body:
                                    JSON.stringify(
                                        {
                                            amount:
                                                amount
                                        }
                                    )

                            }
                        );


                    /*
                    ------------------------------------------------------
                    Parse response
                    ------------------------------------------------------
                    */

                    const data =
                        await response.json();


                    /*
                    ------------------------------------------------------
                    Handle API error
                    ------------------------------------------------------
                    */

                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "Unable to create deposit request"
                        );

                    }


                    /*
                    ------------------------------------------------------
                    Success
                    ------------------------------------------------------
                    */

                    amountInput.value =
                        "";


                    showDashboardMessage(
                        "Deposit request created successfully. It is now pending admin verification."
                    );


                    /*
                    ------------------------------------------------------
                    Refresh deposit history
                    ------------------------------------------------------
                    */

                    await loadMyDeposits();


                } catch (error) {

                    console.error(
                        "CREATE DEPOSIT REQUEST ERROR:",
                        error
                    );


                    showDashboardMessage(
                        error.message ||
                        "Unable to create deposit request."
                    );


                } finally {

                    if (submitButton) {

                        submitButton.disabled =
                            false;


                        submitButton.textContent =
                            originalButtonText;

                    }

                }

            }
        );

    }


    /*
    |--------------------------------------------------------------------------
    | SEND MONEY
    |--------------------------------------------------------------------------
    */

    if (sendForm) {

        sendForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                showDashboardMessage(
                    "Send Money API will be connected next."
                );

            }
        );

    }


    /*
    |--------------------------------------------------------------------------
    | WITHDRAW
    |--------------------------------------------------------------------------
    */

    if (withdrawForm) {

        withdrawForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                showDashboardMessage(
                    "Withdrawal API will be connected next."
                );

            }
        );

    }

}
