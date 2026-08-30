# SkillEarn Hub

SkillEarn Hub is a production-oriented digital wallet,
digital marketplace and earning platform.

## Core Modules

- User Authentication
- User Profile
- Digital Wallet
- Internal Transfers
- Receive Money
- User QR Identity
- Deposits
- Withdrawals
- Bank Accounts
- KYC
- Transaction Ledger
- Digital Products
- Courses
- Marketplace
- Seller Accounts
- Referral Rewards
- Notifications
- Support
- Admin Panel
- Reports
- Audit Logs
- Security Center

## Architecture

The project separates:

1. Frontend
2. Backend/API
3. Database
4. Payment/KYC providers
5. Administration

Financial operations are server-side.

Client-side JavaScript must never be treated as
the source of truth for wallet balances or transaction authorization.

## Security Principles

- HTTPS
- Server-side authorization
- Secure authentication
- TOTP 2FA
- Wallet PIN
- Role-based access control
- Rate limiting
- Audit logging
- Transaction idempotency
- Webhook verification
- Secure secret management

## Development

Frontend files are located in the root and `assets/`
directories.

Backend services will be implemented separately
and connected through authenticated APIs.
