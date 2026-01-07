import React, { useState, useEffect } from 'react';
import { API_URL, defaultStyles as styles, getTableStyles } from '../../styles/theme';

const { rowStyle, headerStyle } = getTableStyles(styles);

function MenuAdminView() {
  const [menus, setMenus] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [showModal, setShowModal] = useState(false); 
  const [editMenu, setEditMenu] = useState(null); 
  const [formData, setFormData] = useState({}); 
  const [separadores, setSeparadores] = useState([]);
  
  useEffect(() => { 
    fetch(`${API_URL}/api/sms/menu_admin`)
      .then(r => r.json())
      .then(data => { 
        setMenus(data); 
        setSeparadores(data.filter(m => m.tipo_opcion === 'separador')); 
      })
      .catch(console.error)
      .finally(() => setLoading(false)); 
  }, []);
  
  const openModal = (menu = null) => { 
    if (menu) { 
      setEditMenu(menu); 
      setFormData({ opcion: menu.opcion, tipo_opcion: menu.tipo_opcion, enlace: menu.enlace || '', id_padre: menu.id_padre || '', estado: menu.estado }); 
    } else { 
      setEditMenu(null); 
      setFormData({ opcion: '', tipo_opcion: 'opcion', enlace: '', id_padre: '', estado: 'ACTIVO' }); 
    } 
    setShowModal(true); 
  };
  
  const saveMenu = async () => { 
    if (!formData.opcion.trim()) { alert('El nombre de la opción es obligatorio'); return; } 
    const method = editMenu ? 'PUT' : 'POST'; 
    const url = editMenu ? `${API_URL}/api/sms/menu/${editMenu.id_menu}` : `${API_URL}/api/sms/menu`; 
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, id_padre: formData.id_padre || null }) }); 
    if (res.ok) { 
      setShowModal(false); 
      const data = await fetch(`${API_URL}/api/sms/menu_admin`).then(r => r.json()); 
      setMenus(data); 
      setSeparadores(data.filter(m => m.tipo_opcion === 'separador')); 
    } 
  };
  
  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>GESTIÓN DE MENÚ</h2>
        <button onClick={() => openModal()} style={{ padding: '8px 16px', background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Adicionar</button>
      </div>
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle}>ID</th>
              <th style={headerStyle}>OPCIONES</th>
              <th style={headerStyle}>TIPO</th>
              <th style={headerStyle}>ESTADO</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>OP</th>
            </tr>
          </thead>
          <tbody>
            {menus.map(menu => (
              <tr key={menu.id_menu} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                <td style={{ ...rowStyle, textAlign: 'center' }}>{menu.id_menu}</td>
                <td style={rowStyle}>{menu.opcion}</td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>{menu.tipo_opcion}</td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: menu.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: menu.estado === 'ACTIVO' ? styles.green : styles.red }}>{menu.estado}</span>
                </td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <button onClick={() => openModal(menu)} style={{ padding: '3px 10px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>✏️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 18, maxWidth: 420, width: '90%' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: '1rem' }}>{editMenu ? 'Editar Menú' : 'Nuevo Menú'}</h3>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Grupo Padre</label>
              <select value={formData.id_padre || ''} onChange={(e) => setFormData({ ...formData, id_padre: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}>
                <option value="">Ninguno</option>
                {separadores.filter(s => s.id_menu !== editMenu?.id_menu).map(s => <option key={s.id_menu} value={s.id_menu}>{s.opcion}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Opción</label>
              <input type="text" value={formData.opcion} onChange={(e) => setFormData({ ...formData, opcion: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Tipo</label>
              <select value={formData.tipo_opcion} onChange={(e) => setFormData({ ...formData, tipo_opcion: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}>
                <option value="opcion">Opción</option>
                <option value="separador">Separador</option>
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Enlace JS</label>
              <input type="text" value={formData.enlace} onChange={(e) => setFormData({ ...formData, enlace: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Estado</label>
              <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}>
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 8, border: `2px solid ${styles.black}`, background: 'transparent', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
              <button onClick={saveMenu} style={{ flex: 1, padding: 8, background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuAdminView;
