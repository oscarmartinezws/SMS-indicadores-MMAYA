const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// ========== Usuarios ==========
router.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.*, r.rol, a.area_organizacional as area 
       FROM usuario u 
       LEFT JOIN rol r ON u.id_rol = r.id_rol 
       LEFT JOIN area a ON u.id_area = a.id_area 
       ORDER BY u.id_usuario`
    );
    res.json(result.rows.map(r => ({
      id_usuario: r.id_usuario, 
      nro_documento: r.nro_documento,
      username: r.username, 
      nombre: r.nombre, 
      id_rol: r.id_rol, 
      rol: r.rol, 
      id_area: r.id_area, 
      area: r.area, 
      estado: r.estado || 'ACTIVO',
      fecha_creacion: r.fecha_creacion
    })));
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener usuarios' });
  }
});

router.post('/usuarios', async (req, res) => {
  try {
    const { username, nombre, clave, nro_documento, id_rol, id_area, estado } = req.body;
    const hashedPassword = await bcrypt.hash(clave, 10);
    const result = await pool.query(
      'INSERT INTO usuario (username, nombre, clave, nro_documento, id_rol, id_area, estado, fecha_creacion) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *',
      [username, nombre, hashedPassword, nro_documento, id_rol, id_area, estado || 'ACTIVO']
    );
    res.json({ id_usuario: result.rows[0].id_usuario, username: result.rows[0].username, nombre: result.rows[0].nombre });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al crear usuario' });
  }
});

router.put('/usuarios/:id', async (req, res) => {
  try {
    const { username, nombre, nro_documento, id_rol, id_area, estado, clave } = req.body;
    await pool.query(
      'UPDATE usuario SET username = $1, nombre = $2, nro_documento = $3, id_rol = $4, id_area = $5, estado = $6 WHERE id_usuario = $7',
      [username, nombre, nro_documento, id_rol, id_area, estado, req.params.id]
    );
    if (clave && clave.trim() !== '') {
      const hashedPassword = await bcrypt.hash(clave, 10);
      await pool.query('UPDATE usuario SET clave = $1 WHERE id_usuario = $2', [hashedPassword, req.params.id]);
    }
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al actualizar usuario' });
  }
});

router.put('/usuarios/:id/clave', async (req, res) => {
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
router.get('/roles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rol ORDER BY id_rol');
    res.json(result.rows.map(r => ({ id: r.id_rol, id_rol: r.id_rol, nombre: r.rol, rol: r.rol, estado: r.estado || 'ACTIVO' })));
  } catch (err) {
    res.status(500).json({ detail: 'Error al obtener roles' });
  }
});

router.post('/roles', async (req, res) => {
  try {
    const { rol, nombre, estado } = req.body;
    const rolName = rol || nombre; // Accept both 'rol' and 'nombre'
    const result = await pool.query('INSERT INTO rol (rol, estado) VALUES ($1, $2) RETURNING *', [rolName, estado || 'ACTIVO']);
    const newRolId = result.rows[0].id_rol;
    
    const menus = await pool.query('SELECT id_menu FROM menu');
    for (const menu of menus.rows) {
      await pool.query('INSERT INTO opciones (id_rol, id_menu, estado) VALUES ($1, $2, $3)', [newRolId, menu.id_menu, 'INACTIVO']);
    }
    
    res.json({ id_rol: newRolId, rol: result.rows[0].rol, estado: result.rows[0].estado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al crear rol' });
  }
});

router.put('/roles/:id', async (req, res) => {
  try {
    const { rol, nombre, estado } = req.body;
    const rolName = rol || nombre; // Accept both 'rol' and 'nombre'
    await pool.query('UPDATE rol SET rol = $1, estado = $2 WHERE id_rol = $3', [rolName, estado, req.params.id]);
    res.json({ message: 'Rol actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al actualizar rol' });
  }
});

// ========== Opciones (permisos por rol) ==========
router.get('/opciones/:id_rol', async (req, res) => {
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

router.put('/opciones/:id', async (req, res) => {
  try {
    const { estado } = req.body;
    const existing = await pool.query('SELECT id_opcion FROM opciones WHERE id_opcion = $1', [req.params.id]);
    if (existing.rows.length > 0) {
      await pool.query('UPDATE opciones SET estado = $1 WHERE id_opcion = $2', [estado, req.params.id]);
    }
    res.json({ message: 'Opción actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Error al actualizar opción' });
  }
});

module.exports = router;
