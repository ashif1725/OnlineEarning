# SkillEarn Hub Architecture

## High-Level Architecture

GitHub Repository
        |
        v
Frontend
        |
        | HTTPS API
        v
Secure Backend
        |
        +---- Authentication
        |
        +---- Wallet Service
        |
        +---- Transaction Ledger
        |
        +---- Deposit Service
        |
        +---- Withdrawal Service
        |
        +---- KYC Service
        |
        +---- Marketplace
        |
        +---- Referral Engine
        |
        v
Database

External Payment/KYC Providers
        |
        v
Secure Backend
