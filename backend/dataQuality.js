// Automated data-quality checks. Each check counts the rows that break a rule, so 0 means it passes.
// Foreign-key checks are discovered from information_schema, so new tables are covered automatically.

const CHECKS = [
  // Completeness: fields that should be filled in for the data to be useful
  { id: 'report-missing-url', category: 'Completeness', table: 'THEFT_REPORT',
    rule: 'Theft reports include a link to the stolen NFT',
    failing: "SELECT COUNT(*) AS n FROM THEFT_REPORT WHERE Stolen_NFT_URL IS NULL OR Stolen_NFT_URL = ''" },
  { id: 'transaction-missing-amount', category: 'Completeness', table: 'TRANSACTION',
    rule: 'Transactions record an amount',
    failing: 'SELECT COUNT(*) AS n FROM TRANSACTION WHERE Amount IS NULL' },
  { id: 'wallet-missing-activity', category: 'Completeness', table: 'SUSPICIOUS_WALLET',
    rule: 'Wallets with transactions have a last-activity date',
    failing: `SELECT COUNT(*) AS n FROM SUSPICIOUS_WALLET w
      WHERE w.Last_Activity IS NULL AND EXISTS (SELECT 1 FROM TRANSACTION t WHERE t.Wallet_ID = w.Wallet_ID)` },

  // Validity: values that are present but impossible
  { id: 'report-future-date', category: 'Validity', table: 'THEFT_REPORT',
    rule: 'Report dates are not in the future',
    failing: 'SELECT COUNT(*) AS n FROM THEFT_REPORT WHERE Report_Date > NOW()' },
  { id: 'transaction-nonpositive-amount', category: 'Validity', table: 'TRANSACTION',
    rule: 'Transaction amounts are greater than zero',
    failing: 'SELECT COUNT(*) AS n FROM TRANSACTION WHERE Amount <= 0' },
  { id: 'report-before-artwork', category: 'Validity', table: 'THEFT_REPORT',
    rule: 'An artwork is reported stolen only after it was created',
    failing: `SELECT COUNT(*) AS n FROM THEFT_REPORT tr JOIN ARTWORK a ON a.Artwork_ID = tr.Artwork_ID
      WHERE DATE(tr.Report_Date) < a.Creation_Date` },
  { id: 'investigation-before-report', category: 'Validity', table: 'INVESTIGATION',
    rule: 'Investigations start on or after the report date',
    failing: `SELECT COUNT(*) AS n FROM INVESTIGATION i JOIN THEFT_REPORT tr ON tr.Report_ID = i.Report_ID
      WHERE i.Start_Date < DATE(tr.Report_Date)` },

  // Consistency: rows that disagree with related rows
  { id: 'open-report-investigated', category: 'Consistency', table: 'THEFT_REPORT',
    rule: 'Open reports have no investigation yet',
    failing: `SELECT COUNT(*) AS n FROM THEFT_REPORT tr JOIN INVESTIGATION i ON i.Report_ID = tr.Report_ID
      WHERE tr.Status = 'Open'` },
  { id: 'closed-report-unresolved', category: 'Consistency', table: 'THEFT_REPORT',
    rule: 'Resolved and closed reports have a resolution',
    failing: `SELECT COUNT(*) AS n FROM THEFT_REPORT tr LEFT JOIN RESOLUTION r ON r.Report_ID = tr.Report_ID
      WHERE tr.Status IN ('Resolved', 'Closed') AND r.Resolution_ID IS NULL` },
  { id: 'resolution-on-active-report', category: 'Consistency', table: 'RESOLUTION',
    rule: 'Resolutions belong to resolved or closed reports',
    failing: `SELECT COUNT(*) AS n FROM RESOLUTION r JOIN THEFT_REPORT tr ON tr.Report_ID = r.Report_ID
      WHERE tr.Status NOT IN ('Resolved', 'Closed')` },
  { id: 'completed-without-end-date', category: 'Consistency', table: 'INVESTIGATION',
    rule: 'Completed investigations have an end date',
    failing: "SELECT COUNT(*) AS n FROM INVESTIGATION WHERE Status = 'Completed' AND End_Date IS NULL" },
  { id: 'investigation-lead-count', category: 'Consistency', table: 'INVESTIGATION',
    rule: 'Each investigation has exactly one lead investigator',
    failing: `SELECT COUNT(*) AS n FROM INVESTIGATION i
      WHERE (SELECT COUNT(*) FROM INVESTIGATION_ASSIGNMENT ia
             WHERE ia.Investigation_ID = i.Investigation_ID AND ia.Role = 'Lead') <> 1` },
  { id: 'resolver-not-on-team', category: 'Consistency', table: 'RESOLUTION',
    rule: 'Cases are resolved by an investigator assigned to them',
    failing: `SELECT COUNT(*) AS n FROM RESOLUTION r
      JOIN INVESTIGATION i ON i.Report_ID = r.Report_ID
      LEFT JOIN INVESTIGATION_ASSIGNMENT ia
        ON ia.Investigation_ID = i.Investigation_ID AND ia.Investigator_ID = r.Resolved_By
      WHERE ia.Investigator_ID IS NULL` },
  { id: 'wallet-activity-mismatch', category: 'Consistency', table: 'SUSPICIOUS_WALLET',
    rule: "A wallet's last activity matches its latest transaction",
    failing: `SELECT COUNT(*) AS n FROM SUSPICIOUS_WALLET w
      JOIN (SELECT Wallet_ID, MAX(DATE(Timestamp)) AS latest FROM TRANSACTION GROUP BY Wallet_ID) t
        ON t.Wallet_ID = w.Wallet_ID
      WHERE w.Last_Activity <> t.latest` },
  { id: 'multiple-current-owners', category: 'Consistency', table: 'COLLECTOR_OWNERSHIP',
    rule: 'Each artwork has at most one current owner',
    failing: `SELECT COUNT(*) AS n FROM (SELECT Artwork_ID FROM COLLECTOR_OWNERSHIP
      WHERE Current_Owner GROUP BY Artwork_ID HAVING COUNT(*) > 1) x` }
];

const quote = name => '`' + String(name).replace(/`/g, '``') + '`';

async function foreignKeyChecks(query) {
  const keys = await query(`SELECT TABLE_NAME AS child, COLUMN_NAME AS col,
      REFERENCED_TABLE_NAME AS parent, REFERENCED_COLUMN_NAME AS parentCol
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY TABLE_NAME, COLUMN_NAME`);
  return keys.map(k => ({
    id: `fk-${k.child}-${k.col}`.toLowerCase(),
    category: 'Referential integrity',
    table: k.child,
    rule: `${k.child}.${k.col} points to an existing ${k.parent}`,
    failing: `SELECT COUNT(*) AS n FROM ${quote(k.child)} c
      LEFT JOIN ${quote(k.parent)} p ON c.${quote(k.col)} = p.${quote(k.parentCol)}
      WHERE c.${quote(k.col)} IS NOT NULL AND p.${quote(k.parentCol)} IS NULL`
  }));
}

async function runChecks(query) {
  const checks = [...(await foreignKeyChecks(query)), ...CHECKS];
  const tables = [...new Set(checks.map(c => c.table))];
  const totals = Object.fromEntries(await Promise.all(tables.map(async t =>
    [t, (await query(`SELECT COUNT(*) AS n FROM ${quote(t)}`))[0].n])));

  const results = await Promise.all(checks.map(async ({ failing, ...check }) => {
    const failingRows = Number((await query(failing))[0].n);
    return { ...check, failingRows, totalRows: Number(totals[check.table]), passed: failingRows === 0 };
  }));

  const passed = results.filter(r => r.passed).length;
  return {
    checkedAt: new Date().toISOString(),
    summary: { checks: results.length, passed, failed: results.length - passed,
      score: Math.round((passed / results.length) * 100) },
    results
  };
}

module.exports = { runChecks };
