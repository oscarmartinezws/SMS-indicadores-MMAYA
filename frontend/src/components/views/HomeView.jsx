import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import html2pdf from 'html2pdf.js';
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

  // Export individual indicator tracking sheet (Ficha de Seguimiento) from Dashboard
  const exportFichaFromDashboard = async () => {
    if (!selectedIndicador || !indicadorProgreso) {
      alert('Seleccione un indicador primero');
      return;
    }
    
    try {
      const lineaBase = parseFloat(selectedIndicador.linea_base) || 0;
      const metaGlobal = parseFloat(selectedIndicador.meta_global) || 0;
      const logradoAcumulado = indicadorProgreso.suma_logrado || 0;
      const porcLogroGlobal = indicadorProgreso.porc_logro_global || 0;
      const logroGlobalColor = porcLogroGlobal >= 100 ? '#009933' : (porcLogroGlobal >= 50 ? '#cc6600' : '#cc0000');
      
      // Build HTML content for PDF
      const htmlContent = `
        <div id="ficha-pdf" style="font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; width: 100%; box-sizing: border-box;">
          <!-- Header -->
          <h1 style="font-size: 16px; text-align: center; margin-bottom: 6px; color: #1a1a1a; font-weight: 700; text-transform: uppercase;">
            Ficha de Seguimiento de Indicador
          </h1>
          <p style="text-align: center; color: #666; margin-bottom: 20px; font-size: 10px;">
            Sistema de Monitoreo Sectorial - Generado: ${new Date().toLocaleString()}
          </p>
          
          <!-- Contexto y Selección de Indicador -->
          <div style="display: flex; gap: 15px; margin-bottom: 15px;">
            <!-- Contexto del Usuario -->
            <div style="flex: 1; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1);">
              <div style="background: #1a1a1a; color: white; padding: 8px 12px; font-size: 10px; font-weight: 600;">CONTEXTO DEL USUARIO</div>
              <div style="background: #fff; padding: 12px;">
                <div style="margin-bottom: 10px;">
                  <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">ENTIDAD</div>
                  <div style="font-size: 11px; font-weight: 500;">${dashboardData?.contexto?.entidad || '-'}</div>
                </div>
                <div style="margin-bottom: 10px;">
                  <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">ÁREA</div>
                  <div style="font-size: 11px; font-weight: 500;">${dashboardData?.contexto?.area || '-'}</div>
                </div>
                <div>
                  <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">SECTOR</div>
                  <div style="font-size: 11px; font-weight: 500;">${dashboardData?.contexto?.sector || '-'}</div>
                </div>
              </div>
            </div>
            
            <!-- Selección de Indicador -->
            <div style="flex: 2; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1);">
              <div style="background: #1a1a1a; color: white; padding: 8px 12px; font-size: 10px; font-weight: 600;">SELECCIÓN DE INDICADOR</div>
              <div style="background: #fff; padding: 12px;">
                <div style="border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 10px;">
                  <span style="font-weight: 700; color: #1a1a1a; font-size: 12px;">${selectedIndicador.codi}</span>
                  <span style="font-size: 11px; color: #333;"> - ${selectedIndicador.indicador_resultado || ''}</span>
                </div>
                <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                  <div>
                    <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">LÍNEA BASE</div>
                    <div style="font-size: 11px; font-weight: 600;">${lineaBase.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">META GLOBAL</div>
                    <div style="font-size: 11px; font-weight: 600; color: #0066cc;">${metaGlobal.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">LOGRADO ACUMULADO <span style="color: #0066cc; font-size: 7px;">(Incluye L.B.)</span></div>
                    <div style="font-size: 14px; font-weight: 700; color: #009933;">${logradoAcumulado.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">% LOGRO GLOBAL <span style="color: #0066cc; font-size: 7px;">(Incluye L.B.)</span></div>
                    <div style="font-size: 14px; font-weight: 700; color: ${logroGlobalColor};">${porcLogroGlobal.toFixed(2)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Progreso por Año -->
          <div style="border-radius: 6px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1); margin-bottom: 15px;">
            <div style="background: #1a1a1a; color: white; padding: 8px 12px; font-size: 10px; font-weight: 600;">PROGRESO POR AÑO</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <thead>
                <tr>
                  <th style="background: #333; color: white; padding: 8px; border: 1px solid #444;">AÑO</th>
                  <th style="background: #0066cc; color: white; padding: 8px; border: 1px solid #0055aa;">PROGRAMADO</th>
                  <th style="background: #009933; color: white; padding: 8px; border: 1px solid #008822;">LOGRADO</th>
                  <th style="background: #cc6600; color: white; padding: 8px; border: 1px solid #aa5500;">% CUMPLIMIENTO</th>
                </tr>
              </thead>
              <tbody>
                ${indicadorProgreso.data_por_anio && indicadorProgreso.data_por_anio.length > 0 
                  ? indicadorProgreso.data_por_anio.map((item, idx) => {
                      const porc = item.programado > 0 ? ((item.logrado / item.programado) * 100).toFixed(1) : '0.0';
                      const color = parseFloat(porc) >= 100 ? '#009933' : (parseFloat(porc) >= 50 ? '#cc6600' : '#cc0000');
                      return `
                        <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f8f8f8'};">
                          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: 600;">${item.year}</td>
                          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background: #e3f2fd;">${item.programado.toFixed(2)}</td>
                          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background: #e8f5e9;">${item.logrado.toFixed(2)}</td>
                          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: 600; color: ${color};">${porc}%</td>
                        </tr>
                      `;
                    }).join('')
                  : '<tr><td colspan="4" style="border: 1px solid #ddd; padding: 20px; text-align: center; color: #999;">Sin datos de rendición registrados</td></tr>'
                }
                <!-- Total Row -->
                <tr style="background: #f0f0f0; font-weight: 600;">
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">TOTAL</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background: #bbdefb;">${metaGlobal.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background: #c8e6c9;">${logradoAcumulado.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: ${logroGlobalColor};">${porcLogroGlobal.toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding: 10px; background: #f5f5f5; border-radius: 4px; font-size: 8px; color: #666;">
            <strong>Nota:</strong> Los cálculos de "Logrado Acumulado" y "% Logro Global" incluyen el valor de la Línea Base. | Usuario: ${user?.nombre || user?.username || '-'}
          </div>
        </div>
      `;
      
      // Create temporary container
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '210mm';
      document.body.appendChild(container);
      
      const element = container.querySelector('#ficha-pdf');
      
      // Configure PDF options
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Ficha_${selectedIndicador.codi}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 2.5,
          useCORS: true, 
          logging: false,
          letterRendering: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Generate and download PDF
      await html2pdf().set(opt).from(element).save();
      
      // Cleanup
      document.body.removeChild(container);
      
    } catch (e) {
      console.error(e);
      alert('Error al generar Ficha PDF: ' + e.message);
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: styles.gray700 }}>
                  Detalle del Indicador Seleccionado
                </div>
                <button 
                  onClick={exportFichaFromDashboard}
                  style={{ 
                    padding: '8px 16px', 
                    background: styles.green, 
                    color: styles.white, 
                    border: 'none', 
                    borderRadius: 6, 
                    fontWeight: 600, 
                    cursor: 'pointer', 
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  📋 Descargar Ficha
                </button>
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
                    <div style={{ fontSize: '0.7rem', color: styles.gray500, marginBottom: 4 }}>LÍNEA BASE</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: styles.gray700 }}>{selectedIndicador.linea_base || 0}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.7rem', color: styles.gray500, marginBottom: 4 }}>META GLOBAL</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: styles.blue }}>{selectedIndicador.meta_global || 0}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.7rem', color: styles.gray500, marginBottom: 4 }}>LOGRADO ACUMULADO <span style={{ fontSize: '0.55rem', color: styles.blue }}>(Incluye L.B.)</span></div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: styles.green }}>{indicadorProgreso?.suma_logrado?.toFixed(2) || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: styles.gray500, marginBottom: 4 }}>% LOGRO GLOBAL <span style={{ fontSize: '0.55rem', color: styles.blue }}>(Incluye L.B.)</span></div>
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
