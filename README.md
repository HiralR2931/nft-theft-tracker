# 🔍 NFT Theft Tracker — Forensics Database System

A full-stack system for tracking, investigating and resolving NFT theft cases: a normalized 16-table MySQL database, an Express REST API, and a React dashboard for running cases end to end.

🌐 **Live demo:** https://nft-theft-tracker.vercel.app

[![CI](https://github.com/HiralR2931/nft-theft-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/HiralR2931/nft-theft-tracker/actions/workflows/ci.yml)

---

## 📌 Overview

NFT theft is a growing problem in digital art. Artists lose ownership of their work through unauthorized minting, plagiarism and wallet fraud. This system provides:

- A relational database for theft reports, investigations, evidence and resolutions
- **Case management**: file a report, open an investigation, add evidence and resolve the case, with every step validated and written in one transaction
- **Data-quality monitoring**: 34 automated checks for referential integrity, completeness, validity and consistency
- **Behavioral wallet risk scores** built with SQL window functions, plus a review queue of wallets whose assigned risk level understates their behavior
- Investigator assignment and workload tracking, and a dashboard that visualizes all of it

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
│   ├── app.js               # Read routes and error handling
│   ├── cases.js             # Case lifecycle write endpoints
│   ├── dataQuality.js       # Data-quality checks
│   ├── riskScore.js         # Wallet risk scoring
│   ├── db.js                # MySQL connection pool and transaction helper
│   ├── server.js            # Starts the API as a regular server (local, Docker)
│   ├── test/                # Jest + Supertest integration tests
│   └── .env.example         # Required environment variables
├── frontend/                # React dashboard (Create React App + Recharts)
│   ├── src/App.js           # Dashboard shell and overview tabs
│   ├── src/CasesTab.js      # Case management forms
│   ├── src/DataQualityTab.js
│   ├── src/RiskScorePanel.js
│   └── .env.example
├── .github/workflows/ci.yml # Tests on every push and pull request
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
| `GET /api/data-quality` | Results of every data-quality check, with a summary score |
| `GET /api/wallets/risk-scores` | Behavioral risk score and factor breakdown for every wallet |
| `GET /api/options` | Artworks, platforms, investigators and allowed values for the forms |
| `GET /api/reports` | Recent cases, filterable with `?status=` and `?limit=` |
| `GET /api/reports/:id` | One case with its investigation, team, evidence and resolution |
| `POST /api/reports` | File a theft report (`artworkId`, `platformId`, `description`, `stolenUrl`) |
| `POST /api/reports/:id/investigation` | Open an investigation (`priority`, `leadInvestigatorId`, `notes`) |
| `POST /api/reports/:id/evidence` | Add evidence (`type`, `description`, `url`) |
| `POST /api/reports/:id/resolution` | Resolve the case (`outcome`, `actionTaken`, `notes`) |

- **Writes** run in a single transaction and check that the case is in the right state, returning `409` if not, e.g. a case can't be resolved before it's investigated. Report, investigation and resolution statuses always move together, and the lead investigator signs off the resolution.
- **Validation** uses zod and returns `400` with the problem for each field.
- **Abuse limits:** the demo is public, so writes are rate limited per visitor (`WRITE_RATE_LIMIT`, default 30 per 15 minutes). `WRITES_ENABLED=false` makes the API read-only.
- **Errors:** database errors are logged on the server and never sent to clients, and CORS only allows the dashboard's origin.

## 🧪 Data Quality

`GET /api/data-quality` runs 34 checks, each counting the rows that break a rule:

| Category | Examples |
|---|---|
| Referential integrity | One check per foreign key, discovered from `information_schema` so new tables are covered automatically |
| Completeness | Reports without a link to the stolen NFT, transactions without an amount |
| Validity | Future report dates, reports filed before the artwork existed |
| Consistency | Open reports with an investigation, resolutions on active cases, investigations without exactly one lead |

The checks currently flag 5 issues, all in the original hand-written sample rows (IDs 001–010). The generated data passes every check.

## 🎯 Wallet Risk Score

Each wallet gets a 0–100 score from its transaction behavior. A CTE aggregates each wallet's activity, and `PERCENT_RANK()` turns each factor into a percentile, so counts, ETH amounts and days can be weighted and added:

| Factor | Weight |
|---|---|
| Distinct reported-stolen artworks the wallet transacted | 30% |
| Total value moved | 25% |
| Largest single transaction | 15% |
| Number of transactions | 15% |
| How recently it was active | 15% |

Scores map to levels (Critical 75+, High 55–74, Medium 35–54, Low under 35), which are compared with each wallet's assigned risk level. Wallets that behave two or more levels riskier than assigned go to a review queue. In the seed data only about a quarter of assigned levels match behavior, because the generator assigned them at random, so the comparison catches those mislabels.

## ✅ Testing

```bash
docker compose up -d db                     # MySQL with seed data on localhost:3307
cd backend && DB_HOST=127.0.0.1 DB_PORT=3307 DB_USER=nft DB_PASSWORD=nft_local_only \
  DB_NAME=NFT_Theft_Database npm test
cd frontend && npm test
```

- **Backend:** 40 integration tests (Jest + Supertest) against real MySQL. They cover every read endpoint, the full case lifecycle, invalid input and wrong-state errors, rate limiting, CORS, error hiding, the data-quality checks and the risk-score math.
- **Frontend:** React Testing Library tests for the overview, filing a case and the Data Quality tab.
- **CI:** GitHub Actions runs both on every push and pull request, builds the dashboard, and fails if `03_bulk_data.sql` no longer matches its generator.

## 🎨 Dashboard

| Tab | Contents |
|---|---|
| **Overview** | Stat cards, theft-status pie chart, platform bar chart, resolution outcomes, wallet risk distribution |
| **Cases** | File a report, then open an investigation, add evidence and resolve it; filterable list of recent cases |
| **Investigations** | Investigator workload chart and roster with load indicators |
| **Wallets** | Behavioral risk scores by factor, review queue, assigned-vs-behavior matrix, wallet registry |
| **Transactions** | Recent suspicious transactions and amount-by-artwork chart |
| **Data Quality** | Quality score, pass rate by category, and every check with failures first |

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
| Backend | Node.js, Express, mysql2, zod, express-rate-limit |
| Frontend | React 19, Recharts |
| Data generation | Python |
| Testing and CI | Jest, Supertest, React Testing Library, GitHub Actions |
| Local environment | Docker Compose, nginx |
| Hosting | Vercel (dashboard + serverless API), Aiven (MySQL) |

## 👤 Author

Hiral Rana. Originally built for IE6700 Data Management for Analytics at Northeastern University.

## 📄 License

For educational purposes.
