import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, Mail, Shield, ArrowRight, UserPlus, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../lib/api';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [departmentName, setDepartmentName] = useState('Registrar');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials or server is unreachable.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/register`, { 
        email, 
        password, 
        role, 
        departmentName: role === 'ADMIN' ? departmentName : undefined 
      });
      setSuccess('Account created! You can now sign in.');
      setIsRegister(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Cinematic Background Elements */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, var(--accent-blue) 0%, transparent 70%)', opacity: 0.1, filter: 'blur(100px)' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, var(--accent-violet) 0%, transparent 70%)', opacity: 0.08, filter: 'blur(100px)' }} />

      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <button 
          className="btn-icon btn-ghost" 
          onClick={toggleTheme}
          style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', width: '44px', height: '44px', borderRadius: '12px' }}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '440px', padding: '0 20px', position: 'relative', zIndex: 1 }}>
        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius-xl)',
            background: 'var(--gradient-primary)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(59,130,246,0.4)',
            transform: 'rotate(-5deg)'
          }}>
            <Shield size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Grievance Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>
            Unified University Resolution Engine
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel" style={{ padding: '40px', background: 'var(--surface)', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
              {isRegister ? 'Join the Portal' : 'Welcome Back'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {isRegister ? 'Create your account to start reporting issues.' : 'Access your dashboard and track your tickets.'}
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', color: 'var(--danger)',
              padding: '12px 16px', borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem', marginBottom: '24px', border: '1px solid rgba(239,68,68,0.2)'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: 'rgba(16,185,129,0.1)', color: 'var(--success)',
              padding: '12px 16px', borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem', marginBottom: '24px', border: '1px solid rgba(16,185,129,0.2)'
            }}>
              {success}
            </div>
          )}

          <form onSubmit={isRegister ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label className="label" style={{ fontSize: '0.7rem' }}>Institutional Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: '48px', height: '48px', background: 'var(--bg-primary)' }}
                  placeholder="name@university.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" style={{ fontSize: '0.7rem' }}>Secret Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="input-field"
                  style={{ paddingLeft: '48px', height: '48px', background: 'var(--bg-primary)' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={4}
                />
              </div>
            </div>

            {isRegister && (
              <div style={{ display: 'grid', gridTemplateColumns: role === 'ADMIN' ? '1fr 1.2fr' : '1fr', gap: '12px' }}>
                <div>
                  <label className="label" style={{ fontSize: '0.7rem' }}>Your Role</label>
                  <select className="input-field" style={{ height: '48px', background: 'var(--bg-primary)' }} value={role} onChange={e => setRole(e.target.value)}>
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Admin</option>
                    <option value="AUTHORITY">Authority</option>
                  </select>
                </div>

                {role === 'ADMIN' && (
                  <div>
                    <label className="label" style={{ fontSize: '0.7rem' }}>Department</label>
                    <select className="input-field" style={{ height: '48px', background: 'var(--bg-primary)' }} value={departmentName} onChange={e => setDepartmentName(e.target.value)}>
                      <option value="Registrar">Registrar</option>
                      <option value="Dean of Academics">Academics</option>
                      <option value="Dean of Student Affairs">Student Affairs</option>
                      <option value="Senior Doctor">Health Center</option>
                      <option value="Chief Warden">Hostels</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '12px', height: '52px', fontSize: '1rem', background: 'var(--gradient-primary)' }}>
              {loading ? (isRegister ? 'Initializing...' : 'Authenticating...') : (
                <>
                  {isRegister ? <><UserPlus size={20} /> Create Account</> : <><ArrowRight size={20} /> Sign In to Portal</>}
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {isRegister ? 'Already have an account?' : "New to the portal?"}{' '}
            <button
              style={{ background: 'none', color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.9rem' }}
              onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
            >
              {isRegister ? 'Sign In' : 'Register Now'}
            </button>
          </div>
        </div>
        
        <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Secure Blockchain-Backbone | University Internal Use Only
        </p>
      </div>
    </div>
  );
}

