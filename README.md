# SkillEarn Hub

> A modern web platform built with Firebase Authentication and Firestore.

SkillEarn Hub is a web-based platform designed with a professional, responsive interface and a scalable Firebase backend.

---

## 🚀 Project Overview

SkillEarn Hub provides a foundation for:

- User Registration
- User Login
- Firebase Authentication
- User Profiles
- Wallet Management
- Deposit Requests
- Withdrawal Requests
- Transaction History
- Admin Dashboard
- User Management
- Wallet Freeze / Unfreeze
- Deposit Approval / Rejection
- Withdrawal Approval / Rejection
- Manual Wallet Management
- Platform Settings
- Transaction Reports

> Wallet, deposit and withdrawal operations must be protected with server-side validation and Firebase Security Rules. Client-side JavaScript should never be treated as a trusted authority for financial balances.

---

# ✨ Current Features

## 👤 User

- Create Account
- Login
- Logout
- User Profile
- Wallet Balance
- Deposit Request
- Withdrawal Request
- Transaction History
- Account Status

---

## 💰 Wallet

The planned wallet system supports:

```text
User
   │
   ├── Deposit Request
   │       │
   │       └── Admin Review
   │               ├── Approve
   │               └── Reject
   │
   └── Withdrawal Request
           │
           └── Admin Review
                   ├── Approve
                   └── Reject

Wallet balances should only be modified through trusted backend logic and appropriate security controls.

---

🛠️ Technology Stack

Frontend

- HTML5
- CSS3
- JavaScript
- Responsive Design

Backend / Services

- Firebase Authentication
- Firebase Firestore

Hosting

- GitHub Pages

---

📁 Project Structure

skillEarnhub/
│
├── index.html
├── login.html
├── register.html
│
├── admin/
│   ├── index.html
│   ├── users.html
│   ├── deposits.html
│   ├── withdrawals.html
│   └── settings.html
│
├── css/
│   ├── style.css
│   ├── auth.css
│   ├── register.css
│   └── admin.css
│
├── js/
│   ├── firebase-config.js
│   ├── auth.js
│   ├── register.js
│   └── admin.js
│
└── README.md

---

🔥 Firebase Setup

SkillEarn Hub uses Firebase for authentication and database functionality.

1. Create Firebase Project

Open Firebase Console and create a project.

Then add a Web App to the project.

---

2. Enable Authentication

Go to:

Firebase Console
→ Authentication
→ Sign-in method
→ Email/Password

Enable:

Email/Password

---

3. Create Firestore Database

Go to:

Firebase Console
→ Firestore Database
→ Create Database

Choose the appropriate region for your project.

---

🔐 Firebase Configuration

The project uses Firebase Compat SDK.

Example:

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

Do not commit passwords, service-account private keys, private tokens, or other server-side credentials to GitHub.

---

👤 User Data Structure

A basic user document can use:

users/{uid}

Example:

{
    uid: "USER_UID",
    fullName: "User Name",
    email: "user@example.com",
    role: "user",
    walletBalance: 0,
    walletFrozen: false,
    createdAt: serverTimestamp()
}

---

🧑‍💼 Admin System

The planned Admin Panel will provide:

Dashboard

- Total Users
- Active Users
- Pending Deposits
- Pending Withdrawals
- Total Wallet Balance
- Transaction Statistics

Deposit Management

- View pending deposits
- View user details
- View submitted UTR/reference
- Approve deposit
- Reject deposit
- Add rejection reason

Withdrawal Management

- View withdrawal requests
- View UPI/bank details
- Approve withdrawal
- Reject withdrawal
- Add rejection reason

User Management

- Search users
- View user profile
- View wallet history
- Freeze account
- Unfreeze account

Wallet Management

- Manual credit
- Manual debit
- Wallet transaction history

All privileged operations should be authorized through secure backend controls.

---

🏦 Deposit Flow

The planned deposit flow:

User
  ↓
Select Deposit
  ↓
View Admin Payment Details
  ↓
Complete Payment Externally
  ↓
Submit UTR / Reference
  ↓
Deposit = Pending
  ↓
Admin Reviews
  ↓
Approve / Reject

A deposit should not automatically increase the wallet merely because a user submits a UTR.

---

💸 Withdrawal Flow

The planned withdrawal flow:

User
  ↓
Enter Withdrawal Amount
  ↓
Enter UPI / Bank Details
  ↓
Submit Request
  ↓
Withdrawal = Pending
  ↓
Admin Reviews
  ↓
Approve / Reject

The backend should validate the available balance and prevent duplicate or unauthorized withdrawals.

---

🔒 Security

Security is a core requirement of SkillEarn Hub.

Important Rules

Never trust values supplied by the browser for:

- Wallet balance
- Deposit approval
- Withdrawal approval
- Admin role
- Transaction status
- User permissions

These values must be validated using trusted backend logic and Firebase Security Rules.

---

🛡️ Admin Security

Admin access should not be granted simply because a browser sends:

role: "admin"

Admin authorization should be enforced using trusted mechanisms such as:

- Firebase Authentication
- Firebase Security Rules
- Custom Claims where appropriate
- Trusted server-side functions
- Auditable transaction records

---

📊 Transaction Records

A transaction record can contain:

transactions/{transactionId}

Example:

{
    userId: "USER_UID",
    type: "deposit",
    amount: 100,
    status: "pending",
    reference: "REFERENCE_ID",
    createdAt: serverTimestamp()
}

For production use, transaction creation and balance changes should be handled atomically by trusted backend code.

---

🌐 GitHub Pages

The project can be hosted using GitHub Pages.

Go to:

GitHub Repository
→ Settings
→ Pages
→ Build and deployment
→ Deploy from a branch

Select:

Branch: main
Folder: / (root)

Save the configuration.

---

📱 Responsive Design

SkillEarn Hub is designed to support:

- Mobile
- Tablet
- Desktop

The interface should remain usable across different screen sizes.

---

🧪 Development Checklist

Before production deployment:

- [ ] Registration works
- [ ] Login works
- [ ] Logout works
- [ ] Firebase Authentication configured
- [ ] Firestore configured
- [ ] Firestore Security Rules tested
- [ ] Admin authorization secured
- [ ] Wallet operations protected
- [ ] Deposit approval protected
- [ ] Withdrawal approval protected
- [ ] Duplicate transactions prevented
- [ ] Error handling implemented
- [ ] Mobile layout tested
- [ ] GitHub Pages deployment tested

---

⚠️ Production Security Notice

This project is a web application and should not be considered production-ready merely because the frontend works.

For any system involving real money or financial transactions, implement:

- Trusted server-side authorization
- Secure transaction processing
- Strong Firestore Security Rules
- Admin authentication
- Audit logs
- Idempotency / duplicate-request protection
- Input validation
- Rate limiting
- Proper payment-provider verification
- Appropriate legal and regulatory compliance

Do not use client-side JavaScript as the authority for financial balances.

---

📌 Development Roadmap

Phase 1

- [x] Project structure
- [x] Homepage
- [x] Register page
- [ ] Login page
- [ ] Authentication state

Phase 2

- [ ] User dashboard
- [ ] Profile
- [ ] Wallet UI
- [ ] Transaction history

Phase 3

- [ ] Deposit request system
- [ ] Withdrawal request system
- [ ] Admin dashboard

Phase 4

- [ ] Secure admin authorization
- [ ] Transaction audit logs
- [ ] Backend validation
- [ ] Security Rules

Phase 5

- [ ] Reports
- [ ] Platform settings
- [ ] Notifications
- [ ] Production testing

---

📄 License

This project is currently under development.

Add an appropriate open-source or private-project license before public distribution.

---

👨‍💻 Development

SkillEarn Hub is being developed as a modular web application so that authentication, user features, wallet functionality and administration can be maintained separately.

---

Status

Development — Active

SkillEarn Hub
Learn • Earn • Grow
