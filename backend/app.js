const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { pool, query } = require('./db');
const { runChecks } = require('./dataQuality');
const { createCasesRouter } = require('./cases');

const app = express();
// Behind Vercel's proxy: use the visitor's IP (for rate limiting), not the proxy's.
app.set('trust proxy', 1);

// Only the dashboard may call the API from a browser. Override with a comma-separated CORS_ORIGINS.
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://nft-theft-tracker.vercel.app,http://localhost:3000')
  .split(',')
  .map(origin => origin.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10kb' }));

// Wraps a route so a failed query reaches the error handler instead of crashing the request.
const route = handler => (req, res, next) => handler(req, res).catch(next);

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.get('/health', route(async (req, res) => {
  await query('SELECT 1');
  res.json({ status: 'ok', database: 'connected' });
}));

app.get('/api/stats', route(async (req, res) => {
  const [reports, investigations, wallets, resolved, transactions] = await Promise.all([
    query('SELECT COUNT(*) AS count FROM THEFT_REPORT'),
    query("SELECT COUNT(*) AS count FROM INVESTIGATION WHERE Status='Active'"),
    query('SELECT COUNT(*) AS count FROM SUSPICIOUS_WALLET'),
    query('SELECT COUNT(*) AS count FROM RESOLUTION'),
    query('SELECT COUNT(*) AS count FROM TRANSACTION')
  ]);
  res.json({
    totalReports: reports[0].count,
    activeInvestigations: investigations[0].count,
    totalWallets: wallets[0].count,
    resolvedCases: resolved[0].count,
    totalTransactions: transactions[0].count
  });
}));

app.get('/api/theft-status', route(async (req, res) => {
  res.json(await query('SELECT Status AS name, COUNT(*) AS value FROM THEFT_REPORT GROUP BY Status'));
}));

app.get('/api/platform-reports', route(async (req, res) => {
  res.json(await query(`SELECT p.Name AS platform, COUNT(tr.Report_ID) AS reports
    FROM PLATFORM p JOIN THEFT_REPORT tr ON p.Platform_ID = tr.Platform_ID
    GROUP BY p.Name ORDER BY reports DESC LIMIT 10`));
}));

app.get('/api/wallet-risks', route(async (req, res) => {
  res.json(await query('SELECT Risk_Level AS name, COUNT(*) AS value FROM SUSPICIOUS_WALLET GROUP BY Risk_Level'));
}));

app.get('/api/resolutions', route(async (req, res) => {
  res.json(await query('SELECT Outcome AS outcome, COUNT(*) AS value FROM RESOLUTION GROUP BY Outcome'));
}));

app.get('/api/investigator-workload', route(async (req, res) => {
  res.json(await query(`SELECT i.Name AS name,
    COUNT(ia.Investigation_ID) AS cases,
    SUM(CASE WHEN inv.Status='Active' THEN 1 ELSE 0 END) AS active,
    i.Expertise AS expertise
    FROM INVESTIGATOR i
    LEFT JOIN INVESTIGATION_ASSIGNMENT ia ON i.Investigator_ID = ia.Investigator_ID
    LEFT JOIN INVESTIGATION inv ON ia.Investigation_ID = inv.Investigation_ID
    GROUP BY i.Investigator_ID, i.Name, i.Expertise
    ORDER BY cases DESC LIMIT 10`));
}));

app.get('/api/wallets', route(async (req, res) => {
  res.json(await query(`SELECT Wallet_ID AS id, Address AS address, Risk_Level AS risk,
    Status AS status, First_Flagged AS flagged, Last_Activity AS lastActivity
    FROM SUSPICIOUS_WALLET
    ORDER BY FIELD(Risk_Level,'Critical','High','Medium','Low') LIMIT 50`));
}));

app.get('/api/transactions', route(async (req, res) => {
  res.json(await query(`SELECT t.Transaction_ID AS id, t.Artwork_ID AS artwork,
    sw.Address AS wallet, sw.Risk_Level AS risk,
    t.Amount AS amount, DATE(t.Timestamp) AS time
    FROM TRANSACTION t
    JOIN SUSPICIOUS_WALLET sw ON t.Wallet_ID = sw.Wallet_ID
    ORDER BY t.Timestamp DESC LIMIT 20`));
}));

// The checks scan every table, so cache the report briefly instead of rerunning them on each visit.
let qualityCache = { report: null, expires: 0 };
app.get('/api/data-quality', route(async (req, res) => {
  if (Date.now() > qualityCache.expires) {
    qualityCache = { report: await runChecks(query), expires: Date.now() + 60_000 };
  }
  res.json(qualityCache.report);
}));

// Writes change what the checks would find, so they clear the cached report.
app.use('/api', createCasesRouter({ onWrite: () => { qualityCache.expires = 0; } }));

// Log the real error but never send database details to the client.
app.use((err, req, res, next) => {
  // Client mistakes (bad input, wrong case state) get a clear message; anything else stays generic.
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body is not valid JSON' });
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message, ...(err.details && { details: err.details }) });
  }
  console.error(`${req.method} ${req.path} failed:`, err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = { app, pool };
