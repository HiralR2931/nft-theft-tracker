const request = require('supertest');
const { app } = require('../app');
const { pool, query } = require('../db');
const { levelFor } = require('../riskScore');

afterAll(() => pool.end());

let body;
beforeAll(async () => {
  const res = await request(app).get('/api/wallets/risk-scores');
  expect(res.status).toBe(200);
  body = res.body;
});

test('scores every suspicious wallet', async () => {
  const [{ n }] = await query('SELECT COUNT(*) AS n FROM SUSPICIOUS_WALLET');
  expect(body.wallets).toHaveLength(n);
  expect(body.summary.wallets).toBe(n);
});

test('factor weights add up to 100%', () => {
  const total = body.factors.reduce((sum, f) => sum + f.weight, 0);
  expect(total).toBeCloseTo(1);
});

test('scores are 0-100, sorted, and equal the sum of their factor contributions', () => {
  body.wallets.forEach((w, i) => {
    expect(w.score).toBeGreaterThanOrEqual(0);
    expect(w.score).toBeLessThanOrEqual(100);
    if (i > 0) expect(w.score).toBeLessThanOrEqual(body.wallets[i - 1].score);
    const sum = Object.values(w.contributions).reduce((a, b) => a + b, 0);
    expect(w.score).toBeCloseTo(sum, 0);
    expect(w.computedLevel).toBe(levelFor(w.score));
  });
});

test('wallets with no transactions score 0', () => {
  const idle = body.wallets.filter(w => w.factors.txCount === 0);
  idle.forEach(w => expect(w.score).toBe(0));
});

test('a wallet linked to more stolen artworks gets a bigger stolen-links contribution', () => {
  const byLinks = [...body.wallets].sort((a, b) => a.factors.stolenLinks - b.factors.stolenLinks);
  const low = byLinks[0];
  const high = byLinks[byLinks.length - 1];
  expect(high.factors.stolenLinks).toBeGreaterThan(low.factors.stolenLinks);
  expect(high.contributions.stolenLinks).toBeGreaterThan(low.contributions.stolenLinks);
});

test('the agreement matrix accounts for every wallet', () => {
  const cells = body.agreement.flatMap(row => ['Low', 'Medium', 'High', 'Critical'].map(l => row[l]));
  expect(cells.reduce((a, b) => a + b, 0)).toBe(body.wallets.length);
  const underRated = body.wallets.filter(w => w.gap >= 2).length;
  expect(body.summary.underRated).toBe(underRated);
});

test('levelFor uses the documented bands', () => {
  expect(levelFor(80)).toBe('Critical');
  expect(levelFor(75)).toBe('Critical');
  expect(levelFor(60)).toBe('High');
  expect(levelFor(40)).toBe('Medium');
  expect(levelFor(10)).toBe('Low');
});
