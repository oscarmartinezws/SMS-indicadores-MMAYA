import React, { useState } from 'react';
import { API_URL } from '../../styles/theme';

function Login({ onLogin, styles }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError('Complete todos los campos'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/sms/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (res.ok && data.token) { localStorage.setItem('sms_token', data.token); localStorage.setItem('sms_user', JSON.stringify(data.user)); onLogin(data.user, data.token); }
      else { setError(data.detail || data.error || 'Credenciales incorrectas'); }
    } catch (err) { console.error(err); setError('Error de conexión'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: styles.black, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: styles.white, borderRadius: 16, padding: '48px 40px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, background: styles.black, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <span style={{ fontSize: 28, color: styles.white }}>📊</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: styles.black }}>SMS</div>
          <div style={{ fontSize: '0.85rem', color: styles.gray600, marginTop: 8 }}>Sistema de Monitoreo Sectorial</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Usuario</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ingrese su usuario" style={{ width: '100%', padding: 14, fontSize: '1rem', border: `2px solid ${styles.gray300}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingrese su contraseña" style={{ width: '100%', padding: 14, fontSize: '1rem', border: `2px solid ${styles.gray300}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, fontSize: '1rem', fontWeight: 600, background: styles.black, color: styles.white, border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginTop: 8 }}>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</button>
          {error && <div style={{ background: '#FEE2E2', color: styles.red, padding: '12px 16px', borderRadius: 8, marginTop: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}><span>⚠️</span> {error}</div>}
        </form>
        <div style={{ textAlign: 'center', marginTop: 32, fontSize: '0.8rem', color: styles.gray500 }}>© 2025 - Todos los derechos reservados</div>
      </div>
    </div>
  );
}

export default Login;
