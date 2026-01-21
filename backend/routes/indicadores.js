const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// ========== Planes ==========
// Get all plans
router.get('/planes', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_plan as id, nombre, descripcion, estado FROM plan ORDER BY id_plan');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener planes' });
  }
});

// Get plans for an indicator
router.get('/indicador_planes/:id_indicador', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id_plan as id, p.nombre, p.descripcion, p.estado 
      FROM plan p 
      INNER JOIN indicador_plan ip ON p.id_plan = ip.id_plan 
      WHERE ip.id_indicador = $1 
      ORDER BY p.nombre
    `, [req.params.id_indicador]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener planes del indicador' });
  }
});

// Set plans for an indicator (replace all)
router.put('/indicador_planes/:id_indicador', async (req, res) => {
  try {
    const { planes } = req.body; // Array of plan IDs
    const idIndicador = req.params.id_indicador;
    
    // Delete existing associations
    await pool.query('DELETE FROM indicador_plan WHERE id_indicador = $1', [idIndicador]);
    
    // Insert new associations
    if (planes && planes.length > 0) {
      const values = planes.map((idPlan, i) => `($1, $${i + 2})`).join(', ');
      await pool.query(
        `INSERT INTO indicador_plan (id_indicador, id_plan) VALUES ${values}`,
        [idIndicador, ...planes]
      );
    }
    
    res.json({ message: 'Planes actualizados' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al actualizar planes' });
  }
});

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
    let query = `
      SELECT mp.*, 
        s.sector,
        e.entidad,
        a.area_organizacional as area,
        COALESCE(
          (SELECT json_agg(json_build_object('id', p.id_plan, 'nombre', p.nombre))
           FROM indicador_plan ip 
           INNER JOIN plan p ON ip.id_plan = p.id_plan 
           WHERE ip.id_indicador = mp.id_indicador), '[]'
        ) as planes
      FROM matriz_parametro mp
      LEFT JOIN sector s ON mp.id_sector = s.id_sector
      LEFT JOIN entidad e ON mp.id_entidad = e.id_entidad
      LEFT JOIN area a ON mp.id_area = a.id_area
    `;
    let params = [];
    
    // ADMINISTRADOR and INVITADO can see ALL indicators
    // Other users only see indicators from their area
    if (req.user.rol !== 'ADMINISTRADOR' && req.user.rol !== 'INVITADO' && req.user.id_area) {
      query += ' WHERE mp.id_area = $1';
      params = [req.user.id_area];
    }
    
    query += ' ORDER BY mp.id_indicador';
    
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
