import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Shield, ArrowRight, UserPlus } from 'lucide-react';
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
      background: 'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.06) 0%, transparent 50%), var(--bg-primary)'
    }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '0 20px' }}>
        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius-lg)',
            background: 'var(--gradient-primary)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
            boxShadow: '0 4px 24px rgba(59,130,246,0.3)'
          }}>
            <Shield size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
            Grievance Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Blockchain-backed transparency & accountability
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '24px' }}>
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', color: 'var(--danger)',
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem', marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: 'rgba(16,185,129,0.1)', color: 'var(--success)',
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem', marginBottom: '16px'
            }}>
              {success}
            </div>
          )}

          <form onSubmit={isRegister ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  placeholder="you@university.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={4}
                />
              </div>
            </div>

            {isRegister && (
              <>
                <div>
                  <label className="label">Role</label>
                  <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Department Admin</option>
                    <option value="AUTHORITY">Higher Authority</option>
                  </select>
                </div>

                {role === 'ADMIN' && (
                  <div>
                    <label className="label">Department</label>
                    <select className="input-field" value={departmentName} onChange={e => setDepartmentName(e.target.value)}>
                      <option value="Registrar">Registrar</option>
                      <option value="Dean of Academics">Dean of Academics</option>
                      <option value="Dean of Student Affairs">Dean of Student Affairs</option>
                      <option value="Senior Doctor">Senior Doctor</option>
                      <option value="Chief Warden">Chief Warden</option>
                    </select>
                  </div>
                )}
              </>
            )}

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '8px', opacity: loading ? 0.7 : 1 }}>
              {loading ? (isRegister ? 'Creating...' : 'Signing in...') : (
                <>
                  {isRegister ? <><UserPlus size={18} /> Create Account</> : <><ArrowRight size={18} /> Sign In</>}
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              style={{ background: 'none', color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.85rem' }}
              onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
            >
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
