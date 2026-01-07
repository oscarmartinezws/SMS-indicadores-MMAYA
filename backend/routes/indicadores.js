const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get all indicators with full data
router.get('/indicadores_full', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        mp.*,
        e.entidad,
        a.area_organizacional as area,
        s.sector,
        p.pilar,
        ej.eje,
        m.meta,
        r.resultado,
        ac.accion
      FROM matriz_parametro mp
      LEFT JOIN entidad e ON mp.id_entidad = e.id_entidad
      LEFT JOIN area a ON mp.id_area = a.id_area
      LEFT JOIN sector s ON mp.id_sector = s.id_sector
      LEFT JOIN pilar p ON mp.id_pilar = p.id_pilar
      LEFT JOIN eje ej ON mp.id_eje = ej.id_eje
      LEFT JOIN meta m ON mp.codi_meta = m.codi_meta
      LEFT JOIN resultado r ON mp.codi_resultado = r.codi_resultado
      LEFT JOIN accion ac ON mp.codi_accion = ac.codi_accion
      ORDER BY mp.id_indicador
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener indicadores' });
  }
});

// Get indicators (with auth filter)
router.get('/matriz_parametros', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM matriz_parametro ORDER BY id_indicador';
    let params = [];
    
    if (req.user.rol !== 'ADMINISTRADOR' && req.user.id_area) {
      query = 'SELECT * FROM matriz_parametro WHERE id_area = $1 ORDER BY id_indicador';
      params = [req.user.id_area];
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener indicadores' });
  }
});

// Get indicators by area
router.get('/indicadores/area/:id_area', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM matriz_parametro WHERE id_area = $1 ORDER BY id_indicador', [req.params.id_area]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener indicadores' });
  }
});

// Create indicator
router.post('/matriz_parametros', async (req, res) => {
  try {
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(
      `INSERT INTO matriz_parametro (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al crear indicador' });
  }
});

// Update indicator
router.put('/matriz_parametros/:id', async (req, res) => {
  try {
    const updates = Object.entries(req.body).map(([k, v], i) => `${k} = $${i + 1}`).join(', ');
    const values = [...Object.values(req.body), req.params.id];
    await pool.query(`UPDATE matriz_parametro SET ${updates} WHERE id_indicador = $${values.length}`, values);
    res.json({ message: 'Indicador actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al actualizar indicador' });
  }
});

module.exports = router;
