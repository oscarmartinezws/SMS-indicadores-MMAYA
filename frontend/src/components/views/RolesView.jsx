import React, { useState, useEffect } from 'react';
import { API_URL, defaultStyles as styles, getTableStyles } from '../../styles/theme';

const { rowStyle, headerStyle } = getTableStyles(styles);

function RolesView({ readOnly = false }) {
  const [roles, setRoles] = useState([]); 
  const [selectedRoleId, setSelectedRoleId] = useState(null); 
  const [options, setOptions] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [showModal, setShowModal] = useState(false); 
  const [editRole, setEditRole] = useState(null); 
  const [formData, setFormData] = useState({ rol: '', estado: 'ACTIVO' });
  
  useEffect(() => { 
    fetch(`${API_URL}/api/sms/roles`)
      .then(r => r.json())
      .then(setRoles)
      .catch(console.error)
      .finally(() => setLoading(false)); 
  }, []);
  
  const fetchOptions = async (roleId) => { 
    setSelectedRoleId(roleId); 
    const res = await fetch(`${API_URL}/api/sms/opciones/${roleId}`); 
    setOptions(await res.json()); 
  };
  
  const updateOptionState = async (id, estado) => { 
    if (readOnly) return;
    await fetch(`${API_URL}/api/sms/opciones/${id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ estado }) 
    }); 
    setOptions(prev => prev.map(o => o.id_opcion === id ? { ...o, estado } : o)); 
  };
  
  const openModal = (role = null) => { 
    if (readOnly) return;
    if (role) { 
      setEditRole(role); 
      setFormData({ rol: role.rol, estado: role.estado }); 
    } else { 
      setEditRole(null); 
      setFormData({ rol: '', estado: 'ACTIVO' }); 
    } 
    setShowModal(true); 
  };
  
  const saveRole = async () => { 
    if (readOnly) return;
    if (!formData.rol.trim()) { alert('El nombre del rol es obligatorio'); return; } 
    const method = editRole ? 'PUT' : 'POST'; 
    const url = editRole ? `${API_URL}/api/sms/roles/${editRole.id_rol}` : `${API_URL}/api/sms/roles`; 
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }); 
    if (res.ok) { 
      setShowModal(false); 
      const data = await fetch(`${API_URL}/api/sms/roles`).then(r => r.json()); 
      setRoles(data); 
    } 
  };
  
  const disabledBtnStyle = { opacity: 0.5, cursor: 'not-allowed' };

  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>ROLES</h2>
        <button 
          onClick={() => !readOnly && openModal()} 
          disabled={readOnly}
          style={{ padding: '8px 16px', background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: readOnly ? 'not-allowed' : 'pointer', fontSize: '0.8rem', ...(readOnly ? disabledBtnStyle : {}) }}
        >+ Adicionar</button>
      </div>
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle}>ID ROL</th>
              <th style={headerStyle}>ROL</th>
              <th style={headerStyle}>ESTADO</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>OP</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id_rol} onClick={() => fetchOptions(role.id_rol)} style={{ borderBottom: `1px solid ${styles.gray200}`, cursor: 'pointer', background: selectedRoleId === role.id_rol ? styles.gray100 : 'transparent' }}>
                <td style={{ ...rowStyle, textAlign: 'center' }}>{role.id_rol}</td>
                <td style={rowStyle}>{role.rol}</td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: role.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: role.estado === 'ACTIVO' ? styles.green : styles.red }}>{role.estado}</span>
                </td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); !readOnly && openModal(role); }} 
                    disabled={readOnly}
                    style={{ padding: '3px 10px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: readOnly ? 'not-allowed' : 'pointer', fontSize: '0.75rem', ...(readOnly ? disabledBtnStyle : {}) }}
                  >✏️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 10, color: styles.gray700 }}>ACCESO</h4>
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle}>ID</th>
              <th style={headerStyle}>OPCIÓN</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {options.length === 0 ? (
              <tr><td colSpan={3} style={{ ...rowStyle, textAlign: 'center', color: styles.gray500 }}>Seleccione un Rol</td></tr>
            ) : options.map(opt => (
              <tr key={opt.id_opcion} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                <td style={{ ...rowStyle, textAlign: 'center' }}>{opt.id_opcion}</td>
                <td style={rowStyle}>{opt.opcion}</td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <select 
                    value={opt.estado} 
                    onChange={(e) => !readOnly && updateOptionState(opt.id_opcion, e.target.value)} 
                    disabled={readOnly}
                    style={{ padding: '3px 6px', border: 'none', borderRadius: 4, background: styles.gray100, fontSize: '0.75rem', cursor: readOnly ? 'not-allowed' : 'pointer', ...(readOnly ? disabledBtnStyle : {}) }}
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && !readOnly && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 18, maxWidth: 380, width: '90%' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: '1rem' }}>{editRole ? 'Editar Rol' : 'Nuevo Rol'}</h3>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Nombre del Rol</label>
              <input type="text" value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />
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
              <button onClick={saveRole} style={{ flex: 1, padding: 8, background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RolesView;
