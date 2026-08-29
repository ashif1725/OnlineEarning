/* =========================================================
   SKILLEARN HUB
   WITHDRAWAL SYSTEM
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeWithdrawPage();

    }
);


/* =========================================================
   FIREBASE SERVICES
   ========================================================= */

const withdrawAuth = firebase.auth();
const withdrawDb = firebase.firestore();


/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;

let walletBalance = 0;

let selectedMethod = "upi";

let withdrawalDetailsVerified = false;


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeWithdrawPage() {

    setupMethodSelection();

    setupVerifyButton();

    setupWithdrawButton();

    withdrawAuth.onAuthStateChanged(
        async (user) => {

            if (!user) {

                window.location.href =
                    "login.html";

                return;
            }

            currentUser = user;

            await loadWallet();

            await loadWithdrawalHistory();

        }
    );
}


/* =========================================================
   METHOD SELECTION
   ========================================================= */

function setupMethodSelection() {

    const methodInputs =
        document.querySelectorAll(
            'input[name="withdrawMethod"]'
        );

    methodInputs.forEach(
        (input) => {

            input.addEventListener(
                "change",
                () => {

                    selectedMethod =
                        input.value;

                    withdrawalDetailsVerified =
                        false;

                    updateMethodUI();

                    resetVerification();

                }
            );

        }
    );

    updateMethodUI();
}


/* =========================================================
   UPDATE METHOD UI
   ========================================================= */

function updateMethodUI() {

    const upiForm =
        document.getElementById(
            "upiForm"
        );

    const bankForm =
        document.getElementById(
            "bankForm"
        );

    const upiOption =
        document.getElementById(
            "upiOption"
        );

    const bankOption =
        document.getElementById(
            "bankOption"
        );


    if (selectedMethod === "upi") {

        upiForm.style.display =
            "block";

        bankForm.style.display =
            "none";

        upiOption.classList.add(
            "selected"
        );

        bankOption.classList.remove(
            "selected"
        );

    } else {

        upiForm.style.display =
            "none";

        bankForm.style.display =
            "block";

        upiOption.classList.remove(
            "selected"
        );

        bankOption.classList.add(
            "selected"
        );
    }
}


/* =========================================================
   LOAD WALLET
   ========================================================= */

async function loadWallet() {

    if (!currentUser) {
        return;
    }

    try {

        const userRef =
            withdrawDb
            .collection("users")
            .doc(currentUser.uid);

        const snapshot =
            await userRef.get();

        if (!snapshot.exists) {

            walletBalance = 0;

            updateWalletUI();

            return;
        }

        const data =
            snapshot.data();

        walletBalance =
            Number(
                data.walletBalance ||
                data.balance ||
                0
            );

        if (
            !Number.isFinite(
                walletBalance
            )
        ) {

            walletBalance = 0;

        }

        updateWalletUI();

    } catch (error) {

        console.error(
            "Wallet loading error:",
            error
        );

        walletBalance = 0;

        updateWalletUI();

        showMessage(
            "Unable to load wallet balance.",
            "error"
        );
    }
}


/* =========================================================
   WALLET UI
   ========================================================= */

function updateWalletUI() {

    const balanceElement =
        document.getElementById(
            "walletBalance"
        );

    if (!balanceElement) {
        return;
    }

    balanceElement.textContent =
        formatMoney(walletBalance);
}


/* =========================================================
   VERIFY BUTTON
   ========================================================= */

function setupVerifyButton() {

    const button =
        document.getElementById(
            "verifyBtn"
        );

    button.addEventListener(
        "click",
        async () => {

            button.disabled = true;

            button.textContent =
                "Checking...";

            try {

                const details =
                    getWithdrawalDetails();

                validateWithdrawalDetails(
                    details
                );


                /*
                 IMPORTANT:

                 This frontend does NOT pretend that
                 a bank/UPI name has been verified.

                 Real verification requires an
                 authorized payment provider API
                 running on a trusted backend.
                */


                showVerificationMessage(
                    "Details entered successfully. Final bank/UPI name verification must be completed through your authorized payment provider.",
                    false
                );

                /*
                 For development/demo purposes,
                 mark the form as ready.

                 In production, only set this to true
                 after your backend confirms verification.
                */

                withdrawalDetailsVerified =
                    true;

                document
                    .getElementById(
                        "withdrawBtn"
                    )
                    .disabled = false;

            } catch (error) {

                console.error(error);

                withdrawalDetailsVerified =
                    false;

                showVerificationMessage(
                    error.message ||
                    "Please check your details.",
                    true
                );

                document
                    .getElementById(
                        "withdrawBtn"
                    )
                    .disabled = true;

            } finally {

                button.disabled = false;

                button.textContent =
                    "Verify Withdrawal Details";

            }

        }
    );
}


/* =========================================================
   GET WITHDRAWAL DETAILS
   ========================================================= */

function getWithdrawalDetails() {

    if (
        selectedMethod ===
        "upi"
    ) {

        const upiId =
            document
            .getElementById(
                "upiId"
            )
            .value
            .trim()
            .toLowerCase();

        return {
            type: "upi",
            upiId: upiId
        };
    }


    const accountName =
        document
        .getElementById(
            "accountName"
        )
        .value
        .trim();

    const accountNumber =
        document
        .getElementById(
            "accountNumber"
        )
        .value
        .trim();

    const confirmAccountNumber =
        document
        .getElementById(
            "confirmAccountNumber"
        )
        .value
        .trim();

    const ifsc =
        document
        .getElementById(
            "ifsc"
        )
        .value
        .trim()
        .toUpperCase();


    return {

        type: "bank",

        accountHolderName:
            accountName,

        accountNumber:
            accountNumber,

        confirmAccountNumber:
            confirmAccountNumber,

        ifsc:
            ifsc
    };
}


/* =========================================================
   VALIDATE DETAILS
   ========================================================= */

function validateWithdrawalDetails(
    details
) {

    if (
        details.type ===
        "upi"
    ) {

        if (!details.upiId) {

            throw new Error(
                "Please enter your UPI ID."
            );
        }


        /*
         Basic format check only.
         This does NOT verify ownership.
        */

        const upiPattern =
            /^[a-zA-Z0-9._-]{2,}@[a-zA-Z0-9._-]{2,}$/;


        if (
            !upiPattern.test(
                details.upiId
            )
        ) {

            throw new Error(
                "Please enter a valid UPI ID."
            );
        }

        return;
    }


    if (
        !details.accountHolderName
    ) {

        throw new Error(
            "Please enter account holder name."
        );
    }


    if (
        !/^[0-9]{9,18}$/.test(
            details.accountNumber
        )
    ) {

        throw new Error(
            "Please enter a valid bank account number."
        );
    }


    if (
        details.accountNumber !==
        details.confirmAccountNumber
    ) {

        throw new Error(
            "Bank account numbers do not match."
        );
    }


    if (
        !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
            details.ifsc
        )
    ) {

        throw new Error(
            "Please enter a valid IFSC code."
        );
    }
}


/* =========================================================
   VERIFICATION MESSAGE
   ========================================================= */

function showVerificationMessage(
    message,
    isError
) {

    const box =
        document.getElementById(
            "verificationBox"
        );

    box.textContent =
        message;

    box.style.display =
        "block";

    box.classList.toggle(
        "success",
        !isError
    );
}


/* =========================================================
   RESET VERIFICATION
   ========================================================= */

function resetVerification() {

    const box =
        document.getElementById(
            "verificationBox"
        );

    box.style.display =
        "none";

    box.textContent = "";

    box.classList.remove(
        "success"
    );

    const withdrawButton =
        document.getElementById(
            "withdrawBtn"
        );

    withdrawButton.disabled =
        true;
}


/* =========================================================
   WITHDRAW BUTTON
   ========================================================= */

function setupWithdrawButton() {

    const button =
        document.getElementById(
            "withdrawBtn"
        );

    button.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                showMessage(
                    "Please login first.",
                    "error"
                );

                return;
            }


            if (
                !withdrawalDetailsVerified
            ) {

                showMessage(
                    "Please verify your withdrawal details first.",
                    "error"
                );

                return;
            }


            const amount =
                Number(
                    document
                    .getElementById(
                        "withdrawAmount"
                    )
                    .value
                );


            if (
                !Number.isFinite(
                    amount
                ) ||
                amount <= 0
            ) {

                showMessage(
                    "Please enter a valid withdrawal amount.",
                    "error"
                );

                return;
            }


            if (
                amount >
                walletBalance
            ) {

                showMessage(
                    "Withdrawal amount is greater than your available wallet balance.",
                    "error"
                );

                return;
            }


            button.disabled =
                true;

            button.textContent =
                "Submitting...";


            try {

                const details =
                    getWithdrawalDetails();

                validateWithdrawalDetails(
                    details
                );


                /*
                 IMPORTANT SECURITY:

                 Do NOT deduct walletBalance
                 from frontend.

                 The backend/Cloud Function
                 should perform the actual
                 balance check and deduction
                 atomically.
                */


                const withdrawalData = {

                    userId:
                        currentUser.uid,

                    userEmail:
                        currentUser.email ||
                        "",

                    amount:
                        amount,

                    method:
                        details.type,

                    status:
                        "pending",

                    verificationStatus:
                        "pending_provider_verification",

                    createdAt:
                        firebase.firestore
                        .FieldValue
                        .serverTimestamp(),

                    updatedAt:
                        firebase.firestore
                        .FieldValue
                        .serverTimestamp()

                };


                /*
                 Store only the necessary
                 withdrawal destination data.

                 For bank accounts, avoid exposing
                 the full account number in UI.
                */

                if (
                    details.type ===
                    "upi"
                ) {

                    withdrawalData.upiId =
                        details.upiId;

                } else {

                    withdrawalData.accountHolderName =
                        details.accountHolderName;

                    withdrawalData.accountNumberLast4 =
                        details.accountNumber
                        .slice(-4);

                    withdrawalData.ifsc =
                        details.ifsc;

                    /*
                     Full account number should
                     preferably be sent only to
                     your trusted backend/provider,
                     not stored openly in Firestore.
                    */
                }


                await withdrawDb
                    .collection(
                        "withdrawals"
                    )
                    .add(
                        withdrawalData
                    );


                showMessage(
                    "Withdrawal request submitted successfully. It is pending verification and processing.",
                    "success"
                );


                document
                    .getElementById(
                        "withdrawAmount"
                    )
                    .value = "";


                resetVerification();


                await loadWithdrawalHistory();

            } catch (error) {

                console.error(
                    "Withdrawal error:",
                    error
                );

                showMessage(
                    getFriendlyError(
                        error
                    ),
                    "error"
                );

            } finally {

                button.disabled =
                    !withdrawalDetailsVerified;

                button.textContent =
                    "Submit Withdrawal Request";

            }

        }
    );
}


/* =========================================================
   LOAD WITHDRAWAL HISTORY
   ========================================================= */

async function loadWithdrawalHistory() {

    const container =
        document.getElementById(
            "withdrawalHistory"
        );

    if (!container) {
        return;
    }


    if (!currentUser) {

        container.innerHTML =
            '<div class="empty">Please login.</div>';

        return;
    }


    try {

        const snapshot =
            await withdrawDb
            .collection(
                "withdrawals"
            )
            .where(
                "userId",
                "==",
                currentUser.uid
            )
            .get();


        if (
            snapshot.empty
        ) {

            container.innerHTML =
                '<div class="empty">No withdrawal requests yet.</div>';

            return;
        }


        const withdrawals =
            [];


        snapshot.forEach(
            (documentSnapshot) => {

                withdrawals.push({
                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()
                });

            }
        );


        withdrawals.sort(
            (a, b) => {

                const aTime =
                    getTimestampValue(
                        a.createdAt
                    );

                const bTime =
                    getTimestampValue(
                        b.createdAt
                    );

                return bTime - aTime;

            }
        );


        container.innerHTML =
            withdrawals
            .slice(0, 20)
            .map(
                renderWithdrawal
            )
            .join("");


    } catch (error) {

        console.error(
            "History error:",
            error
        );

        container.innerHTML =
            '<div class="empty">Unable to load withdrawal history.</div>';
    }
}


/* =========================================================
   RENDER WITHDRAWAL
   ========================================================= */

function renderWithdrawal(
    withdrawal
) {

    const status =
        String(
            withdrawal.status ||
            "pending"
        ).toLowerCase();


    const amount =
        formatMoney(
            Number(
                withdrawal.amount ||
                0
            )
        );


    const method =
        withdrawal.method === "bank"
            ? "🏦 Bank Account"
            : "📱 UPI";


    const destination =
        withdrawal.method === "upi"

            ? escapeHtml(
                withdrawal.upiId ||
                "UPI"
            )

            : `Account ending ****${escapeHtml(
                withdrawal.accountNumberLast4 ||
                ""
            )}`;


    const date =
        formatDate(
            withdrawal.createdAt
        );


    return `

        <div class="withdrawal-item">

            <div class="withdrawal-top">

                <div>

                    <div class="withdrawal-amount">
                        ${amount}
                    </div>

                    <div class="withdrawal-meta">
                        ${method}
                    </div>

                </div>

                <span class="withdrawal-status ${escapeHtml(
                    status
                )}">
                    ${escapeHtml(
                        capitalize(status)
                    )}
                </span>

            </div>

            <div class="withdrawal-meta">
                ${destination}
            </div>

            <div class="withdrawal-meta">
                Requested: ${date}
            </div>

            ${
                withdrawal.rejectionReason
                    ? `
                        <div class="withdrawal-meta">
                            Reason:
                            ${escapeHtml(
                                withdrawal.rejectionReason
                            )}
                        </div>
                    `
                    : ""
            }

        </div>

    `;
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    message,
    type = "error"
) {

    const box =
        document.getElementById(
            "withdrawMessage"
        );

    if (!box) {
        return;
    }

    box.textContent =
        message;

    box.className =
        "message " + type;

    box.style.display =
        "block";


    setTimeout(
        () => {

            box.style.display =
                "none";

        },
        5000
    );
}


/* =========================================================
   MONEY
   ========================================================= */

function formatMoney(
    amount
) {

    const value =
        Number(amount || 0);

    return (
        "₹" +
        value.toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        )
    );
}


/* =========================================================
   DATE
   ========================================================= */

function formatDate(
    timestamp
) {

    if (!timestamp) {
        return "—";
    }


    try {

        let date;


        if (
            typeof timestamp.toDate ===
            "function"
        ) {

            date =
                timestamp.toDate();

        } else if (
            timestamp instanceof Date
        ) {

            date =
                timestamp;

        } else {

            return "—";

        }


        return date.toLocaleString(
            "en-IN"
        );

    } catch {

        return "—";
    }
}


/* =========================================================
   TIMESTAMP VALUE
   ========================================================= */

function getTimestampValue(
    timestamp
) {

    if (!timestamp) {
        return 0;
    }


    try {

        if (
            typeof timestamp.toMillis ===
            "function"
        ) {

            return timestamp.toMillis();

        }


        if (
            typeof timestamp.toDate ===
            "function"
        ) {

            return timestamp
                .toDate()
                .getTime();

        }

    } catch {

        return 0;
    }


    return 0;
}


/* =========================================================
   CAPITALIZE
   ========================================================= */

function capitalize(
    value
) {

    const text =
        String(value || "");

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
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
   FRIENDLY FIREBASE ERROR
   ========================================================= */

function getFriendlyError(
    error
) {

    if (!error) {
        return "Something went wrong.";
    }


    if (
        error.code ===
        "permission-denied"
    ) {

        return (
            "You do not have permission to submit a withdrawal request."
        );
    }


    if (
        error.code ===
        "unauthenticated"
    ) {

        return (
            "Your login session has expired. Please login again."
        );
    }


    return (
        error.message ||
        "Unable to submit withdrawal request."
    );
}
