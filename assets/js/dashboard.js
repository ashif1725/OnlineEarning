if (depositForm) {

    depositForm.addEventListener(
        "submit",

        async function (event) {

            event.preventDefault();


            const amountInput =
                document.getElementById(
                    "depositAmount"
                );


            const amount =
                Number(
                    amountInput.value
                );


            /*
            |--------------------------------------------------------------------------
            | VALIDATION
            |--------------------------------------------------------------------------
            */

            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {

                showDashboardMessage(
                    "Please enter a valid deposit amount."
                );

                return;

            }


            const submitButton =
                depositForm.querySelector(
                    'button[type="submit"]'
                );


            const originalText =
                submitButton
                    ? submitButton.textContent
                    : "Create Deposit Request";


            try {

                /*
                |--------------------------------------------------------------------------
                | LOADING STATE
                |--------------------------------------------------------------------------
                */

                if (submitButton) {

                    submitButton.disabled =
                        true;


                    submitButton.textContent =
                        "Creating Request...";

                }


                /*
                |--------------------------------------------------------------------------
                | API URL
                |--------------------------------------------------------------------------
                */

                const url =
                    typeof window.apiUrl ===
                    "function"

                        ? window.apiUrl(
                            "/api/deposits"
                        )

                        : "https://skillearnhub-1.onrender.com/api/deposits";


                /*
                |--------------------------------------------------------------------------
                | CREATE REQUEST
                |--------------------------------------------------------------------------
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
                                JSON.stringify({

                                    amount:
                                        amount

                                })

                        }

                    );


                const data =
                    await response.json()
                        .catch(
                            function () {

                                return {};
                            }
                        );


                /*
                |--------------------------------------------------------------------------
                | ERROR
                |--------------------------------------------------------------------------
                */

                if (!response.ok) {

                    throw new Error(

                        data.message ||

                        data.error ||

                        "Unable to create deposit request."

                    );

                }


                /*
                |--------------------------------------------------------------------------
                | SUCCESS
                |--------------------------------------------------------------------------
                */

                amountInput.value =
                    "";


                showDashboardMessage(

                    "Deposit request created successfully. Your request is now pending admin verification."

                );


                /*
                |--------------------------------------------------------------------------
                | REFRESH DEPOSIT DATA
                |--------------------------------------------------------------------------
                */

                console.log(
                    "DEPOSIT CREATED:",
                    data
                );


            } catch (error) {

                console.error(
                    "DEPOSIT REQUEST ERROR:",
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
                        originalText;

                }

            }

        }

    );

}
