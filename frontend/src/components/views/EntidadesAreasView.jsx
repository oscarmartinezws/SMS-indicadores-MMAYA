import React, { useState, useEffect } from 'react';
import { API_URL, defaultStyles as styles, getTableStyles } from '../../styles/theme';

const { rowStyle, headerStyle } = getTableStyles(styles);

function EntidadesAreasView({ readOnly = false }) {
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
    if (readOnly) return;
    setEditItem(item);
    setFormData(item ? { ...item } : { nombre: '', estado: 'ACTIVO' });
    setShowEntidadModal(true);
  };

  const saveEntidad = async () => {
    if (readOnly) return;
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
    if (readOnly) return;
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
          {!readOnly && <button onClick={() => openEntidadModal()} style={{ padding: '6px 14px', background: styles.green, color: styles.white, border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem' }}>+ Adicionar</button>}
        </div>
        <div style={{ background: styles.white, borderRadius: '0 0 6px 6px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxHeight: 400, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: styles.gray100 }}>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, width: 40 }}>#</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>NOMBRE DE LA ENTIDAD</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, width: 80 }}>ESTADO</th>
                {!readOnly && <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, width: 100 }}>ACCIONES</th>}
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
                  {!readOnly && <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <button onClick={(e) => { e.stopPropagation(); openEntidadModal(ent); }} style={{ padding: '3px 8px', background: styles.blue, color: styles.white, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem', marginRight: 4 }}>✏️</button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedEntidad(ent); }} style={{ padding: '3px 8px', background: styles.gray600, color: styles.white, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }}>📋</button>
                  </td>}
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
          {selectedEntidad && !readOnly && (
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
      {showEntidadModal && !readOnly && (
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

export default EntidadesAreasView;
