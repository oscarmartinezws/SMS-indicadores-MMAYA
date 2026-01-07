import React, { useState } from 'react';
import { API_URL, getStyles } from '../../styles/theme';

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
            <div key={item.id_menu} onClick={() => { console.log('Clicking menu item:', item.opcion, 'enlace:', item.enlace); if (item.enlace) setActiveView(item.enlace); }} style={{ padding: '6px 14px 6px 40px', color: activeView === item.enlace ? '#FFFFFF' : currentStyles.gray400, background: activeView === item.enlace ? currentStyles.primaryHover : 'transparent', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.15s ease' }}>{item.opcion}</div>
          ))}
        </div>
      ))}
      {isAdmin && (
        <div onClick={() => setActiveView('loadConfiguracionView')} style={{ padding: '8px 14px', color: activeView === 'loadConfiguracionView' ? '#FFFFFF' : currentStyles.gray400, background: activeView === 'loadConfiguracionView' ? currentStyles.primaryHover : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', marginTop: 8, borderTop: `1px solid ${currentStyles.gray800}` }}><span>⚙️</span>{!collapsed && <span>Configuración del Sistema</span>}</div>
      )}
    </div>
  );
}

export default Sidebar;
