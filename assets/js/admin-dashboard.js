/* =========================================
   DEPOSITS
========================================= */

async function loadDeposits() {


    const depositsList =
        document.getElementById(
            "depositsList"
        );


    if (!depositsList) {

        return;

    }


    depositsList.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                ⏳
            </div>

            <strong>
                Loading deposit requests...
            </strong>

        </div>

    `;


    try {


        const apiUrl =
            window.API_URL ||
            "";


        if (!apiUrl) {

            throw new Error(
                "API URL not configured"
            );

        }


        const response =
            await fetch(

                apiUrl +
                "/admin/deposits",

                {

                    method:
                        "GET",

                    headers:
                        getHeaders()

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(

                data.message ||

                data.error ||

                "Unable to load deposits"

            );

        }


        const deposits =
            data.deposits ||
            [];


        setText(

            "pendingDeposits",

            deposits.length

        );


        setText(

            "totalDeposits",

            deposits.length

        );


        renderDeposits(
            deposits
        );


    } catch (
        error
    ) {


        console.error(
            "LOAD DEPOSITS ERROR:",
            error
        );


        depositsList.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <strong>
                    Unable to load deposits
                </strong>

                <p>
                    ${escapeHtml(
                        error.message
                    )}
                </p>

            </div>

        `;

    }

}



/* =========================================
   RENDER DEPOSITS
========================================= */

function renderDeposits(
    deposits
) {


    const depositsList =
        document.getElementById(
            "depositsList"
        );


    if (!depositsList) {

        return;

    }


    if (

        !Array.isArray(
            deposits
        ) ||

        deposits.length ===
        0

    ) {


        depositsList.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    💳
                </div>

                <strong>
                    No pending deposit requests
                </strong>

                <p>
                    New deposit requests will
                    appear here.
                </p>

            </div>

        `;


        return;

    }


    depositsList.innerHTML =
        deposits.map(

            function (
                deposit
            ) {


                const depositId =

                    deposit.id ||

                    deposit.deposit_id ||

                    "";


                const userName =

                    deposit.user_name ||

                    deposit.full_name ||

                    deposit.name ||

                    "User";


                const amount =

                    Number(
                        deposit.amount ||
                        0
                    );


                const status =

                    deposit.status ||
                    "pending";


                const utrNumber =

                    deposit.utr_number ||

                    deposit.utr ||

                    deposit.transaction_id ||

                    "Not provided";


                const paymentMethod =

                    deposit.payment_method ||

                    deposit.method ||

                    "UPI";


                const createdAt =

                    deposit.created_at ||

                    deposit.createdAt ||

                    "";


                return `

                    <div
                        class="content-card deposit-request-card"
                        style="
                            margin-bottom: 16px;
                        "
                    >

                        <div
                            style="
                                display:flex;
                                justify-content:space-between;
                                align-items:flex-start;
                                gap:12px;
                                margin-bottom:16px;
                            "
                        >

                            <div>

                                <strong
                                    style="
                                        font-size:18px;
                                    "
                                >

                                    ${escapeHtml(
                                        userName
                                    )}

                                </strong>

                            </div>


                            <span
                                class="deposit-status"
                            >

                                ${escapeHtml(
                                    status
                                )}

                            </span>

                        </div>


                        <div
                            style="
                                display:grid;
                                gap:10px;
                            "
                        >

                            <p>

                                <strong>
                                    Amount:
                                </strong>

                                ₹${amount.toFixed(
                                    2
                                )}

                            </p>


                            <p>

                                <strong>
                                    Payment Method:
                                </strong>

                                ${escapeHtml(
                                    paymentMethod
                                )}

                            </p>


                            <p>

                                <strong>
                                    UTR Number:
                                </strong>

                                ${escapeHtml(
                                    utrNumber
                                )}

                            </p>


                            ${
                                createdAt

                                    ? `

                                    <p>

                                        <strong>
                                            Requested:
                                        </strong>

                                        ${escapeHtml(
                                            new Date(
                                                createdAt
                                            )
                                            .toLocaleString()
                                        )}

                                    </p>

                                    `

                                    : ""

                            }

                        </div>


                        <div
                            style="
                                display:flex;
                                gap:12px;
                                margin-top:20px;
                                flex-wrap:wrap;
                            "
                        >

                            <button

                                type="button"

                                class="
                                    primary-button
                                    approve-deposit-button
                                "

                                data-deposit-id="
                                    ${escapeHtml(
                                        depositId
                                    )}
                                "

                            >

                                ✓ Approve

                            </button>


                            <button

                                type="button"

                                class="
                                    secondary-button
                                    reject-deposit-button
                                "

                                data-deposit-id="
                                    ${escapeHtml(
                                        depositId
                                    )}
                                "

                            >

                                ✕ Reject

                            </button>

                        </div>

                    </div>

                `;


            }

        )
        .join(
            ""
        );


    bindDepositActionButtons();

}



/* =========================================
   BIND APPROVE / REJECT BUTTONS
========================================= */

function bindDepositActionButtons() {


    const approveButtons =
        document.querySelectorAll(
            ".approve-deposit-button"
        );


    approveButtons.forEach(

        function (
            button
        ) {


            button.addEventListener(

                "click",

                async function () {


                    const depositId =
                        button.dataset.depositId;


                    await approveDeposit(
                        depositId,
                        button
                    );


                }

            );


        }

    );


    const rejectButtons =
        document.querySelectorAll(
            ".reject-deposit-button"
        );


    rejectButtons.forEach(

        function (
            button
        ) {


            button.addEventListener(

                "click",

                async function () {


                    const depositId =
                        button.dataset.depositId;


                    await rejectDeposit(
                        depositId,
                        button
                    );


                }

            );


        }

    );

}



/* =========================================
   APPROVE DEPOSIT
========================================= */

async function approveDeposit(
    depositId,
    button
) {


    const confirmed =
        window.confirm(

            "Are you sure you want to approve this deposit?"

        );


    if (!confirmed) {

        return;

    }


    try {


        button.disabled =
            true;


        button.textContent =
            "Approving...";


        const apiUrl =
            window.API_URL ||
            "";


        const response =
            await fetch(

                apiUrl +
                "/admin/deposits/" +
                encodeURIComponent(
                    depositId
                ) +
                "/approve",

                {

                    method:
                        "POST",

                    headers:
                        getHeaders()

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(

                data.message ||

                data.error ||

                "Unable to approve deposit"

            );

        }


        alert(
            data.message ||
            "Deposit approved successfully."
        );


        await loadDeposits();


    } catch (
        error
    ) {


        console.error(
            "APPROVE DEPOSIT ERROR:",
            error
        );


        alert(
            error.message ||
            "Unable to approve deposit."
        );


        button.disabled =
            false;


        button.textContent =
            "✓ Approve";

    }

}



/* =========================================
   REJECT DEPOSIT
========================================= */

async function rejectDeposit(
    depositId,
    button
) {


    const confirmed =
        window.confirm(

            "Are you sure you want to reject this deposit?"

        );


    if (!confirmed) {

        return;

    }


    const reason =
        window.prompt(

            "Enter rejection reason (optional):"

        );


    try {


        button.disabled =
            true;


        button.textContent =
            "Rejecting...";


        const apiUrl =
            window.API_URL ||
            "";


        const response =
            await fetch(

                apiUrl +
                "/admin/deposits/" +
                encodeURIComponent(
                    depositId
                ) +
                "/reject",

                {

                    method:
                        "POST",

                    headers:
                        getHeaders(),

                    body:
                        JSON.stringify({

                            reason:
                                reason ||
                                null

                        })

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(

                data.message ||

                data.error ||

                "Unable to reject deposit"

            );

        }


        alert(
            data.message ||
            "Deposit rejected successfully."
        );


        await loadDeposits();


    } catch (
        error
    ) {


        console.error(
            "REJECT DEPOSIT ERROR:",
            error
        );


        alert(
            error.message ||
            "Unable to reject deposit."
        );


        button.disabled =
            false;


        button.textContent =
            "✕ Reject";

    }

}
