import React, { useState, useEffect } from 'react';
import './App.css';

// Imported components
import { RolesView, MenuAdminView, UsuariosView, SeguimientoView, HomeView, IndicadoresView, EntidadesAreasView, ConfiguracionView } from './components/views';
import { Login, Sidebar, CrudTable } from './components/common';
import { API_URL, getStyles } from './styles/theme';

// Default styles (will be overridden by context)
let styles = getStyles('negro', 'claro');

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [activeView, setActiveView] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [siteConfig, setSiteConfig] = useState({
    plan_anio_inicio: 2020,
    plan_anio_fin: 2025,
    color_theme: 'negro',
    modo: 'claro',
    copyright_text: '© 2025 - Sistema de Monitoreo Sectorial',
    logo_url: '',
    logo_width: 40,
    logo_height: 40
  });

  // Load site config on mount
  useEffect(() => {
    fetch(`${API_URL}/api/sms/configuracion`)
      .then(res => res.json())
      .then(config => {
        setSiteConfig(prev => ({ ...prev, ...config }));
        styles = getStyles(config.color_theme || 'negro', config.modo || 'claro');
      })
      .catch(console.error);
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
    setActiveView(prev => prev);
  };

  // Check for existing session
  useEffect(() => {
    const storedToken = localStorage.getItem('sms_token');
    const storedUser = localStorage.getItem('sms_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Load menu items based on user role
  useEffect(() => {
    if (user?.id_rol) {
      fetch(`${API_URL}/api/sms/opciones/${user.id_rol}`)
        .then(res => res.json())
        .then(opciones => {
          fetch(`${API_URL}/api/sms/menu_admin`)
            .then(res => res.json())
            .then(allMenus => {
              const menuWithAccess = opciones
                .map(opt => {
                  const menuItem = allMenus.find(m => m.id_menu === opt.id_menu);
                  return menuItem ? { ...menuItem, estado: opt.estado } : null;
                })
                .filter(Boolean);
              setMenuItems(menuWithAccess);
            });
        })
        .catch(console.error);
    }
  }, [user]);

  const handleLogin = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
  };

  const handleLogout = () => {
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_user');
    setUser(null);
    setToken(null);
    setActiveView('home');
  };

  // Show login if not authenticated
  if (!user || !token) return <Login onLogin={handleLogin} />;

  // Get current styles based on config
  const currentStyles = getStyles(siteConfig.color_theme, siteConfig.modo);
  const isDark = siteConfig.modo === 'oscuro';
  
  // Check if user is read-only (INVITADO role)
  const isReadOnly = user?.rol === 'INVITADO';
  const isAdmin = user?.rol === 'ADMINISTRADOR';

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeView user={user} siteConfig={siteConfig} />;
      case 'loadSectorView':
        return <CrudTable title="Sectores" endpoint="sectores" columns={[{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Sector' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'nombre', label: 'Nombre', type: 'text' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} readOnly={isReadOnly} />;
      case 'loadEntidadView':
        return <EntidadesAreasView readOnly={isReadOnly} />;
      case 'loadPilarView':
        return <CrudTable title="Pilares" endpoint="pilares" columns={[{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Pilar' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'nombre', label: 'Nombre', type: 'text' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} readOnly={isReadOnly} />;
      case 'loadEjeView':
        return <CrudTable title="Ejes" endpoint="ejes" columns={[{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Eje' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'nombre', label: 'Nombre', type: 'text' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} readOnly={isReadOnly} />;
      case 'loadMetaView':
        return <CrudTable title="Metas" endpoint="metas" columns={[{ key: 'id', label: 'ID' }, { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Meta' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'codigo', label: 'Código', type: 'text' }, { key: 'nombre', label: 'Descripción', type: 'textarea' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} readOnly={isReadOnly} />;
      case 'loadResultadoView':
        return <CrudTable title="Resultados" endpoint="resultados" columns={[{ key: 'id', label: 'ID' }, { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Resultado' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'codigo', label: 'Código', type: 'text' }, { key: 'nombre', label: 'Descripción', type: 'textarea' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} readOnly={isReadOnly} />;
      case 'loadAccionView':
        return <CrudTable title="Acciones" endpoint="acciones" columns={[{ key: 'id', label: 'ID' }, { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Acción' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'codigo', label: 'Código', type: 'text' }, { key: 'nombre', label: 'Descripción', type: 'textarea' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} readOnly={isReadOnly} />;
      case 'loadIndicadorView':
        return <IndicadoresView user={user} readOnly={isReadOnly} />;
      case 'loadRendicionView':
      case 'loadSeguimientoView':
        return <SeguimientoView user={user} siteConfig={siteConfig} readOnly={isReadOnly} />;
      case 'loadUsuariosView':
        return <UsuariosView readOnly={isReadOnly} />;
      case 'loadRolesView':
      case 'loadRolView':
        return <RolesView readOnly={isReadOnly} />;
      case 'loadMenuView':
        return <MenuAdminView readOnly={isReadOnly} />;
      case 'loadConfiguracionView':
        return <ConfiguracionView siteConfig={siteConfig} onConfigChange={handleConfigChange} readOnly={isReadOnly} />;
      default:
        return <HomeView user={user} siteConfig={siteConfig} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: isDark ? currentStyles.bgColor : currentStyles.gray100 }}>
      <Sidebar user={user} menuItems={menuItems} activeView={activeView} setActiveView={setActiveView} collapsed={sidebarCollapsed} siteConfig={siteConfig} />
      <div style={{ flex: 1, marginLeft: sidebarCollapsed ? 60 : 260, transition: 'margin-left 0.3s ease' }}>
        <nav style={{ background: isDark ? currentStyles.gray100 : currentStyles.white, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${isDark ? currentStyles.gray300 : currentStyles.gray200}`, position: 'sticky', top: 0, zIndex: 100 }}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: 4, color: isDark ? currentStyles.textColor : currentStyles.black }}>☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: isDark ? currentStyles.textColor : currentStyles.black }}>{user?.nombre || user?.username}</div>
              <div style={{ fontSize: '0.65rem', color: currentStyles.gray500 }}>{user?.rol || 'Usuario'}</div>
            </div>
            <button onClick={handleLogout} style={{ padding: '5px 12px', background: currentStyles.red, color: '#FFFFFF', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500, fontSize: '0.75rem' }}>Salir</button>
          </div>
        </nav>
        <div style={{ padding: 20 }}>{renderView()}</div>
      </div>
    </div>
  );
}

export default App;
