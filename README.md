# 🔍 NFT Theft Tracker — Forensics Database System

A full-stack forensics database system for tracking, investigating, and resolving NFT theft cases. Built with a normalized MySQL relational database, advanced SQL features (views, stored procedures, triggers), and an interactive React dashboard for real-time case monitoring.

---
🌐 Live Demo
👉 https://hiralr2931.github.io/nft-theft-tracker


## 📌 Project Overview

NFT theft is a growing problem in the digital art space — artists lose ownership of their work through unauthorized minting, plagiarism, and wallet fraud. This system provides:

- A structured database to record theft reports, investigations, and resolutions
- Suspicious wallet tracking with risk-level classification
- Investigator assignment and workload management
- An interactive forensics dashboard to visualize all case data

---

## 🗂️ Project Structure

```
nft-theft-tracker/
├── NFT.sql                  # Database schema (all 16 tables)
├── NFT_data.sql             # Seed data (CSV imports)
├── MYSQL_Queries.sql        # Core analytical queries (10 queries)
├── NFT_Advanced_SQL.sql     # Views, Stored Procedures, Triggers
├── nft-dashboard/           # React frontend dashboard
│   └── src/
│       └── App.js           # Main dashboard component
└── README.md
```

---

## 🗄️ Database Schema

The database contains **16 tables** organized across 3 logical layers:

### Core Entities
| Table | Description |
|---|---|
| `ARTIST` | Registered NFT artists with verification status |
| `ARTWORK` | Individual NFT artworks with IPFS hash |
| `NFT_COLLECTION` | Collections of NFTs per artist |
| `COLLECTOR` | NFT buyers/owners with reputation scores |
| `PLATFORM` | NFT marketplaces (OpenSea, Rarible, etc.) |

### Theft & Investigation
| Table | Description |
|---|---|
| `THEFT_REPORT` | Filed theft cases linked to artwork & platform |
| `INVESTIGATION` | Investigations opened per theft report |
| `INVESTIGATOR` | Assigned forensic investigators |
| `EVIDENCE` | Digital evidence collected per case |
| `RESOLUTION` | Final outcome of resolved cases |

### Tracking & Transactions
| Table | Description |
|---|---|
| `SUSPICIOUS_WALLET` | Flagged wallets with risk classification |
| `TRANSACTION` | Blockchain transactions linked to suspicious wallets |

### Junction Tables
| Table | Description |
|---|---|
| `COLLECTION_ARTWORK` | Many-to-many: collections ↔ artworks |
| `COLLECTOR_OWNERSHIP` | Ownership history per collector |
| `INVESTIGATION_ASSIGNMENT` | Investigator assignments per case |
| `PLATFORM_REPORTS` | Reports filed per platform |

---

## 🔗 Entity Relationship Overview

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

---

## ⚙️ Advanced SQL Features

### Views (5)
| View | Purpose |
|---|---|
| `vw_OpenCases` | All open theft reports with artwork & artist details |
| `vw_HighRiskWallets` | High & critical risk wallets not yet cleared |
| `vw_InvestigatorWorkload` | Active vs completed cases per investigator |
| `vw_FullCaseSummary` | End-to-end case view: report → investigation → resolution |
| `vw_SuspiciousArtworkTransactions` | Artworks linked to high-risk wallet transactions |

### Stored Procedures (4)
| Procedure | Purpose |
|---|---|
| `sp_FileTheftReport` | File a new theft report cleanly |
| `sp_AutoAssignInvestigator` | Auto-assigns the least busy investigator |
| `sp_ResolveCase` | Resolves report, investigation & creates resolution in one call |
| `sp_GetArtistCases` | Fetch all theft cases for a given artist |

### Triggers (4)
| Trigger | Purpose |
|---|---|
| `trg_AutoCreateInvestigation` | Auto-creates investigation when theft report is filed |
| `trg_FlagWalletOnHighActivity` | Escalates wallet risk after 3+ theft-linked transactions |
| `trg_PreventArtistDeletion` | Blocks deletion of artists with open cases |
| `trg_UpdateWalletLastActivity` | Updates wallet last activity on every new transaction |

---

## 📊 Core Analytical Queries

| # | Query | Purpose |
|---|---|---|
| 1 | List Verified Artists | Filter artists by verification status |
| 2 | Artworks per Artist | COUNT aggregation with LEFT JOIN |
| 3 | NFTs per Collection | Collection size aggregation |
| 4 | Platforms with Most Reports | Ranked theft report count per platform |
| 5 | Open vs Resolved Reports | Status distribution analysis |
| 6 | High/Critical Investigations | Priority filtering |
| 7 | Investigator Workload | Case count per investigator |
| 8 | Wallet Risk vs Transaction Value | AVG amount by risk level |
| 9 | Above-Average Transaction Artworks | Subquery with HAVING clause |
| 10 | Full Theft Case Summary | Complex multi-table JOIN |

---

## 🎨 Interactive Dashboard

A React-based forensics dashboard with 4 tabs:

| Tab | Contents |
|---|---|
| **Overview** | Stat cards, theft status pie chart, platform bar chart, resolution outcomes, wallet risk distribution |
| **Investigations** | Investigator workload chart, full roster table with load indicators |
| **Wallets** | Suspicious wallet registry, risk level breakdown chart |
| **Transactions** | Recent suspicious transactions table, amount-by-artwork chart |

---

## 🚀 Setup Instructions

### 1. Database Setup (MySQL Workbench)

```sql
-- Step 1: Create and select the database
CREATE DATABASE NFT_Theft_Database;
USE NFT_Theft_Database;

-- Step 2: Run the schema
-- Open and execute NFT.sql

-- Step 3: Import CSV data
-- Right-click each table in Workbench → Table Data Import Wizard
-- Import each CSV file into its matching table

-- Step 4: Run core queries
-- Open and execute MYSQL_Queries.sql

-- Step 5: Add advanced features
-- Open and execute NFT_Advanced_SQL.sql
```

### 2. Dashboard Setup (React)

**Prerequisites:** Node.js v18+ installed

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/nft-theft-tracker.git
cd nft-theft-tracker/nft-dashboard

# Install dependencies
npm install
npm install recharts

# Start the dashboard
npm start
```

Open your browser at `http://localhost:3000`

---

## 🧪 Testing Stored Procedures

```sql
-- File a new theft report (use a unique Report_ID each time)
CALL sp_FileTheftReport('RPT-TEST-001', 'AWK001', 'ART001', 'PLT001', 'Test theft report', NULL);

-- Auto-assign investigator to a case
CALL sp_AutoAssignInvestigator('INVS001', 'Lead');

-- Resolve a case (use a Report_ID with no existing resolution)
CALL sp_ResolveCase('RES-TEST-001', 'RPT010', 'INV001', 'Recovered', 'NFT taken down', 'Resolved via DMCA');

-- Get all cases for an artist
CALL sp_GetArtistCases('ART001');
```

> ⚠️ Always use a unique ID for each test call. Reports already resolved: RPT001–RPT009, RPT013, RPT015, RPT017, RPT020.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Database | MySQL 8.0 |
| Query Tool | MySQL Workbench |
| Frontend | React 18 |
| Charts | Recharts |
| Styling | Inline CSS + Tailwind utility classes |
| Version Control | Git + GitHub |

---

## 👤 Author

Built as a database systems project demonstrating:
- Relational database design & normalization
- Advanced SQL (views, procedures, triggers)
- Frontend data visualization with React

---

## 📄 License

This project is for educational purposes.
