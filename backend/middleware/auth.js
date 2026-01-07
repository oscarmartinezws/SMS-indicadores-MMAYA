const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sms_mmaya_secret_key_2025_secure';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ detail: 'No autorizado' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ detail: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken, JWT_SECRET };
