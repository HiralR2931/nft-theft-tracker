// Vercel serverless entry point: every /api/* and /health request is routed here (see vercel.json).
const { app } = require('../backend/app');

module.exports = app;
