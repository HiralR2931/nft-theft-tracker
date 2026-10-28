// Case lifecycle: file a report -> open an investigation -> add evidence -> resolve.
// Every write runs in one transaction, and the report's status always moves with it.
const express = require('express');
const { z } = require('zod');
const { rateLimit } = require('express-rate-limit');
const { query, transaction } = require('./db');

const OUTCOME_STATUS = { Recovered: 'Resolved', Compensated: 'Resolved', Dismissed: 'Closed', Ongoing: 'Closed' };
const EVIDENCE_TYPES = ['Screenshot', 'Transaction Log', 'Wallet Trace', 'Metadata', 'Smart Contract',
  'Image Comparison', 'Email', 'Legal Document', 'Video Recording'];

const text = max => z.string().trim().min(1).max(max);
const optionalText = max => z.string().trim().max(max).optional().transform(v => v || null);
const optionalUrl = z.union([z.literal(''), z.url().max(200)]).optional().transform(v => v || null);

const schemas = {
  report: z.object({
    artworkId: text(50),
    platformId: text(50),
    description: text(500),
    stolenUrl: optionalUrl
  }),
  investigation: z.object({
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
    leadInvestigatorId: text(50),
    notes: optionalText(1000)
  }),
  evidence: z.object({
    type: z.enum(EVIDENCE_TYPES),
    description: optionalText(1000),
    url: optionalUrl
  }),
  resolution: z.object({
    outcome: z.enum(Object.keys(OUTCOME_STATUS)),
    actionTaken: optionalText(200),
    notes: optionalText(1000)
  })
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function parse(schema, body) {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    const err = new HttpError(400, 'Invalid request');
    err.details = result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }));
    throw err;
  }
  return result.data;
}

// Next ID in a table's sequence, e.g. RPT510 -> RPT511. Locks the rows it reads, so two
// requests in parallel cannot get the same ID.
async function nextId(conn, table, column, prefix) {
  const [rows] = await conn.query(
    `SELECT MAX(CAST(SUBSTRING(${column}, ?) AS UNSIGNED)) AS n FROM ${table} WHERE ${column} LIKE ? FOR UPDATE`,
    [prefix.length + 1, `${prefix}%`]
  );
  return `${prefix}${String((rows[0].n || 0) + 1).padStart(3, '0')}`;
}

async function lockReport(conn, reportId) {
  const [rows] = await conn.query(
    `SELECT tr.Report_ID, tr.Status, i.Investigation_ID, i.Status AS investigationStatus
     FROM THEFT_REPORT tr LEFT JOIN INVESTIGATION i ON i.Report_ID = tr.Report_ID
     WHERE tr.Report_ID = ? FOR UPDATE`,
    [reportId]
  );
  if (!rows.length) throw new HttpError(404, 'Report not found');
  return rows[0];
}

async function getReport(reportId) {
  const [report] = await query(
    `SELECT tr.Report_ID AS id, tr.Status AS status, tr.Report_Date AS reportedAt, tr.Description AS description,
       tr.Stolen_NFT_URL AS stolenUrl, a.Artwork_ID AS artworkId, a.Title AS artwork, ar.Name AS artist,
       p.Platform_ID AS platformId, p.Name AS platform
     FROM THEFT_REPORT tr
     JOIN ARTWORK a ON a.Artwork_ID = tr.Artwork_ID
     JOIN ARTIST ar ON ar.Artist_ID = tr.Reporter_ID
     JOIN PLATFORM p ON p.Platform_ID = tr.Platform_ID
     WHERE tr.Report_ID = ?`,
    [reportId]
  );
  if (!report) return null;

  const [investigation] = await query(
    `SELECT Investigation_ID AS id, Status AS status, Priority AS priority, Start_Date AS startDate,
       End_Date AS endDate, Notes AS notes
     FROM INVESTIGATION WHERE Report_ID = ?`,
    [reportId]
  );
  const [resolution] = await query(
    `SELECT r.Resolution_ID AS id, r.Outcome AS outcome, r.Action_Taken AS actionTaken, r.Notes AS notes,
       r.Resolution_Date AS resolvedOn, i.Name AS resolvedBy
     FROM RESOLUTION r JOIN INVESTIGATOR i ON i.Investigator_ID = r.Resolved_By
     WHERE r.Report_ID = ?`,
    [reportId]
  );
  if (investigation) {
    investigation.team = await query(
      `SELECT i.Investigator_ID AS id, i.Name AS name, ia.Role AS role
       FROM INVESTIGATION_ASSIGNMENT ia JOIN INVESTIGATOR i ON i.Investigator_ID = ia.Investigator_ID
       WHERE ia.Investigation_ID = ? ORDER BY ia.Role = 'Lead' DESC, i.Name`,
      [investigation.id]
    );
    investigation.evidence = await query(
      `SELECT Evidence_ID AS id, Type AS type, Description AS description, URL AS url, Collection_Date AS collectedAt
       FROM EVIDENCE WHERE Case_ID = ? ORDER BY Collection_Date DESC`,
      [investigation.id]
    );
  }
  return { ...report, investigation: investigation || null, resolution: resolution || null };
}

function createCasesRouter({ onWrite = () => {} } = {}) {
  const router = express.Router();
  const route = handler => (req, res, next) => handler(req, res).catch(next);

  // The live demo is public, so writes are rate limited per visitor and can be switched off.
  const writes = [
    (req, res, next) => (process.env.WRITES_ENABLED === 'false'
      ? res.status(403).json({ error: 'Changes are disabled on this deployment' })
      : next()),
    rateLimit({ windowMs: 15 * 60 * 1000, limit: Number(process.env.WRITE_RATE_LIMIT) || 30,
      standardHeaders: 'draft-8', legacyHeaders: false,
      message: { error: 'Too many changes, try again later' } })
  ];
  const write = handler => [...writes, route(async (req, res) => {
    const reportId = await handler(req);
    onWrite();
    res.status(201).json(await getReport(reportId));
  })];

  // Choices for the dashboard's forms
  router.get('/options', route(async (req, res) => {
    const [artworks, platforms, investigators] = await Promise.all([
      query(`SELECT a.Artwork_ID AS id, a.Title AS title, ar.Name AS artist
        FROM ARTWORK a JOIN ARTIST ar ON ar.Artist_ID = a.Artist_ID ORDER BY a.Artwork_ID`),
      query('SELECT Platform_ID AS id, Name AS name FROM PLATFORM ORDER BY Name'),
      query(`SELECT i.Investigator_ID AS id, i.Name AS name, i.Expertise AS expertise,
          COUNT(CASE WHEN inv.Status = 'Active' THEN 1 END) AS activeCases
        FROM INVESTIGATOR i
        LEFT JOIN INVESTIGATION_ASSIGNMENT ia ON ia.Investigator_ID = i.Investigator_ID
        LEFT JOIN INVESTIGATION inv ON inv.Investigation_ID = ia.Investigation_ID
        GROUP BY i.Investigator_ID, i.Name, i.Expertise
        ORDER BY activeCases, i.Name`)
    ]);
    res.json({ artworks, platforms, investigators, evidenceTypes: EVIDENCE_TYPES, outcomes: Object.keys(OUTCOME_STATUS) });
  }));

  router.get('/reports', route(async (req, res) => {
    const status = ['Open', 'Under Investigation', 'Resolved', 'Closed'].includes(req.query.status) ? req.query.status : null;
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    res.json(await query(
      `SELECT tr.Report_ID AS id, tr.Status AS status, tr.Report_Date AS reportedAt, a.Title AS artwork,
         p.Name AS platform, i.Priority AS priority
       FROM THEFT_REPORT tr
       JOIN ARTWORK a ON a.Artwork_ID = tr.Artwork_ID
       JOIN PLATFORM p ON p.Platform_ID = tr.Platform_ID
       LEFT JOIN INVESTIGATION i ON i.Report_ID = tr.Report_ID
       WHERE (? IS NULL OR tr.Status = ?)
       ORDER BY tr.Report_Date DESC, tr.Report_ID DESC
       LIMIT ${limit}`,
      [status, status]
    ));
  }));

  router.get('/reports/:id', route(async (req, res) => {
    const report = await getReport(req.params.id);
    if (!report) throw new HttpError(404, 'Report not found');
    res.json(report);
  }));

  // File a new theft report. The artwork's own artist is recorded as the reporter.
  router.post('/reports', ...write(async req => {
    const body = parse(schemas.report, req.body);
    return transaction(async conn => {
      const [[artwork]] = await conn.query('SELECT Artist_ID FROM ARTWORK WHERE Artwork_ID = ?', [body.artworkId]);
      if (!artwork) throw new HttpError(400, 'Unknown artwork');
      const [[platform]] = await conn.query('SELECT Platform_ID FROM PLATFORM WHERE Platform_ID = ?', [body.platformId]);
      if (!platform) throw new HttpError(400, 'Unknown platform');

      const reportId = await nextId(conn, 'THEFT_REPORT', 'Report_ID', 'RPT');
      await conn.query(
        `INSERT INTO THEFT_REPORT (Report_ID, Artwork_ID, Reporter_ID, Platform_ID, Report_Date, Status, Description, Stolen_NFT_URL)
         VALUES (?, ?, ?, ?, NOW(), 'Open', ?, ?)`,
        [reportId, body.artworkId, artwork.Artist_ID, body.platformId, body.description, body.stolenUrl]
      );
      await conn.query('INSERT INTO PLATFORM_REPORTS (Platform_ID, Report_ID, Report_Date) VALUES (?, ?, CURDATE())',
        [body.platformId, reportId]);
      return reportId;
    });
  }));

  // Open an investigation on an open report and assign its lead investigator.
  router.post('/reports/:id/investigation', ...write(async req => {
    const body = parse(schemas.investigation, req.body);
    return transaction(async conn => {
      const report = await lockReport(conn, req.params.id);
      if (report.Status !== 'Open' || report.Investigation_ID) {
        throw new HttpError(409, 'Only open reports without an investigation can be investigated');
      }
      const [[lead]] = await conn.query('SELECT Investigator_ID FROM INVESTIGATOR WHERE Investigator_ID = ?', [body.leadInvestigatorId]);
      if (!lead) throw new HttpError(400, 'Unknown investigator');

      const investigationId = await nextId(conn, 'INVESTIGATION', 'Investigation_ID', 'INVS');
      await conn.query(
        `INSERT INTO INVESTIGATION (Investigation_ID, Report_ID, Start_Date, Priority, Status, Notes)
         VALUES (?, ?, CURDATE(), ?, 'Active', ?)`,
        [investigationId, report.Report_ID, body.priority, body.notes]
      );
      await conn.query(
        `INSERT INTO INVESTIGATION_ASSIGNMENT (Investigation_ID, Investigator_ID, Assignment_Date, Role)
         VALUES (?, ?, CURDATE(), 'Lead')`,
        [investigationId, body.leadInvestigatorId]
      );
      await conn.query("UPDATE THEFT_REPORT SET Status = 'Under Investigation' WHERE Report_ID = ?", [report.Report_ID]);
      return report.Report_ID;
    });
  }));

  // Attach evidence to a report's active investigation.
  router.post('/reports/:id/evidence', ...write(async req => {
    const body = parse(schemas.evidence, req.body);
    return transaction(async conn => {
      const report = await lockReport(conn, req.params.id);
      if (!report.Investigation_ID || report.investigationStatus === 'Completed') {
        throw new HttpError(409, 'Evidence can only be added to an investigation in progress');
      }
      const evidenceId = await nextId(conn, 'EVIDENCE', 'Evidence_ID', 'EV');
      await conn.query(
        `INSERT INTO EVIDENCE (Evidence_ID, Case_ID, Type, File_Hash, Collection_Date, Description, URL)
         VALUES (?, ?, ?, SHA2(CONCAT(?, NOW(6), RAND()), 256), NOW(), ?, ?)`,
        [evidenceId, report.Investigation_ID, body.type, evidenceId, body.description, body.url]
      );
      return report.Report_ID;
    });
  }));

  // Resolve a case: record the outcome, complete the investigation and close the report.
  router.post('/reports/:id/resolution', ...write(async req => {
    const body = parse(schemas.resolution, req.body);
    return transaction(async conn => {
      const report = await lockReport(conn, req.params.id);
      if (!report.Investigation_ID || report.investigationStatus === 'Completed') {
        throw new HttpError(409, 'Only cases with an investigation in progress can be resolved');
      }
      const [[lead]] = await conn.query(
        "SELECT Investigator_ID FROM INVESTIGATION_ASSIGNMENT WHERE Investigation_ID = ? AND Role = 'Lead' LIMIT 1",
        [report.Investigation_ID]
      );
      if (!lead) throw new HttpError(409, 'The investigation has no lead investigator to sign off');

      const resolutionId = await nextId(conn, 'RESOLUTION', 'Resolution_ID', 'RES');
      await conn.query(
        `INSERT INTO RESOLUTION (Resolution_ID, Report_ID, Resolved_By, Resolution_Date, Outcome, Action_Taken, Notes)
         VALUES (?, ?, ?, CURDATE(), ?, ?, ?)`,
        [resolutionId, report.Report_ID, lead.Investigator_ID, body.outcome, body.actionTaken, body.notes]
      );
      await conn.query("UPDATE INVESTIGATION SET Status = 'Completed', End_Date = CURDATE() WHERE Investigation_ID = ?",
        [report.Investigation_ID]);
      await conn.query('UPDATE THEFT_REPORT SET Status = ? WHERE Report_ID = ?',
        [OUTCOME_STATUS[body.outcome], report.Report_ID]);
      return report.Report_ID;
    });
  }));

  return router;
}

module.exports = { createCasesRouter, HttpError };
