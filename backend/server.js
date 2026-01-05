const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = 8001;

// Middleware
app.use(cors());
app.use(express.json());

// Upload directory
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.tipo}_${uuidv4().substring(0, 8)}${ext}`);
  }
});
const upload = multer({ storage });

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'sms_mmaya_secret_key_2025_secure';
const JWT_EXPIRES = '24h';

// PostgreSQL Configuration
const pool = new Pool({
  host: '37.60.254.167',
  port: 5432,
  database: 'sms',
  user: 'admin_sibelys',
  password: 'P1c010c0#2026',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test DB connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('PostgreSQL connection error:', err);
  else console.log('PostgreSQL connected:', res.rows[0].now);
});

// ========== JWT Middleware ==========
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ detail: 'No autorizado' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ detail: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
};

// ========== API Routes ==========
app.get('/api', (req, res) => {
  res.json({ message: 'SMS API - Sistema de Monitoreo Sectorial' });
});

// ========== Authentication ==========
app.post('/api/sms/login', async (req, res) => {
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

app.get('/api/sms/verify-token', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ========== Menu ==========
app.get('/api/sms/menu/:id_rol', async (req, res) => {
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

// ========== Generic CRUD Helper ==========
const createCrudRoutes = (tableName, idField, fields) => {
  // GET all
  app.get(`/api/sms/${tableName}`, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName.replace('es', '')} ORDER BY ${idField}`);
      const rows = result.rows.map(r => ({
        id: r[idField],
        nombre: r[fields.nombre] || r.nombre || r[tableName.replace('es', '')],
        codigo: r.codigo || r.codi,
        estado: r.estado || 'ACTIVO'
      }));
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ detail: `Error al obtener ${tableName}` });
    }
  });
};

// ========== Sectores ==========
app.get('/api/sms/sectores', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sector ORDER BY id_sector');
    res.json(result.rows.map(r => ({ id: r.id_sector, nombre: r.sector, estado: r.estado || 'ACTIVO' })));
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener sectores' });
  }
});

app.post('/api/sms/sectores', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    const result = await pool.query(
      'INSERT INTO sector (sector, estado) VALUES ($1, $2) RETURNING *',
      [nombre, estado || 'ACTIVO']
    );
    res.json({ id: result.rows[0].id_sector, nombre: result.rows[0].sector, estado: result.rows[0].estado });
  } catch (err) {
    res.status(500).json({ detail: 'Error al crear sector' });
  }
});

app.put('/api/sms/sectores/:id', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    await pool.query('UPDATE sector SET sector = $1, estado = $2 WHERE id_sector = $3', [nombre, estado, req.params.id]);
    res.json({ message: 'Sector actualizado' });
  } catch (err) {
    res.status(500).json({ detail: 'Error al actualizar sector' });
  }
});

// ========== Entidades ==========
app.get('/api/sms/entidades', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM entidad ORDER BY id_entidad');
    res.json(result.rows.map(r => ({ id: r.id_entidad, nombre: r.entidad, estado: r.estado || 'ACTIVO' })));
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener entidades' });
  }
});

app.post('/api/sms/entidades', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    const result = await pool.query('INSERT INTO entidad (entidad, estado) VALUES ($1, $2) RETURNING *', [nombre, estado || 'ACTIVO']);
    res.json({ id: result.rows[0].id_entidad, nombre: result.rows[0].entidad, estado: result.rows[0].estado });
  } catch (err) {
    res.status(500).json({ detail: 'Error al crear entidad' });
  }
});

app.put('/api/sms/entidades/:id', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    await pool.query('UPDATE entidad SET entidad = $1, estado = $2 WHERE id_entidad = $3', [nombre, estado, req.params.id]);
    res.json({ message: 'Entidad actualizada' });
  } catch (err) {
    res.status(500).json({ detail: 'Error al actualizar entidad' });
  }
});

// ========== Areas ==========
app.get('/api/sms/areas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM area ORDER BY id_area');
    res.json(result.rows.map(r => ({ id: r.id_area, nombre: r.area_organizacional, estado: r.estado || 'ACTIVO' })));
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener áreas' });
  }
});

app.get('/api/sms/entidades/:id/areas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM area WHERE id_entidad = $1 ORDER BY id_area', [req.params.id]);
    res.json(result.rows.map(r => ({ id: r.id_area, nombre: r.area_organizacional, estado: r.estado || 'ACTIVO' })));
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener áreas' });
  }
});

// Alias for areas by entidad
app.get('/api/sms/areas_by_entidad/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM area WHERE id_entidad = $1 ORDER BY id_area', [req.params.id]);
    res.json(result.rows.map(r => ({ id: r.id_area, nombre: r.area_organizacional, estado: r.estado || 'ACTIVO' })));
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener áreas' });
  }
});

app.post('/api/sms/areas', async (req, res) => {
  try {
    const { nombre, id_entidad, estado } = req.body;
    const result = await pool.query('INSERT INTO area (area_organizacional, id_entidad, estado) VALUES ($1, $2, $3) RETURNING *', [nombre, id_entidad, estado || 'ACTIVO']);
    res.json({ id: result.rows[0].id_area, nombre: result.rows[0].area_organizacional, estado: result.rows[0].estado });
  } catch (err) {
    res.status(500).json({ detail: 'Error al crear área' });
  }
});

// ========== Pilares ==========
app.get('/api/sms/pilares', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pilar ORDER BY id_pilar');
    res.json(result.rows.map(r => ({ id: r.id_pilar, nombre: r.pilar, estado: r.estado || 'ACTIVO' })));
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener pilares' });
  }
});

app.post('/api/sms/pilares', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    const result = await pool.query('INSERT INTO pilar (pilar, estado) VALUES ($1, $2) RETURNING *', [nombre, estado || 'ACTIVO']);
    res.json({ id: result.rows[0].id_pilar, nombre: result.rows[0].pilar, estado: result.rows[0].estado });
  } catch (err) {
    res.status(500).json({ detail: 'Error al crear pilar' });
  }
});

app.put('/api/sms/pilares/:id', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    await pool.query('UPDATE pilar SET pilar = $1, estado = $2 WHERE id_pilar = $3', [nombre, estado, req.params.id]);
    res.json({ message: 'Pilar actualizado' });
  } catch (err) {
    res.status(500).json({ detail: 'Error al actualizar pilar' });
  }
});

// ========== Ejes ==========
app.get('/api/sms/ejes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM eje ORDER BY id_eje');
    res.json(result.rows.map(r => ({ id: r.id_eje, nombre: r.eje, estado: r.estado || 'ACTIVO' })));
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener ejes' });
  }
});

app.post('/api/sms/ejes', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    const result = await pool.query('INSERT INTO eje (eje, estado) VALUES ($1, $2) RETURNING *', [nombre, estado || 'ACTIVO']);
    res.json({ id: result.rows[0].id_eje, nombre: result.rows[0].eje, estado: result.rows[0].estado });
  } catch (err) {
    res.status(500).json({ detail: 'Error al crear eje' });
  }
});

app.put('/api/sms/ejes/:id', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    await pool.query('UPDATE eje SET eje = $1, estado = $2 WHERE id_eje = $3', [nombre, estado, req.params.id]);
    res.json({ message: 'Eje actualizado' });
  } catch (err) {
    res.status(500).json({ detail: 'Error al actualizar eje' });
  }
});

// ========== Metas ==========
app.get('/api/sms/metas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meta ORDER BY id_meta');
    res.json(result.rows.map(r => ({ id: r.id_meta, codigo: r.codi_meta, nombre: r.meta, estado: r.estado || 'ACTIVO' })));
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener metas' });
  }
});

app.post('/api/sms/metas', async (req, res) => {
  try {
    const { codigo, nombre, estado } = req.body;
    const result = await pool.query('INSERT INTO meta (codi_meta, meta, estado) VALUES ($1, $2, $3) RETURNING *', [codigo, nombre, estado || 'ACTIVO']);
    res.json({ id: result.rows[0].id_meta, codigo: result.rows[0].codi_meta, nombre: result.rows[0].meta, estado: result.rows[0].estado });
  } catch (err) {
    res.status(500).json({ detail: 'Error al crear meta' });
  }
});

app.put('/api/sms/metas/:id', async (req, res) => {
  try {
    const { codigo, nombre, estado } = req.body;
    await pool.query('UPDATE meta SET codi_meta = $1, meta = $2, estado = $3 WHERE id_meta = $4', [codigo, nombre, estado, req.params.id]);
    res.json({ message: 'Meta actualizada' });
  } catch (err) {
    res.status(500).json({ detail: 'Error al actualizar meta' });
  }
});

// ========== Resultados ==========
app.get('/api/sms/resultados', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resultado ORDER BY id_resultado');
    res.json(result.rows.map(r => ({ id: r.id_resultado, codigo: r.codi_resultado, nombre: r.resultado, estado: r.estado || 'ACTIVO' })));
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener resultados' });
  }
});

app.post('/api/sms/resultados', async (req, res) => {
  try {
    const { codigo, nombre, estado } = req.body;
    const result = await pool.query('INSERT INTO resultado (codi_resultado, resultado, estado) VALUES ($1, $2, $3) RETURNING *', [codigo, nombre, estado || 'ACTIVO']);
    res.json({ id: result.rows[0].id_resultado, codigo: result.rows[0].codi_resultado, nombre: result.rows[0].resultado, estado: result.rows[0].estado });
  } catch (err) {
    res.status(500).json({ detail: 'Error al crear resultado' });
  }
});

app.put('/api/sms/resultados/:id', async (req, res) => {
  try {
    const { codigo, nombre, estado } = req.body;
    await pool.query('UPDATE resultado SET codi_resultado = $1, resultado = $2, estado = $3 WHERE id_resultado = $4', [codigo, nombre, estado, req.params.id]);
    res.json({ message: 'Resultado actualizado' });
  } catch (err) {
    res.status(500).json({ detail: 'Error al actualizar resultado' });
  }
});

// ========== Acciones ==========
app.get('/api/sms/acciones', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM accion ORDER BY id_accion');
    res.json(result.rows.map(r => ({ id: r.id_accion, codigo: r.codi_accion, nombre: r.accion, estado: r.estado || 'ACTIVO' })));
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener acciones' });
  }
});

app.post('/api/sms/acciones', async (req, res) => {
  try {
    const { codigo, nombre, estado } = req.body;
    const result = await pool.query('INSERT INTO accion (codi_accion, accion, estado) VALUES ($1, $2, $3) RETURNING *', [codigo, nombre, estado || 'ACTIVO']);
    res.json({ id: result.rows[0].id_accion, codigo: result.rows[0].codi_accion, nombre: result.rows[0].accion, estado: result.rows[0].estado });
  } catch (err) {
    res.status(500).json({ detail: 'Error al crear acción' });
  }
});

app.put('/api/sms/acciones/:id', async (req, res) => {
  try {
    const { codigo, nombre, estado } = req.body;
    await pool.query('UPDATE accion SET codi_accion = $1, accion = $2, estado = $3 WHERE id_accion = $4', [codigo, nombre, estado, req.params.id]);
    res.json({ message: 'Acción actualizada' });
  } catch (err) {
    res.status(500).json({ detail: 'Error al actualizar acción' });
  }
});

// ========== Matriz Parametros (Indicadores) ==========
// Get all indicadores with related names for display
app.get('/api/sms/indicadores_full', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        mp.*,
        e.entidad,
        a.area_organizacional,
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

app.get('/api/sms/matriz_parametros', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM matriz_parametro ORDER BY id_indicador';
    let params = [];
    
    // Filter by area if not admin
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

app.get('/api/sms/indicadores/area/:id_area', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM matriz_parametro WHERE id_area = $1 ORDER BY id_indicador', [req.params.id_area]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener indicadores' });
  }
});

app.post('/api/sms/matriz_parametros', async (req, res) => {
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

app.put('/api/sms/matriz_parametros/:id', async (req, res) => {
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

// ========== Usuarios ==========
app.get('/api/sms/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.*, r.rol, a.area_organizacional as area 
       FROM usuario u 
       LEFT JOIN rol r ON u.id_rol = r.id_rol 
       LEFT JOIN area a ON u.id_area = a.id_area 
       ORDER BY u.id_usuario`
    );
    res.json(result.rows.map(r => ({
      id: r.id_usuario, usuario: r.username, nombre: r.nombre, id_rol: r.id_rol, rol: r.rol, id_area: r.id_area, area: r.area, estado: r.estado || 'ACTIVO'
    })));
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener usuarios' });
  }
});

app.post('/api/sms/usuarios', async (req, res) => {
  try {
    const { usuario, nombre, clave, id_rol, id_area, estado } = req.body;
    const hashedPassword = await bcrypt.hash(clave, 10);
    const result = await pool.query(
      'INSERT INTO usuario (username, nombre, clave, id_rol, id_area, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [usuario, nombre, hashedPassword, id_rol, id_area, estado || 'ACTIVO']
    );
    res.json({ id: result.rows[0].id_usuario, usuario: result.rows[0].username, nombre: result.rows[0].nombre });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al crear usuario' });
  }
});

app.put('/api/sms/usuarios/:id', async (req, res) => {
  try {
    const { usuario, nombre, id_rol, id_area, estado } = req.body;
    await pool.query(
      'UPDATE usuario SET username = $1, nombre = $2, id_rol = $3, id_area = $4, estado = $5 WHERE id_usuario = $6',
      [usuario, nombre, id_rol, id_area, estado, req.params.id]
    );
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    res.status(500).json({ detail: 'Error al actualizar usuario' });
  }
});

app.put('/api/sms/usuarios/:id/clave', async (req, res) => {
  try {
    const { clave } = req.body;
    const hashedPassword = await bcrypt.hash(clave, 10);
    await pool.query('UPDATE usuario SET clave = $1 WHERE id_usuario = $2', [hashedPassword, req.params.id]);
    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ detail: 'Error al actualizar contraseña' });
  }
});

// ========== Roles ==========
app.get('/api/sms/roles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rol ORDER BY id_rol');
    res.json(result.rows.map(r => ({ id: r.id_rol, id_rol: r.id_rol, nombre: r.rol, rol: r.rol, estado: r.estado || 'ACTIVO' })));
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener roles' });
  }
});

app.post('/api/sms/roles', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    const result = await pool.query('INSERT INTO rol (rol, estado) VALUES ($1, $2) RETURNING *', [nombre, estado || 'ACTIVO']);
    const newRolId = result.rows[0].id_rol;
    
    // Create opciones entries for new role (for all menu items)
    const menus = await pool.query('SELECT id_menu FROM menu');
    for (const menu of menus.rows) {
      await pool.query('INSERT INTO opciones (id_rol, id_menu, estado) VALUES ($1, $2, $3)', [newRolId, menu.id_menu, 'INACTIVO']);
    }
    
    res.json({ id: newRolId, nombre: result.rows[0].rol, estado: result.rows[0].estado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al crear rol' });
  }
});

app.put('/api/sms/roles/:id', async (req, res) => {
  try {
    const { nombre, estado } = req.body;
    await pool.query('UPDATE rol SET rol = $1, estado = $2 WHERE id_rol = $3', [nombre, estado, req.params.id]);
    res.json({ message: 'Rol actualizado' });
  } catch (err) {
    res.status(500).json({ detail: 'Error al actualizar rol' });
  }
});

// ========== Opciones (permisos por rol) ==========
app.get('/api/sms/opciones/:id_rol', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id_menu, m.opcion, m.enlace, m.tipo_opcion, m.id_padre, 
              o.id_opcion, o.estado
       FROM menu m
       LEFT JOIN opciones o ON m.id_menu = o.id_menu AND o.id_rol = $1
       ORDER BY m.id_menu`, [req.params.id_rol]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener opciones' });
  }
});

app.put('/api/sms/opciones/:id', async (req, res) => {
  try {
    const { estado, id_rol } = req.body;
    // Check if exists
    const existing = await pool.query(
      'SELECT id_opcion FROM opciones WHERE id_opcion = $1', [req.params.id]
    );
    if (existing.rows.length > 0) {
      await pool.query('UPDATE opciones SET estado = $1 WHERE id_opcion = $2', [estado, req.params.id]);
    }
    res.json({ message: 'Opción actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al actualizar opción' });
  }
});

// ========== Menu Admin ==========
app.get('/api/sms/menu_admin', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id_menu, m.opcion, m.enlace, m.tipo_opcion, m.id_padre, m.estado,
              o.id_opcion, o.id_rol, o.estado as opcion_estado
       FROM menu m
       LEFT JOIN opciones o ON m.id_menu = o.id_menu
       ORDER BY m.id_menu`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al obtener menú admin' });
  }
});

app.post('/api/sms/menu', async (req, res) => {
  try {
    const { opcion, enlace, tipo_opcion, id_padre } = req.body;
    const menuResult = await pool.query(
      'INSERT INTO menu (opcion, enlace, tipo_opcion, id_padre) VALUES ($1, $2, $3, $4) RETURNING *',
      [opcion, enlace, tipo_opcion, id_padre]
    );
    const newMenuId = menuResult.rows[0].id_menu;
    
    // Create opciones entries for all roles
    const roles = await pool.query('SELECT id_rol FROM rol');
    for (const rol of roles.rows) {
      await pool.query('INSERT INTO opciones (id_rol, id_menu, estado) VALUES ($1, $2, $3)', [rol.id_rol, newMenuId, 'INACTIVO']);
    }
    
    res.json({ id_menu: newMenuId, opcion, enlace, tipo_opcion, id_padre });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al crear menú' });
  }
});

app.put('/api/sms/menu/:id', async (req, res) => {
  try {
    const { opcion, enlace, tipo_opcion, id_padre } = req.body;
    await pool.query(
      'UPDATE menu SET opcion = $1, enlace = $2, tipo_opcion = $3, id_padre = $4 WHERE id_menu = $5',
      [opcion, enlace, tipo_opcion, id_padre, req.params.id]
    );
    res.json({ message: 'Menú actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al actualizar menú' });
  }
});

// ========== Contexto Usuario ==========
app.get('/api/sms/contexto_usuario/:id_area', async (req, res) => {
  try {
    const idArea = parseInt(req.params.id_area);
    if (isNaN(idArea)) {
      return res.json({ area: '-', entidad: '-', sector: '-' });
    }
    
    // Get context from matriz_parametro which has all the relationships
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
      // Fallback to just area name
      const areaResult = await pool.query(
        'SELECT area_organizacional as area FROM area WHERE id_area = $1', [idArea]
      );
      res.json({
        area: areaResult.rows[0]?.area || '-',
        entidad: '-',
        sector: '-'
      });
    }
  } catch (err) {
    console.error('Contexto error:', err);
    res.json({ area: '-', entidad: '-', sector: '-' });
  }
});

// ========== Dashboard ==========
app.get('/api/sms/dashboard/summary', authenticateToken, async (req, res) => {
  try {
    const { year, id_sector, id_entidad, id_area } = req.query;
    
    // Build filters
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
    
    // Non-admin filter
    if (req.user.rol !== 'ADMINISTRADOR' && req.user.id_area) {
      filters.push(`mp.id_area = $${paramIdx++}`);
      params.push(req.user.id_area);
      mpFilters.push(`mp.id_area = $${mpParamIdx++}`);
      mpParams.push(req.user.id_area);
    }
    
    const whereClause = filters.length > 0 ? filters.join(' AND ') : '1=1';
    const mpWhereClause = mpFilters.length > 0 ? mpFilters.join(' AND ') : '1=1';
    
    // Get total indicators
    const totalResult = await pool.query(
      `SELECT COUNT(DISTINCT mp.id_indicador) as total FROM matriz_parametro mp WHERE ${mpWhereClause}`,
      mpParams
    );
    
    // Get indicators with rendition data
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
    
    // Process summaries
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

app.get('/api/sms/dashboard/years', async (req, res) => {
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

// ========== Rendicion ==========
app.get('/api/sms/rendicion/:id_indicador/:gestion', async (req, res) => {
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

app.post('/api/sms/rendicion', async (req, res) => {
  try {
    const { id_indicador, gestion, ...data } = req.body;
    
    // Check if exists
    const existing = await pool.query(
      'SELECT id_rendicion FROM rendicion WHERE id_indicador = $1 AND gestion = $2',
      [id_indicador, gestion]
    );
    
    if (existing.rows.length > 0) {
      // Update
      const updates = Object.entries(data).map(([k, v], i) => `${k} = $${i + 1}`).join(', ');
      const values = [...Object.values(data), id_indicador, gestion];
      await pool.query(
        `UPDATE rendicion SET ${updates} WHERE id_indicador = $${values.length - 1} AND gestion = $${values.length}`,
        values
      );
      res.json({ message: 'Rendición actualizada' });
    } else {
      // Insert
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

// ========== Configuracion ==========
app.get('/api/sms/configuracion', async (req, res) => {
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

app.post('/api/sms/configuracion', async (req, res) => {
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

app.get('/api/sms/configuracion/years', async (req, res) => {
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

app.post('/api/sms/configuracion/upload/:tipo', upload.single('file'), async (req, res) => {
  try {
    const { tipo } = req.params;
    if (!['favicon', 'logo', 'adjunto'].includes(tipo)) {
      return res.status(400).json({ detail: "Tipo debe ser 'favicon', 'logo' o 'adjunto'" });
    }
    
    if (!req.file) {
      return res.status(400).json({ detail: 'No se recibió archivo' });
    }
    
    const fileUrl = `/api/sms/uploads/${req.file.filename}`;
    
    // Only update config for favicon and logo
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

app.get('/api/sms/uploads/:filename', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ detail: 'Archivo no encontrado' });
  }
});

// ========== Start Server ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SMS Backend (Node.js/Express) running on http://0.0.0.0:${PORT}`);
});
