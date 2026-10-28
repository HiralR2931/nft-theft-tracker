// Jest loads each test file in its own module registry, so these settings only apply here.
process.env.WRITE_RATE_LIMIT = '2';
const request = require('supertest');
const { app } = require('../app');
const { pool } = require('../db');

afterAll(() => pool.end());

test('rate limits writes per visitor', async () => {
  const send = () => request(app).post('/api/reports').send({});
  expect((await send()).status).toBe(400);
  expect((await send()).status).toBe(400);
  const limited = await send();
  expect(limited.status).toBe(429);
  expect(limited.body.error).toMatch(/too many/i);
});

test('reads are not rate limited', async () => {
  expect((await request(app).get('/health')).status).toBe(200);
});

test('writes can be switched off', async () => {
  process.env.WRITES_ENABLED = 'false';
  const res = await request(app).post('/api/reports').send({});
  delete process.env.WRITES_ENABLED;
  expect(res.status).toBe(403);
});
