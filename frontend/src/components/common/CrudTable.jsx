import React, { useState, useEffect, useCallback } from 'react';
import { API_URL, defaultStyles as styles, getTableStyles } from '../../styles/theme';

const { rowStyle, headerStyle } = getTableStyles(styles);

function CrudTable({ title, endpoint, columns, formFields, idField = 'id', readOnly = false }) {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editItem, setEditItem] = useState(null); const [formData, setFormData] = useState({});
  const fetchData = useCallback(async () => { try { setLoading(true); const res = await fetch(`${API_URL}/api/sms/${endpoint}`); const result = await res.json(); setData(Array.isArray(result) ? result : []); } catch (err) { console.error(err); setData([]); } finally { setLoading(false); } }, [endpoint]);
  useEffect(() => { fetchData(); }, [fetchData]);
  const openModal = (item = null) => { if (readOnly) return; if (item) { setEditItem(item); setFormData({ ...item }); } else { setEditItem(null); setFormData({ estado: 'ACTIVO' }); } setShowModal(true); };
  const saveItem = async () => { if (readOnly) return; try { const method = editItem ? 'PUT' : 'POST'; const url = editItem ? `${API_URL}/api/sms/${endpoint}/${editItem[idField]}` : `${API_URL}/api/sms/${endpoint}`; const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }); if (res.ok) { setShowModal(false); fetchData(); } else { const err = await res.json(); alert(err.detail || 'Error al guardar'); } } catch (err) { console.error(err); alert('Error de conexión'); } };

  const disabledBtnStyle = { opacity: 0.5, cursor: 'not-allowed' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>{title}</h2>
        <button 
          onClick={() => !readOnly && openModal()} 
          disabled={readOnly}
          style={{ padding: '8px 16px', background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: readOnly ? 'not-allowed' : 'pointer', fontSize: '0.8rem', ...(readOnly ? disabledBtnStyle : {}) }}
        >+ Adicionar</button>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div> : (
        <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{columns.map(col => <th key={col.key} style={headerStyle}>{col.label}</th>)}<th style={{ ...headerStyle, textAlign: 'center' }}>Op</th></tr></thead>
            <tbody>{(Array.isArray(data) ? data : []).map((item, idx) => (
              <tr key={item[idField] || idx} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                {columns.map(col => <td key={col.key} style={rowStyle}>{col.key === 'estado' ? <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: item[col.key] === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: item[col.key] === 'ACTIVO' ? styles.green : styles.red }}>{item[col.key]}</span> : item[col.key]}</td>)}
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <button 
                    onClick={() => !readOnly && openModal(item)} 
                    disabled={readOnly}
                    style={{ padding: '3px 10px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: readOnly ? 'not-allowed' : 'pointer', fontSize: '0.75rem', ...(readOnly ? disabledBtnStyle : {}) }}
                  >✏️</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {showModal && !readOnly && (
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


export default CrudTable;
