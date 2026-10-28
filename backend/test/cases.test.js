// Walks a case through its whole lifecycle against the real database.
const request = require('supertest');
const { app } = require('../app');
const { pool, query } = require('../db');

afterAll(() => pool.end());

const post = (path, body) => request(app).post(path).send(body);

describe('case lifecycle', () => {
  let reportId;

  test('files a report with the artwork\'s artist as reporter', async () => {
    const res = await post('/api/reports', {
      artworkId: 'AWK100', platformId: 'PLT003',
      description: 'Minted copy found on a clone marketplace', stolenUrl: 'https://example.com/copy/1'
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: 'Open', artworkId: 'AWK100', platformId: 'PLT003', investigation: null });
    reportId = res.body.id;

    const [row] = await query(`SELECT tr.Reporter_ID = a.Artist_ID AS sameArtist FROM THEFT_REPORT tr
      JOIN ARTWORK a ON a.Artwork_ID = tr.Artwork_ID WHERE tr.Report_ID = ?`, [reportId]);
    expect(row.sameArtist).toBe(1);
  });

  test('rejects evidence before an investigation exists', async () => {
    const res = await post(`/api/reports/${reportId}/evidence`, { type: 'Screenshot' });
    expect(res.status).toBe(409);
  });

  test('opens an investigation with a lead investigator', async () => {
    const res = await post(`/api/reports/${reportId}/investigation`, { priority: 'High', leadInvestigatorId: 'INV011' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Under Investigation');
    expect(res.body.investigation).toMatchObject({ status: 'Active', priority: 'High' });
    expect(res.body.investigation.team).toEqual([{ id: 'INV011', name: 'Investigator_11', role: 'Lead' }]);
  });

  test('refuses to open a second investigation', async () => {
    const res = await post(`/api/reports/${reportId}/investigation`, { priority: 'Low', leadInvestigatorId: 'INV012' });
    expect(res.status).toBe(409);
  });

  test('adds evidence to the investigation', async () => {
    const res = await post(`/api/reports/${reportId}/evidence`, { type: 'Wallet Trace', description: 'Funds moved to a mixer' });
    expect(res.status).toBe(201);
    expect(res.body.investigation.evidence).toHaveLength(1);
    expect(res.body.investigation.evidence[0]).toMatchObject({ type: 'Wallet Trace', description: 'Funds moved to a mixer' });
  });

  test('resolves the case, signed off by the lead', async () => {
    const res = await post(`/api/reports/${reportId}/resolution`, { outcome: 'Dismissed', actionTaken: 'No evidence found' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Closed');
    expect(res.body.investigation.status).toBe('Completed');
    expect(res.body.resolution).toMatchObject({ outcome: 'Dismissed', resolvedBy: 'Investigator_11' });
  });

  test('refuses to resolve the same case twice', async () => {
    const res = await post(`/api/reports/${reportId}/resolution`, { outcome: 'Recovered' });
    expect(res.status).toBe(409);
  });

  test('lists the report and returns its details', async () => {
    const list = await request(app).get('/api/reports?status=Closed&limit=100');
    expect(list.body.map(r => r.id)).toContain(reportId);
    const detail = await request(app).get(`/api/reports/${reportId}`);
    expect(detail.body.id).toBe(reportId);
  });

  test('the new case passes every consistency check it touches', async () => {
    const { body } = await request(app).get('/api/data-quality');
    const broken = body.results.filter(r => r.category === 'Referential integrity' && !r.passed);
    expect(broken).toEqual([]);
  });
});

describe('validation', () => {
  test('explains which fields are invalid', async () => {
    const res = await post('/api/reports', { artworkId: '', platformId: 'PLT001' });
    expect(res.status).toBe(400);
    expect(res.body.details.map(d => d.field)).toEqual(expect.arrayContaining(['artworkId', 'description']));
  });

  test('rejects unknown artworks without writing anything', async () => {
    const before = (await query('SELECT COUNT(*) AS n FROM THEFT_REPORT'))[0].n;
    const res = await post('/api/reports', { artworkId: 'AWK_NOPE', platformId: 'PLT001', description: 'x' });
    const after = (await query('SELECT COUNT(*) AS n FROM THEFT_REPORT'))[0].n;
    expect(res.status).toBe(400);
    expect(after).toBe(before);
  });

  test('rejects outcomes outside the allowed list', async () => {
    const res = await post('/api/reports/RPT011/resolution', { outcome: 'Won' });
    expect(res.status).toBe(400);
  });

  test('rejects malformed JSON', async () => {
    const res = await request(app).post('/api/reports').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Request body is not valid JSON');
  });

  test('returns 404 for unknown reports', async () => {
    expect((await request(app).get('/api/reports/RPT99999')).status).toBe(404);
    expect((await post('/api/reports/RPT99999/investigation', { priority: 'Low', leadInvestigatorId: 'INV011' })).status).toBe(404);
  });
});
