import React, { useState, useEffect } from 'react';
import { API_URL, defaultStyles as styles, getTableStyles } from '../../styles/theme';

const { rowStyle, headerStyle } = getTableStyles(styles);

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
  const [selectedPlanes, setSelectedPlanes] = useState([]);
  
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
      const [entRes, areaRes, secRes, pilRes, ejeRes, metaRes, resRes, accRes, planRes] = await Promise.all([
        fetch(`${API_URL}/api/sms/entidades`),
        fetch(`${API_URL}/api/sms/areas`),
        fetch(`${API_URL}/api/sms/sectores`),
        fetch(`${API_URL}/api/sms/pilares`),
        fetch(`${API_URL}/api/sms/ejes`),
        fetch(`${API_URL}/api/sms/metas`),
        fetch(`${API_URL}/api/sms/resultados`),
        fetch(`${API_URL}/api/sms/acciones`),
        fetch(`${API_URL}/api/sms/planes`)
      ]);
      setCatalogs({
        entidades: await entRes.json(),
        areas: await areaRes.json(),
        sectores: await secRes.json(),
        pilares: await pilRes.json(),
        ejes: await ejeRes.json(),
        metas: await metaRes.json(),
        resultados: await resRes.json(),
        acciones: await accRes.json(),
        planes: await planRes.json()
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
      // Load planes for this indicator
      if (item.planes && Array.isArray(item.planes)) {
        setSelectedPlanes(item.planes.map(p => p.id));
      } else {
        setSelectedPlanes([]);
      }
    } else {
      setEditingItem(null);
      setFormData({
        id_entidad: '', id_area: '', id_sector: '', id_pilar: '', id_eje: '',
        codi_meta: '', codi_resultado: '', codi_accion: '', codi: '',
        indicador_resultado: '', formula_indicador: '', anio_base: '',
        linea_base: '', anio_logro: '', logro: '', estado: 'ACTIVO'
      });
      setSelectedPlanes([]);
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
        // Get the indicator ID (for new ones, it's in the response)
        let indicadorId = editingItem?.id_indicador;
        if (!editingItem) {
          const newIndicador = await res.json();
          indicadorId = newIndicador.id_indicador;
        }
        
        // Save planes
        if (indicadorId) {
          await fetch(`${API_URL}/api/sms/indicador_planes/${indicadorId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planes: selectedPlanes })
          });
        }
        
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


export default IndicadoresView;
