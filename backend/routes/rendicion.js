const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('../config/db');

// File upload configuration
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Sum of PROGRAMADO across all years + LINEA BASE
router.get('/suma_programado/:id_indicador', async (req, res) => {
  try {
    // Get sum of programado from rendicion
    const sumResult = await pool.query(
      'SELECT COALESCE(SUM(programado), 0) as suma_programado FROM rendicion WHERE id_indicador = $1',
      [req.params.id_indicador]
    );
    
    // Get linea_base from matriz_parametro
    const lineaBaseResult = await pool.query(
      'SELECT COALESCE(linea_base, 0) as linea_base FROM matriz_parametro WHERE id_indicador = $1',
      [req.params.id_indicador]
    );
    
    const sumaProgramado = parseFloat(sumResult.rows[0].suma_programado) || 0;
    const lineaBase = parseFloat(lineaBaseResult.rows[0]?.linea_base) || 0;
    
    res.json({ 
      suma_programado: sumaProgramado + lineaBase,
      suma_programado_sin_lb: sumaProgramado,
      linea_base: lineaBase,
      incluye_linea_base: true
    });
  } catch (err) {
    console.error('Error getting suma programado:', err);
    res.status(500).json({ detail: 'Error al obtener suma programado' });
  }
});

// Sum of LOGRADO across all years + LINEA BASE (only if there's actual progress)
router.get('/suma_logrado/:id_indicador', async (req, res) => {
  try {
    // Get sum of logrado from rendicion
    const sumResult = await pool.query(
      'SELECT COALESCE(SUM(logrado), 0) as suma_logrado FROM rendicion WHERE id_indicador = $1',
      [req.params.id_indicador]
    );
    
    // Get linea_base from matriz_parametro
    const lineaBaseResult = await pool.query(
      'SELECT COALESCE(linea_base, 0) as linea_base FROM matriz_parametro WHERE id_indicador = $1',
      [req.params.id_indicador]
    );
    
    const sumaLogradoSinLB = parseFloat(sumResult.rows[0].suma_logrado) || 0;
    const lineaBase = parseFloat(lineaBaseResult.rows[0]?.linea_base) || 0;
    
    // Only include linea_base if there's actual progress (suma_logrado_sin_lb > 0)
    const tieneAvance = sumaLogradoSinLB > 0;
    const sumaLogradoConLB = tieneAvance ? (sumaLogradoSinLB + lineaBase) : 0;
    
    res.json({ 
      suma_logrado: sumaLogradoConLB,
      suma_logrado_sin_lb: sumaLogradoSinLB,
      linea_base: lineaBase,
      tiene_avance: tieneAvance,
      incluye_linea_base: tieneAvance
    });
  } catch (err) {
    console.error('Error getting suma logrado:', err);
    res.status(500).json({ detail: 'Error al obtener suma logrado' });
  }
});

// Get rendicion by indicator and year
router.get('/:id_indicador/:gestion', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM rendicion WHERE id_indicador = $1 AND gestion = $2',
      [req.params.id_indicador, req.params.gestion]
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener rendición' });
  }
});

// Create/Update rendicion
router.post('/', async (req, res) => {
  try {
    const { id_indicador, gestion, ...data } = req.body;
    
    const existing = await pool.query(
      'SELECT id_rendicion FROM rendicion WHERE id_indicador = $1 AND gestion = $2',
      [id_indicador, gestion]
    );
    
    if (existing.rows.length > 0) {
      const updates = Object.entries(data).map(([k, v], i) => `${k} = $${i + 1}`).join(', ');
      const values = [...Object.values(data), id_indicador, gestion];
      await pool.query(
        `UPDATE rendicion SET ${updates} WHERE id_indicador = $${values.length - 1} AND gestion = $${values.length}`,
        values
      );
      res.json({ message: 'Rendición actualizada' });
    } else {
      const fields = ['id_indicador', 'gestion', ...Object.keys(data)];
      const values = [id_indicador, gestion, ...Object.values(data)];
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      await pool.query(`INSERT INTO rendicion (${fields.join(', ')}) VALUES (${placeholders})`, values);
      res.json({ message: 'Rendición creada' });
    }
  } catch (err) {
    console.error('Rendicion error:', err);
    res.status(500).json({ detail: 'Error al guardar rendición' });
  }
});

// Update only PROGRAMADO
router.post('/programado', async (req, res) => {
  try {
    const { id_indicador, gestion, programado } = req.body;
    
    const indicador = await pool.query('SELECT id_area FROM matriz_parametro WHERE id_indicador = $1', [id_indicador]);
    if (indicador.rows.length === 0) {
      return res.status(404).json({ detail: 'Indicador no encontrado' });
    }
    
    const id_area = indicador.rows[0].id_area;
    
    const existing = await pool.query(
      'SELECT id_rendicion FROM rendicion WHERE id_indicador = $1 AND gestion = $2',
      [id_indicador, gestion]
    );
    
    if (existing.rows.length > 0) {
      await pool.query('UPDATE rendicion SET programado = $1 WHERE id_indicador = $2 AND gestion = $3', [programado, id_indicador, gestion]);
    } else {
      await pool.query(
        'INSERT INTO rendicion (id_indicador, gestion, programado, id_area, estado_indicador) VALUES ($1, $2, $3, $4, $5)',
        [id_indicador, gestion, programado, id_area, 'PENDIENTE']
      );
    }
    
    res.json({ message: 'Programado guardado', programado });
  } catch (err) {
    console.error('Error saving programado:', err);
    res.status(500).json({ detail: 'Error al guardar programado' });
  }
});

// ========== Adjuntos ==========
router.get('/adjuntos/:id_indicador/:gestion', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre_original as nombre, descripcion, nombre_almacenado as url, 
              tamano_bytes as size, fecha_carga 
       FROM archivos_rendicion 
       WHERE id_indicador = $1 AND gestion = $2 
       ORDER BY fecha_carga DESC`,
      [req.params.id_indicador, req.params.gestion]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting adjuntos:', err);
    res.status(500).json({ detail: 'Error al obtener archivos adjuntos' });
  }
});

router.post('/adjuntos', upload.single('file'), async (req, res) => {
  try {
    const { id_indicador, gestion, nombre, descripcion } = req.body;
    
    if (!id_indicador || !gestion) {
      return res.status(400).json({ detail: 'id_indicador y gestion son requeridos' });
    }
    
    let nombreOriginal = nombre || 'Sin nombre';
    let nombreAlmacenado = '';
    let tamanoBytes = 0;
    
    if (req.file) {
      nombreOriginal = nombre || req.file.originalname;
      nombreAlmacenado = `/api/sms/uploads/${req.file.filename}`;
      tamanoBytes = req.file.size;
    } else if (req.body.url) {
      nombreAlmacenado = req.body.url;
      tamanoBytes = 0;
    } else {
      return res.status(400).json({ detail: 'Se requiere un archivo o URL' });
    }
    
    const result = await pool.query(
      `INSERT INTO archivos_rendicion 
       (id, id_indicador, gestion, nombre_original, nombre_almacenado, descripcion, tamano_bytes, fecha_carga)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, nombre_original as nombre, descripcion, nombre_almacenado as url, tamano_bytes as size, fecha_carga`,
      [id_indicador, gestion, nombreOriginal, nombreAlmacenado, descripcion || '', tamanoBytes]
    );
    
    res.json({ message: 'Archivo guardado', archivo: result.rows[0] });
  } catch (err) {
    console.error('Error saving adjunto:', err);
    res.status(500).json({ detail: 'Error al guardar archivo adjunto' });
  }
});

router.delete('/adjuntos/:id', async (req, res) => {
  try {
    const fileInfo = await pool.query('SELECT nombre_almacenado FROM archivos_rendicion WHERE id = $1', [req.params.id]);
    
    if (fileInfo.rows.length === 0) {
      return res.status(404).json({ detail: 'Archivo no encontrado' });
    }
    
    await pool.query('DELETE FROM archivos_rendicion WHERE id = $1', [req.params.id]);
    
    const url = fileInfo.rows[0].nombre_almacenado;
    if (url && url.startsWith('/api/sms/uploads/')) {
      const filename = url.replace('/api/sms/uploads/', '');
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.json({ message: 'Archivo eliminado' });
  } catch (err) {
    console.error('Error deleting adjunto:', err);
    res.status(500).json({ detail: 'Error al eliminar archivo' });
  }
});

module.exports = router;
