# Student Grievance Redressal Portal

A blockchain-integrated student grievance redressal system with anonymous reporting, intelligent department routing, community-driven impact scoring, automated escalation, and privacy-aware transparency.

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Client     │────▶│  Server (API)   │────▶│  PostgreSQL  │
│  Vite+React  │     │  Express + Cron │     │   Database   │
└─────────────┘     └────────┬────────┘     └──────────────┘
                             │
                    ┌────────▼────────┐
                    │   Blockchain    │
                    │  Hardhat Node   │
                    │  (Solidity)     │
                    └─────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL running locally
- Git

### 1. Clone & Install

```bash
# Install all dependencies
cd server && npm install
cd ../client && npm install
cd ../blockchain && npm install
```

### 2. Environment Setup

1. Create a PostgreSQL database named `grievance`
2. Configure the server environment:
   ```bash
   cd server
   cp .env.example .env
   ```
3. Update `server/.env` with your DB credentials and AWS keys (if using S3).
4. Push the schema and seed:
   ```bash
   npm run db:push
   npm run seed
   ```

### 3. Start Blockchain Node

```bash
cd blockchain
npx hardhat node                        # Keep running in a terminal
npx hardhat run scripts/deploy.js --network localhost  # Deploy contract
```

### 4. Start Server

```bash
cd server
npm run dev
```

### 5. Start Client

```bash
cd client
npm run dev
```

### Test Credentials (from seed)

| Role       | Email                      | Password |
|------------|----------------------------|----------|
| Student    | student@university.edu     | password |
| Admin      | admin@university.edu       | password |
| Authority  | authority@university.edu   | password |

## Project Structure

```
├── server/                    # Express API server
│   ├── src/
│   │   ├── index.js           # Entry point (dotenv, CORS, rate limiting, logging)
│   │   ├── worker.js          # Cron-based escalation worker
│   │   ├── seed.js            # Database seeding script
│   │   ├── routes/
│   │   │   ├── auth.js        # POST /register, /login
│   │   │   └── complaints.js  # All complaint CRUD + voting + status
│   │   ├── middlewares/
│   │   │   ├── auth.js        # JWT verification + RBAC
│   │   │   └── validate.js    # Input validation for all endpoints
│   │   └── lib/
│   │       ├── db.js          # Prisma client singleton
│   │       └── blockchain.js  # ethers.js contract interaction
│   ├── prisma/
│   │   └── schema.prisma      # Full DB schema
│   └── .env                   # Environment variables
│
├── client/                    # Vite + React SPA
│   └── src/
│       ├── App.jsx            # Router + auth guard
│       ├── context/
│       │   └── AuthContext.jsx # JWT state management
│       ├── components/
│       │   ├── Sidebar.jsx          # Role-aware navigation
│       │   ├── ComplaintCard.jsx     # Card with voting, badges, timeline
│       │   ├── StatsGrid.jsx        # Dashboard stat cards
│       │   ├── SubmitComplaintModal.jsx
│       │   └── EmptyState.jsx
│       ├── pages/
│       │   ├── Login.jsx            # Sign in / Register
│       │   ├── Dashboard.jsx        # Layout shell + nested routing
│       │   ├── PublicDashboard.jsx   # All public complaints (any user)
│       │   ├── SubmitComplaint.jsx   # Student: submit form
│       │   ├── MyComplaints.jsx      # Student: track own complaints
│       │   ├── AdminDashboard.jsx    # Admin: department queue
│       │   ├── AuthorityDashboard.jsx # Authority: all + personal
│       │   ├── EscalatedView.jsx     # Authority: escalated only
│       │   └── AuditLog.jsx          # Authority: audit trail table
│       └── styles/
│           └── global.css           # Design system (glassmorphism)
│
└── blockchain/                # Hardhat project
    ├── contracts/
    │   └── GrievanceRegistry.sol  # Smart contract
    ├── scripts/
    │   └── deploy.js              # Deployment script
    └── hardhat.config.js
```

## API Endpoints

| Method | Endpoint                     | Auth    | Role           |
|--------|------------------------------|---------|----------------|
| POST   | /api/auth/register           | —       | —              |
| POST   | /api/auth/login              | —       | —              |
| GET    | /api/complaints/public       | —       | —              |
| POST   | /api/complaints              | JWT     | Any            |
| GET    | /api/complaints/mine         | JWT     | Any            |
| GET    | /api/complaints/:id          | JWT     | Owner/Authority|
| POST   | /api/complaints/:id/vote     | JWT     | Any            |
| PUT    | /api/complaints/:id/status   | JWT     | Admin/Authority|
| GET    | /api/complaints/department   | JWT     | Admin          |
| GET    | /api/complaints/all          | JWT     | Authority      |
| GET    | /api/complaints/escalated    | JWT     | Any            |
| GET    | /api/complaints/audit-log    | JWT     | Authority      |
| GET    | /api/health                  | —       | —              |

## Database Schema

5 tables: `User`, `Department`, `Complaint`, `Vote`, `EscalationLog`

## Smart Contract

`GrievanceRegistry.sol` — stores complaint hash + IPFS hash + status on-chain. Functions:
- `createComplaint(hashId, ipfsHash)`
- `updateStatus(hashId, status)`
- `escalateComplaint(hashId)`

All actions emit events. No deletion is possible.

## Security Features

- JWT authentication with 24h expiry
- Role-based access control (STUDENT / ADMIN / AUTHORITY)
- Rate limiting (100 req/15min general, 20 req/15min auth)
- Input validation on all endpoints
- Personal complaints hidden from public and general admins
- Blockchain audit trail — immutable

## Escalation Rules

| Severity | SLA Deadline |
|----------|-------------|
| Low      | 5 days      |
| Medium   | 3 days      |
| High     | 2 days      |
| Critical | 24 hours    |

Also escalates when Impact Score ≥ 100.
Impact Score = (Upvotes - Downvotes) × Severity Weight.
