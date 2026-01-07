const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const catalogosRoutes = require('./routes/catalogos');
const entidadesRoutes = require('./routes/entidades');
const usuariosRoutes = require('./routes/usuarios');
const menuRoutes = require('./routes/menu');
const indicadoresRoutes = require('./routes/indicadores');
const rendicionRoutes = require('./routes/rendicion');
const dashboardRoutes = require('./routes/dashboard');
const configuracionRoutes = require('./routes/configuracion');

const app = express();
const PORT = 8001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/api/sms/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api', (req, res) => {
  res.json({ status: 'ok', service: 'SMS Backend (Node.js/Express)', version: '2.0.0' });
});

// Mount routes
app.use('/api/sms', authRoutes);
app.use('/api/sms', catalogosRoutes);
app.use('/api/sms', entidadesRoutes);
app.use('/api/sms', usuariosRoutes);
app.use('/api/sms', menuRoutes);
app.use('/api/sms', indicadoresRoutes);
app.use('/api/sms/rendicion', rendicionRoutes);
app.use('/api/sms/dashboard', dashboardRoutes);
app.use('/api/sms/configuracion', configuracionRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ detail: 'Error interno del servidor' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SMS Backend (Node.js/Express) v2.0 running on http://0.0.0.0:${PORT}`);
  console.log('Routes loaded: auth, catalogos, entidades, usuarios, menu, indicadores, rendicion, dashboard, configuracion');
});
