import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { API_URL, getStyles, defaultStyles, getTableStyles } from '../../styles/theme';

function HomeView({ user, siteConfig }) {
  const styles = siteConfig ? getStyles(siteConfig.color_theme, siteConfig.modo) : defaultStyles;
  const { rowStyle, headerStyle } = getTableStyles(styles);
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [years, setYears] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [areas, setAreas] = useState([]);
  const [filters, setFilters] = useState({ year: 'TODOS', id_sector: '', id_entidad: '', id_area: '' });
  
  // User dashboard specific state
  const [selectedIndicador, setSelectedIndicador] = useState(null);
  const [indicadorProgreso, setIndicadorProgreso] = useState(null);
  
  const isAdmin = user?.rol === 'ADMINISTRADOR';
  const COLORS = ['#000000', '#09AA5B', '#0066CC', '#E11900', '#6B6B6B', '#CACACA', '#545454', '#A0A0A0'];

  useEffect(() => {
    if (isAdmin) {
      // Admin: Load filter options
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
        // Default to TODOS
        setFilters(prev => ({ ...prev, year: 'TODOS' }));
      }).catch(console.error);
    } else {
      // User: Load user-specific dashboard
      fetchUserDashboard();
    }
  }, [isAdmin, siteConfig]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminDashboard();
    }
  }, [filters, isAdmin]);

  // Filter areas based on selected entidad
  const filteredAreas = filters.id_entidad 
    ? areas.filter(a => a.id_entidad === parseInt(filters.id_entidad))
    : areas;

  const fetchAdminDashboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.year && filters.year !== 'TODOS') params.append('year', filters.year);
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

  const fetchUserDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/sms/dashboard/summary_user`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('sms_token')}` }
      });
      const data = await res.json();
      setDashboardData(data);
      
      // Auto-select first indicator
      if (data.indicadores && data.indicadores.length > 0) {
        setSelectedIndicador(data.indicadores[0]);
        fetchIndicadorProgreso(data.indicadores[0].id_indicador);
      }
    } catch (err) {
      console.error('Error fetching user dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIndicadorProgreso = async (idIndicador) => {
    try {
      const res = await fetch(`${API_URL}/api/sms/dashboard/indicador_progreso/${idIndicador}`);
      const data = await res.json();
      setIndicadorProgreso(data);
    } catch (err) {
      console.error('Error fetching indicator progress:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    if (key === 'id_entidad') {
      // Reset area when entidad changes
      setFilters(prev => ({ ...prev, [key]: value, id_area: '' }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleIndicadorChange = (idIndicador) => {
    const ind = dashboardData.indicadores.find(i => i.id_indicador === parseInt(idIndicador));
    setSelectedIndicador(ind);
    if (ind) {
      fetchIndicadorProgreso(ind.id_indicador);
    }
  };

  const pieData = dashboardData && dashboardData.general ? [
    { name: 'Con Avance', value: dashboardData.general.con_avance || 0 },
    { name: 'Sin Avance', value: dashboardData.general.sin_avance || 0 }
  ] : [];

  const cardStyle = { background: styles.white, borderRadius: 8, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };
  const selectStyle = { padding: '8px 12px', border: `2px solid ${styles.gray300}`, borderRadius: 6, fontSize: '0.8rem', minWidth: 140 };
  const labelStyle = { fontSize: '0.7rem', fontWeight: 600, color: styles.gray500, display: 'block', marginBottom: 4 };
  const infoTextStyle = { fontSize: '0.85rem', fontWeight: 600, color: styles.gray800, padding: '8px 12px', background: styles.gray100, borderRadius: 6 };

  // ==================== ADMIN VIEW ====================
  if (isAdmin) {
    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: 4 }}>Dashboard de Indicadores</h1>
            <p style={{ color: styles.gray600, fontSize: '0.85rem' }}>Sistema de Monitoreo Sectorial - Vista Administrador</p>
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
            <label style={labelStyle}>AÑO</label>
            <select value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)} style={selectStyle}>
              <option value="TODOS">Todos</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>SECTOR</label>
            <select value={filters.id_sector} onChange={(e) => handleFilterChange('id_sector', e.target.value)} style={selectStyle}>
              <option value="">Todos</option>
              {sectors.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>ENTIDAD</label>
            <select value={filters.id_entidad} onChange={(e) => handleFilterChange('id_entidad', e.target.value)} style={selectStyle}>
              <option value="">Todas</option>
              {entidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>ÁREA</label>
            <select value={filters.id_area} onChange={(e) => handleFilterChange('id_area', e.target.value)} style={selectStyle}>
              <option value="">Todas</option>
              {filteredAreas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
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
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.gray500, textTransform: 'uppercase', marginBottom: 8 }}>Avance Global</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: styles.blue }}>{dashboardData.general.avance_global || 0}%</div>
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

  // ==================== USER VIEW ====================
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: 4 }}>Dashboard de Indicadores</h1>
          <p style={{ color: styles.gray600, fontSize: '0.85rem' }}>Sistema de Monitoreo Sectorial - Vista Usuario</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: styles.gray500 }}>Bienvenido,</div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.nombre || user?.username}</div>
        </div>
      </div>

      {/* Context Info */}
      <div style={{ ...cardStyle, marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <label style={labelStyle}>SECTOR</label>
          <div style={infoTextStyle}>{dashboardData?.contexto?.sector || '-'}</div>
        </div>
        <div>
          <label style={labelStyle}>ENTIDAD</label>
          <div style={infoTextStyle}>{dashboardData?.contexto?.entidad || '-'}</div>
        </div>
        <div>
          <label style={labelStyle}>ÁREA</label>
          <div style={infoTextStyle}>{dashboardData?.contexto?.area || '-'}</div>
        </div>
        <div style={{ flex: 1, minWidth: 250 }}>
          <label style={labelStyle}>INDICADOR</label>
          <select 
            value={selectedIndicador?.id_indicador || ''} 
            onChange={(e) => handleIndicadorChange(e.target.value)} 
            style={{ ...selectStyle, width: '100%' }}
          >
            {dashboardData?.indicadores?.map(ind => (
              <option key={ind.id_indicador} value={ind.id_indicador}>
                [{ind.codi}] {(ind.indicador_resultado || '').substring(0, 60)}{(ind.indicador_resultado || '').length > 60 ? '...' : ''}
              </option>
            ))}
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
              <div style={{ fontSize: '0.65rem', color: styles.gray500 }}>Activos en tu área</div>
            </div>
            <div style={{ ...cardStyle, borderLeft: `4px solid ${styles.green}` }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.gray500, textTransform: 'uppercase', marginBottom: 8 }}>Con Avance <span style={{ fontSize: '0.55rem', color: styles.blue }}>(Incluye L.B.)</span></div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: styles.green }}>{dashboardData.general.con_avance || 0}</div>
              <div style={{ fontSize: '0.65rem', color: styles.gray500 }}>Reportan avance</div>
            </div>
            <div style={{ ...cardStyle, borderLeft: `4px solid ${styles.red}` }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.gray500, textTransform: 'uppercase', marginBottom: 8 }}>Sin Avance</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: styles.red }}>{dashboardData.general.sin_avance || 0}</div>
              <div style={{ fontSize: '0.65rem', color: styles.gray500 }}>Sin reportar avance</div>
            </div>
            <div style={{ ...cardStyle, borderLeft: `4px solid ${styles.blue}` }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.gray500, textTransform: 'uppercase', marginBottom: 8 }}>Avance Global <span style={{ fontSize: '0.55rem', color: styles.blue }}>(Incluye L.B.)</span></div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: styles.blue }}>{dashboardData.general.avance_global || 0}%</div>
              <div style={{ fontSize: '0.65rem', color: styles.gray500 }}>Promedio de % logro global</div>
            </div>
          </div>

          {/* Selected Indicator Details */}
          {selectedIndicador && (
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', color: styles.gray700 }}>
                Detalle del Indicador Seleccionado
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
                {/* Info */}
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.7rem', color: styles.gray500, marginBottom: 4 }}>CÓDIGO</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedIndicador.codi}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.7rem', color: styles.gray500, marginBottom: 4 }}>INDICADOR</div>
                    <div style={{ fontSize: '0.85rem' }}>{selectedIndicador.indicador_resultado}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.7rem', color: styles.gray500, marginBottom: 4 }}>META GLOBAL</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: styles.blue }}>{selectedIndicador.meta_global || 0}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.7rem', color: styles.gray500, marginBottom: 4 }}>LOGRADO ACUMULADO</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: styles.green }}>{indicadorProgreso?.suma_logrado?.toFixed(2) || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: styles.gray500, marginBottom: 4 }}>% LOGRO GLOBAL</div>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 700, 
                      color: (indicadorProgreso?.porc_logro_global || 0) >= 100 ? styles.green : 
                             (indicadorProgreso?.porc_logro_global || 0) >= 50 ? '#CC6600' : styles.red 
                    }}>
                      {indicadorProgreso?.porc_logro_global?.toFixed(2) || 0}%
                    </div>
                  </div>
                </div>
                
                {/* Chart - Logrado por Año */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: styles.gray600, marginBottom: 12 }}>
                    LOGRADO POR AÑO
                  </div>
                  {indicadorProgreso?.data_por_anio?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={indicadorProgreso.data_por_anio} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={styles.gray200} />
                        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ fontSize: '0.8rem', borderRadius: 8 }}
                          formatter={(value, name) => [value?.toFixed(2), name === 'logrado' ? 'Logrado' : name === 'programado' ? 'Programado' : name]}
                        />
                        <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                        <Bar dataKey="programado" name="Programado" fill={styles.blue} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="logrado" name="Logrado" fill={styles.green} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: styles.gray500 }}>
                      Sin datos de rendición registrados
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Indicators List */}
          <div style={cardStyle}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', color: styles.gray700 }}>
              Mis Indicadores ({dashboardData.indicadores?.length || 0})
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    {['#', 'Código', 'Indicador', 'Meta Global', 'Logrado', '% Logro Global', 'Estado'].map(h => (
                      <th key={h} style={headerStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(dashboardData.indicadores || []).map((ind, idx) => (
                    <tr 
                      key={ind.id_indicador} 
                      style={{ 
                        borderBottom: `1px solid ${styles.gray200}`,
                        background: selectedIndicador?.id_indicador === ind.id_indicador ? '#EBF5FF' : 'transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleIndicadorChange(ind.id_indicador)}
                    >
                      <td style={{ ...rowStyle, textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ ...rowStyle, fontWeight: 600 }}>{ind.codi}</td>
                      <td style={{ ...rowStyle, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ind.indicador_resultado || '-'}</td>
                      <td style={{ ...rowStyle, textAlign: 'center' }}>{ind.meta_global || '-'}</td>
                      <td style={{ ...rowStyle, textAlign: 'center', fontWeight: 600, color: styles.green }}>{ind.suma_logrado?.toFixed(2) || 0}</td>
                      <td style={{ ...rowStyle, textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: 10,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: ind.porc_logro_global >= 100 ? '#D1FAE5' : ind.porc_logro_global >= 50 ? '#FEF3C7' : '#FEE2E2',
                          color: ind.porc_logro_global >= 100 ? styles.green : ind.porc_logro_global >= 50 ? '#92400E' : styles.red
                        }}>
                          {ind.porc_logro_global?.toFixed(2) || 0}%
                        </span>
                      </td>
                      <td style={{ ...rowStyle, textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 10,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          background: ind.tiene_avance ? '#D1FAE5' : '#FEE2E2',
                          color: ind.tiene_avance ? styles.green : styles.red
                        }}>
                          {ind.tiene_avance ? 'CON AVANCE' : 'SIN AVANCE'}
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

export default HomeView;
