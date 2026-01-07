const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// ========== Entidades ==========
router.get('/entidades', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_entidad as id, entidad as nombre, estado FROM entidad ORDER BY id_entidad');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener entidades' });
  }
});

router.post('/entidades', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    const result = await pool.query('INSERT INTO entidad (entidad, estado) VALUES ($1, $2) RETURNING id_entidad as id, entidad as nombre, estado', [nombre, estado || 'ACTIVO']);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al crear entidad' });
  }
});

router.put('/entidades/:id', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    await pool.query('UPDATE entidad SET entidad = $1, estado = $2 WHERE id_entidad = $3', [nombre, estado, req.params.id]);
    res.json({ message: 'Entidad actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al actualizar entidad' });
  }
});

// ========== Areas ==========
router.get('/areas', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_area as id, area_organizacional as nombre, id_entidad, estado FROM area ORDER BY id_area');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener áreas' });
  }
});

router.get('/entidades/:id/areas', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_area as id, area_organizacional as nombre, id_entidad, estado FROM area WHERE id_entidad = $1 ORDER BY id_area', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener áreas de entidad' });
  }
});

router.get('/areas_by_entidad/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_area as id, area_organizacional as nombre, id_entidad, estado FROM area WHERE id_entidad = $1 ORDER BY id_area', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener áreas' });
  }
});

router.post('/areas', async (req, res) => {
  try {
    const { nombre, id_entidad, estado } = req.body;
    const result = await pool.query('INSERT INTO area (area_organizacional, id_entidad, estado) VALUES ($1, $2, $3) RETURNING id_area as id, area_organizacional as nombre, id_entidad, estado', [nombre, id_entidad, estado || 'ACTIVO']);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al crear área' });
  }
});

router.put('/areas/:id', async (req, res) => {
  try {
    const { nombre, id_entidad, estado } = req.body;
    await pool.query('UPDATE area SET area_organizacional = $1, id_entidad = $2, estado = $3 WHERE id_area = $4', [nombre, id_entidad, estado, req.params.id]);
    res.json({ message: 'Área actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al actualizar área' });
  }
});

module.exports = router;
