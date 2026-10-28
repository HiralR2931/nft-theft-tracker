// Integration tests: they run against a real MySQL loaded with database/01-03 (see README).
const request = require('supertest');
const { app } = require('../app');
const { pool, query } = require('../db');

afterAll(() => pool.end());

const count = async table => (await query(`SELECT COUNT(*) AS n FROM ${table}`))[0].n;

describe('health', () => {
  test('reports the database as connected', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'connected' });
  });
});

describe('read endpoints', () => {
  test('/api/stats matches the database', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body.totalReports).toBe(await count('THEFT_REPORT'));
    expect(res.body.totalWallets).toBe(await count('SUSPICIOUS_WALLET'));
    expect(res.body.resolvedCases).toBe(await count('RESOLUTION'));
    expect(res.body.totalTransactions).toBe(await count('TRANSACTION'));
  });

  test.each([
    ['/api/theft-status', ['name', 'value']],
    ['/api/platform-reports', ['platform', 'reports']],
    ['/api/wallet-risks', ['name', 'value']],
    ['/api/resolutions', ['outcome', 'value']],
    ['/api/investigator-workload', ['name', 'cases', 'active', 'expertise']],
    ['/api/wallets', ['id', 'address', 'risk', 'status']],
    ['/api/transactions', ['id', 'artwork', 'wallet', 'risk', 'amount']]
  ])('%s returns rows with the expected fields', async (path, fields) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    for (const field of fields) expect(res.body[0]).toHaveProperty(field);
  });

  test('theft-status counts add up to all reports', async () => {
    const res = await request(app).get('/api/theft-status');
    const total = res.body.reduce((sum, row) => sum + Number(row.value), 0);
    expect(total).toBe(await count('THEFT_REPORT'));
  });
});

describe('data quality', () => {
  let report;
  beforeAll(async () => {
    report = (await request(app).get('/api/data-quality')).body;
  });

  test('checks every foreign key in the schema', async () => {
    const keys = await query(`SELECT COUNT(*) AS n FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL`);
    const fkChecks = report.results.filter(r => r.category === 'Referential integrity');
    expect(fkChecks).toHaveLength(keys[0].n);
  });

  test('seed data has no broken references', () => {
    const broken = report.results.filter(r => r.category === 'Referential integrity' && !r.passed);
    expect(broken).toEqual([]);
  });

  test('summary agrees with the individual results', () => {
    const passed = report.results.filter(r => r.passed).length;
    expect(report.summary.checks).toBe(report.results.length);
    expect(report.summary.passed).toBe(passed);
    expect(report.summary.failed).toBe(report.results.length - passed);
  });
});

describe('security', () => {
  test('allows the dashboard origin', async () => {
    const res = await request(app).get('/api/stats').set('Origin', 'http://localhost:3000');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  test('does not allow other origins', async () => {
    const res = await request(app).get('/api/stats').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('database errors are not sent to the client', async () => {
    const spy = jest.spyOn(pool, 'execute').mockRejectedValueOnce(new Error('secret table detail'));
    jest.spyOn(console, 'error').mockImplementationOnce(() => {});
    const res = await request(app).get('/api/wallet-risks');
    spy.mockRestore();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });
});
