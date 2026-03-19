const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0
});

pool.getConnection().then(() => {
  console.log('✅ Connected to NFT_Theft_database!');
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
});

async function query(sql, values) {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } finally {
    connection.release();
  }
}

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.get('/api/stats', async (req, res) => {
  try {
    const queries = {
      totalReports: 'SELECT COUNT(*) AS count FROM THEFT_REPORT',
      activeInvestigations: "SELECT COUNT(*) AS count FROM INVESTIGATION WHERE Status='Active'",
      totalWallets: 'SELECT COUNT(*) AS count FROM SUSPICIOUS_WALLET',
      resolvedCases: 'SELECT COUNT(*) AS count FROM RESOLUTION'
    };
    const results = {};
    for (const [key, sql] of Object.entries(queries)) {
      const rows = await query(sql);
      results[key] = rows[0].count;
    }
    res.json(results);
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/theft-status', async (req, res) => {
  try {
    const results = await query('SELECT Status AS name, COUNT(*) AS value FROM THEFT_REPORT GROUP BY Status');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/platform-reports', async (req, res) => {
  try {
    const results = await query(`SELECT p.Name AS platform, COUNT(tr.Report_ID) AS reports 
      FROM PLATFORM p JOIN THEFT_REPORT tr ON p.Platform_ID = tr.Platform_ID 
      GROUP BY p.Name ORDER BY reports DESC LIMIT 10`);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/wallet-risks', async (req, res) => {
  try {
    const results = await query('SELECT Risk_Level AS name, COUNT(*) AS value FROM SUSPICIOUS_WALLET GROUP BY Risk_Level');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/resolutions', async (req, res) => {
  try {
    const results = await query('SELECT Outcome AS outcome, COUNT(*) AS value FROM RESOLUTION GROUP BY Outcome');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/investigator-workload', async (req, res) => {
  try {
    const results = await query(`SELECT i.Name AS name, 
      COUNT(ia.Investigation_ID) AS cases,
      SUM(CASE WHEN inv.Status='Active' THEN 1 ELSE 0 END) AS active,
      i.Expertise AS expertise
      FROM INVESTIGATOR i
      LEFT JOIN INVESTIGATION_ASSIGNMENT ia ON i.Investigator_ID = ia.Investigator_ID
      LEFT JOIN INVESTIGATION inv ON ia.Investigation_ID = inv.Investigation_ID
      GROUP BY i.Investigator_ID, i.Name, i.Expertise
      ORDER BY cases DESC LIMIT 10`);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/wallets', async (req, res) => {
  try {
    const results = await query(`SELECT Wallet_ID AS id, Address AS address, Risk_Level AS risk, 
      Status AS status, First_Flagged AS flagged, Last_Activity AS lastActivity 
      FROM SUSPICIOUS_WALLET 
      ORDER BY FIELD(Risk_Level,'Critical','High','Medium','Low') LIMIT 50`);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const results = await query(`SELECT t.Transaction_ID AS id, t.Artwork_ID AS artwork, 
      sw.Address AS wallet, sw.Risk_Level AS risk,
      t.Amount AS amount, DATE(t.Timestamp) AS time
      FROM TRANSACTION t
      JOIN SUSPICIOUS_WALLET sw ON t.Wallet_ID = sw.Wallet_ID
      ORDER BY t.Timestamp DESC LIMIT 20`);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
