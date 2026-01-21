import React, { useState, useEffect } from 'react';
import { API_URL, colorThemes, defaultStyles as styles, getTableStyles } from '../../styles/theme';

const { rowStyle, headerStyle } = getTableStyles(styles);

function ConfiguracionView({ siteConfig, onConfigChange, readOnly = false }) {
  const [config, setConfig] = useState({
    plan_anio_inicio: 2020,
    plan_anio_fin: 2025,
    favicon_url: '',
    logo_url: '',
    logo_width: 40,
    logo_height: 40,
    color_theme: 'negro',
    modo: 'claro',
    copyright_text: '© 2025 - Sistema de Monitoreo Sectorial'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const disabledBtnStyle = { opacity: 0.5, cursor: 'not-allowed' };

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sms/configuracion`);
      const data = await res.json();
      setConfig(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/api/sms/configuracion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setMessage('✅ Configuración guardada correctamente');
        if (onConfigChange) onConfigChange(config);
      } else {
        setMessage('❌ Error al guardar la configuración');
      }
    } catch (err) {
      setMessage('❌ Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Cargando configuración...</div>;

  const cardStyle = { background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20 };
  const darkHeader = { background: styles.gray800, color: '#FFFFFF', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
  const inputStyle = { width: '100%', padding: '10px 12px', border: `2px solid ${styles.gray300}`, borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '0.7rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', marginBottom: 6 };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.3rem' }}>⚙️ Configuración del Sistema</h2>
        <button 
          onClick={!readOnly ? saveConfig : undefined} 
          disabled={saving || readOnly} 
          style={{ padding: '10px 24px', background: styles.black, color: '#FFFFFF', border: 'none', borderRadius: 8, fontWeight: 600, cursor: (saving || readOnly) ? 'not-allowed' : 'pointer', fontSize: '0.85rem', opacity: (saving || readOnly) ? 0.5 : 1 }}
        >
          {saving ? 'Guardando...' : '💾 Guardar Configuración'}
        </button>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 20, background: message.includes('✅') ? '#D1FAE5' : '#FEE2E2', color: message.includes('✅') ? styles.green : styles.red, fontSize: '0.85rem', fontWeight: 500 }}>
          {message}
        </div>
      )}

      {/* Plan Sectorial Period */}
      <div style={cardStyle}>
        <div style={darkHeader}>📅 Periodo del Plan Sectorial</div>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: '0.8rem', color: styles.gray600, marginBottom: 16 }}>
            Define el periodo de formulación y evaluación del Plan Sectorial. Solo los años dentro de este rango estarán disponibles en el sistema de seguimiento.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={labelStyle}>Año de Inicio</label>
              <input type="number" min="2000" max="2050" value={config.plan_anio_inicio} onChange={(e) => handleChange('plan_anio_inicio', parseInt(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Año de Fin</label>
              <input type="number" min="2000" max="2050" value={config.plan_anio_fin} onChange={(e) => handleChange('plan_anio_fin', parseInt(e.target.value))} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginTop: 12, padding: '10px 14px', background: styles.gray100, borderRadius: 6, fontSize: '0.75rem', color: styles.gray600 }}>
            <strong>Periodo actual:</strong> {config.plan_anio_inicio} - {config.plan_anio_fin} ({config.plan_anio_fin - config.plan_anio_inicio + 1} años)
          </div>
        </div>
      </div>

      {/* Logo and Favicon - File Upload OR URL */}
      <div style={cardStyle}>
        <div style={darkHeader}>🖼️ Logo y Favicon</div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Favicon */}
            <div>
              <label style={labelStyle}>Favicon del Sitio</label>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button 
                    onClick={() => document.getElementById('favicon-file').click()}
                    style={{ padding: '8px 12px', background: styles.black, color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                    📁 Subir Archivo
                  </button>
                  <input id="favicon-file" type="file" accept=".ico,.png,.jpg,.jpeg,.svg" style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          const res = await fetch(`${API_URL}/api/sms/configuracion/upload/favicon`, { method: 'POST', body: formData });
                          if (res.ok) {
                            const data = await res.json();
                            handleChange('favicon_url', data.url);
                            setMessage('✅ Favicon subido correctamente');
                          } else { setMessage('❌ Error al subir el favicon'); }
                        } catch (err) { setMessage('❌ Error de conexión'); }
                      }
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="url" placeholder="O ingrese URL del favicon" value={config.favicon_url || ''} 
                    onChange={(e) => handleChange('favicon_url', e.target.value)} 
                    style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>
              <p style={{ fontSize: '0.65rem', color: styles.gray500 }}>Formato: .ico, .png (32x32 recomendado)</p>
              {config.favicon_url && (
                <div style={{ marginTop: 8, padding: 8, background: styles.gray100, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={config.favicon_url.startsWith('/') ? API_URL + config.favicon_url : config.favicon_url} alt="Favicon" style={{ width: 24, height: 24 }} onError={(e) => { e.target.style.display = 'none'; }} />
                  <span style={{ fontSize: '0.7rem', color: styles.gray600 }}>Favicon actual</span>
                  <button onClick={() => handleChange('favicon_url', '')} style={{ marginLeft: 'auto', padding: '2px 8px', background: styles.red, color: '#FFF', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.65rem' }}>✕</button>
                </div>
              )}
            </div>
            
            {/* Logo */}
            <div>
              <label style={labelStyle}>Logo Principal</label>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button 
                    onClick={() => document.getElementById('logo-file').click()}
                    style={{ padding: '8px 12px', background: styles.black, color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                    📁 Subir Archivo
                  </button>
                  <input id="logo-file" type="file" accept=".png,.jpg,.jpeg,.svg,.gif" style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          const res = await fetch(`${API_URL}/api/sms/configuracion/upload/logo`, { method: 'POST', body: formData });
                          if (res.ok) {
                            const data = await res.json();
                            handleChange('logo_url', data.url);
                            setMessage('✅ Logo subido correctamente');
                          } else { setMessage('❌ Error al subir el logo'); }
                        } catch (err) { setMessage('❌ Error de conexión'); }
                      }
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="url" placeholder="O ingrese URL del logo" value={config.logo_url || ''} 
                    onChange={(e) => handleChange('logo_url', e.target.value)} 
                    style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>
              <p style={{ fontSize: '0.65rem', color: styles.gray500 }}>Formato: .png, .jpg, .svg</p>
            </div>
          </div>
          
          {/* Logo Size and Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 20, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>Ancho del Logo (px)</label>
              <input type="number" min="20" max="200" value={config.logo_width} onChange={(e) => handleChange('logo_width', parseInt(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Alto del Logo (px)</label>
              <input type="number" min="20" max="200" value={config.logo_height} onChange={(e) => handleChange('logo_height', parseInt(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Vista Previa del Logo</label>
              <div style={{ padding: 16, background: styles.gray100, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 60 }}>
                {config.logo_url ? (
                  <img 
                    src={config.logo_url.startsWith('/') ? API_URL + config.logo_url : config.logo_url} 
                    alt="Logo" 
                    style={{ width: config.logo_width, height: config.logo_height, objectFit: 'contain' }} 
                    onError={(e) => { e.target.style.display = 'none'; }} 
                  />
                ) : (
                  <span style={{ fontSize: '0.75rem', color: styles.gray500 }}>Sin logo configurado</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Color Theme */}
      <div style={cardStyle}>
        <div style={darkHeader}>🎨 Tema de Colores</div>
        <div style={{ padding: 20 }}>
          <label style={labelStyle}>Seleccionar Color Principal</label>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            {[
              { key: 'negro', label: 'Negro', color: '#000000', desc: 'Estilo UBER' },
              { key: 'azul', label: 'Azul', color: '#0066CC', desc: 'Profesional' },
              { key: 'rosa', label: 'Rosa', color: '#FF5A5F', desc: 'Estilo AirBNB' }
            ].map(theme => (
              <div key={theme.key} onClick={() => handleChange('color_theme', theme.key)}
                style={{ flex: 1, padding: 16, border: `3px solid ${config.color_theme === theme.key ? theme.color : styles.gray300}`, borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: config.color_theme === theme.key ? `${theme.color}10` : styles.white, transition: 'all 0.2s' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: theme.color, margin: '0 auto 12px' }}></div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{theme.label}</div>
                <div style={{ fontSize: '0.7rem', color: styles.gray500 }}>{theme.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Light/Dark Mode */}
      <div style={cardStyle}>
        <div style={darkHeader}>🌓 Modo de Visualización</div>
        <div style={{ padding: 20 }}>
          <label style={labelStyle}>Seleccionar Modo</label>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            {[
              { key: 'claro', label: '☀️ Modo Claro', desc: 'Fondo claro, texto oscuro' },
              { key: 'oscuro', label: '🌙 Modo Oscuro', desc: 'Fondo oscuro, texto claro' }
            ].map(mode => (
              <div key={mode.key} onClick={() => handleChange('modo', mode.key)}
                style={{ flex: 1, padding: 20, border: `3px solid ${config.modo === mode.key ? styles.black : styles.gray300}`, borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: config.modo === mode.key ? styles.gray100 : styles.white, transition: 'all 0.2s' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{mode.key === 'claro' ? '☀️' : '🌙'}</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{mode.label}</div>
                <div style={{ fontSize: '0.7rem', color: styles.gray500 }}>{mode.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div style={cardStyle}>
        <div style={darkHeader}>©️ Derechos de Autor</div>
        <div style={{ padding: 20 }}>
          <label style={labelStyle}>Texto de Copyright</label>
          <input type="text" placeholder="© 2025 - Mi Organización" value={config.copyright_text} onChange={(e) => handleChange('copyright_text', e.target.value)} style={inputStyle} />
          <div style={{ marginTop: 12, padding: '10px 14px', background: styles.gray100, borderRadius: 6, fontSize: '0.75rem', color: styles.gray600, textAlign: 'center' }}>
            <strong>Vista previa:</strong> {config.copyright_text}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App Component

export default ConfiguracionView;
