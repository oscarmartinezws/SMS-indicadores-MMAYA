const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// ========== Sectores ==========
router.get('/sectores', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_sector as id, sector as nombre, estado FROM sector ORDER BY id_sector');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener sectores' });
  }
});

router.post('/sectores', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    const result = await pool.query(
      'INSERT INTO sector (sector, estado) VALUES ($1, $2) RETURNING id_sector as id, sector as nombre, estado',
      [nombre, estado || 'ACTIVO']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al crear sector' });
  }
});

router.put('/sectores/:id', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    await pool.query('UPDATE sector SET sector = $1, estado = $2 WHERE id_sector = $3', [nombre, estado, req.params.id]);
    res.json({ message: 'Sector actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al actualizar sector' });
  }
});

// ========== Pilares ==========
router.get('/pilares', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_pilar as id, pilar as nombre, estado FROM pilar ORDER BY id_pilar');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener pilares' });
  }
});

router.post('/pilares', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    const result = await pool.query('INSERT INTO pilar (pilar, estado) VALUES ($1, $2) RETURNING id_pilar as id, pilar as nombre, estado', [nombre, estado || 'ACTIVO']);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al crear pilar' });
  }
});

router.put('/pilares/:id', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    await pool.query('UPDATE pilar SET pilar = $1, estado = $2 WHERE id_pilar = $3', [nombre, estado, req.params.id]);
    res.json({ message: 'Pilar actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al actualizar pilar' });
  }
});

// ========== Ejes ==========
router.get('/ejes', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_eje as id, eje as nombre, estado FROM eje ORDER BY id_eje');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener ejes' });
  }
});

router.post('/ejes', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    const result = await pool.query('INSERT INTO eje (eje, estado) VALUES ($1, $2) RETURNING id_eje as id, eje as nombre, estado', [nombre, estado || 'ACTIVO']);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al crear eje' });
  }
});

router.put('/ejes/:id', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    await pool.query('UPDATE eje SET eje = $1, estado = $2 WHERE id_eje = $3', [nombre, estado, req.params.id]);
    res.json({ message: 'Eje actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al actualizar eje' });
  }
});

// ========== Metas ==========
router.get('/metas', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_meta as id, codi as codigo, meta as nombre, estado FROM meta ORDER BY id_meta');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener metas' });
  }
});

router.post('/metas', async (req, res) => {
  try {
    const { codigo, nombre, estado } = req.body;
    const result = await pool.query('INSERT INTO meta (codi, meta, estado) VALUES ($1, $2, $3) RETURNING id_meta as id, codi as codigo, meta as nombre, estado', [codigo, nombre, estado || 'ACTIVO']);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al crear meta' });
  }
});

router.put('/metas/:id', async (req, res) => {
  try {
    const { codigo, nombre, estado } = req.body;
    await pool.query('UPDATE meta SET codi = $1, meta = $2, estado = $3 WHERE id_meta = $4', [codigo, nombre, estado, req.params.id]);
    res.json({ message: 'Meta actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al actualizar meta' });
  }
});

// ========== Resultados ==========
router.get('/resultados', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_resultado as id, codi as codigo, resultado as nombre, estado FROM resultado ORDER BY id_resultado');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener resultados' });
  }
});

router.post('/resultados', async (req, res) => {
  try {
    const { codigo, nombre, estado } = req.body;
    const result = await pool.query('INSERT INTO resultado (codi, resultado, estado) VALUES ($1, $2, $3) RETURNING id_resultado as id, codi as codigo, resultado as nombre, estado', [codigo, nombre, estado || 'ACTIVO']);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al crear resultado' });
  }
});

router.put('/resultados/:id', async (req, res) => {
  try {
    const { codigo, nombre, estado } = req.body;
    await pool.query('UPDATE resultado SET codi = $1, resultado = $2, estado = $3 WHERE id_resultado = $4', [codigo, nombre, estado, req.params.id]);
    res.json({ message: 'Resultado actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al actualizar resultado' });
  }
});

// ========== Acciones ==========
router.get('/acciones', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_accion as id, codi as codigo, accion as nombre, estado FROM accion ORDER BY id_accion');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener acciones' });
  }
});

router.post('/acciones', async (req, res) => {
  try {
    const { codigo, nombre, estado } = req.body;
    const result = await pool.query('INSERT INTO accion (codi, accion, estado) VALUES ($1, $2, $3) RETURNING id_accion as id, codi as codigo, accion as nombre, estado', [codigo, nombre, estado || 'ACTIVO']);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al crear acción' });
  }
});

router.put('/acciones/:id', async (req, res) => {
  try {
    const { codigo, nombre, estado } = req.body;
    await pool.query('UPDATE accion SET codi = $1, accion = $2, estado = $3 WHERE id_accion = $4', [codigo, nombre, estado, req.params.id]);
    res.json({ message: 'Acción actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al actualizar acción' });
  }
});

module.exports = router;
