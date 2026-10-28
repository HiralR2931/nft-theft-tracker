# 🔍 NFT Theft Tracker — Forensics Database System

A full-stack system for tracking, investigating and resolving NFT theft cases: a normalized 16-table MySQL database, an Express REST API, and a React dashboard for monitoring cases.

🌐 **Live demo:** https://hiralr2931.github.io/nft-theft-tracker

---

## 📌 Overview

NFT theft is a growing problem in digital art. Artists lose ownership of their work through unauthorized minting, plagiarism and wallet fraud. This system provides:

- A relational database for theft reports, investigations, evidence and resolutions
- Suspicious-wallet tracking with risk-level classification
- Investigator assignment and workload tracking
- A REST API and dashboard that visualize the case data

## 🏗️ Architecture

```
React dashboard (GitHub Pages)  ──HTTP/JSON──▶  Express API (Railway)  ──SQL──▶  MySQL 8
        frontend/                                    backend/                    database/
```

## 🗂️ Repository Structure

```
nft-theft-tracker/
├── backend/                 # Node.js + Express REST API
│   ├── server.js            # API routes and MySQL connection pool
│   ├── railway.json         # Railway deploy config
│   └── .env.example         # Required environment variables
├── frontend/                # React dashboard (Create React App + Recharts)
│   ├── src/App.js           # Dashboard UI
│   └── .env.example
├── database/
│   ├── 01_schema.sql        # Creates the database and all 16 tables
│   ├── 02_sample_data.sql   # 10 hand-written rows per table
│   ├── 03_bulk_data.sql     # ~3,600 generated rows for realistic volume
│   └── queries.sql          # Analytical queries
└── README.md
```

## 🗄️ Database Schema

16 tables in three logical groups, plus junction tables.

**Core entities:** `ARTIST`, `ARTWORK`, `NFT_COLLECTION`, `COLLECTOR`, `PLATFORM`

**Theft & investigation:** `THEFT_REPORT`, `INVESTIGATION`, `INVESTIGATOR`, `EVIDENCE`, `RESOLUTION`

**Tracking:** `SUSPICIOUS_WALLET`, `TRANSACTION`

**Junction tables:** `COLLECTION_ARTWORK`, `COLLECTOR_OWNERSHIP`, `INVESTIGATION_ASSIGNMENT`, `PLATFORM_REPORTS`

Integrity is enforced with primary and foreign keys (`ON DELETE RESTRICT` / `CASCADE`), `UNIQUE` constraints on wallet addresses, IPFS hashes and transaction hashes, and `CHECK` constraints on status, risk-level and date fields.

```
ARTIST ──< ARTWORK >── COLLECTION_ARTWORK >── NFT_COLLECTION
  │            │
  │            └──< THEFT_REPORT >── INVESTIGATION >── INVESTIGATION_ASSIGNMENT
  │                      │                  │                    │
  │                   PLATFORM          EVIDENCE            INVESTIGATOR
  │                      │
  │                   RESOLUTION
  │
COLLECTOR >── COLLECTOR_OWNERSHIP
SUSPICIOUS_WALLET ──< TRANSACTION >── ARTWORK
PLATFORM >── PLATFORM_REPORTS >── THEFT_REPORT
```

## 📊 Analytical Queries

`database/queries.sql` covers a range of SQL techniques:

| Technique | Question answered |
|---|---|
| Filtering | Which artists are verified? |
| Aggregation | Average, max and min transaction amount per wallet |
| Inner join | Which investigator resolved which case? |
| Join with condition | Which artworks were transferred most often before being stolen? |
| Non-correlated subquery | Which wallets receive above-average total value? |
| Correlated subquery | How many times was each artwork transferred? |
| `>= ALL` | The highest-value transaction for each artwork |
| `NOT EXISTS` | Artists who have never had a theft report |
| `UNION` | Wallets tied to stolen artwork or high-value transfers |
| Nested subqueries | Artists with more artworks than average |
| Left join | All resolutions with their investigator |
| `CASE` + left join | Stolen artworks and whether they were investigated |

## 🔌 REST API

| Endpoint | Returns |
|---|---|
| `GET /health` | API and database status |
| `GET /api/stats` | Total reports, active investigations, flagged wallets, resolved cases |
| `GET /api/theft-status` | Theft reports by status |
| `GET /api/platform-reports` | Top 10 platforms by number of reports |
| `GET /api/wallet-risks` | Suspicious wallets by risk level |
| `GET /api/resolutions` | Resolutions by outcome |
| `GET /api/investigator-workload` | Top 10 investigators by caseload |
| `GET /api/wallets` | 50 highest-risk wallets |
| `GET /api/transactions` | 20 most recent suspicious transactions |

Queries run through a MySQL connection pool, and the dashboard's stat queries run in parallel. Database errors are logged on the server and never sent to clients, and CORS only allows the dashboard's origin.

## 🎨 Dashboard

| Tab | Contents |
|---|---|
| **Overview** | Stat cards, theft-status pie chart, platform bar chart, resolution outcomes, wallet risk distribution |
| **Investigations** | Investigator workload chart and roster with load indicators |
| **Wallets** | Suspicious-wallet registry and risk breakdown |
| **Transactions** | Recent suspicious transactions and amount-by-artwork chart |

## 🚀 Running Locally

**Prerequisites:** Node.js 18+, MySQL 8+

### 1. Database

```bash
mysql -u root -p < database/01_schema.sql
mysql -u root -p < database/02_sample_data.sql
mysql -u root -p < database/03_bulk_data.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env    # then fill in your MySQL credentials
npm install
npm start               # http://localhost:5001
```

### 3. Frontend

```bash
cd frontend
npm install
npm start               # http://localhost:3000, uses the API at http://localhost:5001
```

Set `REACT_APP_API_URL` in `frontend/.env` to point the dashboard at a different API.

## ☁️ Deployment

- **Backend:** Railway, with the service root directory set to `backend/`. Set the `DB_*` variables (and optionally `CORS_ORIGINS`) in Railway.
- **Frontend:** GitHub Pages. `cd frontend && npm run deploy` builds against the Railway API and publishes to the `gh-pages` branch.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Database | MySQL 8 |
| Backend | Node.js, Express, mysql2 |
| Frontend | React 19, Recharts |
| Hosting | Railway (API + MySQL), GitHub Pages (dashboard) |

## 👤 Author

Hiral Rana. Originally built for IE6700 Data Management for Analytics at Northeastern University.

## 📄 License

For educational purposes.
