import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import html2pdf from 'html2pdf.js';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Theme Context
const ThemeContext = createContext();

// Color Themes
const colorThemes = {
  negro: { primary: '#000000', primaryHover: '#333333', accent: '#09AA5B' },
  azul: { primary: '#0066CC', primaryHover: '#004C99', accent: '#00A3E0' },
  rosa: { primary: '#FF5A5F', primaryHover: '#E04E52', accent: '#FF385C' }
};

// Base styles
const baseStyles = {
  white: '#FFFFFF',
  gray100: '#F6F6F6',
  gray200: '#EEEEEE',
  gray300: '#E2E2E2',
  gray400: '#CACACA',
  gray500: '#A0A0A0',
  gray600: '#6B6B6B',
  gray700: '#545454',
  gray800: '#333333',
  gray900: '#1A1A1A',
  green: '#09AA5B',
  red: '#E11900',
  blue: '#0066CC',
};

// Generate styles based on theme
const getStyles = (colorTheme = 'negro', modo = 'claro') => {
  const theme = colorThemes[colorTheme] || colorThemes.negro;
  const isDark = modo === 'oscuro';
  
  return {
    ...baseStyles,
    black: theme.primary,
    primary: theme.primary,
    primaryHover: theme.primaryHover,
    accent: theme.accent,
    // Dark mode overrides
    ...(isDark ? {
      white: '#1A1A1A',
      gray100: '#2A2A2A',
      gray200: '#3A3A3A',
      gray300: '#4A4A4A',
      gray600: '#AAAAAA',
      gray700: '#BBBBBB',
      textColor: '#FFFFFF',
      bgColor: '#121212'
    } : {
      textColor: '#000000',
      bgColor: '#F6F6F6'
    })
  };
};

// Default styles (will be overridden by context)
let styles = getStyles('negro', 'claro');

// Table styles - compact
const rowStyle = { padding: '6px 10px', fontSize: '0.8rem', verticalAlign: 'middle' };
const headerStyle = { background: styles.black, color: styles.white, padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase' };

// Login Component
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError('Complete todos los campos'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/sms/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (res.ok && data.token) { localStorage.setItem('sms_token', data.token); localStorage.setItem('sms_user', JSON.stringify(data.user)); onLogin(data.user, data.token); }
      else { setError(data.detail || data.error || 'Credenciales incorrectas'); }
    } catch (err) { console.error(err); setError('Error de conexión'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: styles.black, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: styles.white, borderRadius: 16, padding: '48px 40px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, background: styles.black, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <span style={{ fontSize: 28, color: styles.white }}>📊</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: styles.black }}>SMS</div>
          <div style={{ fontSize: '0.85rem', color: styles.gray600, marginTop: 8 }}>Sistema de Monitoreo Sectorial</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Usuario</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ingrese su usuario" style={{ width: '100%', padding: 14, fontSize: '1rem', border: `2px solid ${styles.gray300}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingrese su contraseña" style={{ width: '100%', padding: 14, fontSize: '1rem', border: `2px solid ${styles.gray300}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, fontSize: '1rem', fontWeight: 600, background: styles.black, color: styles.white, border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginTop: 8 }}>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</button>
          {error && <div style={{ background: '#FEE2E2', color: styles.red, padding: '12px 16px', borderRadius: 8, marginTop: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}><span>⚠️</span> {error}</div>}
        </form>
        <div style={{ textAlign: 'center', marginTop: 32, fontSize: '0.8rem', color: styles.gray500 }}>© 2025 - Todos los derechos reservados</div>
      </div>
    </div>
  );
}

// Sidebar Component with Accordion
function Sidebar({ user, menuItems, activeView, setActiveView, collapsed, siteConfig }) {
  const [expandedGroups, setExpandedGroups] = useState({});
  const currentStyles = getStyles(siteConfig?.color_theme || 'negro', siteConfig?.modo || 'claro');
  const isAdmin = user?.rol === 'ADMINISTRADOR';
  
  const getIcon = (name) => {
    const icons = { 'CONFIGURACION': '⚙️', 'PARAMETRICAS': '📋', 'OPERACIONES': '📈', 'Usuarios': '👥', 'Roles': '🔐', 'Rol': '🔐', 'Menu': '☰', 'Sector': '🏭', 'Entidad': '🏛️', 'Pilar': '🏛️', 'Eje': '↔️', 'Meta': '🎯', 'Resultado': '📊', 'Acción': '⚡', 'Banco de Indicadores': '💾', 'Rendición de Cuentas': '📑', 'Seguimiento': '📑' };
    return icons[name] || '📄';
  };
  const toggleGroup = (groupId) => setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  const activeMenuItems = menuItems.filter(item => item.estado === 'ACTIVO');
  const groups = {}; const separators = [];
  activeMenuItems.forEach(item => { if (item.tipo_opcion === 'separador') { separators.push(item); groups[item.id_menu] = []; } });
  activeMenuItems.forEach(item => { if (item.tipo_opcion === 'opcion' && item.id_padre && groups[item.id_padre] !== undefined) groups[item.id_padre].push(item); });
  const visibleSeparators = separators.filter(sep => groups[sep.id_menu]?.length > 0);

  return (
    <div style={{ width: collapsed ? 60 : 260, minHeight: '100vh', background: currentStyles.primary, position: 'fixed', left: 0, top: 0, transition: 'width 0.3s ease', zIndex: 1000, overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '16px 14px', borderBottom: `1px solid ${currentStyles.gray800}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        {siteConfig?.logo_url ? (
          <img src={siteConfig.logo_url.startsWith('/') ? API_URL + siteConfig.logo_url : siteConfig.logo_url} alt="Logo" style={{ width: siteConfig.logo_width || 32, height: siteConfig.logo_height || 32, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <div style={{ width: 32, height: 32, background: '#FFFFFF', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: 16 }}>📊</span></div>
        )}
        {!collapsed && <div><div style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.8rem' }}>SMS</div><div style={{ color: currentStyles.gray500, fontSize: '0.6rem' }}>Monitoreo Sectorial</div></div>}
      </div>
      <div onClick={() => setActiveView('home')} style={{ padding: '8px 14px', color: activeView === 'home' ? '#FFFFFF' : currentStyles.gray400, background: activeView === 'home' ? currentStyles.primaryHover : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}><span>🏠</span>{!collapsed && <span>Inicio</span>}</div>
      {visibleSeparators.map(sep => (
        <div key={sep.id_menu}>
          <div onClick={() => toggleGroup(sep.id_menu)} style={{ padding: '8px 14px', background: currentStyles.gray900, color: '#FFFFFF', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>{getIcon(sep.opcion)}</span>{!collapsed && <span>{sep.opcion}</span>}</div>
            {!collapsed && <span style={{ fontSize: '0.55rem', transition: 'transform 0.2s', transform: expandedGroups[sep.id_menu] ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>}
          </div>
          {!collapsed && expandedGroups[sep.id_menu] && groups[sep.id_menu]?.map(item => (
            <div key={item.id_menu} onClick={() => item.enlace && setActiveView(item.enlace)} style={{ padding: '6px 14px 6px 40px', color: activeView === item.enlace ? '#FFFFFF' : currentStyles.gray400, background: activeView === item.enlace ? currentStyles.primaryHover : 'transparent', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.15s ease' }}>{item.opcion}</div>
          ))}
        </div>
      ))}
      {/* Config button for Admin only */}
      {isAdmin && (
        <div onClick={() => setActiveView('loadConfiguracionView')} style={{ padding: '8px 14px', color: activeView === 'loadConfiguracionView' ? '#FFFFFF' : currentStyles.gray400, background: activeView === 'loadConfiguracionView' ? currentStyles.primaryHover : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', marginTop: 8, borderTop: `1px solid ${currentStyles.gray800}` }}><span>⚙️</span>{!collapsed && <span>Configuración del Sistema</span>}</div>
      )}
    </div>
  );
}

// Generic CRUD Table Component
// Entidades y Areas View - Two sections
function EntidadesAreasView() {
  const [entidades, setEntidades] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntidad, setSelectedEntidad] = useState(null);
  const [showEntidadModal, setShowEntidadModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});

  // Fetch entidades
  const fetchEntidades = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sms/entidades`);
      setEntidades(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Fetch areas for selected entidad
  const fetchAreas = async (entidadId) => {
    try {
      const res = await fetch(`${API_URL}/api/sms/areas_by_entidad/${entidadId}`);
      if (res.ok) {
        setAreas(await res.json());
      } else {
        setAreas([]);
      }
    } catch (err) { console.error(err); setAreas([]); }
  };

  useEffect(() => { fetchEntidades(); }, []);

  useEffect(() => {
    if (selectedEntidad) {
      fetchAreas(selectedEntidad.id);
    } else {
      setAreas([]);
    }
  }, [selectedEntidad]);

  // Entidad modal handlers
  const openEntidadModal = (item = null) => {
    setEditItem(item);
    setFormData(item ? { ...item } : { nombre: '', estado: 'ACTIVO' });
    setShowEntidadModal(true);
  };

  const saveEntidad = async () => {
    try {
      const method = editItem ? 'PUT' : 'POST';
      const url = editItem ? `${API_URL}/api/sms/entidades/${editItem.id}` : `${API_URL}/api/sms/entidades`;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { setShowEntidadModal(false); fetchEntidades(); }
      else { const err = await res.json(); alert(err.detail || 'Error'); }
    } catch (err) { alert('Error'); }
  };

  // Area modal handlers
  const openAreaModal = (item = null) => {
    setEditItem(item);
    setFormData(item ? { ...item } : { nombre: '', id_entidad: selectedEntidad?.id, estado: 'ACTIVO' });
    setShowAreaModal(true);
  };

  const saveArea = async () => {
    try {
      const payload = { ...formData, id_entidad: selectedEntidad?.id };
      const method = editItem ? 'PUT' : 'POST';
      const url = editItem ? `${API_URL}/api/sms/areas/${editItem.id}` : `${API_URL}/api/sms/areas`;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { setShowAreaModal(false); fetchAreas(selectedEntidad.id); }
      else { const err = await res.json(); alert(err.detail || 'Error'); }
    } catch (err) { alert('Error'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Section 1: Entidades */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, background: styles.black, padding: '10px 14px', borderRadius: '6px 6px 0 0' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: styles.white, margin: 0 }}>ENTIDAD</h3>
          <button onClick={() => openEntidadModal()} style={{ padding: '6px 14px', background: styles.green, color: styles.white, border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem' }}>+ Adicionar</button>
        </div>
        <div style={{ background: styles.white, borderRadius: '0 0 6px 6px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxHeight: 400, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: styles.gray100 }}>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, width: 40 }}>#</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>NOMBRE DE LA ENTIDAD</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, width: 80 }}>ESTADO</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, width: 100 }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {entidades.map((ent, idx) => (
                <tr key={ent.id} style={{ borderBottom: `1px solid ${styles.gray200}`, background: selectedEntidad?.id === ent.id ? '#E3F2FD' : (idx % 2 === 0 ? styles.white : styles.gray50), cursor: 'pointer' }} onClick={() => setSelectedEntidad(ent)}>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ padding: '8px 10px' }}>{ent.nombre}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: ent.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: ent.estado === 'ACTIVO' ? styles.green : styles.red }}>{ent.estado}</span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <button onClick={(e) => { e.stopPropagation(); openEntidadModal(ent); }} style={{ padding: '3px 8px', background: styles.blue, color: styles.white, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem', marginRight: 4 }}>✏️</button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedEntidad(ent); }} style={{ padding: '3px 8px', background: styles.gray600, color: styles.white, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }}>📋</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Areas Organizacionales */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, background: selectedEntidad ? styles.black : styles.gray400, padding: '10px 14px', borderRadius: '6px 6px 0 0' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: styles.white, margin: 0 }}>
            ÁREA ORGANIZACIONAL {selectedEntidad ? `- ${selectedEntidad.nombre}` : ''}
          </h3>
          {selectedEntidad && (
            <button onClick={() => openAreaModal()} style={{ padding: '6px 14px', background: styles.green, color: styles.white, border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem' }}>+ Adicionar</button>
          )}
        </div>
        <div style={{ background: styles.white, borderRadius: '0 0 6px 6px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxHeight: 400, overflowY: 'auto' }}>
          {!selectedEntidad ? (
            <div style={{ padding: 40, textAlign: 'center', color: styles.gray500 }}>Seleccione una entidad para ver sus áreas</div>
          ) : areas.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: styles.gray500 }}>No hay áreas registradas para esta entidad</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: styles.gray100 }}>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, width: 40 }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>ÁREA ORGANIZACIONAL</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, width: 80 }}>ESTADO</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, width: 60 }}>OP</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((area, idx) => (
                  <tr key={area.id} style={{ borderBottom: `1px solid ${styles.gray200}`, background: idx % 2 === 0 ? styles.white : styles.gray50 }}>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 10px' }}>{area.nombre}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: area.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: area.estado === 'ACTIVO' ? styles.green : styles.red }}>{area.estado}</span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <button onClick={() => openAreaModal(area)} style={{ padding: '3px 8px', background: styles.blue, color: styles.white, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }}>✏️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Entidad Modal */}
      {showEntidadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 20, maxWidth: 400, width: '90%' }}>
            <h3 style={{ marginBottom: 16, fontWeight: 700, fontSize: '1rem' }}>{editItem ? 'Editar' : 'Nueva'} Entidad</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem', color: styles.gray700 }}>Nombre</label>
              <input type="text" value={formData.nombre || ''} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} style={{ width: '100%', padding: 10, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.85rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem', color: styles.gray700 }}>Estado</label>
              <select value={formData.estado || 'ACTIVO'} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} style={{ width: '100%', padding: 10, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.85rem' }}>
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowEntidadModal(false)} style={{ flex: 1, padding: 10, border: `2px solid ${styles.black}`, background: 'transparent', borderRadius: 5, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={saveEntidad} style={{ flex: 1, padding: 10, background: styles.green, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Area Modal */}
      {showAreaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 20, maxWidth: 400, width: '90%' }}>
            <h3 style={{ marginBottom: 16, fontWeight: 700, fontSize: '1rem' }}>{editItem ? 'Editar' : 'Nueva'} Área - {selectedEntidad?.nombre}</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem', color: styles.gray700 }}>Nombre del Área</label>
              <input type="text" value={formData.nombre || ''} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} style={{ width: '100%', padding: 10, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.85rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem', color: styles.gray700 }}>Estado</label>
              <select value={formData.estado || 'ACTIVO'} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} style={{ width: '100%', padding: 10, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.85rem' }}>
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowAreaModal(false)} style={{ flex: 1, padding: 10, border: `2px solid ${styles.black}`, background: 'transparent', borderRadius: 5, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={saveArea} style={{ flex: 1, padding: 10, background: styles.green, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Generic CRUD Table Component
function CrudTable({ title, endpoint, columns, formFields, idField = 'id' }) {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editItem, setEditItem] = useState(null); const [formData, setFormData] = useState({});
  const fetchData = useCallback(async () => { try { setLoading(true); const res = await fetch(`${API_URL}/api/sms/${endpoint}`); setData(await res.json()); } catch (err) { console.error(err); } finally { setLoading(false); } }, [endpoint]);
  useEffect(() => { fetchData(); }, [fetchData]);
  const openModal = (item = null) => { if (item) { setEditItem(item); setFormData({ ...item }); } else { setEditItem(null); setFormData({ estado: 'ACTIVO' }); } setShowModal(true); };
  const saveItem = async () => { try { const method = editItem ? 'PUT' : 'POST'; const url = editItem ? `${API_URL}/api/sms/${endpoint}/${editItem[idField]}` : `${API_URL}/api/sms/${endpoint}`; const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }); if (res.ok) { setShowModal(false); fetchData(); } else { const err = await res.json(); alert(err.detail || 'Error al guardar'); } } catch (err) { console.error(err); alert('Error de conexión'); } };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>{title}</h2>
        <button onClick={() => openModal()} style={{ padding: '8px 16px', background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Adicionar</button>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div> : (
        <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{columns.map(col => <th key={col.key} style={headerStyle}>{col.label}</th>)}<th style={{ ...headerStyle, textAlign: 'center' }}>Op</th></tr></thead>
            <tbody>{data.map((item, idx) => (
              <tr key={item[idField] || idx} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                {columns.map(col => <td key={col.key} style={rowStyle}>{col.key === 'estado' ? <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: item[col.key] === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: item[col.key] === 'ACTIVO' ? styles.green : styles.red }}>{item[col.key]}</span> : item[col.key]}</td>)}
                <td style={{ ...rowStyle, textAlign: 'center' }}><button onClick={() => openModal(item)} style={{ padding: '3px 10px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>✏️</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 18, maxWidth: 420, width: '90%' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: '1rem' }}>{editItem ? 'Editar' : 'Nuevo'} {title}</h3>
            {formFields.map(field => (
              <div key={field.key} style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem', color: styles.gray700 }}>{field.label}</label>
                {field.type === 'select' ? <select value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}>{field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>
                : field.type === 'textarea' ? <textarea value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} rows={2} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', resize: 'vertical' }} />
                : <input type={field.type || 'text'} value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 8, border: `2px solid ${styles.black}`, background: 'transparent', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
              <button onClick={saveItem} style={{ flex: 1, padding: 8, background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Banco de Indicadores View - Filtered by user area
function IndicadoresView({ user }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    id_entidad: '', id_area: '', id_sector: '', id_pilar: '', id_eje: '',
    codi_meta: '', codi_resultado: '', codi_accion: '', codi: '',
    indicador_resultado: '', formula_indicador: '', anio_base: '',
    linea_base: '', anio_logro: '', logro: '', estado: 'ACTIVO'
  });
  
  // Catalogs for dropdowns
  const [catalogs, setCatalogs] = useState(null);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  
  const isAdmin = user?.rol === 'ADMINISTRADOR';
  const PAGE_SIZE = 10;

  // Fetch only basic data for grid
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('sms_token');
        const res = await fetch(`${API_URL}/api/sms/matriz_parametros`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setData(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Load catalogs when opening modal
  const loadCatalogs = async () => {
    if (catalogs) return;
    setLoadingCatalogs(true);
    try {
      const [entRes, areaRes, secRes, pilRes, ejeRes, metaRes, resRes, accRes] = await Promise.all([
        fetch(`${API_URL}/api/sms/entidades`),
        fetch(`${API_URL}/api/sms/areas`),
        fetch(`${API_URL}/api/sms/sectores`),
        fetch(`${API_URL}/api/sms/pilares`),
        fetch(`${API_URL}/api/sms/ejes`),
        fetch(`${API_URL}/api/sms/metas`),
        fetch(`${API_URL}/api/sms/resultados`),
        fetch(`${API_URL}/api/sms/acciones`)
      ]);
      setCatalogs({
        entidades: await entRes.json(),
        areas: await areaRes.json(),
        sectores: await secRes.json(),
        pilares: await pilRes.json(),
        ejes: await ejeRes.json(),
        metas: await metaRes.json(),
        resultados: await resRes.json(),
        acciones: await accRes.json()
      });
    } catch (err) { console.error(err); }
    finally { setLoadingCatalogs(false); }
  };

  // Open modal for edit (admin) or view (user)
  const openModal = async (item, isViewMode = false) => {
    await loadCatalogs();
    setViewOnly(isViewMode);
    if (item) {
      setEditingItem(item);
      setFormData({
        id_entidad: item.id_entidad || '',
        id_area: item.id_area || '',
        id_sector: item.id_sector || '',
        id_pilar: item.id_pilar || '',
        id_eje: item.id_eje || '',
        codi_meta: item.codi_meta || '',
        codi_resultado: item.codi_resultado || '',
        codi_accion: item.codi_accion || '',
        codi: item.codi || '',
        indicador_resultado: item.indicador_resultado || '',
        formula_indicador: item.formula_indicador || '',
        anio_base: item.anio_base || '',
        linea_base: item.linea_base || '',
        anio_logro: item.anio_logro || '',
        logro: item.logro || '',
        estado: item.estado || 'ACTIVO'
      });
    } else {
      setEditingItem(null);
      setFormData({
        id_entidad: '', id_area: '', id_sector: '', id_pilar: '', id_eje: '',
        codi_meta: '', codi_resultado: '', codi_accion: '', codi: '',
        indicador_resultado: '', formula_indicador: '', anio_base: '',
        linea_base: '', anio_logro: '', logro: '', estado: 'ACTIVO'
      });
    }
    setShowModal(true);
  };

  // Helper to get catalog name by id
  const getCatalogName = (catalogList, id, idField = 'id', nameField = 'nombre') => {
    if (!catalogList || !id) return '-';
    const item = catalogList.find(c => String(c[idField]) === String(id));
    return item ? item[nameField] : '-';
  };

  const getMetaName = (codigo) => {
    if (!catalogs?.metas || !codigo) return '-';
    const item = catalogs.metas.find(m => m.codigo === codigo);
    return item ? item.nombre : '-';
  };

  const getResultadoName = (codigo) => {
    if (!catalogs?.resultados || !codigo) return '-';
    const item = catalogs.resultados.find(r => r.codigo === codigo);
    return item ? item.nombre : '-';
  };

  const getAccionName = (codigo) => {
    if (!catalogs?.acciones || !codigo) return '-';
    const item = catalogs.acciones.find(a => a.codigo === codigo);
    return item ? item.nombre : '-';
  };

  const handleSave = async () => {
    const requiredFields = [
      { field: 'id_entidad', label: 'Entidad' },
      { field: 'id_area', label: 'Área' },
      { field: 'id_sector', label: 'Sector' },
      { field: 'id_pilar', label: 'Pilar' },
      { field: 'id_eje', label: 'Eje' },
      { field: 'codi_meta', label: 'Meta' },
      { field: 'codi_resultado', label: 'Resultado' },
      { field: 'codi_accion', label: 'Acción' },
      { field: 'codi', label: 'Código' },
      { field: 'indicador_resultado', label: 'Indicador' },
      { field: 'formula_indicador', label: 'Fórmula' },
      { field: 'anio_base', label: 'Año Base' },
      { field: 'linea_base', label: 'Línea Base' },
      { field: 'anio_logro', label: 'Año Logro' },
      { field: 'logro', label: 'Logro' }
    ];
    
    const missing = requiredFields.filter(r => !formData[r.field] || formData[r.field] === '');
    if (missing.length > 0) {
      alert(`Campos requeridos:\n${missing.map(m => '• ' + m.label).join('\n')}`);
      return;
    }
    
    try {
      const payload = { ...formData };
      ['id_entidad', 'id_area', 'id_sector', 'id_pilar', 'id_eje', 'anio_base', 'anio_logro'].forEach(f => {
        payload[f] = payload[f] === '' ? null : parseInt(payload[f]);
      });
      ['linea_base', 'logro'].forEach(f => {
        payload[f] = payload[f] === '' ? null : parseFloat(payload[f]);
      });

      const url = editingItem 
        ? `${API_URL}/api/sms/matriz_parametros/${editingItem.id_indicador}`
        : `${API_URL}/api/sms/matriz_parametros`;
      
      const res = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert(editingItem ? 'Indicador actualizado' : 'Indicador creado');
        setShowModal(false);
        const token = localStorage.getItem('sms_token');
        const indRes = await fetch(`${API_URL}/api/sms/matriz_parametros`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setData(await indRes.json());
      } else {
        const errData = await res.json().catch(() => ({}));
        alert('Error: ' + (errData.detail || 'Error desconocido'));
      }
    } catch (err) {
      console.error(err);
      alert('Error al guardar');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  // Pagination
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const paginatedData = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const inputStyle = { width: '100%', padding: '8px 10px', border: `1px solid ${styles.gray300}`, borderRadius: 4, fontSize: '0.85rem' };
  const labelStyle = { display: 'block', fontSize: '0.7rem', fontWeight: 600, color: styles.gray600, marginBottom: 4, textTransform: 'uppercase' };
  const readOnlyStyle = { width: '100%', padding: '10px 12px', background: styles.gray100, border: `1px solid ${styles.gray200}`, borderRadius: 4, fontSize: '0.85rem', color: styles.gray700, minHeight: 40 };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.2rem', margin: 0 }}>Banco de Indicadores</h2>
        {isAdmin && (
          <button onClick={() => openModal(null, false)} data-testid="btn-adicionar-indicador" style={{ padding: '10px 20px', background: styles.green, color: styles.white, border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            ➕ Adicionar
          </button>
        )}
      </div>

      {/* Grid - Only codes */}
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ background: styles.black, color: styles.white }}>
              {['#', 'ENTIDAD', 'ÁREA', 'SECTOR', 'PILAR', 'EJE', 'META', 'RESULTADO', 'ACCIÓN', 'CÓDIGO', 'INDICADOR', 'ESTADO', 'ACCIONES'].map(h => (
                <th key={h} style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr><td colSpan={13} style={{ textAlign: 'center', padding: 24, color: styles.gray500 }}>No hay indicadores</td></tr>
            ) : paginatedData.map((item, idx) => (
              <tr key={item.id_indicador} style={{ borderBottom: `1px solid ${styles.gray200}`, background: idx % 2 === 0 ? styles.white : styles.gray50 }}>
                <td style={{ padding: '8px', textAlign: 'center' }}>{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>{item.id_entidad}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>{item.id_area}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>{item.id_sector}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>{item.id_pilar}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>{item.id_eje}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>{item.codi_meta}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>{item.codi_resultado}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>{item.codi_accion}</td>
                <td style={{ padding: '8px', textAlign: 'center', fontWeight: 600 }}>{item.codi}</td>
                <td style={{ padding: '8px', maxWidth: 250 }} title={item.indicador_resultado}>{(item.indicador_resultado || '').substring(0, 50)}{(item.indicador_resultado || '').length > 50 ? '...' : ''}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: item.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: item.estado === 'ACTIVO' ? styles.green : styles.red }}>{item.estado}</span>
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  {isAdmin ? (
                    <button onClick={() => openModal(item, false)} data-testid={`btn-edit-${item.id_indicador}`} style={{ padding: '4px 10px', background: styles.blue, color: styles.white, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }}>✏️ Editar</button>
                  ) : (
                    <button onClick={() => openModal(item, true)} data-testid={`btn-view-${item.id_indicador}`} style={{ padding: '4px 10px', background: styles.gray600, color: styles.white, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }}>👁 Ver</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={{ padding: '6px 12px', border: `1px solid ${styles.gray300}`, borderRadius: 4, background: currentPage === 1 ? styles.gray100 : styles.white, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>⏮</button>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '6px 12px', border: `1px solid ${styles.gray300}`, borderRadius: 4, background: currentPage === 1 ? styles.gray100 : styles.white, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>◀</button>
          <span style={{ padding: '6px 16px', fontWeight: 600 }}>Página {currentPage} de {totalPages} ({data.length} registros)</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '6px 12px', border: `1px solid ${styles.gray300}`, borderRadius: 4, background: currentPage === totalPages ? styles.gray100 : styles.white, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>▶</button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} style={{ padding: '6px 12px', border: `1px solid ${styles.gray300}`, borderRadius: 4, background: currentPage === totalPages ? styles.gray100 : styles.white, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>⏭</button>
        </div>
      )}

      {/* Modal - Edit for Admin, View for Users */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: styles.white, borderRadius: 8, width: '95%', maxWidth: 1100, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ background: viewOnly ? styles.gray700 : styles.black, color: styles.white, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                {viewOnly ? '👁 Ver Indicador' : (editingItem ? '✏️ Editar Indicador' : '➕ Nuevo Indicador')}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: styles.white, fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            
            {loadingCatalogs ? (
              <div style={{ padding: 40, textAlign: 'center' }}>Cargando datos...</div>
            ) : catalogs && (
              <div style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  {/* Left Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Entidad</label>
                      {viewOnly ? (
                        <div style={readOnlyStyle}>{getCatalogName(catalogs.entidades, formData.id_entidad)}</div>
                      ) : (
                        <select value={formData.id_entidad} onChange={(e) => setFormData({...formData, id_entidad: e.target.value})} style={{ ...inputStyle, minHeight: 42 }}>
                          <option value="">-- Seleccionar --</option>
                          {catalogs.entidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                        </select>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Área Organizacional</label>
                      {viewOnly ? (
                        <div style={readOnlyStyle}>{getCatalogName(catalogs.areas, formData.id_area)}</div>
                      ) : (
                        <select value={formData.id_area} onChange={(e) => setFormData({...formData, id_area: e.target.value})} style={{ ...inputStyle, minHeight: 42 }}>
                          <option value="">-- Seleccionar --</option>
                          {catalogs.areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </select>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Sector</label>
                      {viewOnly ? (
                        <div style={readOnlyStyle}>{getCatalogName(catalogs.sectores, formData.id_sector)}</div>
                      ) : (
                        <select value={formData.id_sector} onChange={(e) => setFormData({...formData, id_sector: e.target.value})} style={{ ...inputStyle, minHeight: 42 }}>
                          <option value="">-- Seleccionar --</option>
                          {catalogs.sectores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Pilar</label>
                      {viewOnly ? (
                        <div style={{ ...readOnlyStyle, whiteSpace: 'pre-wrap', minHeight: 60 }}>{getCatalogName(catalogs.pilares, formData.id_pilar)}</div>
                      ) : (
                        <select value={formData.id_pilar} onChange={(e) => setFormData({...formData, id_pilar: e.target.value})} style={{ ...inputStyle, minHeight: 60 }}>
                          <option value="">-- Seleccionar --</option>
                          {catalogs.pilares.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Eje</label>
                      {viewOnly ? (
                        <div style={{ ...readOnlyStyle, whiteSpace: 'pre-wrap', minHeight: 60 }}>{getCatalogName(catalogs.ejes, formData.id_eje)}</div>
                      ) : (
                        <select value={formData.id_eje} onChange={(e) => setFormData({...formData, id_eje: e.target.value})} style={{ ...inputStyle, minHeight: 60 }}>
                          <option value="">-- Seleccionar --</option>
                          {catalogs.ejes.map(ej => <option key={ej.id} value={ej.id}>{ej.nombre}</option>)}
                        </select>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Meta</label>
                      {viewOnly ? (
                        <div style={{ ...readOnlyStyle, whiteSpace: 'pre-wrap', minHeight: 80 }}><strong>{formData.codi_meta}</strong> - {getMetaName(formData.codi_meta)}</div>
                      ) : (
                        <select value={formData.codi_meta} onChange={(e) => setFormData({...formData, codi_meta: e.target.value})} style={{ ...inputStyle, minHeight: 60 }}>
                          <option value="">-- Seleccionar --</option>
                          {catalogs.metas.map(m => <option key={m.id} value={m.codigo}>{m.codigo} - {m.nombre}</option>)}
                        </select>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Resultado</label>
                      {viewOnly ? (
                        <div style={{ ...readOnlyStyle, whiteSpace: 'pre-wrap', minHeight: 80 }}><strong>{formData.codi_resultado}</strong> - {getResultadoName(formData.codi_resultado)}</div>
                      ) : (
                        <select value={formData.codi_resultado} onChange={(e) => setFormData({...formData, codi_resultado: e.target.value})} style={{ ...inputStyle, minHeight: 60 }}>
                          <option value="">-- Seleccionar --</option>
                          {catalogs.resultados.map(r => <option key={r.id} value={r.codigo}>{r.codigo} - {r.nombre}</option>)}
                        </select>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Acción</label>
                      {viewOnly ? (
                        <div style={{ ...readOnlyStyle, whiteSpace: 'pre-wrap', minHeight: 80 }}><strong>{formData.codi_accion}</strong> - {getAccionName(formData.codi_accion)}</div>
                      ) : (
                        <select value={formData.codi_accion} onChange={(e) => setFormData({...formData, codi_accion: e.target.value})} style={{ ...inputStyle, minHeight: 60 }}>
                          <option value="">-- Seleccionar --</option>
                          {catalogs.acciones.map(a => <option key={a.id} value={a.codigo}>{a.codigo} - {a.nombre}</option>)}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Código</label>
                      {viewOnly ? (
                        <div style={{ ...readOnlyStyle, fontWeight: 600, fontSize: '1rem' }}>{formData.codi}</div>
                      ) : (
                        <input type="text" value={formData.codi} onChange={(e) => setFormData({...formData, codi: e.target.value})} style={inputStyle} placeholder="Ej: IND-001" />
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Indicador</label>
                      {viewOnly ? (
                        <div style={{ ...readOnlyStyle, whiteSpace: 'pre-wrap', minHeight: 100 }}>{formData.indicador_resultado}</div>
                      ) : (
                        <textarea value={formData.indicador_resultado} onChange={(e) => setFormData({...formData, indicador_resultado: e.target.value})} style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} placeholder="Descripción del indicador" />
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Fórmula</label>
                      {viewOnly ? (
                        <div style={{ ...readOnlyStyle, whiteSpace: 'pre-wrap', minHeight: 80 }}>{formData.formula_indicador}</div>
                      ) : (
                        <textarea value={formData.formula_indicador} onChange={(e) => setFormData({...formData, formula_indicador: e.target.value})} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Fórmula del indicador" />
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Año Base</label>
                        {viewOnly ? (
                          <div style={readOnlyStyle}>{formData.anio_base}</div>
                        ) : (
                          <input type="number" value={formData.anio_base} onChange={(e) => setFormData({...formData, anio_base: e.target.value})} style={inputStyle} placeholder="2020" />
                        )}
                      </div>
                      <div>
                        <label style={labelStyle}>Línea Base</label>
                        {viewOnly ? (
                          <div style={readOnlyStyle}>{formData.linea_base}</div>
                        ) : (
                          <input type="number" step="0.01" value={formData.linea_base} onChange={(e) => setFormData({...formData, linea_base: e.target.value})} style={inputStyle} placeholder="0.00" />
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Año Logro</label>
                        {viewOnly ? (
                          <div style={readOnlyStyle}>{formData.anio_logro}</div>
                        ) : (
                          <input type="number" value={formData.anio_logro} onChange={(e) => setFormData({...formData, anio_logro: e.target.value})} style={inputStyle} placeholder="2025" />
                        )}
                      </div>
                      <div>
                        <label style={labelStyle}>Logro</label>
                        {viewOnly ? (
                          <div style={readOnlyStyle}>{formData.logro}</div>
                        ) : (
                          <input type="number" step="0.01" value={formData.logro} onChange={(e) => setFormData({...formData, logro: e.target.value})} style={inputStyle} placeholder="0.00" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Estado</label>
                      {viewOnly ? (
                        <div style={readOnlyStyle}>
                          <span style={{ padding: '4px 12px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600, background: formData.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: formData.estado === 'ACTIVO' ? styles.green : styles.red }}>{formData.estado}</span>
                        </div>
                      ) : (
                        <select value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} style={inputStyle}>
                          <option value="ACTIVO">ACTIVO</option>
                          <option value="INACTIVO">INACTIVO</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: `1px solid ${styles.gray200}` }}>
                  <button onClick={() => setShowModal(false)} style={{ padding: '10px 24px', background: styles.gray200, color: styles.gray700, border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
                    {viewOnly ? 'Cerrar' : 'Volver'}
                  </button>
                  {!viewOnly && (
                    <button onClick={handleSave} data-testid="btn-grabar-indicador" style={{ padding: '10px 24px', background: styles.green, color: styles.white, border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
                      💾 Grabar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// UBER Style Seguimiento View
function SeguimientoView({ user, siteConfig }) {
  const [indicadores, setIndicadores] = useState([]);
  const [selectedIndicador, setSelectedIndicador] = useState(null);
  const [gestion, setGestion] = useState(new Date().getFullYear());
  const [mes, setMes] = useState('ENERO');
  const [rendicion, setRendicion] = useState({});
  const [loading, setLoading] = useState(true);
  const [contexto, setContexto] = useState({});
  const [configYears, setConfigYears] = useState([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [adjuntos, setAdjuntos] = useState([]);
  const [newFile, setNewFile] = useState({ nombre: '', descripcion: '', url: '', file: null });
  const [showProgramadoModal, setShowProgramadoModal] = useState(false);
  const [programadoTemp, setProgramadoTemp] = useState('');

  const isAdmin = user?.rol === 'ADMINISTRADOR';
  const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  const mesesCortos = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

  useEffect(() => {
    // Load years from config
    fetch(`${API_URL}/api/sms/configuracion/years`).then(r => r.json()).then(yrs => {
      setConfigYears(yrs || []);
      const currentYear = new Date().getFullYear();
      if (yrs && yrs.length > 0) {
        const defaultYear = yrs.includes(currentYear) ? currentYear : yrs[yrs.length - 1];
        setGestion(defaultYear);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('sms_token');
        if (user?.id_area) {
          const ctxRes = await fetch(`${API_URL}/api/sms/contexto_usuario/${user.id_area}`);
          if (ctxRes.ok) setContexto(await ctxRes.json());
        }
        // Use the main endpoint that handles filtering based on user role
        const indRes = await fetch(`${API_URL}/api/sms/matriz_parametros`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const indData = await indRes.json();
        setIndicadores(indData);
        if (indData.length > 0) setSelectedIndicador(indData[0]);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (selectedIndicador) {
      fetch(`${API_URL}/api/sms/rendicion/${selectedIndicador.id_indicador}/${gestion}`)
        .then(r => r.json()).then(data => setRendicion(data || {})).catch(console.error);
    }
  }, [selectedIndicador, gestion]);

  const handleChange = (field, value) => setRendicion(prev => ({ ...prev, [field]: value }));

  // Open programado modal
  const openProgramadoModal = () => {
    setProgramadoTemp(rendicion.programado || selectedIndicador?.logro || '');
    setShowProgramadoModal(true);
  };

  // Save programado
  const saveProgramado = async () => {
    if (!selectedIndicador) return;
    try {
      const newProgramado = parseFloat(programadoTemp) || 0;
      const res = await fetch(`${API_URL}/api/sms/rendicion/programado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id_indicador: selectedIndicador.id_indicador, 
          gestion, 
          programado: newProgramado 
        })
      });
      if (res.ok) {
        setRendicion(prev => ({ ...prev, programado: newProgramado }));
        setShowProgramadoModal(false);
        alert('Programado guardado exitosamente');
      } else {
        alert('Error al guardar el programado');
      }
    } catch (e) {
      console.error(e);
      alert('Error al guardar el programado');
    }
  };

  const saveRendicion = async () => {
    if (!selectedIndicador) return;
    try {
      const mesesCortos = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const programado = parseFloat(rendicion.programado) || parseFloat(selectedIndicador?.logro) || 0;
      
      // Calculate % EJEC and ACUMULADO for all months
      const dataToSave = { ...rendicion };
      let acumuladoTotal = 0;
      
      mesesCortos.forEach((m, i) => {
        const ejecutado = parseFloat(rendicion[`ejecutado_${m}`]) || 0;
        
        // Calculate % EJEC
        const procEjec = programado > 0 ? (ejecutado / programado) : 0;
        dataToSave[`proc_ejecutado_${m}`] = procEjec;
        
        // Calculate ACUMULADO (cumulative sum)
        acumuladoTotal += ejecutado;
        dataToSave[`acumulado_${m}`] = acumuladoTotal;
      });
      
      // Set logrado as total acumulado
      dataToSave.logrado = acumuladoTotal;
      
      const res = await fetch(`${API_URL}/api/sms/rendicion`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_indicador: selectedIndicador.id_indicador, gestion, id_area: user?.id_area, ...dataToSave })
      });
      if (res.ok) {
        alert('Rendición guardada exitosamente');
        // Reload data to show updated values
        const reloadRes = await fetch(`${API_URL}/api/sms/rendicion/${selectedIndicador.id_indicador}/${gestion}`);
        if (reloadRes.ok) {
          setRendicion(await reloadRes.json());
        }
      }
    } catch (e) { console.error(e); alert('Error al guardar'); }
  };

  // Export all indicators to CSV
  const exportToCSV = async () => {
    try {
      const mesesCortos = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const mesesHeaders = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
      
      // Fetch rendicion data for all indicators
      const allData = await Promise.all(
        indicadores.map(async (ind) => {
          try {
            const res = await fetch(`${API_URL}/api/sms/rendicion/${ind.id_indicador}/${gestion}`);
            const rendData = res.ok ? await res.json() : {};
            return { indicador: ind, rendicion: rendData };
          } catch (e) {
            return { indicador: ind, rendicion: {} };
          }
        })
      );
      
      // Build CSV content
      let csvContent = '\uFEFF'; // BOM for Excel UTF-8
      
      // Header row
      csvContent += 'CÓDIGO,INDICADOR,AÑO BASE,LÍNEA BASE,AÑO LOGRO,LOGRO PROGRAMADO,';
      mesesHeaders.forEach(m => csvContent += `EJEC_${m},`);
      mesesHeaders.forEach(m => csvContent += `%EJEC_${m},`);
      mesesHeaders.forEach(m => csvContent += `ACUM_${m},`);
      csvContent += 'PROGRAMADO,LOGRADO,DESCRIPCIÓN CUALITATIVA,MODIFICACIONES\n';
      
      // Data rows
      allData.forEach(({ indicador, rendicion }) => {
        const row = [];
        row.push(`"${indicador.codi || ''}"`);
        row.push(`"${(indicador.indicador_resultado || '').replace(/"/g, '""')}"`);
        row.push(indicador.anio_base || '');
        row.push(indicador.linea_base || '');
        row.push(indicador.anio_logro || '');
        row.push(indicador.logro || '');
        
        // EJECUCIÓN values
        mesesCortos.forEach(m => {
          row.push(rendicion[`ejecutado_${m}`] || '');
        });
        
        // % EJEC values
        mesesCortos.forEach(m => {
          const val = rendicion[`proc_ejecutado_${m}`];
          row.push(val ? (parseFloat(val) * 100).toFixed(2) + '%' : '');
        });
        
        // ACUMULADO values
        mesesCortos.forEach(m => {
          row.push(rendicion[`acumulado_${m}`] || '');
        });
        
        row.push(rendicion.programado || indicador.logro || '');
        row.push(rendicion.logrado || '');
        row.push(`"${(rendicion.descripcion_cualitativa || '').replace(/"/g, '""')}"`);
        row.push(`"${(rendicion.modificaciones || '').replace(/"/g, '""')}"`);
        
        csvContent += row.join(',') + '\n';
      });
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Rendicion_${gestion}_${contexto.area || 'Usuario'}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      alert(`Exportación exitosa: ${allData.length} indicadores`);
    } catch (e) {
      console.error(e);
      alert('Error al exportar');
    }
  };

  // Export to PDF - Auto download with 3 sub-rows per indicator
  const exportToPDF = async () => {
    try {
      const mesesCortos = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const mesesHeaders = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
      
      // Fetch rendicion data for all indicators
      const allData = await Promise.all(
        indicadores.map(async (ind) => {
          try {
            const res = await fetch(`${API_URL}/api/sms/rendicion/${ind.id_indicador}/${gestion}`);
            const rendData = res.ok ? await res.json() : {};
            return { indicador: ind, rendicion: rendData };
          } catch (e) {
            return { indicador: ind, rendicion: {} };
          }
        })
      );
      
      // Build HTML content for PDF with 3 sub-rows per indicator
      const htmlContent = `
        <div id="pdf-content" style="font-family: Arial, sans-serif; font-size: 9px; padding: 15px; width: 100%;">
          <h1 style="font-size: 16px; text-align: center; margin-bottom: 5px; color: #333;">RENDICIÓN DE INDICADORES - GESTIÓN ${gestion}</h1>
          <h2 style="font-size: 11px; text-align: center; color: #666; margin-bottom: 15px;">Sistema de Monitoreo Sectorial</h2>
          
          <div style="margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px; display: flex; flex-wrap: wrap; gap: 15px;">
            <span><strong>Entidad:</strong> ${contexto.entidad || '-'}</span>
            <span><strong>Área:</strong> ${contexto.area || '-'}</span>
            <span><strong>Sector:</strong> ${contexto.sector || '-'}</span>
            <span><strong>Usuario:</strong> ${user?.nombre || '-'}</span>
            <span><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</span>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
            <thead>
              <tr>
                <th style="background: #1a1a1a; color: white; padding: 6px 4px; border: 1px solid #333; width: 60px;">CÓDIGO</th>
                <th style="background: #1a1a1a; color: white; padding: 6px 4px; border: 1px solid #333; text-align: left; min-width: 180px;">INDICADOR</th>
                <th style="background: #1a1a1a; color: white; padding: 6px 4px; border: 1px solid #333; width: 45px;">TIPO</th>
                ${mesesHeaders.map(m => `<th style="background: #1a1a1a; color: white; padding: 6px 2px; border: 1px solid #333; width: 38px;">${m}</th>`).join('')}
                <th style="background: #0066cc; color: white; padding: 6px 4px; border: 1px solid #333; width: 55px;">PROG.</th>
                <th style="background: #cc0000; color: white; padding: 6px 4px; border: 1px solid #333; width: 55px;">LOGRADO</th>
              </tr>
            </thead>
            <tbody>
              ${allData.map(({ indicador, rendicion }, idx) => {
                const programado = rendicion.programado || indicador.logro || '';
                const logrado = rendicion.logrado || '';
                
                return `
                  <!-- Indicator group ${idx + 1} -->
                  <!-- Row 1: EJECUTADO -->
                  <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f9f9f9'};">
                    <td rowspan="3" style="border: 1px solid #ddd; padding: 4px; text-align: center; vertical-align: middle; font-weight: bold;">${indicador.codi || ''}</td>
                    <td rowspan="3" style="border: 1px solid #ddd; padding: 4px; text-align: left; vertical-align: top; line-height: 1.3;">${indicador.indicador_resultado || ''}</td>
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: center; background: #e8f5e9; font-weight: 600; font-size: 7px;">EJEC</td>
                    ${mesesCortos.map(m => {
                      const val = rendicion['ejecutado_' + m];
                      return '<td style="border: 1px solid #ddd; padding: 3px; text-align: center; background: #e8f5e9;">' + (val ? parseFloat(val).toFixed(2) : '') + '</td>';
                    }).join('')}
                    <td rowspan="3" style="border: 1px solid #ddd; padding: 4px; text-align: center; vertical-align: middle; background: #e3f2fd; font-weight: bold;">${programado}</td>
                    <td rowspan="3" style="border: 1px solid #ddd; padding: 4px; text-align: center; vertical-align: middle; background: #ffebee; font-weight: bold; color: #c00;">${logrado}</td>
                  </tr>
                  <!-- Row 2: % EJEC -->
                  <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f9f9f9'};">
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: center; background: #fff3e0; font-weight: 600; font-size: 7px;">%EJEC</td>
                    ${mesesCortos.map(m => {
                      const val = rendicion['proc_ejecutado_' + m];
                      return '<td style="border: 1px solid #ddd; padding: 3px; text-align: center; background: #fff3e0;">' + (val ? (parseFloat(val) * 100).toFixed(1) + '%' : '') + '</td>';
                    }).join('')}
                  </tr>
                  <!-- Row 3: ACUMULADO -->
                  <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f9f9f9'}; border-bottom: 2px solid #999;">
                    <td style="border: 1px solid #ddd; padding: 3px; text-align: center; background: #e1f5fe; font-weight: 600; font-size: 7px;">ACUM</td>
                    ${mesesCortos.map(m => {
                      const val = rendicion['acumulado_' + m];
                      return '<td style="border: 1px solid #ddd; padding: 3px; text-align: center; background: #e1f5fe;">' + (val ? parseFloat(val).toFixed(2) : '') + '</td>';
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <p style="text-align: center; color: #999; margin-top: 20px; font-size: 8px;">
            Total de indicadores: ${allData.length} | Generado el ${new Date().toLocaleString()}
          </p>
        </div>
      `;
      
      // Create temporary container
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '297mm'; // A4 landscape width
      document.body.appendChild(container);
      
      const element = container.querySelector('#pdf-content');
      
      // Configure PDF options
      const opt = {
        margin: [5, 5, 5, 5],
        filename: `Rendicion_${gestion}_${contexto.area || 'Usuario'}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 1.5, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      
      // Generate and download PDF
      await html2pdf().set(opt).from(element).save();
      
      // Cleanup
      document.body.removeChild(container);
      
      alert(`PDF generado exitosamente: ${allData.length} indicadores`);
      
    } catch (e) {
      console.error(e);
      alert('Error al generar PDF: ' + e.message);
    }
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>;

  const cellInput = { width: '100%', padding: '4px 6px', fontSize: '0.75rem', border: `1px solid ${styles.gray300}`, borderRadius: 4, textAlign: 'center', boxSizing: 'border-box' };
  const darkHeader = { background: styles.gray800, color: styles.white, padding: '10px 16px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
  
  // Get selected month index
  const mesSeleccionadoIndex = meses.indexOf(mes);
  const mesCortoSeleccionado = mesesCortos[mesSeleccionadoIndex];

  return (
    <div>
      <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 16 }}>Seguimiento de Indicadores</h2>

      {/* Context Header - Dark Style */}
      <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <div style={darkHeader}>CONTEXTO DEL USUARIO</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {[{ label: 'ENTIDAD', value: contexto.entidad || '-' }, { label: 'ÁREA', value: contexto.area || '-' }, { label: 'SECTOR', value: contexto.sector || '-' },
            { label: 'AÑO', value: <select value={gestion} onChange={(e) => setGestion(parseInt(e.target.value))} style={{ ...cellInput, background: styles.white, width: '100%' }}>{configYears.map(y => <option key={y} value={y}>{y}</option>)}</select> },
            { label: 'MES', value: <select value={mes} onChange={(e) => setMes(e.target.value)} style={{ ...cellInput, background: styles.white, width: '100%' }}>{meses.map(m => <option key={m} value={m}>{m}</option>)}</select> },
            { label: 'ESTADO', value: <span style={{ padding: '4px 12px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, background: '#D1FAE5', color: styles.green }}>ABIERTO</span> }
          ].map((item, i) => (
            <div key={i} style={{ padding: '12px 16px', borderRight: i < 5 ? `1px solid ${styles.gray200}` : 'none' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, color: styles.gray500, textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicator Selector - Dark Header */}
      <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <div style={darkHeader}>SELECCIÓN DE INDICADOR</div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: styles.gray500, textTransform: 'uppercase', marginBottom: 8 }}>INDICADOR</label>
              <select value={selectedIndicador?.id_indicador || ''} onChange={(e) => setSelectedIndicador(indicadores.find(i => i.id_indicador === parseInt(e.target.value)))}
                style={{ width: '100%', padding: 12, fontSize: '0.85rem', border: `2px solid ${styles.gray300}`, borderRadius: 8, background: styles.white }}>
                {indicadores.map(ind => <option key={ind.id_indicador} value={ind.id_indicador}>{ind.codi} - {ind.indicador_resultado?.substring(0, 80)}...</option>)}
              </select>
            </div>
            <button onClick={saveRendicion} data-testid="btn-guardar" style={{ padding: '12px 24px', background: styles.black, color: styles.white, border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
              💾 Guardar
            </button>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowExportMenu(!showExportMenu)} data-testid="btn-exportar" style={{ padding: '12px 24px', background: styles.green, color: styles.white, border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                📥 Exportar ▾
              </button>
              {showExportMenu && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: styles.white, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 100, minWidth: 180, overflow: 'hidden' }}>
                  <button onClick={() => { exportToCSV(); setShowExportMenu(false); }} data-testid="btn-export-csv" style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${styles.gray200}` }}
                    onMouseEnter={(e) => e.target.style.background = styles.gray100}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                    📊 Exportar a CSV
                  </button>
                  <button onClick={() => { exportToPDF(); setShowExportMenu(false); }} data-testid="btn-export-pdf" style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}
                    onMouseEnter={(e) => e.target.style.background = styles.gray100}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                    📄 Exportar a PDF
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {selectedIndicador && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${styles.gray200}` }}>
              <div><div style={{ fontSize: '0.6rem', fontWeight: 600, color: styles.gray500, marginBottom: 4 }}>AÑO BASE</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedIndicador.anio_base || '-'}</div></div>
              <div><div style={{ fontSize: '0.6rem', fontWeight: 600, color: styles.gray500, marginBottom: 4 }}>LÍNEA BASE</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedIndicador.linea_base || '-'}</div></div>
              <div><div style={{ fontSize: '0.6rem', fontWeight: 600, color: styles.gray500, marginBottom: 4 }}>AÑO LOGRO</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedIndicador.anio_logro || '-'}</div></div>
              <div><div style={{ fontSize: '0.6rem', fontWeight: 600, color: styles.gray500, marginBottom: 4 }}>LOGRO PROGRAMADO</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedIndicador.logro || '-'}</div></div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Grid - Dark Header - Only selected month is editable */}
      <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <div style={darkHeader}>REGISTRO MENSUAL DE EJECUCIÓN</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ ...headerStyle, width: 100, background: styles.gray700 }}>#</th>
                {mesesCortos.map((m, i) => (
                  <th key={m} style={{ ...headerStyle, textAlign: 'center', minWidth: 55, background: i === mesSeleccionadoIndex ? styles.green : styles.gray700 }}>{m}</th>
                ))}
                <th style={{ ...headerStyle, textAlign: 'center', background: styles.blue, minWidth: 80 }}>PROGRAMADO</th>
                <th style={{ ...headerStyle, textAlign: 'center', background: styles.red, minWidth: 70 }}>LOGRADO</th>
              </tr>
            </thead>
            <tbody>
              {/* Row EJECUCIÓN - Editable */}
              <tr style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                <td style={{ ...rowStyle, fontWeight: 600, background: styles.gray100 }}>EJECUCIÓN</td>
                {mesesCortos.map((m, i) => {
                  const isSelected = i === mesSeleccionadoIndex;
                  const fieldName = `ejecutado_${m.toLowerCase()}`;
                  return (
                    <td key={m} style={{ ...rowStyle, padding: 4, background: isSelected ? '#D1FAE5' : 'transparent' }}>
                      {isSelected ? (
                        <input type="number" step="0.001" value={rendicion[fieldName] || ''} 
                          onChange={(e) => handleChange(fieldName, e.target.value)} style={cellInput} />
                      ) : (
                        <span style={{ display: 'block', textAlign: 'center', fontSize: '0.75rem', color: styles.gray600 }}>
                          {rendicion[fieldName] || ''}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td style={{ ...rowStyle, textAlign: 'center', background: '#DBEAFE', fontWeight: 600, color: styles.blue }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span>{rendicion.programado || selectedIndicador?.logro || '-'}</span>
                    {isAdmin && (
                      <button onClick={openProgramadoModal} data-testid="btn-edit-programado" style={{ padding: '2px 6px', background: styles.blue, color: styles.white, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.65rem' }}>✏️</button>
                    )}
                  </div>
                </td>
                <td style={{ ...rowStyle, textAlign: 'center', background: '#FEE2E2', fontWeight: 600, color: styles.red }}>
                  {rendicion.logrado || '-'}
                </td>
              </tr>
              
              {/* Row % EJEC - Calculated, Read-only */}
              <tr style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                <td style={{ ...rowStyle, fontWeight: 600, background: styles.gray100 }}>% EJEC</td>
                {mesesCortos.map((m, i) => {
                  const isSelected = i === mesSeleccionadoIndex;
                  const ejecutado = parseFloat(rendicion[`ejecutado_${m.toLowerCase()}`]) || 0;
                  const programado = parseFloat(rendicion.programado) || parseFloat(selectedIndicador?.logro) || 1;
                  const porcentaje = programado > 0 ? ((ejecutado / programado) * 100).toFixed(2) : '0.00';
                  return (
                    <td key={m} style={{ ...rowStyle, padding: 4, background: isSelected ? '#D1FAE5' : 'transparent', textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: styles.gray700, fontWeight: isSelected ? 600 : 400 }}>
                        {ejecutado > 0 ? `${porcentaje}%` : ''}
                      </span>
                    </td>
                  );
                })}
                <td style={{ ...rowStyle, textAlign: 'center', background: '#DBEAFE' }}></td>
                <td style={{ ...rowStyle, textAlign: 'center', background: '#FEE2E2' }}></td>
              </tr>
              
              {/* Row ACUMULADO - Calculated, Read-only */}
              <tr style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                <td style={{ ...rowStyle, fontWeight: 600, background: styles.gray100 }}>ACUMULADO</td>
                {mesesCortos.map((m, i) => {
                  const isSelected = i === mesSeleccionadoIndex;
                  // Calculate cumulative sum from ENE to current month
                  let acumulado = 0;
                  for (let j = 0; j <= i; j++) {
                    acumulado += parseFloat(rendicion[`ejecutado_${mesesCortos[j].toLowerCase()}`]) || 0;
                  }
                  return (
                    <td key={m} style={{ ...rowStyle, padding: 4, background: isSelected ? '#D1FAE5' : 'transparent', textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: styles.gray700, fontWeight: isSelected ? 600 : 400 }}>
                        {acumulado > 0 ? acumulado.toFixed(3) : ''}
                      </span>
                    </td>
                  );
                })}
                <td style={{ ...rowStyle, textAlign: 'center', background: '#DBEAFE' }}></td>
                <td style={{ ...rowStyle, textAlign: 'center', background: '#FEE2E2' }}>
                  {(() => {
                    // Total accumulated
                    let total = 0;
                    mesesCortos.forEach(m => { total += parseFloat(rendicion[`ejecutado_${m.toLowerCase()}`]) || 0; });
                    return total > 0 ? <span style={{ fontWeight: 600, color: styles.red }}>{total.toFixed(3)}</span> : '';
                  })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Qualitative Description - Dark Headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={darkHeader}>DESCRIPCIÓN CUALITATIVA DEL AVANCE</div>
          <div style={{ padding: 16 }}>
            <textarea value={rendicion.descripcion_cualitativa || ''} onChange={(e) => handleChange('descripcion_cualitativa', e.target.value)} rows={5}
              style={{ width: '100%', padding: 12, border: `2px solid ${styles.gray300}`, borderRadius: 8, fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Ingrese la descripción cualitativa del avance..." />
          </div>
        </div>
        <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={darkHeader}>MODIFICACIONES</div>
          <div style={{ padding: 16 }}>
            <textarea value={rendicion.modificaciones || ''} onChange={(e) => handleChange('modificaciones', e.target.value)} rows={5}
              style={{ width: '100%', padding: 12, border: `2px solid ${styles.gray300}`, borderRadius: 8, fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Ingrese las modificaciones..." />
          </div>
        </div>
      </div>

      {/* Attachments - Dark Header */}
      <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ ...darkHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>ARCHIVOS ADJUNTOS</span>
          <button onClick={() => setShowFileModal(true)} style={{ padding: '6px 12px', background: styles.white, color: styles.black, border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.7rem' }}>+ Agregar archivo</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['NOMBRE', 'DESCRIPCIÓN', 'TAMAÑO', 'ACCIONES'].map(h => <th key={h} style={headerStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {adjuntos.length === 0 ? (
              <tr><td colSpan={4} style={{ ...rowStyle, textAlign: 'center', color: styles.gray500, padding: 24 }}>No hay archivos adjuntos</td></tr>
            ) : (
              adjuntos.map((adj, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                  <td style={rowStyle}>{adj.nombre}</td>
                  <td style={rowStyle}>{adj.descripcion || '-'}</td>
                  <td style={rowStyle}>{adj.size || '-'}</td>
                  <td style={{ ...rowStyle, textAlign: 'center' }}>
                    <a href={adj.url} target="_blank" rel="noopener noreferrer" style={{ color: styles.blue, marginRight: 8 }}>⬇️</a>
                    <button onClick={() => setAdjuntos(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: styles.red, cursor: 'pointer' }}>🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* File Upload Modal */}
      {showFileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 12, width: 500, maxWidth: '90%', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ ...darkHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>AGREGAR ARCHIVO</span>
              <button onClick={() => { setShowFileModal(false); setNewFile({ nombre: '', descripcion: '', url: '', file: null }); }} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', marginBottom: 6 }}>Nombre del archivo</label>
                <input type="text" value={newFile.nombre} onChange={(e) => setNewFile(prev => ({ ...prev, nombre: e.target.value }))} 
                  style={{ width: '100%', padding: '10px 12px', border: `2px solid ${styles.gray300}`, borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }} 
                  placeholder="Ej: documento.pdf" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', marginBottom: 6 }}>Descripción</label>
                <input type="text" value={newFile.descripcion} onChange={(e) => setNewFile(prev => ({ ...prev, descripcion: e.target.value }))} 
                  style={{ width: '100%', padding: '10px 12px', border: `2px solid ${styles.gray300}`, borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }} 
                  placeholder="Descripción del archivo" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', marginBottom: 6 }}>Subir archivo</label>
                <input type="file" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setNewFile(prev => ({ ...prev, file, nombre: prev.nombre || file.name, size: `${(file.size / 1024).toFixed(1)} KB` }));
                  }
                }} style={{ fontSize: '0.85rem' }} />
              </div>
              <div style={{ marginBottom: 16, textAlign: 'center', color: styles.gray500, fontSize: '0.8rem' }}>— O —</div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', marginBottom: 6 }}>URL del archivo</label>
                <input type="url" value={newFile.url} onChange={(e) => setNewFile(prev => ({ ...prev, url: e.target.value }))} 
                  style={{ width: '100%', padding: '10px 12px', border: `2px solid ${styles.gray300}`, borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }} 
                  placeholder="https://ejemplo.com/archivo.pdf" />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowFileModal(false); setNewFile({ nombre: '', descripcion: '', url: '', file: null }); }} 
                  style={{ padding: '10px 20px', background: styles.gray200, color: styles.gray700, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Cancelar</button>
                <button onClick={async () => {
                  if (!newFile.nombre) { alert('Ingrese un nombre para el archivo'); return; }
                  let fileUrl = newFile.url;
                  if (newFile.file && !newFile.url) {
                    // Upload file
                    const formData = new FormData();
                    formData.append('file', newFile.file);
                    try {
                      const res = await fetch(`${API_URL}/api/sms/configuracion/upload/adjunto`, { method: 'POST', body: formData });
                      if (res.ok) {
                        const data = await res.json();
                        fileUrl = data.url;
                      }
                    } catch (err) { console.error(err); }
                  }
                  if (fileUrl || newFile.url) {
                    setAdjuntos(prev => [...prev, { nombre: newFile.nombre, descripcion: newFile.descripcion, url: fileUrl || newFile.url, size: newFile.size || '-' }]);
                    setShowFileModal(false);
                    setNewFile({ nombre: '', descripcion: '', url: '', file: null });
                  } else {
                    alert('Seleccione un archivo o ingrese una URL');
                  }
                }} 
                  style={{ padding: '10px 20px', background: styles.black, color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Roles View
function RolesView() {
  const [roles, setRoles] = useState([]); const [selectedRoleId, setSelectedRoleId] = useState(null); const [options, setOptions] = useState([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editRole, setEditRole] = useState(null); const [formData, setFormData] = useState({ rol: '', estado: 'ACTIVO' });
  useEffect(() => { fetch(`${API_URL}/api/sms/roles`).then(r => r.json()).then(setRoles).catch(console.error).finally(() => setLoading(false)); }, []);
  const fetchOptions = async (roleId) => { setSelectedRoleId(roleId); const res = await fetch(`${API_URL}/api/sms/opciones/${roleId}`); setOptions(await res.json()); };
  const updateOptionState = async (id, estado) => { await fetch(`${API_URL}/api/sms/opciones/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado }) }); setOptions(prev => prev.map(o => o.id_opcion === id ? { ...o, estado } : o)); };
  const openModal = (role = null) => { if (role) { setEditRole(role); setFormData({ rol: role.rol, estado: role.estado }); } else { setEditRole(null); setFormData({ rol: '', estado: 'ACTIVO' }); } setShowModal(true); };
  const saveRole = async () => { if (!formData.rol.trim()) { alert('El nombre del rol es obligatorio'); return; } const method = editRole ? 'PUT' : 'POST'; const url = editRole ? `${API_URL}/api/sms/roles/${editRole.id_rol}` : `${API_URL}/api/sms/roles`; const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }); if (res.ok) { setShowModal(false); const data = await fetch(`${API_URL}/api/sms/roles`).then(r => r.json()); setRoles(data); } };
  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>ROLES</h2><button onClick={() => openModal()} style={{ padding: '8px 16px', background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Adicionar</button></div>
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={headerStyle}>ID ROL</th><th style={headerStyle}>ROL</th><th style={headerStyle}>ESTADO</th><th style={{ ...headerStyle, textAlign: 'center' }}>OP</th></tr></thead>
          <tbody>{roles.map(role => (
            <tr key={role.id_rol} onClick={() => fetchOptions(role.id_rol)} style={{ borderBottom: `1px solid ${styles.gray200}`, cursor: 'pointer', background: selectedRoleId === role.id_rol ? styles.gray100 : 'transparent' }}>
              <td style={{ ...rowStyle, textAlign: 'center' }}>{role.id_rol}</td><td style={rowStyle}>{role.rol}</td>
              <td style={{ ...rowStyle, textAlign: 'center' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: role.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: role.estado === 'ACTIVO' ? styles.green : styles.red }}>{role.estado}</span></td>
              <td style={{ ...rowStyle, textAlign: 'center' }}><button onClick={(e) => { e.stopPropagation(); openModal(role); }} style={{ padding: '3px 10px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>✏️</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 10, color: styles.gray700 }}>ACCESO</h4>
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={headerStyle}>ID</th><th style={headerStyle}>OPCIÓN</th><th style={{ ...headerStyle, textAlign: 'center' }}>ESTADO</th></tr></thead>
          <tbody>{options.length === 0 ? <tr><td colSpan={3} style={{ ...rowStyle, textAlign: 'center', color: styles.gray500 }}>Seleccione un Rol</td></tr> : options.map(opt => (
            <tr key={opt.id_opcion} style={{ borderBottom: `1px solid ${styles.gray200}` }}><td style={{ ...rowStyle, textAlign: 'center' }}>{opt.id_opcion}</td><td style={rowStyle}>{opt.opcion}</td>
              <td style={{ ...rowStyle, textAlign: 'center' }}><select value={opt.estado} onChange={(e) => updateOptionState(opt.id_opcion, e.target.value)} style={{ padding: '3px 6px', border: 'none', borderRadius: 4, background: styles.gray100, fontSize: '0.75rem', cursor: 'pointer' }}><option value="ACTIVO">ACTIVO</option><option value="INACTIVO">INACTIVO</option></select></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 18, maxWidth: 380, width: '90%' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: '1rem' }}>{editRole ? 'Editar Rol' : 'Nuevo Rol'}</h3>
            <div style={{ marginBottom: 10 }}><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Nombre del Rol</label><input type="text" value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} /></div>
            <div style={{ marginBottom: 10 }}><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Estado</label><select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}><option value="ACTIVO">ACTIVO</option><option value="INACTIVO">INACTIVO</option></select></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 8, border: `2px solid ${styles.black}`, background: 'transparent', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button><button onClick={saveRole} style={{ flex: 1, padding: 8, background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Guardar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Menu Admin View
function MenuAdminView() {
  const [menus, setMenus] = useState([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editMenu, setEditMenu] = useState(null); const [formData, setFormData] = useState({}); const [separadores, setSeparadores] = useState([]);
  useEffect(() => { fetch(`${API_URL}/api/sms/menu_admin`).then(r => r.json()).then(data => { setMenus(data); setSeparadores(data.filter(m => m.tipo_opcion === 'separador')); }).catch(console.error).finally(() => setLoading(false)); }, []);
  const openModal = (menu = null) => { if (menu) { setEditMenu(menu); setFormData({ opcion: menu.opcion, tipo_opcion: menu.tipo_opcion, enlace: menu.enlace || '', id_padre: menu.id_padre || '', estado: menu.estado }); } else { setEditMenu(null); setFormData({ opcion: '', tipo_opcion: 'opcion', enlace: '', id_padre: '', estado: 'ACTIVO' }); } setShowModal(true); };
  const saveMenu = async () => { if (!formData.opcion.trim()) { alert('El nombre de la opción es obligatorio'); return; } const method = editMenu ? 'PUT' : 'POST'; const url = editMenu ? `${API_URL}/api/sms/menu/${editMenu.id_menu}` : `${API_URL}/api/sms/menu`; const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, id_padre: formData.id_padre || null }) }); if (res.ok) { setShowModal(false); const data = await fetch(`${API_URL}/api/sms/menu_admin`).then(r => r.json()); setMenus(data); setSeparadores(data.filter(m => m.tipo_opcion === 'separador')); } };
  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>GESTIÓN DE MENÚ</h2><button onClick={() => openModal()} style={{ padding: '8px 16px', background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Adicionar</button></div>
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={headerStyle}>ID</th><th style={headerStyle}>OPCIONES</th><th style={headerStyle}>TIPO</th><th style={headerStyle}>ESTADO</th><th style={{ ...headerStyle, textAlign: 'center' }}>OP</th></tr></thead>
          <tbody>{menus.map(menu => (
            <tr key={menu.id_menu} style={{ borderBottom: `1px solid ${styles.gray200}` }}><td style={{ ...rowStyle, textAlign: 'center' }}>{menu.id_menu}</td><td style={rowStyle}>{menu.opcion}</td><td style={{ ...rowStyle, textAlign: 'center' }}>{menu.tipo_opcion}</td>
              <td style={{ ...rowStyle, textAlign: 'center' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: menu.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: menu.estado === 'ACTIVO' ? styles.green : styles.red }}>{menu.estado}</span></td>
              <td style={{ ...rowStyle, textAlign: 'center' }}><button onClick={() => openModal(menu)} style={{ padding: '3px 10px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>✏️</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 18, maxWidth: 420, width: '90%' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: '1rem' }}>{editMenu ? 'Editar Menú' : 'Nuevo Menú'}</h3>
            <div style={{ marginBottom: 10 }}><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Grupo Padre</label><select value={formData.id_padre || ''} onChange={(e) => setFormData({ ...formData, id_padre: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}><option value="">Ninguno</option>{separadores.filter(s => s.id_menu !== editMenu?.id_menu).map(s => <option key={s.id_menu} value={s.id_menu}>{s.opcion}</option>)}</select></div>
            <div style={{ marginBottom: 10 }}><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Opción</label><input type="text" value={formData.opcion} onChange={(e) => setFormData({ ...formData, opcion: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} /></div>
            <div style={{ marginBottom: 10 }}><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Tipo</label><select value={formData.tipo_opcion} onChange={(e) => setFormData({ ...formData, tipo_opcion: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}><option value="opcion">Opción</option><option value="separador">Separador</option></select></div>
            <div style={{ marginBottom: 10 }}><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Enlace JS</label><input type="text" value={formData.enlace} onChange={(e) => setFormData({ ...formData, enlace: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} /></div>
            <div style={{ marginBottom: 10 }}><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Estado</label><select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}><option value="ACTIVO">ACTIVO</option><option value="INACTIVO">INACTIVO</option></select></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 8, border: `2px solid ${styles.black}`, background: 'transparent', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button><button onClick={saveMenu} style={{ flex: 1, padding: 8, background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Guardar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Usuarios View
function UsuariosView() {
  const [data, setData] = useState([]); const [areas, setAreas] = useState([]); const [roles, setRoles] = useState([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editItem, setEditItem] = useState(null); const [formData, setFormData] = useState({});
  useEffect(() => { Promise.all([fetch(`${API_URL}/api/sms/usuarios`).then(r => r.json()), fetch(`${API_URL}/api/sms/areas`).then(r => r.json()), fetch(`${API_URL}/api/sms/roles`).then(r => r.json())]).then(([u, a, r]) => { setData(u); setAreas(a); setRoles(r); }).catch(console.error).finally(() => setLoading(false)); }, []);
  const openModal = (item = null) => { if (item) { setEditItem(item); setFormData({ ...item, clave: '' }); } else { setEditItem(null); setFormData({ estado: 'ACTIVO' }); } setShowModal(true); };
  const saveItem = async () => { if (!formData.username || !formData.nombre) { alert('Nombre y Usuario son obligatorios'); return; } if (!editItem && !formData.clave) { alert('Contraseña es obligatoria'); return; } const method = editItem ? 'PUT' : 'POST'; const url = editItem ? `${API_URL}/api/sms/usuarios/${editItem.id_usuario}` : `${API_URL}/api/sms/usuarios`; const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }); if (res.ok) { setShowModal(false); setData(await fetch(`${API_URL}/api/sms/usuarios`).then(r => r.json())); } };
  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>Usuarios</h2><button onClick={() => openModal()} style={{ padding: '8px 16px', background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Adicionar</button></div>
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['ID', 'Doc', 'Nombre', 'Usuario', 'Fecha', 'Área', 'Rol', 'Estado', 'Op'].map(h => <th key={h} style={headerStyle}>{h}</th>)}</tr></thead>
          <tbody>{data.map(item => (
            <tr key={item.id_usuario} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
              <td style={{ ...rowStyle, textAlign: 'center' }}>{item.id_usuario}</td><td style={rowStyle}>{item.nro_documento || '-'}</td><td style={rowStyle}>{item.nombre}</td><td style={rowStyle}>{item.username}</td><td style={rowStyle}>{item.fecha_creacion?.split('T')[0] || '-'}</td><td style={rowStyle}>{item.area || '-'}</td><td style={rowStyle}>{item.rol || '-'}</td>
              <td style={{ ...rowStyle, textAlign: 'center' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: item.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: item.estado === 'ACTIVO' ? styles.green : styles.red }}>{item.estado}</span></td>
              <td style={{ ...rowStyle, textAlign: 'center' }}><button onClick={() => openModal(item)} style={{ padding: '3px 10px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>✏️</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 18, maxWidth: 520, width: '95%' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: '1rem' }}>{editItem ? 'Editar' : 'Nuevo'} Usuario</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Nro. Doc</label><input type="text" value={formData.nro_documento || ''} onChange={(e) => setFormData({ ...formData, nro_documento: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Nombre *</label><input type="text" value={formData.nombre || ''} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Usuario *</label><input type="text" value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Contraseña</label><input type="password" value={formData.clave || ''} onChange={(e) => setFormData({ ...formData, clave: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Área</label><select value={formData.id_area || ''} onChange={(e) => setFormData({ ...formData, id_area: e.target.value ? parseInt(e.target.value) : null })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}><option value="">-- Seleccionar --</option>{areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
              <div><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Rol</label><select value={formData.id_rol || ''} onChange={(e) => setFormData({ ...formData, id_rol: e.target.value ? parseInt(e.target.value) : null })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}><option value="">-- Seleccionar --</option>{roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.rol}</option>)}</select></div>
              <div><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Estado</label><select value={formData.estado || 'ACTIVO'} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}><option value="ACTIVO">ACTIVO</option><option value="INACTIVO">INACTIVO</option></select></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 8, border: `2px solid ${styles.black}`, background: 'transparent', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button><button onClick={saveItem} style={{ flex: 1, padding: 8, background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Guardar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Home View with Dashboard
function HomeView({ user, siteConfig }) {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [years, setYears] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [areas, setAreas] = useState([]);
  const [filters, setFilters] = useState({ year: '', id_sector: '', id_entidad: '', id_area: '' });

  const COLORS = ['#000000', '#09AA5B', '#0066CC', '#E11900', '#6B6B6B', '#CACACA', '#545454', '#A0A0A0'];

  useEffect(() => {
    // Load filter options - use config years from plan sectorial
    Promise.all([
      fetch(`${API_URL}/api/sms/configuracion/years`).then(r => r.json()),
      fetch(`${API_URL}/api/sms/sectores`).then(r => r.json()),
      fetch(`${API_URL}/api/sms/entidades`).then(r => r.json()),
      fetch(`${API_URL}/api/sms/areas`).then(r => r.json())
    ]).then(([yrs, sec, ent, ar]) => {
      setYears(yrs || []);
      setSectors(sec || []);
      setEntidades(ent || []);
      setAreas(ar || []);
      // Set current year as default if in range
      const currentYear = new Date().getFullYear();
      if (yrs && yrs.length > 0) {
        const defaultYear = yrs.includes(currentYear) ? currentYear : yrs[yrs.length - 1];
        setFilters(prev => ({ ...prev, year: defaultYear }));
      }
    }).catch(console.error);
  }, [siteConfig]);

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.id_sector) params.append('id_sector', filters.id_sector);
      if (filters.id_entidad) params.append('id_entidad', filters.id_entidad);
      if (filters.id_area) params.append('id_area', filters.id_area);
      
      const res = await fetch(`${API_URL}/api/sms/dashboard/summary?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('sms_token')}` }
      });
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const pieData = dashboardData && dashboardData.general ? [
    { name: 'Con Avance', value: dashboardData.general.con_avance || 0 },
    { name: 'Sin Avance', value: dashboardData.general.sin_avance || 0 }
  ] : [];

  const cardStyle = { background: styles.white, borderRadius: 8, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };
  const selectStyle = { padding: '8px 12px', border: `2px solid ${styles.gray300}`, borderRadius: 6, fontSize: '0.8rem', minWidth: 140 };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: 4 }}>Dashboard de Indicadores</h1>
          <p style={{ color: styles.gray600, fontSize: '0.85rem' }}>Sistema de Monitoreo Sectorial</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: styles.gray500 }}>Bienvenido,</div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.nombre || user?.username}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: styles.gray700 }}>FILTROS:</div>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.gray500, display: 'block', marginBottom: 4 }}>AÑO</label>
          <select value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)} style={selectStyle}>
            <option value="">Todos</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.gray500, display: 'block', marginBottom: 4 }}>SECTOR</label>
          <select value={filters.id_sector} onChange={(e) => handleFilterChange('id_sector', e.target.value)} style={selectStyle}>
            <option value="">Todos</option>
            {sectors.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.gray500, display: 'block', marginBottom: 4 }}>ENTIDAD</label>
          <select value={filters.id_entidad} onChange={(e) => handleFilterChange('id_entidad', e.target.value)} style={selectStyle}>
            <option value="">Todas</option>
            {entidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.gray500, display: 'block', marginBottom: 4 }}>ÁREA</label>
          <select value={filters.id_area} onChange={(e) => handleFilterChange('id_area', e.target.value)} style={selectStyle}>
            <option value="">Todas</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: '1.2rem', marginBottom: 10 }}>📊</div>
          <div style={{ color: styles.gray600 }}>Cargando datos del dashboard...</div>
        </div>
      ) : dashboardData && dashboardData.general ? (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
            <div style={{ ...cardStyle, borderLeft: `4px solid ${styles.black}` }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.gray500, textTransform: 'uppercase', marginBottom: 8 }}>Total Indicadores</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{dashboardData.general.total_indicadores || 0}</div>
            </div>
            <div style={{ ...cardStyle, borderLeft: `4px solid ${styles.green}` }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.gray500, textTransform: 'uppercase', marginBottom: 8 }}>Con Avance</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: styles.green }}>{dashboardData.general.con_avance || 0}</div>
            </div>
            <div style={{ ...cardStyle, borderLeft: `4px solid ${styles.red}` }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.gray500, textTransform: 'uppercase', marginBottom: 8 }}>Sin Avance</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: styles.red }}>{dashboardData.general.sin_avance || 0}</div>
            </div>
            <div style={{ ...cardStyle, borderLeft: `4px solid ${styles.blue}` }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.gray500, textTransform: 'uppercase', marginBottom: 8 }}>% Avance General</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: styles.blue }}>{dashboardData.general.porcentaje_avance || 0}%</div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Bar Chart - By Sector */}
            <div style={cardStyle}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', color: styles.gray700 }}>Indicadores por Sector</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dashboardData.por_sector || []} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={styles.gray200} />
                  <XAxis dataKey="nombre" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: '0.8rem', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Bar dataKey="total" name="Total" fill={styles.black} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="con_avance" name="Con Avance" fill={styles.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart - General Progress */}
            <div style={cardStyle}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', color: styles.gray700 }}>Estado General</div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? styles.green : styles.gray400} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '0.8rem', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Bar Chart - By Entity */}
            <div style={cardStyle}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', color: styles.gray700 }}>Indicadores por Entidad</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dashboardData.por_entidad || []} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={styles.gray200} />
                  <XAxis dataKey="nombre" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: '0.8rem', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Bar dataKey="total" name="Total" fill={styles.blue} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="con_avance" name="Con Avance" fill={styles.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart - By Area */}
            <div style={cardStyle}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', color: styles.gray700 }}>Indicadores por Área</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={(dashboardData.por_area || []).slice(0, 10)} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={styles.gray200} />
                  <XAxis dataKey="nombre" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: '0.8rem', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Bar dataKey="total" name="Total" fill={styles.gray700} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="con_avance" name="Con Avance" fill={styles.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Table */}
          <div style={cardStyle}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', color: styles.gray700 }}>Resumen de Indicadores</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    {['#', 'Indicador', 'Sector', 'Entidad', 'Área', 'Gestión', 'Avance'].map(h => (
                      <th key={h} style={headerStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(dashboardData.indicadores || []).slice(0, 15).map((ind, idx) => (
                    <tr key={ind.id_indicador || idx} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                      <td style={{ ...rowStyle, textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ ...rowStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ind.indicador_resultado || '-'}</td>
                      <td style={rowStyle}>{ind.sector || '-'}</td>
                      <td style={rowStyle}>{ind.entidad || '-'}</td>
                      <td style={rowStyle}>{ind.area || '-'}</td>
                      <td style={{ ...rowStyle, textAlign: 'center' }}>{ind.gestion || '-'}</td>
                      <td style={{ ...rowStyle, textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 10,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          background: ind.total_acumulado > 0 ? '#D1FAE5' : '#FEE2E2',
                          color: ind.total_acumulado > 0 ? styles.green : styles.red
                        }}>
                          {ind.total_acumulado > 0 ? 'CON AVANCE' : 'SIN AVANCE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 60, color: styles.gray600 }}>
          No hay datos disponibles para mostrar
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 30, fontSize: '0.75rem', color: styles.gray500 }}>
        {siteConfig?.copyright_text || '© 2025 - Sistema de Monitoreo Sectorial'}
      </div>
    </div>
  );
}

// Configuration View
function ConfiguracionView({ siteConfig, onConfigChange }) {
  const [config, setConfig] = useState({
    plan_anio_inicio: 2020,
    plan_anio_fin: 2025,
    favicon_url: '',
    logo_url: '',
    logo_width: 40,
    logo_height: 40,
    color_theme: 'negro',
    modo: 'claro',
    copyright_text: '© 2025 - Sistema de Monitoreo Sectorial'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sms/configuracion`);
      const data = await res.json();
      setConfig(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/api/sms/configuracion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setMessage('✅ Configuración guardada correctamente');
        if (onConfigChange) onConfigChange(config);
      } else {
        setMessage('❌ Error al guardar la configuración');
      }
    } catch (err) {
      setMessage('❌ Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Cargando configuración...</div>;

  const cardStyle = { background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20 };
  const darkHeader = { background: styles.gray800, color: '#FFFFFF', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
  const inputStyle = { width: '100%', padding: '10px 12px', border: `2px solid ${styles.gray300}`, borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '0.7rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', marginBottom: 6 };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.3rem' }}>⚙️ Configuración del Sistema</h2>
        <button onClick={saveConfig} disabled={saving} style={{ padding: '10px 24px', background: styles.black, color: '#FFFFFF', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Guardando...' : '💾 Guardar Configuración'}
        </button>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 20, background: message.includes('✅') ? '#D1FAE5' : '#FEE2E2', color: message.includes('✅') ? styles.green : styles.red, fontSize: '0.85rem', fontWeight: 500 }}>
          {message}
        </div>
      )}

      {/* Plan Sectorial Period */}
      <div style={cardStyle}>
        <div style={darkHeader}>📅 Periodo del Plan Sectorial</div>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: '0.8rem', color: styles.gray600, marginBottom: 16 }}>
            Define el periodo de formulación y evaluación del Plan Sectorial. Solo los años dentro de este rango estarán disponibles en el sistema de seguimiento.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={labelStyle}>Año de Inicio</label>
              <input type="number" min="2000" max="2050" value={config.plan_anio_inicio} onChange={(e) => handleChange('plan_anio_inicio', parseInt(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Año de Fin</label>
              <input type="number" min="2000" max="2050" value={config.plan_anio_fin} onChange={(e) => handleChange('plan_anio_fin', parseInt(e.target.value))} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginTop: 12, padding: '10px 14px', background: styles.gray100, borderRadius: 6, fontSize: '0.75rem', color: styles.gray600 }}>
            <strong>Periodo actual:</strong> {config.plan_anio_inicio} - {config.plan_anio_fin} ({config.plan_anio_fin - config.plan_anio_inicio + 1} años)
          </div>
        </div>
      </div>

      {/* Logo and Favicon - File Upload OR URL */}
      <div style={cardStyle}>
        <div style={darkHeader}>🖼️ Logo y Favicon</div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Favicon */}
            <div>
              <label style={labelStyle}>Favicon del Sitio</label>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button 
                    onClick={() => document.getElementById('favicon-file').click()}
                    style={{ padding: '8px 12px', background: styles.black, color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                    📁 Subir Archivo
                  </button>
                  <input id="favicon-file" type="file" accept=".ico,.png,.jpg,.jpeg,.svg" style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          const res = await fetch(`${API_URL}/api/sms/configuracion/upload/favicon`, { method: 'POST', body: formData });
                          if (res.ok) {
                            const data = await res.json();
                            handleChange('favicon_url', data.url);
                            setMessage('✅ Favicon subido correctamente');
                          } else { setMessage('❌ Error al subir el favicon'); }
                        } catch (err) { setMessage('❌ Error de conexión'); }
                      }
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="url" placeholder="O ingrese URL del favicon" value={config.favicon_url || ''} 
                    onChange={(e) => handleChange('favicon_url', e.target.value)} 
                    style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>
              <p style={{ fontSize: '0.65rem', color: styles.gray500 }}>Formato: .ico, .png (32x32 recomendado)</p>
              {config.favicon_url && (
                <div style={{ marginTop: 8, padding: 8, background: styles.gray100, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={config.favicon_url.startsWith('/') ? API_URL + config.favicon_url : config.favicon_url} alt="Favicon" style={{ width: 24, height: 24 }} onError={(e) => { e.target.style.display = 'none'; }} />
                  <span style={{ fontSize: '0.7rem', color: styles.gray600 }}>Favicon actual</span>
                  <button onClick={() => handleChange('favicon_url', '')} style={{ marginLeft: 'auto', padding: '2px 8px', background: styles.red, color: '#FFF', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.65rem' }}>✕</button>
                </div>
              )}
            </div>
            
            {/* Logo */}
            <div>
              <label style={labelStyle}>Logo Principal</label>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button 
                    onClick={() => document.getElementById('logo-file').click()}
                    style={{ padding: '8px 12px', background: styles.black, color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                    📁 Subir Archivo
                  </button>
                  <input id="logo-file" type="file" accept=".png,.jpg,.jpeg,.svg,.gif" style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          const res = await fetch(`${API_URL}/api/sms/configuracion/upload/logo`, { method: 'POST', body: formData });
                          if (res.ok) {
                            const data = await res.json();
                            handleChange('logo_url', data.url);
                            setMessage('✅ Logo subido correctamente');
                          } else { setMessage('❌ Error al subir el logo'); }
                        } catch (err) { setMessage('❌ Error de conexión'); }
                      }
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="url" placeholder="O ingrese URL del logo" value={config.logo_url || ''} 
                    onChange={(e) => handleChange('logo_url', e.target.value)} 
                    style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>
              <p style={{ fontSize: '0.65rem', color: styles.gray500 }}>Formato: .png, .jpg, .svg</p>
            </div>
          </div>
          
          {/* Logo Size and Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 20, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>Ancho del Logo (px)</label>
              <input type="number" min="20" max="200" value={config.logo_width} onChange={(e) => handleChange('logo_width', parseInt(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Alto del Logo (px)</label>
              <input type="number" min="20" max="200" value={config.logo_height} onChange={(e) => handleChange('logo_height', parseInt(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Vista Previa del Logo</label>
              <div style={{ padding: 16, background: styles.gray100, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 60 }}>
                {config.logo_url ? (
                  <img 
                    src={config.logo_url.startsWith('/') ? API_URL + config.logo_url : config.logo_url} 
                    alt="Logo" 
                    style={{ width: config.logo_width, height: config.logo_height, objectFit: 'contain' }} 
                    onError={(e) => { e.target.style.display = 'none'; }} 
                  />
                ) : (
                  <span style={{ fontSize: '0.75rem', color: styles.gray500 }}>Sin logo configurado</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Color Theme */}
      <div style={cardStyle}>
        <div style={darkHeader}>🎨 Tema de Colores</div>
        <div style={{ padding: 20 }}>
          <label style={labelStyle}>Seleccionar Color Principal</label>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            {[
              { key: 'negro', label: 'Negro', color: '#000000', desc: 'Estilo UBER' },
              { key: 'azul', label: 'Azul', color: '#0066CC', desc: 'Profesional' },
              { key: 'rosa', label: 'Rosa', color: '#FF5A5F', desc: 'Estilo AirBNB' }
            ].map(theme => (
              <div key={theme.key} onClick={() => handleChange('color_theme', theme.key)}
                style={{ flex: 1, padding: 16, border: `3px solid ${config.color_theme === theme.key ? theme.color : styles.gray300}`, borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: config.color_theme === theme.key ? `${theme.color}10` : styles.white, transition: 'all 0.2s' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: theme.color, margin: '0 auto 12px' }}></div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{theme.label}</div>
                <div style={{ fontSize: '0.7rem', color: styles.gray500 }}>{theme.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Light/Dark Mode */}
      <div style={cardStyle}>
        <div style={darkHeader}>🌓 Modo de Visualización</div>
        <div style={{ padding: 20 }}>
          <label style={labelStyle}>Seleccionar Modo</label>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            {[
              { key: 'claro', label: '☀️ Modo Claro', desc: 'Fondo claro, texto oscuro' },
              { key: 'oscuro', label: '🌙 Modo Oscuro', desc: 'Fondo oscuro, texto claro' }
            ].map(mode => (
              <div key={mode.key} onClick={() => handleChange('modo', mode.key)}
                style={{ flex: 1, padding: 20, border: `3px solid ${config.modo === mode.key ? styles.black : styles.gray300}`, borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: config.modo === mode.key ? styles.gray100 : styles.white, transition: 'all 0.2s' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{mode.key === 'claro' ? '☀️' : '🌙'}</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{mode.label}</div>
                <div style={{ fontSize: '0.7rem', color: styles.gray500 }}>{mode.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div style={cardStyle}>
        <div style={darkHeader}>©️ Derechos de Autor</div>
        <div style={{ padding: 20 }}>
          <label style={labelStyle}>Texto de Copyright</label>
          <input type="text" placeholder="© 2025 - Mi Organización" value={config.copyright_text} onChange={(e) => handleChange('copyright_text', e.target.value)} style={inputStyle} />
          <div style={{ marginTop: 12, padding: '10px 14px', background: styles.gray100, borderRadius: 6, fontSize: '0.75rem', color: styles.gray600, textAlign: 'center' }}>
            <strong>Vista previa:</strong> {config.copyright_text}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [user, setUser] = useState(null); const [token, setToken] = useState(null); const [menuItems, setMenuItems] = useState([]); const [activeView, setActiveView] = useState('home'); const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [siteConfig, setSiteConfig] = useState({ plan_anio_inicio: 2020, plan_anio_fin: 2025, color_theme: 'negro', modo: 'claro', copyright_text: '© 2025 - Sistema de Monitoreo Sectorial', logo_url: '', logo_width: 40, logo_height: 40 });
  
  // Load site config on mount
  useEffect(() => {
    fetch(`${API_URL}/api/sms/configuracion`).then(res => res.json()).then(config => {
      setSiteConfig(prev => ({ ...prev, ...config }));
      // Update global styles
      styles = getStyles(config.color_theme || 'negro', config.modo || 'claro');
    }).catch(console.error);
  }, []);

  // Update favicon when config changes
  useEffect(() => {
    if (siteConfig.favicon_url) {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = siteConfig.favicon_url;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [siteConfig.favicon_url]);

  const handleConfigChange = (newConfig) => {
    setSiteConfig(newConfig);
    styles = getStyles(newConfig.color_theme || 'negro', newConfig.modo || 'claro');
    // Force re-render by updating state
    setActiveView(prev => prev);
  };

  useEffect(() => { const storedToken = localStorage.getItem('sms_token'); const storedUser = localStorage.getItem('sms_user'); if (storedToken && storedUser) { setToken(storedToken); setUser(JSON.parse(storedUser)); } }, []);
  useEffect(() => {
    if (user?.id_rol) {
      fetch(`${API_URL}/api/sms/opciones/${user.id_rol}`).then(res => res.json()).then(opciones => {
        fetch(`${API_URL}/api/sms/menu_admin`).then(res => res.json()).then(allMenus => {
          const menuWithAccess = opciones.map(opt => { const menuItem = allMenus.find(m => m.id_menu === opt.id_menu); return menuItem ? { ...menuItem, estado: opt.estado } : null; }).filter(Boolean);
          setMenuItems(menuWithAccess);
        });
      }).catch(console.error);
    }
  }, [user]);
  const handleLogin = (userData, tokenData) => { setUser(userData); setToken(tokenData); };
  const handleLogout = () => { localStorage.removeItem('sms_token'); localStorage.removeItem('sms_user'); setUser(null); setToken(null); setActiveView('home'); };
  if (!user || !token) return <Login onLogin={handleLogin} />;

  // Get current styles based on config
  const currentStyles = getStyles(siteConfig.color_theme, siteConfig.modo);
  const isDark = siteConfig.modo === 'oscuro';

  const renderView = () => {
    switch (activeView) {
      case 'home': return <HomeView user={user} siteConfig={siteConfig} />;
      case 'loadSectorView': return <CrudTable title="Sectores" endpoint="sectores" columns={[{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Sector' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'nombre', label: 'Nombre', type: 'text' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadEntidadView': return <EntidadesAreasView />;
      case 'loadPilarView': return <CrudTable title="Pilares" endpoint="pilares" columns={[{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Pilar' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'nombre', label: 'Nombre', type: 'text' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadEjeView': return <CrudTable title="Ejes" endpoint="ejes" columns={[{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Eje' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'nombre', label: 'Nombre', type: 'text' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadMetaView': return <CrudTable title="Metas" endpoint="metas" columns={[{ key: 'id', label: 'ID' }, { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Meta' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'codigo', label: 'Código', type: 'text' }, { key: 'nombre', label: 'Descripción', type: 'textarea' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadResultadoView': return <CrudTable title="Resultados" endpoint="resultados" columns={[{ key: 'id', label: 'ID' }, { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Resultado' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'codigo', label: 'Código', type: 'text' }, { key: 'nombre', label: 'Descripción', type: 'textarea' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadAccionView': return <CrudTable title="Acciones" endpoint="acciones" columns={[{ key: 'id', label: 'ID' }, { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Acción' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'codigo', label: 'Código', type: 'text' }, { key: 'nombre', label: 'Descripción', type: 'textarea' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadIndicadorView': return <IndicadoresView user={user} />;
      case 'loadRendicionView': case 'loadSeguimientoView': return <SeguimientoView user={user} siteConfig={siteConfig} />;
      case 'loadUsuariosView': return <UsuariosView />;
      case 'loadRolesView': case 'loadRolView': return <RolesView />;
      case 'loadMenuView': return <MenuAdminView />;
      case 'loadConfiguracionView': return <ConfiguracionView siteConfig={siteConfig} onConfigChange={handleConfigChange} />;
      default: return <HomeView user={user} siteConfig={siteConfig} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: isDark ? currentStyles.bgColor : currentStyles.gray100 }}>
      <Sidebar user={user} menuItems={menuItems} activeView={activeView} setActiveView={setActiveView} collapsed={sidebarCollapsed} siteConfig={siteConfig} />
      <div style={{ flex: 1, marginLeft: sidebarCollapsed ? 60 : 260, transition: 'margin-left 0.3s ease' }}>
        <nav style={{ background: isDark ? currentStyles.gray100 : currentStyles.white, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${isDark ? currentStyles.gray300 : currentStyles.gray200}`, position: 'sticky', top: 0, zIndex: 100 }}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: 4, color: isDark ? currentStyles.textColor : currentStyles.black }}>☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 600, fontSize: '0.8rem', color: isDark ? currentStyles.textColor : currentStyles.black }}>{user?.nombre || user?.username}</div><div style={{ fontSize: '0.65rem', color: currentStyles.gray500 }}>{user?.rol || 'Usuario'}</div></div>
            <button onClick={handleLogout} style={{ padding: '5px 12px', background: currentStyles.red, color: '#FFFFFF', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500, fontSize: '0.75rem' }}>Salir</button>
          </div>
        </nav>
        <div style={{ padding: 20 }}>{renderView()}</div>
      </div>
    </div>
  );
}

export default App;
