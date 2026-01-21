const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES = '24h';

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query(
      `SELECT u.*, r.rol FROM usuario u 
       LEFT JOIN rol r ON u.id_rol = r.id_rol 
       WHERE u.username = $1`, [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ detail: 'Usuario no encontrado' });
    }
    
    const user = result.rows[0];
    
    // Check if user is ACTIVE
    if (user.estado !== 'ACTIVO') {
      return res.status(401).json({ detail: 'Usuario inactivo. Contacte al administrador.' });
    }
    
    // Check password (bcrypt or plain)
    let validPassword = false;
    if (user.clave && user.clave.startsWith('$2')) {
      validPassword = await bcrypt.compare(password, user.clave);
    } else {
      validPassword = user.clave === password;
    }
    
    if (!validPassword) {
      return res.status(401).json({ detail: 'Contraseña incorrecta' });
    }
    
    const tokenData = {
      id_usuario: user.id_usuario,
      username: user.username,
      nombre: user.nombre,
      id_rol: user.id_rol,
      rol: user.rol,
      id_area: user.id_area
    };
    
    const token = jwt.sign(tokenData, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    
    res.json({
      message: 'Login exitoso',
      token,
      user: tokenData
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ detail: 'Error de conexión' });
  }
});

// Verify token
router.get('/verify-token', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;
