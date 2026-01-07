const { Pool } = require('pg');

// PostgreSQL Configuration
const pool = new Pool({
  host: '37.60.254.167',
  port: 5432,
  database: 'sms',
  user: 'admin_sibelys',
  password: 'P1c010c0#2026',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test DB connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('PostgreSQL connection error:', err);
  else console.log('PostgreSQL connected:', res.rows[0].now);
});

module.exports = pool;
