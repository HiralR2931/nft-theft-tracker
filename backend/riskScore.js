// Behavioral risk score for suspicious wallets, from 0 (least risky) to 100.
// Each factor is turned into a percentile across all wallets with PERCENT_RANK(), so factors on
// different scales (counts, ETH, days) can be weighted and added. The score is the weighted sum.

const FACTORS = [
  { key: 'stolenLinks', label: 'Links to stolen artworks', weight: 0.30,
    describe: 'Distinct reported-stolen artworks this wallet transacted' },
  { key: 'totalValue', label: 'Total value moved', weight: 0.25, describe: 'Sum of transaction amounts (ETH)' },
  { key: 'largestValue', label: 'Largest transaction', weight: 0.15, describe: 'Biggest single transaction (ETH)' },
  { key: 'txCount', label: 'Transaction count', weight: 0.15, describe: 'Number of transactions' },
  { key: 'recency', label: 'Recent activity', weight: 0.15, describe: 'Days since the last transaction (fewer is riskier)' }
];
const LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const levelFor = score => (score >= 75 ? 'Critical' : score >= 55 ? 'High' : score >= 35 ? 'Medium' : 'Low');

const SQL = `
WITH stolen AS (
  SELECT DISTINCT Artwork_ID FROM THEFT_REPORT
),
activity AS (
  SELECT w.Wallet_ID, w.Address, w.Risk_Level, w.Status,
    COUNT(t.Transaction_ID) AS txCount,
    COALESCE(SUM(t.Amount), 0) AS totalValue,
    COALESCE(MAX(t.Amount), 0) AS largestValue,
    COUNT(DISTINCT s.Artwork_ID) AS stolenLinks,
    DATEDIFF(CURDATE(), MAX(t.Timestamp)) AS daysSinceActive
  FROM SUSPICIOUS_WALLET w
  LEFT JOIN TRANSACTION t ON t.Wallet_ID = w.Wallet_ID
  LEFT JOIN stolen s ON s.Artwork_ID = t.Artwork_ID
  GROUP BY w.Wallet_ID, w.Address, w.Risk_Level, w.Status
)
SELECT *,
  PERCENT_RANK() OVER (ORDER BY stolenLinks) AS pStolenLinks,
  PERCENT_RANK() OVER (ORDER BY totalValue) AS pTotalValue,
  PERCENT_RANK() OVER (ORDER BY largestValue) AS pLargestValue,
  PERCENT_RANK() OVER (ORDER BY txCount) AS pTxCount,
  -- Wallets that never transacted rank as the least recent.
  PERCENT_RANK() OVER (ORDER BY COALESCE(-daysSinceActive, -1000000)) AS pRecency
FROM activity`;

const percentileColumn = key => `p${key[0].toUpperCase()}${key.slice(1)}`;

async function scoreWallets(query) {
  const rows = await query(SQL);
  const wallets = rows.map(row => {
    const contributions = Object.fromEntries(FACTORS.map(f =>
      [f.key, Math.round(Number(row[percentileColumn(f.key)]) * f.weight * 1000) / 10]));
    const score = Math.round(Object.values(contributions).reduce((a, b) => a + b, 0) * 10) / 10;
    const computedLevel = levelFor(score);
    // Positive gap: behavior looks riskier than the level the wallet was given.
    const gap = LEVELS.indexOf(computedLevel) - LEVELS.indexOf(row.Risk_Level);
    return {
      id: row.Wallet_ID,
      address: row.Address,
      status: row.Status,
      assignedLevel: row.Risk_Level,
      computedLevel,
      score,
      gap,
      factors: {
        stolenLinks: Number(row.stolenLinks),
        totalValue: Number(row.totalValue),
        largestValue: Number(row.largestValue),
        txCount: Number(row.txCount),
        daysSinceActive: row.daysSinceActive === null ? null : Number(row.daysSinceActive)
      },
      contributions
    };
  }).sort((a, b) => b.score - a.score);

  // Rows: the level each wallet was given. Columns: the level its behavior suggests.
  const agreement = LEVELS.map(assigned => ({
    assigned,
    ...Object.fromEntries(LEVELS.map(computed =>
      [computed, wallets.filter(w => w.assignedLevel === assigned && w.computedLevel === computed).length]))
  }));
  const matching = wallets.filter(w => w.gap === 0).length;

  return {
    factors: FACTORS,
    levels: { Critical: '75+', High: '55-74', Medium: '35-54', Low: 'under 35' },
    summary: {
      wallets: wallets.length,
      agreementRate: wallets.length ? Math.round((matching / wallets.length) * 100) : 0,
      underRated: wallets.filter(w => w.gap >= 2).length,
      overRated: wallets.filter(w => w.gap <= -2).length
    },
    agreement,
    wallets
  };
}

module.exports = { scoreWallets, levelFor };
