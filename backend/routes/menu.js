const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get menu by role
router.get('/menu/:id_rol', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, o.estado as opcion_estado 
       FROM menu m 
       LEFT JOIN opciones o ON m.id_menu = o.id_menu AND o.id_rol = $1 
       ORDER BY m.id_menu`, [req.params.id_rol]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener menú' });
  }
});

// Get all menus (admin)
router.get('/menu_admin', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id_menu, m.opcion, m.enlace, m.tipo_opcion, m.id_padre, m.estado
       FROM menu m
       ORDER BY m.id_menu`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener menú admin' });
  }
});

// Create menu
router.post('/menu', async (req, res) => {
  try {
    const { opcion, tipo_opcion, enlace, id_padre, estado } = req.body;
    const result = await pool.query(
      'INSERT INTO menu (opcion, tipo_opcion, enlace, id_padre, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [opcion, tipo_opcion, enlace, id_padre, estado || 'ACTIVO']
    );
    
    const newMenuId = result.rows[0].id_menu;
    const roles = await pool.query('SELECT id_rol FROM rol');
    for (const rol of roles.rows) {
      await pool.query('INSERT INTO opciones (id_rol, id_menu, estado) VALUES ($1, $2, $3)', [rol.id_rol, newMenuId, 'INACTIVO']);
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al crear menú' });
  }
});

// Update menu
router.put('/menu/:id', async (req, res) => {
  try {
    const { opcion, tipo_opcion, enlace, id_padre, estado } = req.body;
    await pool.query(
      'UPDATE menu SET opcion = $1, tipo_opcion = $2, enlace = $3, id_padre = $4, estado = $5 WHERE id_menu = $6',
      [opcion, tipo_opcion, enlace, id_padre, estado, req.params.id]
    );
    res.json({ message: 'Menú actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al actualizar menú' });
  }
});

module.exports = router;
