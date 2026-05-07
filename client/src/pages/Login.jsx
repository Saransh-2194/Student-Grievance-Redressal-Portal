import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Shield, ArrowRight, Info, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../lib/api';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [authorityId, setAuthorityId] = useState('');
  const [designation, setDesignation] = useState('');
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
        name,
        rollNo: role === 'STUDENT' ? rollNo : undefined,
        authorityId: role !== 'STUDENT' ? authorityId : undefined,
        designation: role !== 'STUDENT' ? designation : undefined,
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
      minHeight: '100vh', 
      display: 'flex', 
      background: '#ffffff',
      color: '#1e293b',
      fontFamily: '"Outfit", sans-serif'
    }}>
      {/* LEFT SIDE: Cinematic Branding (Dark Blue) */}
      <div style={{
        flex: 1.1,
        background: '#0a192f', // Deep dark navy
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center'
      }}>
        {/* Subtle Grid Background */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.5
        }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Institution Label */}
          <div style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '100px',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '32px',
            color: '#cbd5e1',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            JUIT SOLAN
          </div>

          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: 800, 
            lineHeight: 1.1, 
            marginBottom: '24px',
            letterSpacing: '-0.02em',
            color: '#ffffff'
          }}>
            Student <br/>
            <span style={{ color: '#60a5fa' }}>Grievance</span> <br/>
            Portal
          </h1>

          {/* Illustration Container */}
          <div style={{ 
            marginTop: '40px',
            position: 'relative',
            width: '100%',
            maxWidth: '450px',
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="https://cdni.iconscout.com/illustration/premium/thumb/students-discussing-about-their-results-on-laptop-2710189-2263889.png" 
              alt="Illustration"
              style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))' }}
              onError={(e) => {
                e.target.src = "https://illustrations.popsy.co/white/student-going-to-school.svg";
              }}
            />
          </div>
        </div>

        {/* Floating Accents */}
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: '10px', height: '10px', background: '#f59e0b', borderRadius: '50%', opacity: 0.5 }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: '12px', height: '12px', background: '#3b82f6', borderRadius: '50%', opacity: 0.4 }} />
      </div>

      {/* RIGHT SIDE: Clean Auth Form (White) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        position: 'relative',
        background: '#ffffff'
      }}>
        
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ marginBottom: '40px' }}>
            <p style={{ 
              fontSize: '0.75rem', 
              fontWeight: 800, 
              color: '#4f46e5', 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em',
              marginBottom: '12px'
            }}>
              {isRegister ? 'JOIN THE COMMUNITY' : 'WELCOME BACK'}
            </p>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              {isRegister ? 'Create an account' : 'Sign in to continue'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              {isRegister ? 'Fill in your details to start using the portal.' : 'Use your institutional credentials to access the dashboard.'}
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', color: '#b91c1c',
              padding: '16px', borderRadius: '12px',
              fontSize: '0.85rem', marginBottom: '24px', border: '1px solid #fee2e2',
              display: 'flex', gap: '12px', alignItems: 'center'
            }}>
              <Info size={18} /> {error}
            </div>
          )}

          {success && (
            <div style={{
              background: '#ecfdf5', color: '#047857',
              padding: '16px', borderRadius: '12px',
              fontSize: '0.85rem', marginBottom: '24px', border: '1px solid #d1fae5',
              display: 'flex', gap: '12px', alignItems: 'center'
            }}>
              <CheckCircle size={18} /> {success}
            </div>
          )}

          <form onSubmit={isRegister ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Institutional Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '17px', color: '#94a3b8' }} />
                <input
                  type="email"
                  className="input-field"
                  style={{ 
                    paddingLeft: '50px', height: '54px', background: '#f8fafc',
                    border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem', color: '#0f172a'
                  }}
                  placeholder="e.g. 210001@juit.ac.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '17px', color: '#94a3b8' }} />
                <input
                  type="password"
                  className="input-field"
                  style={{ 
                    paddingLeft: '50px', height: '54px', background: '#f8fafc',
                    border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem', color: '#0f172a'
                  }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {isRegister && (
              <>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    style={{ height: '54px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a' }}
                    placeholder="Enter your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                {role === 'STUDENT' ? (
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Roll Number</label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ height: '54px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a' }}
                      placeholder="e.g. 210001"
                      value={rollNo}
                      onChange={e => setRollNo(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>ID / Code</label>
                      <input
                        type="text"
                        className="input-field"
                        style={{ height: '54px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a' }}
                        placeholder="e.g. STAFF01"
                        value={authorityId}
                        onChange={e => setAuthorityId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Designation</label>
                      <input
                        type="text"
                        className="input-field"
                        style={{ height: '54px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a' }}
                        placeholder="e.g. HOD / Dean / Warden / Registrar"
                        value={designation}
                        onChange={e => setDesignation(e.target.value)}
                        required
                      />
                      <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                        Includes Dept Heads (HOD, Warden, Caretaker) and Admins (Dean, Registrar).
                      </p>
                    </div>
                  </>
                )}
              </>
            )}

            {isRegister && (
              <div style={{ display: 'grid', gridTemplateColumns: (role === 'ADMIN' || role === 'AUTHORITY') ? '1fr 1fr' : '1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>User Role</label>
                  <select className="input-field" style={{ height: '54px', background: '#f8fafc', color: '#0f172a' }} value={role} onChange={e => setRole(e.target.value)}>
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">University Authority (Dept Head / Admin)</option>
                  </select>
                </div>

                {role === 'ADMIN' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Department</label>
                    <select className="input-field" style={{ height: '54px', background: '#f8fafc', color: '#0f172a' }} value={departmentName} onChange={e => setDepartmentName(e.target.value)}>
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

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ 
                marginTop: '10px', height: '54px', fontSize: '1rem', fontWeight: 700,
                background: '#4f46e5', borderRadius: '12px',
                boxShadow: '0 10px 20px rgba(79, 70, 229, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
              }}
            >
              {loading ? (isRegister ? 'Processing...' : 'Signing in...') : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'} <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.95rem', color: '#64748b' }}>
            {isRegister ? 'Already have an account?' : "New to the portal?"}{' '}
            <button
              style={{ background: 'none', color: '#4f46e5', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer' }}
              onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
            >
              {isRegister ? 'Sign In' : 'Sign Up Now'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '40px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
          Powered by Blockchain Security | JUIT Institutional Access
        </div>
      </div>
    </div>
  );
}
