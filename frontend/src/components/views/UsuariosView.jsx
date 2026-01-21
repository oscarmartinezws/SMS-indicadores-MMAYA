import React, { useState, useEffect } from 'react';
import { API_URL, defaultStyles as styles, getTableStyles } from '../../styles/theme';

const { rowStyle, headerStyle } = getTableStyles(styles);

function UsuariosView({ readOnly = false }) {
  const [data, setData] = useState([]); 
  const [areas, setAreas] = useState([]); 
  const [roles, setRoles] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [showModal, setShowModal] = useState(false); 
  const [editItem, setEditItem] = useState(null); 
  const [formData, setFormData] = useState({});
  
  useEffect(() => { 
    Promise.all([
      fetch(`${API_URL}/api/sms/usuarios`).then(r => r.json()), 
      fetch(`${API_URL}/api/sms/areas`).then(r => r.json()), 
      fetch(`${API_URL}/api/sms/roles`).then(r => r.json())
    ]).then(([u, a, r]) => { 
      setData(u); 
      setAreas(a); 
      setRoles(r); 
    }).catch(console.error).finally(() => setLoading(false)); 
  }, []);
  
  const openModal = (item = null) => { 
    if (readOnly) return;
    if (item) { 
      setEditItem(item); 
      setFormData({ ...item, clave: '' }); 
    } else { 
      setEditItem(null); 
      setFormData({ estado: 'ACTIVO' }); 
    } 
    setShowModal(true); 
  };
  
  const saveItem = async () => { 
    if (!formData.username || !formData.nombre) { alert('Nombre y Usuario son obligatorios'); return; } 
    if (!editItem && !formData.clave) { alert('Contraseña es obligatoria'); return; } 
    const method = editItem ? 'PUT' : 'POST'; 
    const url = editItem ? `${API_URL}/api/sms/usuarios/${editItem.id_usuario}` : `${API_URL}/api/sms/usuarios`; 
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }); 
    if (res.ok) { 
      setShowModal(false); 
      setData(await fetch(`${API_URL}/api/sms/usuarios`).then(r => r.json())); 
    } 
  };
  
  const disabledBtnStyle = { opacity: 0.5, cursor: 'not-allowed' };

  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>Usuarios</h2>
        <button 
          onClick={() => !readOnly && openModal()} 
          disabled={readOnly}
          style={{ padding: '8px 16px', background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: readOnly ? 'not-allowed' : 'pointer', fontSize: '0.8rem', ...(readOnly ? disabledBtnStyle : {}) }}
        >+ Adicionar</button>
      </div>
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['ID', 'Doc', 'Nombre', 'Usuario', 'Fecha', 'Área', 'Rol', 'Estado', 'Op'].map(h => <th key={h} style={headerStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id_usuario} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                <td style={{ ...rowStyle, textAlign: 'center' }}>{item.id_usuario}</td>
                <td style={rowStyle}>{item.nro_documento || '-'}</td>
                <td style={rowStyle}>{item.nombre}</td>
                <td style={rowStyle}>{item.username}</td>
                <td style={rowStyle}>{item.fecha_creacion?.split('T')[0] || '-'}</td>
                <td style={rowStyle}>{item.area || '-'}</td>
                <td style={rowStyle}>{item.rol || '-'}</td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: item.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: item.estado === 'ACTIVO' ? styles.green : styles.red }}>{item.estado}</span>
                </td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <button 
                    onClick={() => !readOnly && openModal(item)} 
                    disabled={readOnly}
                    style={{ padding: '3px 10px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: readOnly ? 'not-allowed' : 'pointer', fontSize: '0.75rem', ...(readOnly ? disabledBtnStyle : {}) }}
                  >✏️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && !readOnly && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 18, maxWidth: 520, width: '95%' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: '1rem' }}>{editItem ? 'Editar' : 'Nuevo'} Usuario</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Nro. Doc</label>
                <input type="text" value={formData.nro_documento || ''} onChange={(e) => setFormData({ ...formData, nro_documento: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Nombre *</label>
                <input type="text" value={formData.nombre || ''} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Usuario *</label>
                <input type="text" value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Contraseña</label>
                <input type="password" value={formData.clave || ''} onChange={(e) => setFormData({ ...formData, clave: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Área</label>
                <select value={formData.id_area || ''} onChange={(e) => setFormData({ ...formData, id_area: e.target.value ? parseInt(e.target.value) : null })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}>
                  <option value="">-- Seleccionar --</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Rol</label>
                <select value={formData.id_rol || ''} onChange={(e) => setFormData({ ...formData, id_rol: e.target.value ? parseInt(e.target.value) : null })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}>
                  <option value="">-- Seleccionar --</option>
                  {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.rol}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Estado</label>
                <select value={formData.estado || 'ACTIVO'} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}>
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>
            </div>
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

export default UsuariosView;
