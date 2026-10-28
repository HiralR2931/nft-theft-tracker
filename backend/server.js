// Runs the API as a long-lived server (local, Docker, Railway). Vercel uses api/index.js instead.
const { app, pool } = require('./app');

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  pool.query('SELECT 1')
    .then(() => console.log('✅ Connected to the database'))
    .catch(err => console.error('❌ Database connection failed:', err.message));
});
