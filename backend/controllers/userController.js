const pool = require('../config/db');
const crypto = require('crypto');

function hash(pwd) {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

exports.register = async (req, res) => {
  const { name, email, password, role = 'student' } = req.body;
  try {
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash(password), role]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT id, name, role FROM users WHERE email=? AND password_hash=?',
      [email, hash(password)]
    );
    if (rows.length === 0) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    res.json({ ok: true, user: rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
