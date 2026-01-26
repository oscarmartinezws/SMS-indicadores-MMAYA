import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { API_URL, getStyles, defaultStyles, getTableStyles } from '../../styles/theme';

function SeguimientoView({ user, siteConfig, readOnly = false }) {
  // Get styles based on site config
  const styles = siteConfig ? getStyles(siteConfig.color_theme, siteConfig.modo) : defaultStyles;
  const { rowStyle, headerStyle } = getTableStyles(styles);
  
  const [indicadores, setIndicadores] = useState([]);
  const [selectedIndicador, setSelectedIndicador] = useState(null);
  const [gestion, setGestion] = useState(new Date().getFullYear());
  const [mes, setMes] = useState('ENERO');
  const [rendicion, setRendicion] = useState({});
  const [loading, setLoading] = useState(true);
  const [contexto, setContexto] = useState({});
  const [configYears, setConfigYears] = useState([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [adjuntos, setAdjuntos] = useState([]);
  const [newFile, setNewFile] = useState({ nombre: '', descripcion: '', url: '', file: null });
  const [showProgramadoModal, setShowProgramadoModal] = useState(false);
  const [programadoTemp, setProgramadoTemp] = useState('');
  const [sumaProgramado, setSumaProgramado] = useState(0);
  const [sumaLogrado, setSumaLogrado] = useState(0);
  const [sumaLogradoSinLB, setSumaLogradoSinLB] = useState(0);
  const [lineaBaseData, setLineaBaseData] = useState({ programado: 0, logrado: 0 });

  const isAdmin = user?.rol === 'ADMINISTRADOR';
  const canEdit = !readOnly && (isAdmin || user?.rol !== 'INVITADO');
  const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  const mesesCortos = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const disabledBtnStyle = { opacity: 0.5, cursor: 'not-allowed' };

  // Fetch suma programado for selected indicator (now includes linea base)
  const fetchSumaProgramado = async (id_indicador) => {
    try {
      const res = await fetch(`${API_URL}/api/sms/rendicion/suma_programado/${id_indicador}`);
      if (res.ok) {
        const data = await res.json();
        setSumaProgramado(data.suma_programado || 0);
        setLineaBaseData(prev => ({ ...prev, programado: data.linea_base || 0 }));
      }
    } catch (err) { console.error(err); }
  };

  // Fetch suma logrado for selected indicator (now includes linea base)
  const fetchSumaLogrado = async (id_indicador) => {
    try {
      const res = await fetch(`${API_URL}/api/sms/rendicion/suma_logrado/${id_indicador}`);
      if (res.ok) {
        const data = await res.json();
        setSumaLogrado(data.suma_logrado || 0);
        setSumaLogradoSinLB(data.suma_logrado_sin_lb || 0);
        setLineaBaseData(prev => ({ ...prev, logrado: data.linea_base || 0 }));
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    // Load years from config
    fetch(`${API_URL}/api/sms/configuracion/years`).then(r => r.json()).then(yrs => {
      setConfigYears(yrs || []);
      const currentYear = new Date().getFullYear();
      if (yrs && yrs.length > 0) {
        const defaultYear = yrs.includes(currentYear) ? currentYear : yrs[yrs.length - 1];
        setGestion(defaultYear);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('sms_token');
        // Use the main endpoint that handles filtering based on user role
        const indRes = await fetch(`${API_URL}/api/sms/matriz_parametros`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const indData = await indRes.json();
        setIndicadores(indData);
        if (indData.length > 0) {
          setSelectedIndicador(indData[0]);
          // Get context from first indicator (which has sector, entidad, area from JOIN)
          if (indData[0].sector || indData[0].entidad || indData[0].area) {
            setContexto({
              sector: indData[0].sector || '-',
              entidad: indData[0].entidad || '-',
              area: indData[0].area || '-'
            });
          }
        }
        // If no context from indicators, try to get from user area
        if (user?.id_area) {
          const ctxRes = await fetch(`${API_URL}/api/sms/dashboard/contexto_usuario/${user.id_area}`);
          if (ctxRes.ok) {
            const ctxData = await ctxRes.json();
            if (ctxData && (ctxData.sector !== '-' || ctxData.entidad !== '-' || ctxData.area !== '-')) {
              setContexto(ctxData);
            }
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (selectedIndicador) {
      fetch(`${API_URL}/api/sms/rendicion/${selectedIndicador.id_indicador}/${gestion}`)
        .then(r => r.json()).then(data => setRendicion(data || {})).catch(console.error);
      // Also fetch the sum of all programado and logrado values for this indicator
      fetchSumaProgramado(selectedIndicador.id_indicador);
      fetchSumaLogrado(selectedIndicador.id_indicador);
      // Fetch adjuntos for this indicator and year
      fetchAdjuntos(selectedIndicador.id_indicador, gestion);
    }
  }, [selectedIndicador, gestion]);

  // Fetch adjuntos for indicator/year
  const fetchAdjuntos = async (id_indicador, gestion) => {
    try {
      const res = await fetch(`${API_URL}/api/sms/rendicion/adjuntos/${id_indicador}/${gestion}`);
      if (res.ok) {
        const data = await res.json();
        setAdjuntos(data.map(a => ({
          id: a.id,
          nombre: a.nombre,
          descripcion: a.descripcion,
          url: a.url,
          size: a.size ? `${(a.size / 1024).toFixed(1)} KB` : '-'
        })));
      }
    } catch (err) { console.error('Error fetching adjuntos:', err); }
  };

  // Delete adjunto
  const deleteAdjunto = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este archivo?')) return;
    try {
      const res = await fetch(`${API_URL}/api/sms/rendicion/adjuntos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAdjuntos(prev => prev.filter(a => a.id !== id));
      } else {
        alert('Error al eliminar archivo');
      }
    } catch (err) { 
      console.error(err); 
      alert('Error al eliminar archivo');
    }
  };

  const handleChange = (field, value) => setRendicion(prev => ({ ...prev, [field]: value }));

  // Open programado modal
  const openProgramadoModal = () => {
    setProgramadoTemp(rendicion.programado || selectedIndicador?.logro || '');
    setShowProgramadoModal(true);
  };

  // Save programado with validation against global goal
  const saveProgramado = async () => {
    if (!selectedIndicador) return;
    try {
      const newProgramado = parseFloat(programadoTemp) || 0;
      const globalGoal = parseFloat(selectedIndicador?.logro) || 0;
      const currentProgramado = parseFloat(rendicion.programado) || 0;
      
      // Calculate what the new total would be
      // sumaProgramado includes the current year's programado, so we need to subtract it and add the new value
      const newSumaTotal = sumaProgramado - currentProgramado + newProgramado;
      
      // Validation: new total cannot exceed global goal
      if (globalGoal > 0 && newSumaTotal > globalGoal) {
        alert(`⚠️ El valor programado excede la meta global.\n\nMeta global: ${globalGoal}\nSuma actual de programados: ${sumaProgramado}\nNuevo total sería: ${newSumaTotal.toFixed(3)}\n\nPor favor ingrese un valor menor o igual a ${(globalGoal - sumaProgramado + currentProgramado).toFixed(3)}`);
        return;
      }
      
      const res = await fetch(`${API_URL}/api/sms/rendicion/programado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id_indicador: selectedIndicador.id_indicador, 
          gestion, 
          programado: newProgramado 
        })
      });
      if (res.ok) {
        setRendicion(prev => ({ ...prev, programado: newProgramado }));
        // Update suma programado to reflect the change
        setSumaProgramado(newSumaTotal);
        setShowProgramadoModal(false);
        alert('Programado guardado exitosamente');
      } else {
        alert('Error al guardar el programado');
      }
    } catch (e) {
      console.error(e);
      alert('Error al guardar el programado');
    }
  };

  const saveRendicion = async () => {
    if (!selectedIndicador) return;
    try {
      const mesesCortos = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const programado = parseFloat(rendicion.programado) || parseFloat(selectedIndicador?.logro) || 0;
      
      // Calculate % EJEC and ACUMULADO for all months
      const dataToSave = { ...rendicion };
      let acumuladoTotal = 0;
      
      mesesCortos.forEach((m, i) => {
        const ejecutado = parseFloat(rendicion[`ejecutado_${m}`]) || 0;
        
        // Calculate % EJEC
        const procEjec = programado > 0 ? (ejecutado / programado) : 0;
        dataToSave[`proc_ejecutado_${m}`] = procEjec;
        
        // Calculate ACUMULADO (cumulative sum)
        acumuladoTotal += ejecutado;
        dataToSave[`acumulado_${m}`] = acumuladoTotal;
      });
      
      // Set logrado as total acumulado
      dataToSave.logrado = acumuladoTotal;
      
      const res = await fetch(`${API_URL}/api/sms/rendicion`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_indicador: selectedIndicador.id_indicador, gestion, id_area: user?.id_area, ...dataToSave })
      });
      if (res.ok) {
        alert('Rendición guardada exitosamente');
        // Reload data to show updated values
        const reloadRes = await fetch(`${API_URL}/api/sms/rendicion/${selectedIndicador.id_indicador}/${gestion}`);
        if (reloadRes.ok) {
          setRendicion(await reloadRes.json());
        }
      }
    } catch (e) { console.error(e); alert('Error al guardar'); }
  };

  // Export all indicators to CSV
  const exportToCSV = async () => {
    try {
      const mesesCortos = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const mesesHeaders = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
      
      // Fetch rendicion data for all indicators
      const allData = await Promise.all(
        indicadores.map(async (ind) => {
          try {
            const res = await fetch(`${API_URL}/api/sms/rendicion/${ind.id_indicador}/${gestion}`);
            const rendData = res.ok ? await res.json() : {};
            return { indicador: ind, rendicion: rendData };
          } catch (e) {
            return { indicador: ind, rendicion: {} };
          }
        })
      );
      
      // Build CSV content
      let csvContent = '\uFEFF'; // BOM for Excel UTF-8
      
      // Header row
      csvContent += 'CÓDIGO,INDICADOR,AÑO BASE,LÍNEA BASE,AÑO LOGRO,LOGRO PROGRAMADO,';
      mesesHeaders.forEach(m => csvContent += `EJEC_${m},`);
      mesesHeaders.forEach(m => csvContent += `%EJEC_${m},`);
      mesesHeaders.forEach(m => csvContent += `ACUM_${m},`);
      csvContent += 'PROGRAMADO,LOGRADO,DESCRIPCIÓN CUALITATIVA,MODIFICACIONES\n';
      
      // Data rows
      allData.forEach(({ indicador, rendicion }) => {
        const row = [];
        row.push(`"${indicador.codi || ''}"`);
        row.push(`"${(indicador.indicador_resultado || '').replace(/"/g, '""')}"`);
        row.push(indicador.anio_base || '');
        row.push(indicador.linea_base || '');
        row.push(indicador.anio_logro || '');
        row.push(indicador.logro || '');
        
        // EJECUCIÓN values
        mesesCortos.forEach(m => {
          row.push(rendicion[`ejecutado_${m}`] || '');
        });
        
        // % EJEC values
        mesesCortos.forEach(m => {
          const val = rendicion[`proc_ejecutado_${m}`];
          row.push(val ? (parseFloat(val) * 100).toFixed(2) + '%' : '');
        });
        
        // ACUMULADO values
        mesesCortos.forEach(m => {
          row.push(rendicion[`acumulado_${m}`] || '');
        });
        
        row.push(rendicion.programado || indicador.logro || '');
        row.push(rendicion.logrado || '');
        row.push(`"${(rendicion.descripcion_cualitativa || '').replace(/"/g, '""')}"`);
        row.push(`"${(rendicion.modificaciones || '').replace(/"/g, '""')}"`);
        
        csvContent += row.join(',') + '\n';
      });
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Rendicion_${gestion}_${contexto.area || 'Usuario'}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      alert(`Exportación exitosa: ${allData.length} indicadores`);
    } catch (e) {
      console.error(e);
      alert('Error al exportar');
    }
  };

  // Export to PDF - Auto download with 3 sub-rows per indicator
  const exportToPDF = async () => {
    try {
      const mesesCortos = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const mesesHeaders = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
      
      // Fetch rendicion data and sums for all indicators
      const allData = await Promise.all(
        indicadores.map(async (ind) => {
          try {
            const [rendRes, sumaProgramadoRes, sumaLogradoRes] = await Promise.all([
              fetch(`${API_URL}/api/sms/rendicion/${ind.id_indicador}/${gestion}`),
              fetch(`${API_URL}/api/sms/rendicion/suma_programado/${ind.id_indicador}`),
              fetch(`${API_URL}/api/sms/rendicion/suma_logrado/${ind.id_indicador}`)
            ]);
            const rendData = rendRes.ok ? await rendRes.json() : {};
            const sumaProg = sumaProgramadoRes.ok ? (await sumaProgramadoRes.json()).suma_programado : 0;
            const sumaLog = sumaLogradoRes.ok ? (await sumaLogradoRes.json()).suma_logrado : 0;
            return { indicador: ind, rendicion: rendData, sumaProgramado: sumaProg, sumaLogrado: sumaLog };
          } catch (e) {
            return { indicador: ind, rendicion: {}, sumaProgramado: 0, sumaLogrado: 0 };
          }
        })
      );
      
      // Build HTML content for PDF - Single row per indicator
      const htmlContent = `
        <div id="pdf-content" style="font-family: 'Segoe UI', Arial, sans-serif; padding: 15px; width: 100%;">
          <h1 style="font-size: 18px; text-align: center; margin-bottom: 8px; color: #1a1a1a; font-weight: 700;">SEGUIMIENTO DE INDICADORES - GESTIÓN ${gestion}</h1>
          <h2 style="font-size: 12px; text-align: center; color: #666; margin-bottom: 15px; font-weight: 400;">Sistema de Monitoreo Sectorial</h2>
          
          <div style="margin-bottom: 15px; padding: 12px; background: #f5f5f5; border-radius: 6px; display: flex; flex-wrap: wrap; gap: 20px; font-size: 10px;">
            <span><strong>Entidad:</strong> ${contexto.entidad || '-'}</span>
            <span><strong>Área:</strong> ${contexto.area || '-'}</span>
            <span><strong>Sector:</strong> ${contexto.sector || '-'}</span>
            <span><strong>Usuario:</strong> ${user?.nombre || '-'}</span>
            <span><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</span>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
            <thead>
              <tr>
                <th style="background: #1a1a1a; color: white; padding: 8px 4px; border: 1px solid #333; width: 55px; font-size: 8px;">CÓDIGO</th>
                <th style="background: #1a1a1a; color: white; padding: 8px 4px; border: 1px solid #333; text-align: left; min-width: 120px; font-size: 8px;">INDICADOR</th>
                <th style="background: #4a4a4a; color: white; padding: 8px 4px; border: 1px solid #333; width: 60px; font-size: 8px;">PLAN</th>
                ${mesesHeaders.map(m => `<th style="background: #333; color: white; padding: 6px 2px; border: 1px solid #444; width: 30px; font-size: 7px;">${m}</th>`).join('')}
                <th style="background: #0066cc; color: white; padding: 6px 3px; border: 1px solid #0055aa; width: 42px; font-size: 7px;">PROG.</th>
                <th style="background: #cc0000; color: white; padding: 6px 3px; border: 1px solid #aa0000; width: 42px; font-size: 7px;">LOGRADO</th>
                <th style="background: #0066cc; color: white; padding: 6px 3px; border: 1px solid #0055aa; width: 40px; font-size: 7px;">% PROG</th>
                <th style="background: #cc0000; color: white; padding: 6px 3px; border: 1px solid #aa0000; width: 40px; font-size: 7px;">% LOG</th>
                <th style="background: #006633; color: white; padding: 6px 3px; border: 1px solid #005522; width: 45px; font-size: 7px;">Σ PROG</th>
                <th style="background: #993300; color: white; padding: 6px 3px; border: 1px solid #882200; width: 48px; font-size: 7px;">% LOGRO GLOBAL</th>
              </tr>
            </thead>
            <tbody>
              ${allData.map(({ indicador, rendicion, sumaProgramado, sumaLogrado }, idx) => {
                const programado = parseFloat(rendicion.programado) || parseFloat(indicador.logro) || 0;
                const logrado = parseFloat(rendicion.logrado) || 0;
                const metaGlobal = parseFloat(indicador.logro) || 0;
                
                // Calculate percentages
                const porcProgramado = metaGlobal > 0 ? ((programado / metaGlobal) * 100).toFixed(1) : '0.0';
                const porcLogrado = programado > 0 ? ((logrado / programado) * 100).toFixed(1) : '0.0';
                const porcLogroGlobal = metaGlobal > 0 ? ((sumaLogrado / metaGlobal) * 100).toFixed(1) : '0.0';
                
                // Color for % LOGRO GLOBAL
                const logroGlobalColor = parseFloat(porcLogroGlobal) >= 100 ? '#009933' : (parseFloat(porcLogroGlobal) >= 50 ? '#cc6600' : '#cc0000');
                
                // Get planes for this indicator
                const planesText = indicador.planes && indicador.planes.length > 0 
                  ? indicador.planes.map(p => p.nombre).join(', ') 
                  : '-';
                
                return `
                  <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8f8f8'};">
                    <td style="border: 1px solid #ddd; padding: 6px 4px; text-align: center; font-weight: 600; font-size: 8px; vertical-align: middle;">${indicador.codi || ''}</td>
                    <td style="border: 1px solid #ddd; padding: 6px 4px; text-align: left; font-size: 8px; line-height: 1.4; word-wrap: break-word; max-width: 120px; vertical-align: middle;">${indicador.indicador_resultado || ''}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 2px; text-align: center; font-size: 7px; font-weight: 600; vertical-align: middle; background: #f5f5f5;">${planesText}</td>
                    ${mesesCortos.map(m => {
                      const val = rendicion['ejecutado_' + m];
                      return '<td style="border: 1px solid #ddd; padding: 4px 2px; text-align: center; font-size: 7px; vertical-align: middle;">' + (val ? parseFloat(val).toFixed(2) : '-') + '</td>';
                    }).join('')}
                    <td style="border: 1px solid #ddd; padding: 4px 2px; text-align: center; background: #e3f2fd; font-weight: 600; font-size: 8px; vertical-align: middle;">${programado ? programado.toFixed(2) : '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 2px; text-align: center; background: #ffebee; font-weight: 600; font-size: 8px; color: #c00; vertical-align: middle;">${logrado ? logrado.toFixed(2) : '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 2px; text-align: center; background: #e3f2fd; font-size: 8px; vertical-align: middle;">${porcProgramado}%</td>
                    <td style="border: 1px solid #ddd; padding: 4px 2px; text-align: center; background: #ffebee; font-size: 8px; color: #c00; vertical-align: middle;">${porcLogrado}%</td>
                    <td style="border: 1px solid #ddd; padding: 4px 2px; text-align: center; background: #e8f5e9; font-weight: 600; font-size: 8px; vertical-align: middle;">${sumaProgramado ? sumaProgramado.toFixed(2) : '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 4px 2px; text-align: center; background: #fff8e1; font-weight: 700; font-size: 8px; color: ${logroGlobalColor}; vertical-align: middle;">${porcLogroGlobal}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 15px; padding: 10px; background: #f0f0f0; border-radius: 4px; font-size: 8px;">
            <strong>Leyenda:</strong>
            <span style="margin-left: 15px;">PROG. = Programado del año</span>
            <span style="margin-left: 10px;">LOGRADO = Logrado del año</span>
            <span style="margin-left: 10px;">% PROG = (Prog. Año / Meta Global) × 100</span>
            <span style="margin-left: 10px;">% LOG = (Logrado / Prog. Año) × 100</span>
            <span style="margin-left: 10px;">Σ PROG = Suma programados todos los años</span>
            <span style="margin-left: 10px;">% LOGRO GLOBAL = (Σ Logrado / Meta) × 100</span>
          </div>
          
          <p style="text-align: center; color: #999; margin-top: 15px; font-size: 9px;">
            Total de indicadores: ${allData.length} | Generado el ${new Date().toLocaleString()}
          </p>
        </div>
      `;
      
      // Create temporary container
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '297mm'; // A4 landscape width
      document.body.appendChild(container);
      
      const element = container.querySelector('#pdf-content');
      
      // Configure PDF options - Higher quality
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `Seguimiento_Indicadores_${gestion}_${contexto.area || 'Usuario'}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 3, // Higher scale for better quality
          useCORS: true, 
          logging: false,
          letterRendering: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      
      // Generate and download PDF
      await html2pdf().set(opt).from(element).save();
      
      // Cleanup
      document.body.removeChild(container);
      
      alert(`PDF generado exitosamente: ${allData.length} indicadores`);
      
    } catch (e) {
      console.error(e);
      alert('Error al generar PDF: ' + e.message);
    }
  };

  // Export individual indicator tracking sheet (Ficha de Seguimiento)
  const exportFichaIndicador = async () => {
    if (!selectedIndicador) {
      alert('Seleccione un indicador primero');
      return;
    }
    
    try {
      const mesesCortos = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const years = configYears.sort((a, b) => a - b);
      
      // Fetch rendition data for all years for this indicator
      const rendicionesPorAnio = await Promise.all(
        years.map(async (year) => {
          try {
            const res = await fetch(`${API_URL}/api/sms/rendicion/${selectedIndicador.id_indicador}/${year}`);
            const data = res.ok ? await res.json() : {};
            return { year, data };
          } catch (e) {
            return { year, data: {} };
          }
        })
      );
      
      // Calculate totals
      const lineaBase = parseFloat(selectedIndicador.linea_base) || 0;
      const metaGlobal = parseFloat(selectedIndicador.logro) || 0;
      const logradoAcumulado = sumaLogrado; // Already includes linea base
      const logradoSinLB = sumaLogradoSinLB; // Without linea base
      const porcLogroGlobal = metaGlobal > 0 ? ((logradoAcumulado / metaGlobal) * 100).toFixed(2) : '0.00';
      const logroGlobalColor = parseFloat(porcLogroGlobal) >= 100 ? '#009933' : (parseFloat(porcLogroGlobal) >= 50 ? '#cc6600' : '#cc0000');
      
      // Build HTML content for PDF - Ficha Individual
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
            <!-- Contexto del Indicador -->
            <div style="flex: 1; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1);">
              <div style="background: #1a1a1a; color: white; padding: 8px 12px; font-size: 10px; font-weight: 600;">CONTEXTO DEL INDICADOR</div>
              <div style="background: #fff; padding: 12px;">
                <div style="margin-bottom: 10px;">
                  <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">SECTOR</div>
                  <div style="font-size: 11px; font-weight: 500;">${selectedIndicador.sector || contexto.sector || '-'}</div>
                </div>
                <div style="margin-bottom: 10px;">
                  <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">ENTIDAD</div>
                  <div style="font-size: 11px; font-weight: 500;">${selectedIndicador.entidad || contexto.entidad || '-'}</div>
                </div>
                <div>
                  <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">ÁREA</div>
                  <div style="font-size: 11px; font-weight: 500;">${selectedIndicador.area || contexto.area || '-'}</div>
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
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                  <div>
                    <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">AÑO BASE</div>
                    <div style="font-size: 11px; font-weight: 600;">${selectedIndicador.anio_base || '-'}</div>
                  </div>
                  <div>
                    <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">LÍNEA BASE</div>
                    <div style="font-size: 11px; font-weight: 600;">${lineaBase.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">AÑO LOGRO</div>
                    <div style="font-size: 11px; font-weight: 600;">${selectedIndicador.anio_logro || '-'}</div>
                  </div>
                  <div>
                    <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">META</div>
                    <div style="font-size: 11px; font-weight: 600; color: #0066cc;">${metaGlobal.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">LOGRADO (SIN L.B.)</div>
                    <div style="font-size: 11px; font-weight: 600; color: #666;">${logradoSinLB.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">LOGRADO <span style="color: #0066cc; font-size: 7px;">(Con L.B.)</span></div>
                    <div style="font-size: 11px; font-weight: 600; color: #009933;">${logradoAcumulado.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style="font-size: 9px; color: #666; font-weight: 600; margin-bottom: 2px;">% LOGRO GLOBAL <span style="color: #0066cc; font-size: 7px;">(Con L.B.)</span></div>
                    <div style="font-size: 14px; font-weight: 700; color: ${logroGlobalColor};">${porcLogroGlobal}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Seguimiento Anual -->
          <div style="border-radius: 6px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1); margin-bottom: 15px;">
            <div style="background: #1a1a1a; color: white; padding: 8px 12px; font-size: 10px; font-weight: 600;">SEGUIMIENTO ANUAL DE INDICADORES</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
              <thead>
                <tr>
                  <th style="background: #333; color: white; padding: 6px 4px; border: 1px solid #444; width: 70px; font-size: 8px;">#</th>
                  ${years.map(y => `<th style="background: #333; color: white; padding: 6px 4px; border: 1px solid #444; font-size: 8px;">${y}</th>`).join('')}
                  <th style="background: #333; color: white; padding: 6px 4px; border: 1px solid #444; font-size: 8px;">LÍNEA BASE</th>
                  <th style="background: #0066cc; color: white; padding: 6px 4px; border: 1px solid #0055aa; font-size: 8px;">LOGRO PROG.</th>
                  <th style="background: #cc0000; color: white; padding: 6px 4px; border: 1px solid #aa0000; font-size: 8px;">LOGRO EJEC.</th>
                  <th style="background: #cc6600; color: white; padding: 6px 4px; border: 1px solid #aa5500; font-size: 8px;">% LOGRO GLOBAL</th>
                </tr>
              </thead>
              <tbody>
                <!-- EJECUCIÓN Row -->
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px 4px; font-weight: 600; background: #f5f5f5; font-size: 8px;">EJECUCIÓN</td>
                  ${years.map(y => {
                    const rend = rendicionesPorAnio.find(r => r.year === y);
                    const logrado = parseFloat(rend?.data?.logrado) || 0;
                    return `<td style="border: 1px solid #ddd; padding: 6px 4px; text-align: center; font-size: 8px;">${logrado > 0 ? logrado.toFixed(2) : '-'}</td>`;
                  }).join('')}
                  <td style="border: 1px solid #ddd; padding: 6px 4px; text-align: center; font-size: 8px;">${lineaBase.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px 4px; text-align: center; background: #e3f2fd; font-size: 8px;">${metaGlobal.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px 4px; text-align: center; background: #ffebee; font-weight: 600; color: #c00; font-size: 8px;">${logradoAcumulado.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px 4px; text-align: center; background: #fff8e1; font-weight: 700; color: ${logroGlobalColor}; font-size: 9px;">${porcLogroGlobal}%</td>
                </tr>
                <!-- % EJEC Row -->
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px 4px; font-weight: 600; background: #f5f5f5; font-size: 8px;">% EJEC</td>
                  ${years.map(y => {
                    const rend = rendicionesPorAnio.find(r => r.year === y);
                    const programado = parseFloat(rend?.data?.programado) || 0;
                    const logrado = parseFloat(rend?.data?.logrado) || 0;
                    const porc = programado > 0 ? ((logrado / programado) * 100).toFixed(1) : '-';
                    return `<td style="border: 1px solid #ddd; padding: 6px 4px; text-align: center; font-size: 8px;">${porc !== '-' ? porc + '%' : '-'}</td>`;
                  }).join('')}
                  <td style="border: 1px solid #ddd; padding: 6px 4px; text-align: center; font-size: 8px;">-</td>
                  <td style="border: 1px solid #ddd; padding: 6px 4px; text-align: center; background: #e3f2fd; font-size: 8px;">-</td>
                  <td style="border: 1px solid #ddd; padding: 6px 4px; text-align: center; background: #ffebee; font-size: 8px;">-</td>
                  <td style="border: 1px solid #ddd; padding: 6px 4px; text-align: center; background: #fff8e1; font-size: 8px;">-</td>
                </tr>
                <!-- ACUMULADO Row -->
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px 4px; font-weight: 600; background: #f5f5f5; font-size: 8px;">ACUMULADO</td>
                  ${(() => {
                    let acum = lineaBase;
                    return years.map(y => {
                      const rend = rendicionesPorAnio.find(r => r.year === y);
                      const logrado = parseFloat(rend?.data?.logrado) || 0;
                      acum += logrado;
                      return `<td style="border: 1px solid #ddd; padding: 6px 4px; text-align: center; font-size: 8px;">${acum.toFixed(2)}</td>`;
                    }).join('');
                  })()}
                  <td style="border: 1px solid #ddd; padding: 6px 4px; text-align: center; font-size: 8px;">${lineaBase.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px 4px; text-align: center; background: #e3f2fd; font-weight: 600; font-size: 8px;">${sumaProgramado.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px 4px; text-align: center; background: #ffebee; font-weight: 600; color: #c00; font-size: 8px;">${logradoAcumulado.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px 4px; text-align: center; background: #fff8e1; font-weight: 700; color: ${logroGlobalColor}; font-size: 9px;">${porcLogroGlobal}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Descripción Cualitativa y Modificaciones -->
          <div style="display: flex; gap: 15px; margin-bottom: 15px;">
            <div style="flex: 1; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1);">
              <div style="background: #1a1a1a; color: white; padding: 8px 12px; font-size: 10px; font-weight: 600;">DESCRIPCIÓN CUALITATIVA DEL AVANCE</div>
              <div style="background: #fff; padding: 12px; min-height: 80px; font-size: 10px; border: 1px solid #eee; border-top: none;">
                ${rendicion.descripcion_cualitativa || '<span style="color: #999;">Sin descripción registrada</span>'}
              </div>
            </div>
            <div style="flex: 1; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1);">
              <div style="background: #1a1a1a; color: white; padding: 8px 12px; font-size: 10px; font-weight: 600;">MODIFICACIONES</div>
              <div style="background: #fff; padding: 12px; min-height: 80px; font-size: 10px; border: 1px solid #eee; border-top: none;">
                ${rendicion.modificaciones || '<span style="color: #999;">Sin modificaciones registradas</span>'}
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding: 10px; background: #f5f5f5; border-radius: 4px; font-size: 8px; color: #666;">
            <strong>Nota:</strong> Los cálculos de "Logro Ejecutado" y "% Logro Global" incluyen el valor de la Línea Base.
          </div>
        </div>
      `;
      
      // Create temporary container
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '297mm';
      document.body.appendChild(container);
      
      const element = container.querySelector('#ficha-pdf');
      
      // Configure PDF options
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Ficha_${selectedIndicador.codi}_${gestion}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 2.5,
          useCORS: true, 
          logging: false,
          letterRendering: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
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

  const [showExportMenu, setShowExportMenu] = useState(false);

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>;

  const cellInput = { width: '100%', padding: '4px 6px', fontSize: '0.75rem', border: `1px solid ${styles.gray300}`, borderRadius: 4, textAlign: 'center', boxSizing: 'border-box' };
  const darkHeader = { background: styles.gray800, color: styles.white, padding: '10px 16px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
  
  // Get selected month index
  const mesSeleccionadoIndex = meses.indexOf(mes);
  const mesCortoSeleccionado = mesesCortos[mesSeleccionadoIndex];

  return (
    <div>
      <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 16 }}>Seguimiento de Indicadores</h2>

      {/* Context Header - Dark Style */}
      <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <div style={darkHeader}>CONTEXTO DEL USUARIO</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {[{ label: 'ENTIDAD', value: contexto.entidad || '-' }, { label: 'ÁREA', value: contexto.area || '-' }, { label: 'SECTOR', value: contexto.sector || '-' },
            { label: 'AÑO', value: <select value={gestion} onChange={(e) => setGestion(parseInt(e.target.value))} style={{ ...cellInput, background: styles.white, width: '100%' }}>{configYears.map(y => <option key={y} value={y}>{y}</option>)}</select> },
            { label: 'MES', value: <select value={mes} onChange={(e) => setMes(e.target.value)} style={{ ...cellInput, background: styles.white, width: '100%' }}>{meses.map(m => <option key={m} value={m}>{m}</option>)}</select> },
            { label: 'ESTADO', value: <span style={{ padding: '4px 12px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, background: '#D1FAE5', color: styles.green }}>ABIERTO</span> }
          ].map((item, i) => (
            <div key={i} style={{ padding: '12px 16px', borderRight: i < 5 ? `1px solid ${styles.gray200}` : 'none' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, color: styles.gray500, textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicator Selector - Dark Header */}
      <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <div style={darkHeader}>SELECCIÓN DE INDICADOR</div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: styles.gray500, textTransform: 'uppercase', marginBottom: 8 }}>INDICADOR</label>
              <select value={selectedIndicador?.id_indicador || ''} onChange={(e) => setSelectedIndicador(indicadores.find(i => i.id_indicador === parseInt(e.target.value)))}
                style={{ width: '100%', padding: 12, fontSize: '0.85rem', border: `2px solid ${styles.gray300}`, borderRadius: 8, background: styles.white }}>
                {indicadores.map(ind => <option key={ind.id_indicador} value={ind.id_indicador}>{ind.codi} - {ind.indicador_resultado?.substring(0, 80)}...</option>)}
              </select>
            </div>
            <button 
              onClick={!readOnly ? saveRendicion : undefined} 
              disabled={readOnly}
              data-testid="btn-guardar" 
              style={{ padding: '12px 24px', background: styles.black, color: styles.white, border: 'none', borderRadius: 8, fontWeight: 600, cursor: readOnly ? 'not-allowed' : 'pointer', fontSize: '0.85rem', ...(readOnly ? disabledBtnStyle : {}) }}
            >
              💾 Guardar
            </button>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowExportMenu(!showExportMenu)} data-testid="btn-exportar" style={{ padding: '12px 24px', background: styles.green, color: styles.white, border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                📥 Exportar ▾
              </button>
              {showExportMenu && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: styles.white, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 100, minWidth: 200, overflow: 'hidden' }}>
                  <button onClick={() => { exportFichaIndicador(); setShowExportMenu(false); }} data-testid="btn-export-ficha" style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${styles.gray200}` }}
                    onMouseEnter={(e) => e.target.style.background = styles.gray100}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                    📋 Ficha del Indicador
                  </button>
                  <button onClick={() => { exportToCSV(); setShowExportMenu(false); }} data-testid="btn-export-csv" style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${styles.gray200}` }}
                    onMouseEnter={(e) => e.target.style.background = styles.gray100}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                    📊 Exportar a CSV
                  </button>
                  <button onClick={() => { exportToPDF(); setShowExportMenu(false); }} data-testid="btn-export-pdf" style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}
                    onMouseEnter={(e) => e.target.style.background = styles.gray100}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                    📄 Exportar a PDF
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {selectedIndicador && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 16, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${styles.gray200}` }}>
              <div><div style={{ fontSize: '0.6rem', fontWeight: 600, color: styles.gray500, marginBottom: 4 }}>AÑO BASE</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedIndicador.anio_base || '-'}</div></div>
              <div><div style={{ fontSize: '0.6rem', fontWeight: 600, color: styles.gray500, marginBottom: 4 }}>LÍNEA BASE</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedIndicador.linea_base || '-'}</div></div>
              <div><div style={{ fontSize: '0.6rem', fontWeight: 600, color: styles.gray500, marginBottom: 4 }}>AÑO LOGRO</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedIndicador.anio_logro || '-'}</div></div>
              <div><div style={{ fontSize: '0.6rem', fontWeight: 600, color: styles.gray500, marginBottom: 4 }}>LOGRO PROGRAMADO (META)</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedIndicador.logro || '-'}</div></div>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 600, color: styles.gray500, marginBottom: 4 }}>LOGRADO (SIN L.B.)</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: styles.gray600 }}>{sumaLogradoSinLB.toFixed(3)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 600, color: styles.gray500, marginBottom: 4 }}>% LOGRO GLOBAL <span style={{ fontSize: '0.5rem', color: styles.blue }}>(Con L.B.)</span></div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: (() => {
                  const meta = parseFloat(selectedIndicador.logro) || 0;
                  const porcentaje = meta > 0 ? (sumaLogrado / meta) * 100 : 0;
                  return porcentaje >= 100 ? styles.green : (porcentaje >= 50 ? '#F59E0B' : styles.red);
                })() }}>
                  {(() => {
                    const meta = parseFloat(selectedIndicador.logro) || 0;
                    const porcentaje = meta > 0 ? (sumaLogrado / meta) * 100 : 0;
                    return `${porcentaje.toFixed(2)}%`;
                  })()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 600, color: styles.gray500, marginBottom: 4 }}>SUMA PROGRAMADO <span style={{ fontSize: '0.5rem', color: styles.blue }}>(Con L.B.)</span></div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: sumaProgramado > (parseFloat(selectedIndicador.logro) || 0) ? styles.red : styles.green }}>
                  {sumaProgramado.toFixed(3)} / {selectedIndicador.logro || '-'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Grid - Dark Header - Only selected month is editable */}
      <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <div style={darkHeader}>REGISTRO MENSUAL DE EJECUCIÓN</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ ...headerStyle, width: 100, background: styles.gray700 }}>#</th>
                {mesesCortos.map((m, i) => (
                  <th key={m} style={{ ...headerStyle, textAlign: 'center', minWidth: 55, background: i === mesSeleccionadoIndex ? styles.green : styles.gray700 }}>{m}</th>
                ))}
                <th style={{ ...headerStyle, textAlign: 'center', background: styles.blue, minWidth: 80 }}>PROGRAMADO</th>
                <th style={{ ...headerStyle, textAlign: 'center', background: styles.red, minWidth: 70 }}>LOGRADO</th>
              </tr>
            </thead>
            <tbody>
              {/* Row EJECUCIÓN - Editable */}
              <tr style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                <td style={{ ...rowStyle, fontWeight: 600, background: styles.gray100 }}>EJECUCIÓN</td>
                {mesesCortos.map((m, i) => {
                  const isSelected = i === mesSeleccionadoIndex;
                  const fieldName = `ejecutado_${m.toLowerCase()}`;
                  return (
                    <td key={m} style={{ ...rowStyle, padding: 4, background: isSelected ? '#D1FAE5' : 'transparent' }}>
                      {isSelected ? (
                        <input 
                          type="number" 
                          step="0.001" 
                          value={rendicion[fieldName] || ''} 
                          onChange={(e) => !readOnly && handleChange(fieldName, e.target.value)} 
                          disabled={readOnly}
                          style={{ ...cellInput, ...(readOnly ? disabledBtnStyle : {}) }} 
                        />
                      ) : (
                        <span style={{ display: 'block', textAlign: 'center', fontSize: '0.75rem', color: styles.gray600 }}>
                          {rendicion[fieldName] || ''}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td style={{ ...rowStyle, textAlign: 'center', background: '#DBEAFE', fontWeight: 600, color: styles.blue }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span>{rendicion.programado || selectedIndicador?.logro || '-'}</span>
                    <button 
                      onClick={() => !readOnly && openProgramadoModal()} 
                      disabled={readOnly}
                      data-testid="btn-edit-programado" 
                      style={{ padding: '2px 6px', background: styles.blue, color: styles.white, border: 'none', borderRadius: 4, cursor: readOnly ? 'not-allowed' : 'pointer', fontSize: '0.65rem', ...(readOnly ? disabledBtnStyle : {}) }}
                    >✏️</button>
                  </div>
                </td>
                <td style={{ ...rowStyle, textAlign: 'center', background: '#FEE2E2', fontWeight: 600, color: styles.red }}>
                  {rendicion.logrado || '-'}
                </td>
              </tr>
              
              {/* Row % EJEC - Calculated, Read-only */}
              <tr style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                <td style={{ ...rowStyle, fontWeight: 600, background: styles.gray100 }}>% EJEC</td>
                {mesesCortos.map((m, i) => {
                  const isSelected = i === mesSeleccionadoIndex;
                  const ejecutado = parseFloat(rendicion[`ejecutado_${m.toLowerCase()}`]) || 0;
                  const programado = parseFloat(rendicion.programado) || parseFloat(selectedIndicador?.logro) || 1;
                  const porcentaje = programado > 0 ? ((ejecutado / programado) * 100).toFixed(2) : '0.00';
                  return (
                    <td key={m} style={{ ...rowStyle, padding: 4, background: isSelected ? '#D1FAE5' : 'transparent', textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: styles.gray700, fontWeight: isSelected ? 600 : 400 }}>
                        {ejecutado > 0 ? `${porcentaje}%` : ''}
                      </span>
                    </td>
                  );
                })}
                <td style={{ ...rowStyle, textAlign: 'center', background: '#DBEAFE' }}></td>
                <td style={{ ...rowStyle, textAlign: 'center', background: '#FEE2E2', fontWeight: 600, color: styles.red }}>
                  {(() => {
                    // Calculate total LOGRADO / PROGRAMADO * 100
                    let totalLogrado = 0;
                    mesesCortos.forEach(m => {
                      totalLogrado += parseFloat(rendicion[`ejecutado_${m.toLowerCase()}`]) || 0;
                    });
                    const programado = parseFloat(rendicion.programado) || parseFloat(selectedIndicador?.logro) || 0;
                    if (programado > 0 && totalLogrado > 0) {
                      return `${((totalLogrado / programado) * 100).toFixed(2)}%`;
                    }
                    return '';
                  })()}
                </td>
              </tr>
              
              {/* Row ACUMULADO - Calculated, Read-only */}
              <tr style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                <td style={{ ...rowStyle, fontWeight: 600, background: styles.gray100 }}>ACUMULADO</td>
                {mesesCortos.map((m, i) => {
                  const isSelected = i === mesSeleccionadoIndex;
                  // Calculate cumulative sum from ENE to current month
                  let acumulado = 0;
                  for (let j = 0; j <= i; j++) {
                    acumulado += parseFloat(rendicion[`ejecutado_${mesesCortos[j].toLowerCase()}`]) || 0;
                  }
                  return (
                    <td key={m} style={{ ...rowStyle, padding: 4, background: isSelected ? '#D1FAE5' : 'transparent', textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: styles.gray700, fontWeight: isSelected ? 600 : 400 }}>
                        {acumulado > 0 ? acumulado.toFixed(3) : ''}
                      </span>
                    </td>
                  );
                })}
                <td style={{ ...rowStyle, textAlign: 'center', background: '#DBEAFE' }}></td>
                <td style={{ ...rowStyle, textAlign: 'center', background: '#FEE2E2' }}>
                  {(() => {
                    // Total accumulated
                    let total = 0;
                    mesesCortos.forEach(m => { total += parseFloat(rendicion[`ejecutado_${m.toLowerCase()}`]) || 0; });
                    return total > 0 ? <span style={{ fontWeight: 600, color: styles.red }}>{total.toFixed(3)}</span> : '';
                  })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Qualitative Description - Dark Headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={darkHeader}>DESCRIPCIÓN CUALITATIVA DEL AVANCE</div>
          <div style={{ padding: 16 }}>
            <textarea 
              value={rendicion.descripcion_cualitativa || ''} 
              onChange={(e) => !readOnly && handleChange('descripcion_cualitativa', e.target.value)} 
              disabled={readOnly}
              rows={5}
              style={{ width: '100%', padding: 12, border: `2px solid ${styles.gray300}`, borderRadius: 8, fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box', ...(readOnly ? disabledBtnStyle : {}) }}
              placeholder="Ingrese la descripción cualitativa del avance..." />
          </div>
        </div>
        <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={darkHeader}>MODIFICACIONES</div>
          <div style={{ padding: 16 }}>
            <textarea 
              value={rendicion.modificaciones || ''} 
              onChange={(e) => !readOnly && handleChange('modificaciones', e.target.value)} 
              disabled={readOnly}
              rows={5}
              style={{ width: '100%', padding: 12, border: `2px solid ${styles.gray300}`, borderRadius: 8, fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box', ...(readOnly ? disabledBtnStyle : {}) }}
              placeholder="Ingrese las modificaciones..." />
          </div>
        </div>
      </div>

      {/* Attachments - Dark Header */}
      <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ ...darkHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>ARCHIVOS ADJUNTOS</span>
          <button 
            onClick={() => !readOnly && setShowFileModal(true)} 
            disabled={readOnly}
            style={{ padding: '6px 12px', background: styles.white, color: styles.black, border: 'none', borderRadius: 6, fontWeight: 600, cursor: readOnly ? 'not-allowed' : 'pointer', fontSize: '0.7rem', ...(readOnly ? disabledBtnStyle : {}) }}
          >+ Agregar archivo</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['NOMBRE', 'DESCRIPCIÓN', 'TAMAÑO', 'ACCIONES'].map(h => <th key={h} style={headerStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {adjuntos.length === 0 ? (
              <tr><td colSpan={4} style={{ ...rowStyle, textAlign: 'center', color: styles.gray500, padding: 24 }}>No hay archivos adjuntos</td></tr>
            ) : (
              adjuntos.map((adj, idx) => (
                <tr key={adj.id || idx} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                  <td style={rowStyle}>{adj.nombre}</td>
                  <td style={rowStyle}>{adj.descripcion || '-'}</td>
                  <td style={rowStyle}>{adj.size || '-'}</td>
                  <td style={{ ...rowStyle, textAlign: 'center' }}>
                    <a href={adj.url.startsWith('http') ? adj.url : `${API_URL}${adj.url}`} target="_blank" rel="noopener noreferrer" style={{ color: styles.blue, marginRight: 8 }}>⬇️</a>
                    <button 
                      onClick={() => !readOnly && deleteAdjunto(adj.id)} 
                      disabled={readOnly}
                      style={{ background: 'none', border: 'none', color: styles.red, cursor: readOnly ? 'not-allowed' : 'pointer', ...(readOnly ? disabledBtnStyle : {}) }}
                    >🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* File Upload Modal */}
      {showFileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 12, width: 500, maxWidth: '90%', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ ...darkHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>AGREGAR ARCHIVO</span>
              <button onClick={() => { setShowFileModal(false); setNewFile({ nombre: '', descripcion: '', url: '', file: null }); }} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', marginBottom: 6 }}>Nombre del archivo</label>
                <input type="text" value={newFile.nombre} onChange={(e) => setNewFile(prev => ({ ...prev, nombre: e.target.value }))} 
                  style={{ width: '100%', padding: '10px 12px', border: `2px solid ${styles.gray300}`, borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }} 
                  placeholder="Ej: documento.pdf" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', marginBottom: 6 }}>Descripción</label>
                <input type="text" value={newFile.descripcion} onChange={(e) => setNewFile(prev => ({ ...prev, descripcion: e.target.value }))} 
                  style={{ width: '100%', padding: '10px 12px', border: `2px solid ${styles.gray300}`, borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }} 
                  placeholder="Descripción del archivo" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', marginBottom: 6 }}>Subir archivo</label>
                <input type="file" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setNewFile(prev => ({ ...prev, file, nombre: prev.nombre || file.name, size: `${(file.size / 1024).toFixed(1)} KB` }));
                  }
                }} style={{ fontSize: '0.85rem' }} />
              </div>
              <div style={{ marginBottom: 16, textAlign: 'center', color: styles.gray500, fontSize: '0.8rem' }}>— O —</div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', marginBottom: 6 }}>URL del archivo</label>
                <input type="url" value={newFile.url} onChange={(e) => setNewFile(prev => ({ ...prev, url: e.target.value }))} 
                  style={{ width: '100%', padding: '10px 12px', border: `2px solid ${styles.gray300}`, borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }} 
                  placeholder="https://ejemplo.com/archivo.pdf" />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowFileModal(false); setNewFile({ nombre: '', descripcion: '', url: '', file: null }); }} 
                  style={{ padding: '10px 20px', background: styles.gray200, color: styles.gray700, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Cancelar</button>
                <button onClick={async () => {
                  if (!newFile.nombre) { alert('Ingrese un nombre para el archivo'); return; }
                  if (!selectedIndicador) { alert('Seleccione un indicador'); return; }
                  
                  try {
                    const formData = new FormData();
                    formData.append('id_indicador', selectedIndicador.id_indicador);
                    formData.append('gestion', gestion);
                    formData.append('nombre', newFile.nombre);
                    formData.append('descripcion', newFile.descripcion || '');
                    
                    if (newFile.file) {
                      formData.append('file', newFile.file);
                    } else if (newFile.url) {
                      formData.append('url', newFile.url);
                    } else {
                      alert('Seleccione un archivo o ingrese una URL');
                      return;
                    }
                    
                    const res = await fetch(`${API_URL}/api/sms/rendicion/adjuntos`, { 
                      method: 'POST', 
                      body: formData 
                    });
                    
                    if (res.ok) {
                      const data = await res.json();
                      setAdjuntos(prev => [...prev, {
                        id: data.archivo.id,
                        nombre: data.archivo.nombre,
                        descripcion: data.archivo.descripcion,
                        url: data.archivo.url,
                        size: data.archivo.size ? `${(data.archivo.size / 1024).toFixed(1)} KB` : '-'
                      }]);
                      setShowFileModal(false);
                      setNewFile({ nombre: '', descripcion: '', url: '', file: null });
                      alert('Archivo guardado correctamente');
                    } else {
                      const error = await res.json();
                      alert('Error al guardar archivo: ' + (error.detail || 'Error desconocido'));
                    }
                  } catch (err) { 
                    console.error(err); 
                    alert('Error al guardar archivo');
                  }
                }} 
                  style={{ padding: '10px 20px', background: styles.black, color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for editing PROGRAMADO - Only Admin */}
      {showProgramadoModal && canEdit && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 0, maxWidth: 400, width: '90%', overflow: 'hidden' }}>
            <div style={{ background: styles.blue, color: styles.white, padding: '16px 20px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Editar PROGRAMADO del Año</h3>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.8rem', color: styles.gray700 }}>
                  Indicador: {selectedIndicador?.codi}
                </label>
                <div style={{ fontSize: '0.85rem', color: styles.gray600, marginBottom: 12 }}>
                  {selectedIndicador?.indicador_resultado?.substring(0, 100)}...
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.8rem', color: styles.gray700 }}>
                  Año de Gestión: {gestion}
                </label>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.8rem', color: styles.gray700 }}>
                  PROGRAMADO
                </label>
                <input 
                  type="number" 
                  step="0.001"
                  value={programadoTemp} 
                  onChange={(e) => setProgramadoTemp(e.target.value)} 
                  style={{ width: '100%', padding: 12, border: `2px solid ${styles.blue}`, borderRadius: 6, fontSize: '1rem', fontWeight: 600, boxSizing: 'border-box' }}
                  placeholder="Ingrese el valor programado"
                />
              </div>
              <div style={{ fontSize: '0.75rem', color: styles.gray500, marginBottom: 16, padding: 12, background: styles.gray100, borderRadius: 6 }}>
                <div style={{ marginBottom: 6 }}><strong>Meta global del indicador:</strong> {selectedIndicador?.logro || '-'}</div>
                <div style={{ marginBottom: 6 }}><strong>Suma de programados (todos los años):</strong> {sumaProgramado.toFixed(3)}</div>
                <div style={{ color: (parseFloat(selectedIndicador?.logro) || 0) > 0 ? ((sumaProgramado <= (parseFloat(selectedIndicador?.logro) || 0)) ? styles.green : styles.red) : styles.gray600 }}>
                  <strong>Disponible para programar:</strong> {((parseFloat(selectedIndicador?.logro) || 0) - sumaProgramado + (parseFloat(rendicion.programado) || 0)).toFixed(3)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowProgramadoModal(false)} style={{ flex: 1, padding: 12, border: `2px solid ${styles.gray300}`, background: 'transparent', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={saveProgramado} data-testid="btn-save-programado" style={{ flex: 1, padding: 12, background: styles.blue, color: styles.white, border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
                  💾 Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SeguimientoView;
