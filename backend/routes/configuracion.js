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

// Get configuration
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT clave, valor FROM configuracion_sistema');
    const config = {};
    const defaults = {
      plan_anio_inicio: 2020, plan_anio_fin: 2025, favicon_url: '', logo_url: '',
      logo_width: 40, logo_height: 40, color_theme: 'negro', modo: 'claro',
      copyright_text: '© 2025 - Sistema de Monitoreo Sectorial'
    };
    
    result.rows.forEach(row => {
      const key = row.clave;
      const value = row.valor;
      if (['plan_anio_inicio', 'plan_anio_fin', 'logo_width', 'logo_height'].includes(key)) {
        config[key] = parseInt(value) || 0;
      } else {
        config[key] = value || '';
      }
    });
    
    res.json({ ...defaults, ...config });
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener configuración' });
  }
});

// Save configuration
router.post('/', async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await pool.query(
        `INSERT INTO configuracion_sistema (clave, valor, fecha_modificacion) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (clave) DO UPDATE SET valor = $2, fecha_modificacion = CURRENT_TIMESTAMP`,
        [key, String(value)]
      );
    }
    res.json({ message: 'Configuración guardada', config: req.body });
  } catch (err) {
    res.status(500).json({ detail: 'Error al guardar configuración' });
  }
});

// Get years range
router.get('/years', async (req, res) => {
  try {
    const startResult = await pool.query("SELECT valor FROM configuracion_sistema WHERE clave = 'plan_anio_inicio'");
    const endResult = await pool.query("SELECT valor FROM configuracion_sistema WHERE clave = 'plan_anio_fin'");
    
    const start = startResult.rows[0]?.valor ? parseInt(startResult.rows[0].valor) : 2020;
    const end = endResult.rows[0]?.valor ? parseInt(endResult.rows[0].valor) : 2025;
    
    const years = [];
    for (let y = start; y <= end; y++) years.push(y);
    res.json(years);
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener años' });
  }
});

// Upload file
router.post('/upload/:tipo', upload.single('file'), async (req, res) => {
  try {
    const { tipo } = req.params;
    if (!['favicon', 'logo', 'adjunto'].includes(tipo)) {
      return res.status(400).json({ detail: "Tipo debe ser 'favicon', 'logo' o 'adjunto'" });
    }
    
    if (!req.file) {
      return res.status(400).json({ detail: 'No se recibió archivo' });
    }
    
    const fileUrl = `/api/sms/uploads/${req.file.filename}`;
    
    if (tipo !== 'adjunto') {
      await pool.query(
        `INSERT INTO configuracion_sistema (clave, valor, fecha_modificacion) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (clave) DO UPDATE SET valor = $2, fecha_modificacion = CURRENT_TIMESTAMP`,
        [`${tipo}_url`, fileUrl]
      );
    }
    
    res.json({ message: `${tipo} subido correctamente`, url: fileUrl, filename: req.file.filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al subir archivo' });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ detail: 'Archivo no encontrado' });
  }
});

module.exports = router;
