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
    let mpFilters = ['mp.estado = \'ACTIVO\''];
    let mpParams = [];
    let paramIdx = 1;
    let mpParamIdx = 1;
    
    if (year && year !== 'TODOS') {
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
    
    // Always add estado = ACTIVO to the main filters
    filters.push(`mp.estado = 'ACTIVO'`);
    
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
    
    // Get unique indicators with their total logrado across all years
    const indicatorMap = {};
    for (const ind of indicators) {
      if (!indicatorMap[ind.id_indicador]) {
        indicatorMap[ind.id_indicador] = {
          ...ind,
          total_logrado_global: 0
        };
      }
      indicatorMap[ind.id_indicador].total_logrado_global += parseFloat(ind.logrado) || 0;
    }
    
    // Calculate % logro global for each indicator
    const uniqueIndicators = Object.values(indicatorMap).map(ind => {
      const metaGlobal = parseFloat(ind.logro_programado) || 0;
      const porcLogroGlobal = metaGlobal > 0 ? ((ind.total_logrado_global / metaGlobal) * 100) : 0;
      return {
        ...ind,
        porc_logro_global: porcLogroGlobal,
        tiene_avance: ind.total_logrado_global > 0
      };
    });
    
    const sectorSummary = {};
    const entidadSummary = {};
    const areaSummary = {};
    
    uniqueIndicators.forEach(ind => {
      const sector = ind.sector || 'Sin Sector';
      const entidad = ind.entidad || 'Sin Entidad';
      const area = ind.area || 'Sin Área';
      const hasProgress = ind.tiene_avance;
      
      if (!sectorSummary[sector]) sectorSummary[sector] = { total: 0, con_avance: 0, acumulado: 0 };
      sectorSummary[sector].total++;
      if (hasProgress) { sectorSummary[sector].con_avance++; sectorSummary[sector].acumulado += ind.total_logrado_global; }
      
      if (!entidadSummary[entidad]) entidadSummary[entidad] = { total: 0, con_avance: 0, acumulado: 0 };
      entidadSummary[entidad].total++;
      if (hasProgress) { entidadSummary[entidad].con_avance++; entidadSummary[entidad].acumulado += ind.total_logrado_global; }
      
      if (!areaSummary[area]) areaSummary[area] = { total: 0, con_avance: 0, acumulado: 0 };
      areaSummary[area].total++;
      if (hasProgress) { areaSummary[area].con_avance++; areaSummary[area].acumulado += ind.total_logrado_global; }
    });
    
    const totalIndicators = uniqueIndicators.length;
    const withProgress = uniqueIndicators.filter(i => i.tiene_avance).length;
    
    // Calculate avance global (average of % logro global for indicators with avance)
    const indicadoresConAvance = uniqueIndicators.filter(i => i.tiene_avance);
    const avanceGlobal = indicadoresConAvance.length > 0
      ? indicadoresConAvance.reduce((sum, i) => sum + i.porc_logro_global, 0) / indicadoresConAvance.length
      : 0;
    
    res.json({
      general: {
        total_indicadores: totalIndicators,
        con_avance: withProgress,
        sin_avance: totalIndicators - withProgress,
        porcentaje_avance: totalIndicators > 0 ? Math.round((withProgress / totalIndicators) * 10000) / 100 : 0,
        avance_global: Math.round(avanceGlobal * 100) / 100
      },
      por_sector: Object.entries(sectorSummary).map(([nombre, v]) => ({ nombre, ...v })),
      por_entidad: Object.entries(entidadSummary).map(([nombre, v]) => ({ nombre, ...v })),
      por_area: Object.entries(areaSummary).map(([nombre, v]) => ({ nombre, ...v })),
      indicadores: uniqueIndicators.slice(0, 50)
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

// Get indicator progress by year (for user dashboard chart)
router.get('/indicador_progreso/:id_indicador', async (req, res) => {
  try {
    const idIndicador = parseInt(req.params.id_indicador);
    
    // Get all rendicion records for this indicator across all years
    const result = await pool.query(`
      SELECT 
        r.gestion as year,
        r.programado,
        r.logrado,
        mp.logro as meta_global
      FROM rendicion r
      INNER JOIN matriz_parametro mp ON r.id_indicador = mp.id_indicador
      WHERE r.id_indicador = $1
      ORDER BY r.gestion
    `, [idIndicador]);
    
    // Also get the sum of logrado across all years for % logro global
    const sumaResult = await pool.query(`
      SELECT COALESCE(SUM(logrado), 0) as suma_logrado
      FROM rendicion
      WHERE id_indicador = $1
    `, [idIndicador]);
    
    const metaResult = await pool.query(`
      SELECT logro as meta_global FROM matriz_parametro WHERE id_indicador = $1
    `, [idIndicador]);
    
    const sumaLogrado = parseFloat(sumaResult.rows[0]?.suma_logrado) || 0;
    const metaGlobal = parseFloat(metaResult.rows[0]?.meta_global) || 0;
    const porcLogroGlobal = metaGlobal > 0 ? ((sumaLogrado / metaGlobal) * 100) : 0;
    
    res.json({
      data_por_anio: result.rows.map(r => ({
        year: r.year,
        programado: parseFloat(r.programado) || 0,
        logrado: parseFloat(r.logrado) || 0,
        meta_global: parseFloat(r.meta_global) || 0
      })),
      suma_logrado: sumaLogrado,
      meta_global: metaGlobal,
      porc_logro_global: Math.round(porcLogroGlobal * 100) / 100
    });
  } catch (err) {
    console.error('Error getting indicator progress:', err);
    res.status(500).json({ detail: 'Error al obtener progreso del indicador' });
  }
});

// Dashboard summary for users (with avance global calculation)
router.get('/summary_user', authenticateToken, async (req, res) => {
  try {
    const idArea = req.user.id_area;
    
    if (!idArea) {
      return res.status(400).json({ detail: 'Usuario sin área asignada' });
    }
    
    // Get all active indicators for this area
    const indicadoresResult = await pool.query(`
      SELECT 
        mp.id_indicador, mp.indicador_resultado, mp.codi, mp.logro as meta_global, mp.estado,
        s.sector, e.entidad, a.area_organizacional as area
      FROM matriz_parametro mp
      LEFT JOIN sector s ON mp.id_sector = s.id_sector
      LEFT JOIN entidad e ON mp.id_entidad = e.id_entidad
      LEFT JOIN area a ON mp.id_area = a.id_area
      WHERE mp.id_area = $1 AND mp.estado = 'ACTIVO'
      ORDER BY mp.id_indicador
    `, [idArea]);
    
    const indicadores = indicadoresResult.rows;
    
    // For each indicator, get the sum of all logrado values and calculate % logro global
    const indicadoresConAvance = await Promise.all(indicadores.map(async (ind) => {
      const sumaResult = await pool.query(`
        SELECT COALESCE(SUM(logrado), 0) as suma_logrado
        FROM rendicion
        WHERE id_indicador = $1
      `, [ind.id_indicador]);
      
      const sumaLogrado = parseFloat(sumaResult.rows[0]?.suma_logrado) || 0;
      const metaGlobal = parseFloat(ind.meta_global) || 0;
      const porcLogroGlobal = metaGlobal > 0 ? ((sumaLogrado / metaGlobal) * 100) : 0;
      
      return {
        ...ind,
        suma_logrado: sumaLogrado,
        porc_logro_global: porcLogroGlobal,
        tiene_avance: sumaLogrado > 0
      };
    }));
    
    const totalIndicadores = indicadoresConAvance.length;
    const conAvance = indicadoresConAvance.filter(i => i.tiene_avance).length;
    const sinAvance = totalIndicadores - conAvance;
    
    // Calculate avance global (average of % logro global for ALL indicators)
    const avanceGlobal = totalIndicadores > 0
      ? indicadoresConAvance.reduce((sum, i) => sum + i.porc_logro_global, 0) / totalIndicadores
      : 0;
    
    // Get context from first indicator or from area directly
    let contexto = { sector: '-', entidad: '-', area: '-' };
    if (indicadores.length > 0) {
      contexto = {
        sector: indicadores[0].sector || '-',
        entidad: indicadores[0].entidad || '-',
        area: indicadores[0].area || '-'
      };
    } else {
      // Try to get context from area table
      const areaResult = await pool.query(`
        SELECT a.area_organizacional as area, e.entidad, s.sector
        FROM area a
        LEFT JOIN entidad e ON a.id_entidad = e.id_entidad
        LEFT JOIN sector s ON e.id_sector = s.id_sector
        WHERE a.id_area = $1
      `, [idArea]);
      if (areaResult.rows.length > 0) {
        contexto = {
          sector: areaResult.rows[0].sector || '-',
          entidad: areaResult.rows[0].entidad || '-',
          area: areaResult.rows[0].area || '-'
        };
      }
    }
    
    res.json({
      contexto: contexto,
      general: {
        total_indicadores: totalIndicadores,
        con_avance: conAvance,
        sin_avance: sinAvance,
        avance_global: Math.round(avanceGlobal * 100) / 100
      },
      indicadores: indicadoresConAvance
    });
  } catch (err) {
    console.error('Dashboard user error:', err);
    res.status(500).json({ detail: 'Error al obtener dashboard de usuario' });
  }
});

module.exports = router;
