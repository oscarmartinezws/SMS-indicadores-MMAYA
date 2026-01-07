const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// User context
router.get('/contexto_usuario/:id_area', async (req, res) => {
  try {
    const idArea = parseInt(req.params.id_area);
    if (isNaN(idArea)) {
      return res.json({ area: '-', entidad: '-', sector: '-' });
    }
    
    const result = await pool.query(
      `SELECT DISTINCT a.area_organizacional as area, e.entidad, s.sector
       FROM matriz_parametro mp
       LEFT JOIN area a ON mp.id_area = a.id_area
       LEFT JOIN entidad e ON mp.id_entidad = e.id_entidad
       LEFT JOIN sector s ON mp.id_sector = s.id_sector
       WHERE mp.id_area = $1
       LIMIT 1`, [idArea]
    );
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      const areaResult = await pool.query('SELECT area_organizacional as area FROM area WHERE id_area = $1', [idArea]);
      res.json({ area: areaResult.rows[0]?.area || '-', entidad: '-', sector: '-' });
    }
  } catch (err) {
    console.error('Contexto error:', err);
    res.json({ area: '-', entidad: '-', sector: '-' });
  }
});

// Dashboard summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { year, id_sector, id_entidad, id_area } = req.query;
    
    let filters = [];
    let params = [];
    let mpFilters = [];
    let mpParams = [];
    let paramIdx = 1;
    let mpParamIdx = 1;
    
    if (year) {
      filters.push(`r.gestion = $${paramIdx++}`);
      params.push(parseInt(year));
    }
    
    if (id_sector) {
      filters.push(`mp.id_sector = $${paramIdx++}`);
      params.push(parseInt(id_sector));
      mpFilters.push(`mp.id_sector = $${mpParamIdx++}`);
      mpParams.push(parseInt(id_sector));
    }
    
    if (id_entidad) {
      filters.push(`mp.id_entidad = $${paramIdx++}`);
      params.push(parseInt(id_entidad));
      mpFilters.push(`mp.id_entidad = $${mpParamIdx++}`);
      mpParams.push(parseInt(id_entidad));
    }
    
    if (id_area) {
      filters.push(`mp.id_area = $${paramIdx++}`);
      params.push(parseInt(id_area));
      mpFilters.push(`mp.id_area = $${mpParamIdx++}`);
      mpParams.push(parseInt(id_area));
    }
    
    if (req.user.rol !== 'ADMINISTRADOR' && req.user.id_area) {
      filters.push(`mp.id_area = $${paramIdx++}`);
      params.push(req.user.id_area);
      mpFilters.push(`mp.id_area = $${mpParamIdx++}`);
      mpParams.push(req.user.id_area);
    }
    
    const whereClause = filters.length > 0 ? filters.join(' AND ') : '1=1';
    const mpWhereClause = mpFilters.length > 0 ? mpFilters.join(' AND ') : '1=1';
    
    const totalResult = await pool.query(
      `SELECT COUNT(DISTINCT mp.id_indicador) as total FROM matriz_parametro mp WHERE ${mpWhereClause}`,
      mpParams
    );
    
    const dataQuery = `
      SELECT 
        mp.id_indicador, mp.indicador_resultado, mp.logro as logro_programado,
        s.sector, e.entidad, a.area_organizacional as area,
        r.gestion, r.programado, r.logrado,
        COALESCE(r.acumulado_ene, 0) + COALESCE(r.acumulado_feb, 0) + COALESCE(r.acumulado_mar, 0) +
        COALESCE(r.acumulado_abr, 0) + COALESCE(r.acumulado_may, 0) + COALESCE(r.acumulado_jun, 0) +
        COALESCE(r.acumulado_jul, 0) + COALESCE(r.acumulado_ago, 0) + COALESCE(r.acumulado_sep, 0) +
        COALESCE(r.acumulado_oct, 0) + COALESCE(r.acumulado_nov, 0) + COALESCE(r.acumulado_dic, 0) as total_acumulado
      FROM matriz_parametro mp
      LEFT JOIN sector s ON mp.id_sector = s.id_sector
      LEFT JOIN entidad e ON mp.id_entidad = e.id_entidad
      LEFT JOIN area a ON mp.id_area = a.id_area
      LEFT JOIN rendicion r ON mp.id_indicador = r.id_indicador
      WHERE ${whereClause}
      ORDER BY mp.id_indicador
    `;
    
    const dataResult = await pool.query(dataQuery, params);
    const indicators = dataResult.rows;
    
    const sectorSummary = {};
    const entidadSummary = {};
    const areaSummary = {};
    
    indicators.forEach(ind => {
      const sector = ind.sector || 'Sin Sector';
      const entidad = ind.entidad || 'Sin Entidad';
      const area = ind.area || 'Sin Área';
      const hasProgress = ind.total_acumulado && parseFloat(ind.total_acumulado) > 0;
      
      if (!sectorSummary[sector]) sectorSummary[sector] = { total: 0, con_avance: 0, acumulado: 0 };
      sectorSummary[sector].total++;
      if (hasProgress) { sectorSummary[sector].con_avance++; sectorSummary[sector].acumulado += parseFloat(ind.total_acumulado); }
      
      if (!entidadSummary[entidad]) entidadSummary[entidad] = { total: 0, con_avance: 0, acumulado: 0 };
      entidadSummary[entidad].total++;
      if (hasProgress) { entidadSummary[entidad].con_avance++; entidadSummary[entidad].acumulado += parseFloat(ind.total_acumulado); }
      
      if (!areaSummary[area]) areaSummary[area] = { total: 0, con_avance: 0, acumulado: 0 };
      areaSummary[area].total++;
      if (hasProgress) { areaSummary[area].con_avance++; areaSummary[area].acumulado += parseFloat(ind.total_acumulado); }
    });
    
    const totalIndicators = indicators.length;
    const withProgress = indicators.filter(i => i.total_acumulado && parseFloat(i.total_acumulado) > 0).length;
    
    res.json({
      general: {
        total_indicadores: totalIndicators,
        con_avance: withProgress,
        sin_avance: totalIndicators - withProgress,
        porcentaje_avance: totalIndicators > 0 ? Math.round((withProgress / totalIndicators) * 10000) / 100 : 0
      },
      por_sector: Object.entries(sectorSummary).map(([nombre, v]) => ({ nombre, ...v })),
      por_entidad: Object.entries(entidadSummary).map(([nombre, v]) => ({ nombre, ...v })),
      por_area: Object.entries(areaSummary).map(([nombre, v]) => ({ nombre, ...v })),
      indicadores: indicators.slice(0, 50)
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ detail: 'Error al obtener dashboard' });
  }
});

// Dashboard years
router.get('/years', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT gestion FROM rendicion WHERE gestion IS NOT NULL ORDER BY gestion DESC');
    const years = result.rows.map(r => r.gestion);
    const currentYear = new Date().getFullYear();
    if (!years.includes(currentYear)) years.unshift(currentYear);
    res.json(years);
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener años' });
  }
});

module.exports = router;
