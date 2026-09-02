"use strict";

/*
|--------------------------------------------------------------------------
| SkillEarn Hub
| Send Money Frontend Module
|--------------------------------------------------------------------------
|
| STEP 7
|
| This file handles:
|
| - Authentication check
| - Recipient validation
| - Amount validation
| - Quick amount buttons
| - Transfer form
| - Confirmation before transfer
| - Safe API request preparation
| - Logout
|
| IMPORTANT:
| Real money transfer is NOT performed here.
| STEP 8 will connect this form to the secure
| backend transaction endpoint.
|
|--------------------------------------------------------------------------
*/


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeSendMoney
);


/* =========================================================
   INITIALIZE SEND MONEY PAGE
========================================================= */

async function initializeSendMoney() {

    setupQuickAmounts();

    setupForm();

    setupLogout();

    loadSignedInUser();

    /*
     * Verify current login session.
     *
     * We do not trust localStorage alone.
     */

    await verifyAuthentication();
}


/* =========================================================
   AUTHENTICATION CHECK
========================================================= */

async function verifyAuthentication() {

    /*
     * If the existing auth system is available,
     * ask the backend for the current user.
     */

    if (
        typeof window.SkillEarnAuth !== "undefined" &&
        typeof window.SkillEarnAuth.getCurrentUser === "function"
    ) {

        try {

            const user =
                await window.SkillEarnAuth.getCurrentUser();


            if (user) {

                renderAccount(user);

                return;
            }

        } catch (error) {

            console.warn(
                "Authentication verification failed:",
                error
            );
        }
    }


    /*
     * Fallback to saved user information.
     *
     * This does NOT perform a money transaction.
     */

    const savedUser =
        typeof window.getSavedUser === "function"
            ? window.getSavedUser()
            : null;


    if (savedUser) {

        renderAccount(savedUser);

        return;
    }


    /*
     * No authenticated account.
     */

    redirectToLogin();
}


/* =========================================================
   LOAD SIGNED-IN USER
========================================================= */

function loadSignedInUser() {

    if (
        typeof window.getSavedUser !== "function"
    ) {
        return;
    }


    const user =
        window.getSavedUser();


    if (user) {

        renderAccount(user);
    }
}


/* =========================================================
   RENDER ACCOUNT
========================================================= */

function renderAccount(user) {

    if (!user) {
        return;
    }


    const fullName =
        user.fullName ||
        user.full_name ||
        user.name ||
        "User";


    const userId =
        user.publicUserId ||
        user.public_user_id ||
        user.userId ||
        user.id ||
        "—";


    const email =
        user.email ||
        "—";


    setText(
        "accountName",
        fullName
    );


    setText(
        "accountUserId",
        userId
    );


    setText(
        "accountEmail",
        email
    );
}


/* =========================================================
   SAFE TEXT
========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    element.textContent =
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
            ? String(value)
            : "—";
}


/* =========================================================
   QUICK AMOUNT BUTTONS
========================================================= */

function setupQuickAmounts() {

    const buttons =
        document.querySelectorAll(
            ".quick-amount"
        );


    if (!buttons.length) {
        return;
    }


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const amount =
                        button.dataset.amount;


                    const input =
                        document.getElementById(
                            "amount"
                        );


                    if (!input) {
                        return;
                    }


                    input.value =
                        amount;


                    clearFieldError(
                        "amount"
                    );


                    input.focus();
                }
            );
        }
    );
}


/* =========================================================
   FORM SETUP
========================================================= */

function setupForm() {

    const form =
        document.getElementById(
            "sendMoneyForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        handleSendMoney
    );


    /*
     * Remove errors while typing.
     */

    const recipient =
        document.getElementById(
            "recipient"
        );


    if (recipient) {

        recipient.addEventListener(
            "input",
            function () {

                clearFieldError(
                    "recipient"
                );
            }
        );
    }


    const amount =
        document.getElementById(
            "amount"
        );


    if (amount) {

        amount.addEventListener(
            "input",
            function () {

                clearFieldError(
                    "amount"
                );
            }
        );
    }


    const note =
        document.getElementById(
            "note"
        );


    if (note) {

        note.addEventListener(
            "input",
            function () {

                clearFieldError(
                    "note"
                );
            }
        );
    }
}


/* =========================================================
   FORM VALIDATION
========================================================= */

function validateTransferForm() {

    clearAllErrors();


    const recipientInput =
        document.getElementById(
            "recipient"
        );


    const amountInput =
        document.getElementById(
            "amount"
        );


    const noteInput =
        document.getElementById(
            "note"
        );


    const recipient =
        recipientInput
            ? recipientInput.value.trim()
            : "";


    const amountRaw =
        amountInput
            ? amountInput.value.trim()
            : "";


    const note =
        noteInput
            ? noteInput.value.trim()
            : "";


    let valid = true;


    /* =====================================================
       RECIPIENT
    ===================================================== */

    if (!recipient) {

        setFieldError(
            "recipient",
            "Please enter the recipient User ID or email."
        );

        valid = false;

    } else if (recipient.length < 3) {

        setFieldError(
            "recipient",
            "Recipient details are too short."
        );

        valid = false;

    } else if (recipient.length > 160) {

        setFieldError(
            "recipient",
            "Recipient details are too long."
        );

        valid = false;
    }


    /* =====================================================
       AMOUNT
    ===================================================== */

    if (!amountRaw) {

        setFieldError(
            "amount",
            "Please enter an amount."
        );

        valid = false;

    } else {

        const amount =
            Number(amountRaw);


        if (!Number.isFinite(amount)) {

            setFieldError(
                "amount",
                "Please enter a valid amount."
            );

            valid = false;

        } else if (amount <= 0) {

            setFieldError(
                "amount",
                "Amount must be greater than zero."
            );

            valid = false;

        } else if (amount > 1000000) {

            setFieldError(
                "amount",
                "Amount exceeds the current limit."
            );

            valid = false;

        } else {

            /*
             * Currency precision.
             *
             * Do not allow more than two decimal places.
             */

            const decimalPart =
                amountRaw.includes(".")
                    ? amountRaw.split(".")[1]
                    : "";


            if (
                decimalPart &&
                decimalPart.length > 2
            ) {

                setFieldError(
                    "amount",
                    "Amount can contain maximum 2 decimal places."
                );

                valid = false;
            }
        }
    }


    /* =====================================================
       NOTE
    ===================================================== */

    if (note.length > 120) {

        setFieldError(
            "note",
            "Note cannot exceed 120 characters."
        );

        valid = false;
    }


    return {
        valid,
        data: {
            recipient,
            amount:
                Number(amountRaw),
            note
        }
    };
}


/* =========================================================
   HANDLE SEND MONEY
========================================================= */

async function handleSendMoney(event) {

    event.preventDefault();


    const validation =
        validateTransferForm();


    if (!validation.valid) {
        return;
    }


    const data =
        validation.data;


    /*
     * Confirmation step.
     *
     * This is NOT the actual transfer.
     * It prepares the user for STEP 8 backend confirmation.
     */

    const confirmed =
        window.confirm(
            "Please verify the recipient and amount before continuing.\n\n" +
            "Recipient: " +
            data.recipient +
            "\n" +
            "Amount: ₹" +
            formatAmount(data.amount) +
            "\n\n" +
            "Continue?"
        );


    if (!confirmed) {
        return;
    }


    /*
     * STEP 8 BACKEND API NOT YET AVAILABLE.
     */

    showMessage(
        "info",
        "Transfer form is ready. The secure server-side transfer API will be connected in STEP 8."
    );


    /*
     * Keep the button enabled because no transaction
     * has actually been submitted.
     */

    return;
}


/* =========================================================
   FORMAT AMOUNT
========================================================= */

function formatAmount(amount) {

    if (
        !Number.isFinite(amount)
    ) {
        return "0.00";
    }


    return amount.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(type, message) {

    const element =
        document.getElementById(
            "sendMoneyMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message || "";


    element.classList.remove(
        "show",
        "success",
        "error",
        "info"
    );


    if (message) {

        element.classList.add(
            "show",
            type || "info"
        );
    }
}


/* =========================================================
   FIELD ERROR
========================================================= */

function setFieldError(
    fieldId,
    message
) {

    const errorElement =
        document.getElementById(
            fieldId + "Error"
        );


    const input =
        document.getElementById(
            fieldId
        );


    if (errorElement) {

        errorElement.textContent =
            message || "";
    }


    if (input) {

        if (message) {

            input.classList.add(
                "input-error"
            );

            input.setAttribute(
                "aria-invalid",
                "true"
            );

        } else {

            input.classList.remove(
                "input-error"
            );

            input.removeAttribute(
                "aria-invalid"
            );
        }
    }
}


/* =========================================================
   CLEAR FIELD ERROR
========================================================= */

function clearFieldError(fieldId) {

    setFieldError(
        fieldId,
        ""
    );
}


/* =========================================================
   CLEAR ALL ERRORS
========================================================= */

function clearAllErrors() {

    clearFieldError(
        "recipient"
    );

    clearFieldError(
        "amount"
    );

    clearFieldError(
        "note"
    );


    showMessage(
        "info",
        ""
    );
}


/* =========================================================
   LOGOUT SETUP
========================================================= */

function setupLogout() {

    const button =
        document.getElementById(
            "logoutButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        handleLogout
    );
}


/* =========================================================
   LOGOUT
========================================================= */

async function handleLogout() {

    const button =
        document.getElementById(
            "logoutButton"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Logging out...";
    }


    try {

        /*
         * Use existing auth system.
         */

        if (
            typeof window.SkillEarnAuth !== "undefined" &&
            typeof window.SkillEarnAuth.logout === "function"
        ) {

            await window.SkillEarnAuth.logout();

            return;
        }


        /*
         * Fallback logout request.
         */

        const url =
            typeof window.apiUrl === "function"
                ? window.apiUrl(
                    "/api/auth/logout"
                )
                : "https://skillearnhub-1.onrender.com/api/auth/logout";


        await fetch(
            url,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Accept":
                        "application/json"
                }
            }
        );

    } catch (error) {

        console.warn(
            "Logout request failed:",
            error
        );

    } finally {

        /*
         * Clear local data.
         */

        if (
            typeof window.clearAuthData ===
            "function"
        ) {

            window.clearAuthData();

        } else {

            localStorage.removeItem(
                "skillearn_access_token"
            );

            localStorage.removeItem(
                "skillearn_user"
            );

            sessionStorage.removeItem(
                "skillEarnUser"
            );
        }


        redirectToLogin();
    }
}


/* =========================================================
   REDIRECT LOGIN
========================================================= */

function redirectToLogin() {

    window.location.href =
        "../login.html";
}
