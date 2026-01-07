import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { API_URL, getStyles, defaultStyles, getTableStyles } from '../../styles/theme';

function HomeView({ user, siteConfig }) {
  // Get styles based on site config
  const styles = siteConfig ? getStyles(siteConfig.color_theme, siteConfig.modo) : defaultStyles;
  const { rowStyle, headerStyle } = getTableStyles(styles);
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


export default HomeView;
