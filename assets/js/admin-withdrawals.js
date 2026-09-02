"use strict";

/* =========================================================
   SkillEarn Hub
   assets/js/admin-withdrawals.js

   Admin Withdrawal Management
   ========================================================= */


/* =========================================================
   API CONFIGURATION
   ========================================================= */

const WITHDRAWAL_API = {

    /*
    ---------------------------------------------------------
    Get all pending withdrawal requests for admin
    ---------------------------------------------------------
    */

    PENDING:
        "/api/withdrawals/admin/pending",


    /*
    ---------------------------------------------------------
    Approve withdrawal

    Final URL becomes:

    /api/withdrawals/admin/{withdrawalId}/approve
    ---------------------------------------------------------
    */

    APPROVE:
        function (withdrawalId) {

            return `/api/withdrawals/admin/${encodeURIComponent(
                withdrawalId
            )}/approve`;

        },


    /*
    ---------------------------------------------------------
    Reject withdrawal

    Final URL becomes:

    /api/withdrawals/admin/{withdrawalId}/reject
    ---------------------------------------------------------
    */

    REJECT:
        function (withdrawalId) {

            return `/api/withdrawals/admin/${encodeURIComponent(
                withdrawalId
            )}/reject`;

        }

};


/* =========================================================
   STATE
   ========================================================= */

const withdrawalState = {

    withdrawals:
        [],

    loading:
        false,

    selectedWithdrawal:
        null

};


/* =========================================================
   ELEMENT HELPER
   ========================================================= */

function withdrawalElement(id) {

    return document.getElementById(
        id
    );

}


/* =========================================================
   GET SAVED USER
   ========================================================= */

function getCurrentUser() {

    if (
        typeof window.getSavedUser ===
        "function"
    ) {

        return window.getSavedUser();

    }


    try {

        const value =
            localStorage.getItem(
                "skillearn_user"
            );


        return value
            ? JSON.parse(value)
            : null;

    } catch (error) {

        return null;

    }

}


/* =========================================================
   GET USER ROLE
   ========================================================= */

function getUserRole(user) {

    return String(

        user?.role ||

        user?.userRole ||

        user?.user_role ||

        ""

    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   ADMIN AUTHORIZATION
   ========================================================= */

function requireAdmin() {

    const user =
        getCurrentUser();


    const role =
        getUserRole(
            user
        );


    if (

        role === "admin" ||

        role === "administrator"

    ) {

        return true;

    }


    window.location.href =
        "../login.html";


    return false;

}


/* =========================================================
   MESSAGE
   ========================================================= */

function showWithdrawalMessage(
    message,
    type = "error"
) {

    const element =
        withdrawalElement(
            "withdrawalMessage"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message || "";


    element.classList.remove(
        "show",
        "success",
        "error"
    );


    if (!message) {

        return;

    }


    element.classList.add(
        "show",
        type
    );

}


/* =========================================================
   CLEAR MESSAGE
   ========================================================= */

function clearWithdrawalMessage() {

    showWithdrawalMessage(
        ""
    );

}


/* =========================================================
   FORMAT AMOUNT
   ========================================================= */

function formatAmount(
    amount,
    currency = "INR"
) {

    const numericAmount =
        Number(amount);


    if (
        !Number.isFinite(
            numericAmount
        )
    ) {

        return "-";

    }


    try {

        return new Intl.NumberFormat(
            "en-IN",
            {

                style:
                    "currency",

                currency:
                    currency || "INR",

                maximumFractionDigits:
                    2

            }
        )
        .format(
            numericAmount
        );

    } catch (error) {

        return `${currency || "INR"} ${numericAmount.toFixed(
            2
        )}`;

    }

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {

            dateStyle:
                "medium",

            timeStyle:
                "short"

        }
    )
    .format(
        date
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   EXTRACT ARRAY FROM API RESPONSE
   ========================================================= */

function extractWithdrawals(
    result
) {

    if (
        Array.isArray(
            result
        )
    ) {

        return result;

    }


    if (
        Array.isArray(
            result?.withdrawals
        )
    ) {

        return result.withdrawals;

    }


    if (
        Array.isArray(
            result?.data
        )
    ) {

        return result.data;

    }


    if (
        Array.isArray(
            result?.requests
        )
    ) {

        return result.requests;

    }


    return [];

}


/* =========================================================
   GET TABLE BODY
   ========================================================= */

function getWithdrawalTableBody() {

    return (

        withdrawalElement(
            "withdrawalsTableBody"
        )

        ||

        document.querySelector(
            "#withdrawalsTable tbody"
        )

    );

}


/* =========================================================
   SET LOADING STATE
   ========================================================= */

function setWithdrawalLoading(
    loading
) {

    withdrawalState.loading =
        loading;


    const refreshButton =
        withdrawalElement(
            "refreshWithdrawals"
        );


    if (refreshButton) {

        refreshButton.disabled =
            loading;


        if (loading) {

            refreshButton.dataset.originalText =
                refreshButton.dataset.originalText ||
                refreshButton.textContent;


            refreshButton.textContent =
                "Loading...";

        } else {

            refreshButton.textContent =
                refreshButton.dataset.originalText ||
                "Refresh";

        }

    }

}


/* =========================================================
   RENDER EMPTY STATE
   ========================================================= */

function renderEmptyState() {

    const tableBody =
        getWithdrawalTableBody();


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML =
        `
        <tr>
            <td
                colspan="8"
                class="empty-state"
            >
                No pending withdrawal requests found.
            </td>
        </tr>
        `;

}


/* =========================================================
   RENDER LOADING STATE
   ========================================================= */

function renderLoadingState() {

    const tableBody =
        getWithdrawalTableBody();


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML =
        `
        <tr>
            <td
                colspan="8"
                class="empty-state"
            >
                Loading withdrawal requests...
            </td>
        </tr>
        `;

}


/* =========================================================
   GET WITHDRAWAL ID
   ========================================================= */

function getWithdrawalId(
    withdrawal
) {

    return (

        withdrawal?.id ||

        withdrawal?.withdrawal_id ||

        withdrawal?.withdrawalId ||

        ""

    );

}


/* =========================================================
   GET USER NAME
   ========================================================= */

function getWithdrawalUserName(
    withdrawal
) {

    return (

        withdrawal?.full_name ||

        withdrawal?.fullName ||

        withdrawal?.user_name ||

        withdrawal?.userName ||

        withdrawal?.email ||

        withdrawal?.user_email ||

        "Unknown User"

    );

}


/* =========================================================
   GET USER EMAIL
   ========================================================= */

function getWithdrawalEmail(
    withdrawal
) {

    return (

        withdrawal?.email ||

        withdrawal?.user_email ||

        withdrawal?.userEmail ||

        ""

    );

}


/* =========================================================
   GET PAYMENT METHOD
   ========================================================= */

function getWithdrawalMethod(
    withdrawal
) {

    return (

        withdrawal?.payment_method ||

        withdrawal?.paymentMethod ||

        withdrawal?.method ||

        withdrawal?.withdrawal_method ||

        "-"

    );

}


/* =========================================================
   GET PAYMENT DETAILS
   ========================================================= */

function getWithdrawalDetails(
    withdrawal
) {

    return (

        withdrawal?.payment_details ||

        withdrawal?.paymentDetails ||

        withdrawal?.account_details ||

        withdrawal?.accountDetails ||

        withdrawal?.upi_id ||

        withdrawal?.upiId ||

        withdrawal?.bank_account ||

        withdrawal?.bankAccount ||

        "-"

    );

}


/* =========================================================
   RENDER WITHDRAWALS
   ========================================================= */

function renderWithdrawals(
    withdrawals
) {

    const tableBody =
        getWithdrawalTableBody();


    if (!tableBody) {

        console.warn(
            "Withdrawal table body not found."
        );

        return;

    }


    if (

        !Array.isArray(
            withdrawals
        )

        ||

        withdrawals.length === 0

    ) {

        renderEmptyState();

        return;

    }


    tableBody.innerHTML =
        withdrawals
            .map(
                function (
                    withdrawal
                ) {

                    const withdrawalId =
                        getWithdrawalId(
                            withdrawal
                        );


                    const userName =
                        getWithdrawalUserName(
                            withdrawal
                        );


                    const email =
                        getWithdrawalEmail(
                            withdrawal
                        );


                    const amount =
                        formatAmount(

                            withdrawal?.amount,

                            withdrawal?.currency ||
                            "INR"

                        );


                    const method =
                        getWithdrawalMethod(
                            withdrawal
                        );


                    const details =
                        getWithdrawalDetails(
                            withdrawal
                        );


                    const requestedAt =
                        formatDate(

                            withdrawal?.requested_at ||

                            withdrawal?.requestedAt ||

                            withdrawal?.created_at ||

                            withdrawal?.createdAt

                        );


                    return `
                        <tr>

                            <td>
                                ${escapeHtml(
                                    withdrawalId
                                )}
                            </td>


                            <td>

                                <strong>
                                    ${escapeHtml(
                                        userName
                                    )}
                                </strong>

                                ${
                                    email
                                        ? `<br><small>${escapeHtml(
                                            email
                                        )}</small>`
                                        : ""
                                }

                            </td>


                            <td>
                                ${escapeHtml(
                                    amount
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    method
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    details
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    requestedAt
                                )}
                            </td>


                            <td>
                                <span class="status-badge pending">
                                    Pending
                                </span>
                            </td>


                            <td>

                                <div class="table-actions">

                                    <button
                                        type="button"
                                        class="btn btn-success btn-small"
                                        data-withdrawal-action="approve"
                                        data-withdrawal-id="${escapeHtml(
                                            withdrawalId
                                        )}"
                                    >
                                        Approve
                                    </button>


                                    <button
                                        type="button"
                                        class="btn btn-danger btn-small"
                                        data-withdrawal-action="reject"
                                        data-withdrawal-id="${escapeHtml(
                                            withdrawalId
                                        )}"
                                    >
                                        Reject
                                    </button>

                                </div>

                            </td>

                        </tr>
                    `;

                }
            )
            .join(
                ""
            );

}


/* =========================================================
   LOAD PENDING WITHDRAWALS
   ========================================================= */

async function loadPendingWithdrawals() {

    if (
        withdrawalState.loading
    ) {

        return;

    }


    clearWithdrawalMessage();


    setWithdrawalLoading(
        true
    );


    renderLoadingState();


    try {

        const result =
            await window.apiRequest(
                WITHDRAWAL_API.PENDING,
                {

                    method:
                        "GET"

                }
            );


        const withdrawals =
            extractWithdrawals(
                result
            );


        withdrawalState.withdrawals =
            withdrawals;


        renderWithdrawals(
            withdrawals
        );


    } catch (error) {

        console.error(
            "LOAD WITHDRAWALS ERROR:",
            error
        );


        withdrawalState.withdrawals =
            [];


        renderEmptyState();


        showWithdrawalMessage(

            error.message ||

            "Unable to load withdrawal requests."

        );


    } finally {

        setWithdrawalLoading(
            false
        );

    }

}


/* =========================================================
   FIND WITHDRAWAL
   ========================================================= */

function findWithdrawal(
    withdrawalId
) {

    return withdrawalState.withdrawals.find(
        function (
            withdrawal
        ) {

            return String(
                getWithdrawalId(
                    withdrawal
                )
            ) === String(
                withdrawalId
            );

        }
    );

}


/* =========================================================
   SET ACTION BUTTONS
   ========================================================= */

function setRowActionLoading(
    withdrawalId,
    loading
) {

    document
        .querySelectorAll(
            `[data-withdrawal-id="${CSS.escape(
                String(
                    withdrawalId
                )
            )}"]`
        )
        .forEach(
            function (
                button
            ) {

                button.disabled =
                    loading;

            }
        );

}


/* =========================================================
   APPROVE WITHDRAWAL
   ========================================================= */

async function approveWithdrawal(
    withdrawalId
) {

    const withdrawal =
        findWithdrawal(
            withdrawalId
        );


    if (!withdrawal) {

        showWithdrawalMessage(
            "Withdrawal request not found."
        );

        return;

    }


    const amount =
        formatAmount(

            withdrawal.amount,

            withdrawal.currency ||
            "INR"

        );


    const confirmed =
        window.confirm(
            `Approve withdrawal request of ${amount}?`
        );


    if (!confirmed) {

        return;

    }


    clearWithdrawalMessage();


    setRowActionLoading(
        withdrawalId,
        true
    );


    try {

        const result =
            await window.apiRequest(
                WITHDRAWAL_API.APPROVE(
                    withdrawalId
                ),
                {

                    method:
                        "POST"

                }
            );


        showWithdrawalMessage(

            result?.message ||

            "Withdrawal approved successfully.",

            "success"

        );


        await loadPendingWithdrawals();


    } catch (error) {

        console.error(
            "APPROVE WITHDRAWAL ERROR:",
            error
        );


        showWithdrawalMessage(

            error.message ||

            "Unable to approve withdrawal request."

        );


    } finally {

        setRowActionLoading(
            withdrawalId,
            false
        );

    }

}


/* =========================================================
   REJECT WITHDRAWAL
   ========================================================= */

async function rejectWithdrawal(
    withdrawalId
) {

    const withdrawal =
        findWithdrawal(
            withdrawalId
        );


    if (!withdrawal) {

        showWithdrawalMessage(
            "Withdrawal request not found."
        );

        return;

    }


    const reason =
        window.prompt(
            "Enter rejection reason (optional):"
        );


    /*
    User pressed Cancel
    */

    if (
        reason === null
    ) {

        return;

    }


    const confirmed =
        window.confirm(
            "Are you sure you want to reject this withdrawal request?"
        );


    if (!confirmed) {

        return;

    }


    clearWithdrawalMessage();


    setRowActionLoading(
        withdrawalId,
        true
    );


    try {

        const result =
            await window.apiRequest(
                WITHDRAWAL_API.REJECT(
                    withdrawalId
                ),
                {

                    method:
                        "POST",

                    body: {

                        reason:
                            reason.trim() ||
                            null

                    }

                }
            );


        showWithdrawalMessage(

            result?.message ||

            "Withdrawal rejected successfully.",

            "success"

        );


        await loadPendingWithdrawals();


    } catch (error) {

        console.error(
            "REJECT WITHDRAWAL ERROR:",
            error
        );


        showWithdrawalMessage(

            error.message ||

            "Unable to reject withdrawal request."

        );


    } finally {

        setRowActionLoading(
            withdrawalId,
            false
        );

    }

}


/* =========================================================
   TABLE ACTION EVENTS
   ========================================================= */

function initializeTableActions() {

    document.addEventListener(
        "click",
        async function (
            event
        ) {

            const button =
                event.target.closest(
                    "[data-withdrawal-action]"
                );


            if (!button) {

                return;

            }


            const action =
                button.dataset
                    .withdrawalAction;


            const withdrawalId =
                button.dataset
                    .withdrawalId;


            if (!withdrawalId) {

                return;

            }


            if (
                action === "approve"
            ) {

                await approveWithdrawal(
                    withdrawalId
                );

                return;

            }


            if (
                action === "reject"
            ) {

                await rejectWithdrawal(
                    withdrawalId
                );

            }

        }
    );

}


/* =========================================================
   REFRESH BUTTON
   ========================================================= */

function initializeRefreshButton() {

    const button =
        withdrawalElement(
            "refreshWithdrawals"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        function (
            event
        ) {

            event.preventDefault();

            loadPendingWithdrawals();

        }
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutAdmin() {

    try {

        await window.apiRequest(
            "/api/auth/logout",
            {

                method:
                    "POST"

            }
        );

    } catch (error) {

        console.warn(
            "ADMIN LOGOUT ERROR:",
            error
        );

    } finally {

        if (
            typeof window.clearAuthData ===
            "function"
        ) {

            window.clearAuthData();

        }


        window.location.href =
            "../login.html";

    }

}


/* =========================================================
   LOGOUT BUTTONS
   ========================================================= */

function initializeLogoutButtons() {

    document
        .querySelectorAll(
            "[data-action='logout']"
        )
        .forEach(
            function (
                button
            ) {

                button.addEventListener(
                    "click",
                    function (
                        event
                    ) {

                        event.preventDefault();

                        logoutAdmin();

                    }
                );

            }
        );

}


/* =========================================================
   INITIALIZE PAGE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        /*
        -----------------------------------------------------
        Check admin authentication first
        -----------------------------------------------------
        */

        const isAdmin =
            requireAdmin();


        if (!isAdmin) {

            return;

        }


        /*
        -----------------------------------------------------
        Initialize events
        -----------------------------------------------------
        */

        initializeTableActions();


        initializeRefreshButton();


        initializeLogoutButtons();


        /*
        -----------------------------------------------------
        Load pending withdrawals
        -----------------------------------------------------
        */

        await loadPendingWithdrawals();

    }
);


/* =========================================================
   PUBLIC API
   ========================================================= */

window.SkillEarnAdminWithdrawals = {

    load:
        loadPendingWithdrawals,

    approve:
        approveWithdrawal,

    reject:
        rejectWithdrawal,

    refresh:
        loadPendingWithdrawals

};
