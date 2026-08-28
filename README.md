# 🚀 SkillEarn Hub

SkillEarn Hub is a modern digital learning and online earning platform.

The platform is designed to provide users with:

- Digital skill courses
- Course enrollment
- User dashboard
- Digital products
- Referral system
- Affiliate opportunities
- User profile
- Payment integration
- Earning dashboard
- Firebase authentication
- Google authentication
- Secure user data management

---

# 📌 Project Overview

SkillEarn Hub allows users to create an account, login securely, explore courses and digital products, and access earning-related features.

The project uses Firebase Authentication and Firestore for user authentication and database functionality.

---

# ✨ Main Features

## 🔐 Authentication

The platform supports:

- Email & Password Registration
- Email & Password Login
- Google Login
- Forgot Password
- Logout
- Authentication state checking
- Protected dashboard pages

---

# 👤 User Features

After creating an account, users can access:

- Personal Dashboard
- Profile
- Courses
- Course Details
- Earnings
- Referral
- Affiliate
- Store
- Payment

---

# 🎓 Courses

Users can:

- Browse available courses
- View course details
- Check course information
- View course pricing
- Enroll in courses after successful payment

### Important

Course enrollment should only be confirmed after payment has been successfully verified.

The browser/client should NOT be trusted to confirm a payment.

---

# 💰 Earning System

The platform can support legitimate earning features such as:

- Referral rewards
- Affiliate commissions
- Digital product sales
- Course-related commissions
- Wallet balance
- Earning history

All earning amounts should be calculated and verified by a trusted backend/server-side system.

Never rely only on JavaScript running in the user's browser for financial calculations.

---

# 🤝 Referral System

Users can have a unique referral link.

Example:

    https://your-domain.com/register.html?ref=USER123

A referral system can track:

- Referral ID
- Referred user
- Referral status
- Eligible commission
- Commission history

Referral rewards should only be credited after the required qualifying action has been verified.

---

# 🛒 Digital Store

The Store section can contain:

- E-books
- Templates
- Digital guides
- Courses
- Other legitimate digital products

Products should be delivered only after successful payment verification.

---

# 💳 Payment System

The payment page is intended to handle course/product purchases.

Recommended payment flow:

1. User selects a course/product.
2. User must be logged in.
3. User starts checkout.
4. Payment provider processes payment.
5. Server verifies payment.
6. Order is marked as paid.
7. Course/product access is granted.
8. Referral/affiliate commission is calculated if applicable.

## Security Rule

Never mark an order as "paid" based only on:

    payment=success

or a value stored in:

    localStorage

or:

    sessionStorage

Payment status must be verified using the payment provider's server-side verification/webhook system.

---

# 🔥 Firebase

The project uses Firebase for authentication and database services.

Firebase services currently used:

- Firebase Authentication
- Firebase Firestore
- Google Authentication

---

# 🔑 Firebase Authentication

The authentication system supports:

### Email Registration

Users provide:

- Full name
- Email
- Password
- Confirm password

### Email Login

Users provide:

- Email
- Password

### Google Authentication

Users can authenticate using their Google account.

### Password Reset

Users can request a password reset email.

---

# 🗄️ Firestore Database

A recommended user document structure is:

    users/{uid}

Example:

```json
{
  "uid": "USER_UID",
  "name": "User Name",
  "email": "user@example.com",
  "photoURL": "",
  "role": "user",
  "walletBalance": 0,
  "totalEarnings": 0,
  "referralEarnings": 0,
  "referralCount": 0,
  "coursesEnrolled": 0,
  "createdAt": "server timestamp",
  "updatedAt": "server timestamp"
}
