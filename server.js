const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
});

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ Connected to NFT_Theft_database!');
});

// API 1 — Summary Stats
app.get('/api/stats', (req, res) => {
  const queries = {
    totalReports: 'SELECT COUNT(*) AS count FROM THEFT_REPORT',
    activeInvestigations: "SELECT COUNT(*) AS count FROM INVESTIGATION WHERE Status='Active'",
    totalWallets: 'SELECT COUNT(*) AS count FROM SUSPICIOUS_WALLET',
    resolvedCases: 'SELECT COUNT(*) AS count FROM RESOLUTION'
  };

  const results = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  for (const [key, query] of Object.entries(queries)) {
    db.query(query, (err, rows) => {
      if (err) {
        console.error(`Error in ${key}:`, err.message);
        return res.status(500).json({ error: err.message });
      }
      results[key] = rows[0].count;
      completed++;
      if (completed === total) res.json(results);
    });
  }
});

// API 2 — Theft Report Status Count
app.get('/api/theft-status', (req, res) => {
  db.query('SELECT Status AS name, COUNT(*) AS value FROM THEFT_REPORT GROUP BY Status', (err, results) => {
    if (err) {
      console.error('theft-status error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// API 3 — Platform Reports Count
app.get('/api/platform-reports', (req, res) => {
  db.query(`SELECT p.Name AS platform, COUNT(tr.Report_ID) AS reports 
            FROM PLATFORM p 
            JOIN THEFT_REPORT tr ON p.Platform_ID = tr.Platform_ID 
            GROUP BY p.Name ORDER BY reports DESC LIMIT 10`, (err, results) => {
    if (err) {
      console.error('platform-reports error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// API 4 — Wallet Risk Levels
app.get('/api/wallet-risks', (req, res) => {
  db.query('SELECT Risk_Level AS name, COUNT(*) AS value FROM SUSPICIOUS_WALLET GROUP BY Risk_Level', (err, results) => {
    if (err) {
      console.error('wallet-risks error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// API 5 — Resolution Outcomes
app.get('/api/resolutions', (req, res) => {
  db.query('SELECT Outcome AS outcome, COUNT(*) AS value FROM RESOLUTION GROUP BY Outcome', (err, results) => {
    if (err) {
      console.error('resolutions error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// API 6 — Investigator Workload
app.get('/api/investigator-workload', (req, res) => {
  db.query(`SELECT i.Name AS name, 
            COUNT(ia.Investigation_ID) AS cases,
            SUM(CASE WHEN inv.Status='Active' THEN 1 ELSE 0 END) AS active,
            i.Expertise AS expertise
            FROM INVESTIGATOR i
            LEFT JOIN INVESTIGATION_ASSIGNMENT ia ON i.Investigator_ID = ia.Investigator_ID
            LEFT JOIN INVESTIGATION inv ON ia.Investigation_ID = inv.Investigation_ID
            GROUP BY i.Investigator_ID, i.Name, i.Expertise
            ORDER BY cases DESC LIMIT 10`, (err, results) => {
    if (err) {
      console.error('investigator-workload error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// API 7 — Suspicious Wallets List
app.get('/api/wallets', (req, res) => {
  db.query(`SELECT Wallet_ID AS id, Address AS address, Risk_Level AS risk, 
            Status AS status, First_Flagged AS flagged, Last_Activity AS lastActivity 
            FROM SUSPICIOUS_WALLET 
            ORDER BY FIELD(Risk_Level,'Critical','High','Medium','Low') LIMIT 50`, (err, results) => {
    if (err) {
      console.error('wallets error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// API 8 — Recent Transactions
app.get('/api/transactions', (req, res) => {
  db.query(`SELECT t.Transaction_ID AS id, t.Artwork_ID AS artwork, 
            sw.Address AS wallet, sw.Risk_Level AS risk,
            t.Amount AS amount, DATE(t.Timestamp) AS time
            FROM TRANSACTION t
            JOIN SUSPICIOUS_WALLET sw ON t.Wallet_ID = sw.Wallet_ID
            ORDER BY t.Timestamp DESC LIMIT 20`, (err, results) => {
    if (err) {
      console.error('transactions error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});