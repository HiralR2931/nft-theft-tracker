# 🔍 NFT Theft Tracker — Forensics Database System

A full-stack system for tracking, investigating and resolving NFT theft cases: a normalized 16-table MySQL database, an Express REST API, and a React dashboard for monitoring cases.

🌐 **Live demo:** https://nft-theft-tracker.vercel.app

---

## 📌 Overview

NFT theft is a growing problem in digital art. Artists lose ownership of their work through unauthorized minting, plagiarism and wallet fraud. This system provides:

- A relational database for theft reports, investigations, evidence and resolutions
- Suspicious-wallet tracking with risk-level classification
- Investigator assignment and workload tracking
- A REST API and dashboard that visualize the case data

## 🏗️ Architecture

```
React dashboard  ──/api/*──▶  Express API (serverless function)  ──TLS──▶  MySQL 8 (Aiven)
    frontend/                    backend/ + api/                        database/
└──────────────── one Vercel project ────────────────┘
```

## 🗂️ Repository Structure

```
nft-theft-tracker/
├── api/index.js             # Vercel serverless entry point for the API
├── backend/                 # Node.js + Express REST API
│   ├── app.js               # API routes and MySQL connection pool
│   ├── server.js            # Starts the API as a regular server (local, Docker)
│   └── .env.example         # Required environment variables
├── frontend/                # React dashboard (Create React App + Recharts)
│   ├── src/App.js           # Dashboard UI
│   └── .env.example
├── database/
│   ├── 01_schema.sql            # Creates the database and all 16 tables
│   ├── 02_sample_data.sql       # 10 hand-written rows per table
│   ├── 03_bulk_data.sql         # ~5,000 generated rows (do not edit by hand)
│   ├── generate_bulk_data.py    # Generates 03_bulk_data.sql
│   └── queries.sql              # Analytical queries
├── docker-compose.yml       # Runs database, API and dashboard together
├── vercel.json              # Vercel build and routing config
└── README.md
```

## 🗄️ Database Schema

16 tables in three logical groups, plus junction tables.

**Core entities:** `ARTIST`, `ARTWORK`, `NFT_COLLECTION`, `COLLECTOR`, `PLATFORM`

**Theft & investigation:** `THEFT_REPORT`, `INVESTIGATION`, `INVESTIGATOR`, `EVIDENCE`, `RESOLUTION`

**Tracking:** `SUSPICIOUS_WALLET`, `TRANSACTION`

**Junction tables:** `COLLECTION_ARTWORK`, `COLLECTOR_OWNERSHIP`, `INVESTIGATION_ASSIGNMENT`, `PLATFORM_REPORTS`

Integrity is enforced with primary and foreign keys (`ON DELETE RESTRICT` / `CASCADE`), `UNIQUE` constraints on wallet addresses, IPFS hashes and transaction hashes, and `CHECK` constraints on status, risk-level and date fields.

### Seed data

`database/generate_bulk_data.py` produces about 5,000 rows across all 16 tables from a fixed seed, so the output is the same every run. It loads with foreign-key checks on, so a broken reference fails the load. The data also follows the case lifecycle:

- Theft reports come after the artwork was created, and the reporter is the artwork's artist
- Open reports have no investigation; resolved and closed reports have a completed investigation and a resolution
- Each resolution is signed off by the lead investigator on that case
- A wallet's last activity matches its most recent transaction, and each artwork has at most one current owner

To regenerate it: `python3 database/generate_bulk_data.py`

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

### Quick start with Docker

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
docker compose up --build
```

This starts MySQL with the schema and seed data loaded, the API and the dashboard. On the first run the database takes about a minute to load.

- Dashboard: http://localhost:3000
- API: http://localhost:5001/api/stats
- MySQL: `localhost:3307`, user `nft`, password `nft_local_only` (local container only)

Stop it with `Ctrl + C`. To reload the seed data from scratch, run `docker compose down -v` and start it again.

### Manual setup

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

The dashboard and API deploy together as one **Vercel** project, and the database runs on **Aiven for MySQL**.

- `vercel.json` builds the dashboard and routes `/api/*` and `/health` to the Express app in `api/index.js`. Because both share one domain, the dashboard calls the API with relative URLs and needs no CORS setup.
- Every push to `main` deploys to production, and every pull request gets its own preview URL.
- Set these environment variables in the Vercel project: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL_CA` (Aiven's CA certificate) and `DB_CONNECTION_LIMIT=2`.
- Load the database once with the three `database/` files, the same way as in the manual setup.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Database | MySQL 8 |
| Backend | Node.js, Express, mysql2 |
| Frontend | React 19, Recharts |
| Data generation | Python |
| Local environment | Docker Compose, nginx |
| Hosting | Vercel (dashboard + serverless API), Aiven (MySQL) |

## 👤 Author

Hiral Rana. Originally built for IE6700 Data Management for Analytics at Northeastern University.

## 📄 License

For educational purposes.
