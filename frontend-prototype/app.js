const { useState, useRef, useEffect } = React;

const rollEmail = r => r + '@juitsolan.in';

const USERS = [
  { roll:'231030001', name:'Rahul Sharma',     password:'pass123',  role:'student' },
  { roll:'231030002', name:'Priya Singh',      password:'pass123',  role:'student' },
  { roll:'241030001', name:'Amit Kumar',       password:'pass123',  role:'student' },
  { roll:'251030001', name:'Sneha Gupta',      password:'pass123',  role:'student' },
  // Hostel chain
  { roll:'CARE01',    name:'Mr. A. Singh',     password:'admin123', role:'authority', dept:'Caretaker'              },
  { roll:'WARDEN01',  name:'Dr. R. Verma',     password:'admin123', role:'authority', dept:'Hostel Warden'          },
  { roll:'DWARDEN01', name:'Dr. S. Nair',      password:'admin123', role:'authority', dept:'Deputy Chief Warden'    },
  { roll:'CWARDEN01', name:'Prof. D. Sharma',  password:'admin123', role:'authority', dept:'Chief Warden'           },
  // Academic chain
  { roll:'ACAD01',    name:'Prof. S. Kumar',   password:'admin123', role:'authority', dept:'Academic Committee'     },
  { roll:'HOD01',     name:'Dr. P. Mehta',     password:'admin123', role:'authority', dept:'HOD'                   },
  { roll:'DEAN01',    name:'Prof. R. Joshi',   password:'admin123', role:'authority', dept:'Dean of Academics'      },
  // Exam chain
  { roll:'DCOE01',    name:'Dr. K. Rao',       password:'admin123', role:'authority', dept:'Deputy COE'             },
  { roll:'COE01',     name:'Prof. V. Gupta',   password:'admin123', role:'authority', dept:'COE'                   },
  // Library chain
  { roll:'LIB01',     name:'Mr. S. Mishra',    password:'admin123', role:'authority', dept:'Librarian'              },
  { roll:'CLIB01',    name:'Mr. T. Das',       password:'admin123', role:'authority', dept:'Chief Librarian'        },
  // Admin / Registrar
  { roll:'ADMIN01',   name:'Mr. P. Gupta',     password:'admin123', role:'authority', dept:'Administrative Office'  },
  { roll:'REG01',     name:'Dr. M. Tiwari',    password:'admin123', role:'authority', dept:'Registrar'              },
];

const DEPT_MAP = {
  Academic:      'Academic Committee',
  Exam:          'Deputy COE',
  Administrative:'Administrative Office',
  Library:       'Librarian',
  Other:         'Administrative Office',
};

const HOSTEL_TIERS = [
  { keys:['hot water','geyser','heater','light','electricity','bulb','fan','appliance','garbage','trash','waste','dustbin','wifi','internet','network','washroom','toilet','bathroom','drain','tap','water','cleanliness','sweep','broom','monkey','pest','rodent','animal','repair','leak','smell'], dept:'Caretaker', label:'Caretaker (routine maintenance)' },
  { keys:['room change','room transfer','roommate','bed change','shift room','discipline','ragging','noise','disturbance','lost item','theft','cupboard lock','chair broken','table broken','bed broken','mattress','serious','not resolved','still pending','2 weeks','month'], dept:'Hostel Warden', label:'Hostel Warden' },
  { keys:['deputy','escalate','repeated','ignored','no action','urgent','emergency'], dept:'Deputy Chief Warden', label:'Deputy Chief Warden' },
  { keys:['chief','harassment','safety','security'], dept:'Chief Warden', label:'Chief Warden' },
  { keys:['registrar','critical','policy','legal','formal'], dept:'Registrar', label:'Registrar' },
];

function hostelDept(title, desc) {
  const t = (title + ' ' + desc).toLowerCase();
  for (const tier of HOSTEL_TIERS)
    if (tier.keys.some(k => t.includes(k))) return tier;
  return { dept:'Caretaker', label:'Caretaker (routine maintenance)' };
}

const SUGGESTIONS = {
  Hostel: [
    { keys:['hot water','geyser','heater'], text:'Hot water not available' },
    { keys:['light','electricity','bulb','switch','power'], text:'Electricity / lighting issue' },
    { keys:['fan','appliance','ac '], text:'Fan or electrical appliance issue' },
    { keys:['bed','chair','table','cupboard','furniture'], text:'Room furniture maintenance' },
    { keys:['washroom','toilet','bathroom','drain','tap'], text:'Washroom / sanitation issue' },
    { keys:['wifi','internet','network'], text:'WiFi connectivity problem' },
    { keys:['garbage','trash','waste','dustbin'], text:'Garbage collection issue' },
    { keys:['monkey','animal','pest','rodent'], text:'Monkey / animal disturbance' },
  ],
  Academic: [
    { keys:['registration','course','enroll','add','drop'], text:'Course registration problem' },
    { keys:['attendance','proxy','shortage'], text:'Attendance issue' },
    { keys:['timetable','schedule','clash'], text:'Timetable clash' },
  ],
  Exam: [
    { keys:['exam','paper','question'], text:'Exam paper issue' },
    { keys:['revaluation','rechecking','marks'], text:'Revaluation / rechecking request' },
    { keys:['date','schedule','clash'], text:'Exam date / schedule conflict' },
  ],
  Administrative: [
    { keys:['id card','identity','id'], text:'ID card problem' },
    { keys:['marksheet','certificate','document'], text:'Marksheet / certificate issue' },
    { keys:['bus','transport','shuttle'], text:'Transport complaint' },
    { keys:['fee','payment','receipt'], text:'Fee / payment issue' },
  ],
  Library: [
    { keys:['book','issue','return'], text:'Book issue / return problem' },
    { keys:['fine','penalty'], text:'Library fine dispute' },
    { keys:['facility','reading','room'], text:'Library facility complaint' },
  ],
  Other: [
    { keys:['id card','identity'], text:'ID card problem' },
    { keys:['library','book'], text:'Library issue' },
    { keys:['transport','bus'], text:'Transport complaint' },
  ],
};

function getSugg(title, cat) {
  if (!title || title.length < 2) return [];
  const t = title.toLowerCase();
  return (SUGGESTIONS[cat] || []).filter(s => s.keys.some(k => t.includes(k))).slice(0, 4);
}

const mkId    = () => 'GRV' + Math.floor(1000 + Math.random() * 9000);
const mkToken = () => Math.random().toString(36).substring(2,7).toUpperCase();
const mkDate  = () => new Date().toISOString().slice(0,10);

const SEED = [
  { id:'GRV1001', title:'Hot water not available in hostel', desc:'Hot water supply from the boiler has been unavailable in the common washrooms for the past 2 weeks.', category:'Hostel', status:'Under Review', assignedTo:'Caretaker', sRoll:'231030001', sName:'Rahul Sharma', anon:false, date:'2026-03-10', token:null, remarks:'' },
];

const ShieldSVG = ({ size = 20, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z"
      fill={`${color}1a`} stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function Badge({ s }) {
  const m = { Submitted:'b-blue', 'Under Review':'b-yellow', Resolved:'b-green', Rejected:'b-red', Escalated:'b-purple' };
  return <span className={`badge ${m[s] || 'b-blue'}`}>{s}</span>;
}

const Field = ({ label, req, children }) => (
  <div className="field">
    <label>{label}{req && <span className="req">*</span>}</label>
    {children}
  </div>
);

function Login({ onLogin, onForgot }) {
  const [roll, setRoll] = useState('');
  const [pw,   setPw]   = useState('');
  const [err,  setErr]  = useState('');

  function doLogin() {
    if (!roll.trim() || !pw.trim()) { setErr('Please enter your credentials.'); return; }
    const u = USERS.find(x => x.roll === roll.trim() && x.password === pw);
    if (u) { setErr(''); onLogin(u); }
    else setErr('Incorrect roll number or password.');
  }

  return (
    <div className="login-root">
      <div className="login-card">

        {/* ── LEFT ── */}
        <div className="lp-left">
          <div className="lp-ring2"/>
          {/* Geometric decorations */}
          <div className="lp-geo-ring1"/>
          <div className="lp-geo-ring2"/>
          <div className="lp-geo-sq1"/>
          <div className="lp-geo-sq2"/>
          <div className="lp-geo-dots">
            {Array.from({length:25}).map((_,i)=><span key={i}/>)}
          </div>
          {/* Branding */}
          <div className="lp-top">
            <div className="lp-eyebrow">
              <ShieldSVG size={10} color="rgba(255,255,255,.55)"/>
              JUIt Solan
            </div>
            <div className="lp-title">Student<br/><span className="hi">Grievance</span><br/>Portal</div>
            <div style={{width:56, height:3, background:'linear-gradient(90deg,#56cfee,rgba(86,207,238,0))', borderRadius:2, marginTop:18}}/>
          </div>
          {/* Illustration */}
          <div className="lp-illus-wrap">
            <img src="illustration.png" alt="Grievance illustration"/>
          </div>
        </div>        {/* ── RIGHT ── */}
        <div className="lp-right">
          <div className="lp-form-tag">Welcome Back</div>
          <div className="lp-form-title">Sign in to continue</div>
          <div className="lp-form-sub">Use your student roll number or authority ID.</div>

          <Field label="Roll Number / Authority ID">
            <input type="text" value={roll} onChange={e => setRoll(e.target.value)}
              placeholder="e.g. 231030001 or ADMIN01"
              onKeyDown={e => e.key === 'Enter' && doLogin()}/>
          </Field>
          <Field label="Password">
            <input type="password" value={pw} onChange={e => setPw(e.target.value)}
              placeholder="Enter your password"
              onKeyDown={e => e.key === 'Enter' && doLogin()}/>
          </Field>

          {err && <div className="notice n-err">{err}</div>}
          <button className="btn btn-primary btn-full" onClick={doLogin}>Sign In →</button>

          <div style={{textAlign:'center', marginTop:14, fontSize:13}}>
            <button className="btn-link" onClick={onForgot}>Forgot password?</button>
          </div>

          <div className="demo-panel">
            <div className="demo-title">
              <span>Quick Demo — click to fill</span>
              <span style={{fontWeight:400,fontSize:10,color:'var(--c-sub)',fontStyle:'italic'}}>scroll for more ↓</span>
            </div>
            <div className="demo-scroll">
            {[
              ['231030001','pass123','Student 2023'],
              ['241030001','pass123','Student 2024'],
              ['CARE01',   'admin123','Caretaker'],
              ['WARDEN01', 'admin123','Hostel Warden'],
              ['DWARDEN01','admin123','Dy. Chief Warden'],
              ['CWARDEN01','admin123','Chief Warden'],
              ['ACAD01',   'admin123','Academic Cmte.'],
              ['HOD01',    'admin123','HOD'],
              ['DEAN01',   'admin123','Dean of Academics'],
              ['DCOE01',   'admin123','Deputy COE'],
              ['COE01',    'admin123','COE'],
              ['LIB01',    'admin123','Librarian'],
              ['CLIB01',   'admin123','Chief Librarian'],
              ['ADMIN01',  'admin123','Admin Office'],
              ['REG01',    'admin123','Registrar'],
            ].map(([r,p,l]) => (
              <div key={r} className="demo-row" onClick={() => { setRoll(r); setPw(p); }}>
                <span className="demo-roll">{r}</span>
                <span className="demo-pw">{p}</span>
                <span className="demo-lbl">{l}</span>
              </div>
            ))}
            </div>
            <div className="demo-hint">Click any row to auto-fill credentials</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Forgot({ onBack }) {
  const [step,    setStep]    = useState(1);
  const [email,   setEmail]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [realOtp, setRealOtp] = useState('');
  const [pw1,     setPw1]     = useState('');
  const [pw2,     setPw2]     = useState('');
  const [err,     setErr]     = useState('');
  const [found,   setFound]   = useState(null);

  function sendOtp() {
    const u = USERS.find(x => rollEmail(x.roll) === email.trim().toLowerCase());
    if (!u) { setErr('No account found with that email.'); return; }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setRealOtp(code); setFound(u); setErr(''); setStep(2);
  }
  function verifyOtp() {
    if (otp.trim() !== realOtp) { setErr('Incorrect OTP. Try again.'); return; }
    setErr(''); setStep(3);
  }
  function resetPw() {
    if (pw1.length < 6) { setErr('Minimum 6 characters required.'); return; }
    if (pw1 !== pw2)    { setErr('Passwords do not match.'); return; }
    found.password = pw1; setErr(''); setStep(4);
  }

  const STEPS = ['Email','OTP','New Password'];

  return (
    <div className="forgot-root">
      <div className="forgot-card">
        <div className="forgot-head">
          <div className="forgot-icon">
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
              <circle cx="7.5" cy="15.5" r="5.5" stroke="#fff" strokeWidth="1.8"/>
              <path d="m21 2-9.6 9.6M15 8l3 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="forgot-title">Reset Password</div>
          <div className="forgot-sub">
            {['Enter your college email address', `OTP sent to ${email}`, 'Create your new password', 'Password updated!'][step - 1]}
          </div>
        </div>

        <div className="card" style={{padding:'28px 30px'}}>
          {step < 4 && (
            <div className="steps">
              {STEPS.map((l, i) => (
                <React.Fragment key={l}>
                  <div className="step-wrap">
                    <div className="step-circle" style={{
                      background: step > i+1 ? 'var(--c-green)' : step === i+1 ? 'var(--c-blue)' : 'var(--c-line)',
                      color: step >= i+1 ? '#fff' : 'var(--c-sub)',
                    }}>{step > i+1 ? '✓' : i+1}</div>
                    <div className="step-label" style={{color: step >= i+1 ? 'var(--c-navy)' : 'var(--c-sub)'}}>{l}</div>
                  </div>
                  {i < 2 && <div className="step-line" style={{background: step > i+1 ? 'var(--c-green)' : 'var(--c-line)'}}/>}
                </React.Fragment>
              ))}
            </div>
          )}

          {step === 1 && <>
            <Field label="College Email">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="231030001@juitsolan.in" onKeyDown={e => e.key === 'Enter' && sendOtp()}/>
            </Field>
            {err && <div className="notice n-err">{err}</div>}
            <button className="btn btn-primary btn-full" onClick={sendOtp}>Send OTP</button>
          </>}

          {step === 2 && <>
            <div className="notice n-info">Demo OTP: <strong>{realOtp}</strong></div>
            <Field label="Enter 6-Digit OTP">
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                placeholder="— — — — — —" maxLength={6}
                style={{letterSpacing:10, textAlign:'center', fontSize:22, fontFamily:'monospace'}}
                onKeyDown={e => e.key === 'Enter' && verifyOtp()}/>
            </Field>
            {err && <div className="notice n-err">{err}</div>}
            <button className="btn btn-primary btn-full" onClick={verifyOtp}>Verify OTP</button>
          </>}

          {step === 3 && <>
            <Field label="New Password">
              <input type="password" value={pw1} onChange={e => setPw1(e.target.value)} placeholder="Minimum 6 characters"/>
            </Field>
            <Field label="Confirm New Password">
              <input type="password" value={pw2} onChange={e => setPw2(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && resetPw()}/>
            </Field>
            {err && <div className="notice n-err">{err}</div>}
            <button className="btn btn-primary btn-full" onClick={resetPw}>Update Password</button>
          </>}

          {step === 4 && <>
            <div className="notice n-ok" style={{justifyContent:'center', flexDirection:'column', textAlign:'center', padding:22, gap:4}}>
              <div style={{fontWeight:800, fontSize:15, fontFamily:'Plus Jakarta Sans'}}>Password updated!</div>
              <div style={{fontSize:13}}>You can now sign in with your new password.</div>
            </div>
            <button className="btn btn-primary btn-full" onClick={onBack}>Back to Login</button>
          </>}

          {step !== 4 && <div style={{textAlign:'center', marginTop:16, fontSize:13}}>
            <button className="btn-link" onClick={onBack}>← Back to Login</button>
          </div>}
        </div>
      </div>
    </div>
  );
}

function Topbar({ user, page, setPage, onLogout }) {
  const links = user.role === 'student'
    ? [['dashboard','Dashboard'],['submit','Submit Complaint'],['track','Track Status'],['profile','My Profile']]
    : [['dashboard','Dashboard']];

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark"><ShieldSVG size={16}/></div>
        <span className="brand-name">Grievance<span>Portal</span></span>
      </div>

      <nav className="nav">
        {links.map(([k,l]) => (
          <div key={k} className={`nav-item${page === k ? ' on' : ''}`} onClick={() => setPage(k)}>{l}</div>
        ))}
      </nav>

      <div className="topbar-end">
        <div className="t-avatar">{initials}</div>
        <div className="t-info">
          <div className="t-name">{user.name.split(' ')[0]}</div>
          <div className="t-role">{user.role === 'student' ? user.roll : user.dept}</div>
        </div>
        <button className="btn-signout" onClick={onLogout}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}

function Dashboard({ user, complaints, setPage }) {
  const mine     = complaints.filter(c => c.sRoll === user.roll);
  const active   = mine.filter(c => c.status !== 'Resolved' && c.status !== 'Rejected').length;
  const resolved = mine.filter(c => c.status === 'Resolved').length;
  const pending  = mine.filter(c => c.status === 'Submitted').length;

  const stats = [
    { num: mine.length, label: 'Total Filed',   color:'#4361ee', bg:'linear-gradient(135deg,#eef1ff,#e0e6ff)',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#4361ee" strokeWidth="1.8" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="#4361ee" strokeWidth="1.8" strokeLinejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="#4361ee" strokeWidth="1.8" strokeLinecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="#4361ee" strokeWidth="1.8" strokeLinecap="round"/></svg> },
    { num: pending,     label: 'Pending',        color:'#f59f00', bg:'linear-gradient(135deg,#fff9e6,#ffefc0)',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#f59f00" strokeWidth="1.8"/><polyline points="12 6 12 12 16 14" stroke="#f59f00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { num: active,      label: 'In Progress',    color:'#3b82f6', bg:'linear-gradient(135deg,#eff6ff,#dbeafe)',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round"/></svg> },
    { num: resolved,    label: 'Resolved',       color:'#06b77e', bg:'linear-gradient(135deg,#e8fdf4,#c5f5e2)',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#06b77e" strokeWidth="1.8" strokeLinecap="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="#06b77e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ];

  const statusBar = mine.length > 0 ? (resolved / mine.length) * 100 : 0;

  return (
    <div className="page" style={{maxWidth:800}}>

      {/* ── HERO GREETING ── */}
      <div style={{
        background:'linear-gradient(135deg, #0c1340 0%, #1a2d8f 60%, #0e1f6b 100%)',
        borderRadius:20, padding:'32px 36px', marginBottom:24, position:'relative', overflow:'hidden'
      }}>
        {/* background rings */}
        <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',border:'1.5px solid rgba(255,255,255,.07)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:-10,right:-10,width:100,height:100,borderRadius:'50%',border:'1px solid rgba(255,255,255,.05)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:-30,left:200,width:120,height:120,borderRadius:'50%',background:'radial-gradient(circle,rgba(86,207,238,.15) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'rgba(255,255,255,.5)',fontFamily:'Plus Jakarta Sans',marginBottom:8}}>Student Dashboard</div>
              <div style={{fontFamily:'Plus Jakarta Sans',fontSize:28,fontWeight:800,color:'#fff',letterSpacing:'-0.5px',lineHeight:1.2}}>
                Welcome back, <span style={{color:'#56cfee'}}>{user.name.split(' ')[0]}</span>
              </div>
              <div style={{fontSize:13,color:'rgba(255,255,255,.5)',marginTop:6,fontFamily:'Plus Jakarta Sans'}}>
                {user.roll} &nbsp;·&nbsp; {rollEmail(user.roll)}
              </div>
            </div>
            <div style={{display:'flex',gap:10,flexShrink:0}}>
              <button className="btn btn-primary" style={{background:'rgba(255,255,255,.15)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,.2)',fontSize:13,padding:'9px 18px'}} onClick={() => setPage('submit')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                New Complaint
              </button>
              <button className="btn btn-ghost" style={{background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.15)',color:'#fff',fontSize:13,padding:'9px 18px'}} onClick={() => setPage('track')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#fff" strokeWidth="1.8"/><path d="m21 21-4.35-4.35" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>
                Track
              </button>
            </div>
          </div>
          {/* Progress bar */}
          {mine.length > 0 && (
            <div style={{marginTop:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <span style={{fontSize:11.5,color:'rgba(255,255,255,.5)',fontFamily:'Plus Jakarta Sans',fontWeight:600}}>Resolution rate</span>
                <span style={{fontSize:11.5,color:'rgba(255,255,255,.7)',fontFamily:'Plus Jakarta Sans',fontWeight:700}}>{Math.round(statusBar)}%</span>
              </div>
              <div style={{height:5,background:'rgba(255,255,255,.1)',borderRadius:10,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${statusBar}%`,background:'linear-gradient(90deg,#56cfee,#4361ee)',borderRadius:10,transition:'width .5s ease'}}/>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
        {stats.map(s => (
          <div key={s.label} style={{
            background:'#fff', borderRadius:16, padding:'18px 20px',
            boxShadow:'0 2px 12px rgba(20,40,120,.07)', border:'1px solid rgba(255,255,255,.9)',
            transition:'transform .2s,box-shadow .2s', cursor:'default'
          }}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(20,40,120,.12)'}}
          onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 12px rgba(20,40,120,.07)'}}>
            <div style={{width:40,height:40,borderRadius:12,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14}}>{s.icon}</div>
            <div style={{fontFamily:'Plus Jakarta Sans',fontSize:32,fontWeight:800,color:s.color,lineHeight:1,letterSpacing:'-1.5px'}}>{s.num}</div>
            <div style={{fontSize:12,color:'#7b82a8',marginTop:5,fontWeight:600,fontFamily:'Plus Jakarta Sans'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── COMPLAINTS ── */}
      {mine.length > 0 ? (
        <div style={{background:'#fff',borderRadius:20,boxShadow:'0 2px 12px rgba(20,40,120,.07)',border:'1px solid rgba(255,255,255,.9)',overflow:'hidden'}}>
          <div style={{padding:'20px 24px 16px',borderBottom:'1px solid #f0f2fb',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontFamily:'Plus Jakarta Sans',fontSize:15,fontWeight:800,color:'var(--c-navy)',display:'flex',alignItems:'center',gap:9}}>
              <div style={{width:30,height:30,borderRadius:9,background:'rgba(67,97,238,.08)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="var(--c-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="var(--c-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              My Complaints
            </div>
            <span style={{fontSize:12,fontWeight:700,color:'var(--c-sub)',background:'#f0f2fb',padding:'3px 10px',borderRadius:20,fontFamily:'Plus Jakarta Sans'}}>{mine.length} total</span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#f8f9ff'}}>
                  <th style={{padding:'10px 24px',fontSize:10.5,fontWeight:800,color:'var(--c-sub)',textTransform:'uppercase',letterSpacing:'.7px',textAlign:'left',fontFamily:'Plus Jakarta Sans',whiteSpace:'nowrap',borderBottom:'1.5px solid #f0f2fb'}}>Ticket ID</th>
                  <th style={{padding:'10px 14px',fontSize:10.5,fontWeight:800,color:'var(--c-sub)',textTransform:'uppercase',letterSpacing:'.7px',textAlign:'left',fontFamily:'Plus Jakarta Sans',borderBottom:'1.5px solid #f0f2fb'}}>Title</th>
                  <th style={{padding:'10px 14px',fontSize:10.5,fontWeight:800,color:'var(--c-sub)',textTransform:'uppercase',letterSpacing:'.7px',textAlign:'left',fontFamily:'Plus Jakarta Sans',whiteSpace:'nowrap',borderBottom:'1.5px solid #f0f2fb'}}>Category</th>
                  <th style={{padding:'10px 14px',fontSize:10.5,fontWeight:800,color:'var(--c-sub)',textTransform:'uppercase',letterSpacing:'.7px',textAlign:'left',fontFamily:'Plus Jakarta Sans',whiteSpace:'nowrap',borderBottom:'1.5px solid #f0f2fb'}}>Date</th>
                  <th style={{padding:'10px 24px 10px 14px',fontSize:10.5,fontWeight:800,color:'var(--c-sub)',textTransform:'uppercase',letterSpacing:'.7px',textAlign:'left',fontFamily:'Plus Jakarta Sans',borderBottom:'1.5px solid #f0f2fb'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((c,i) => (
                  <tr key={c.id} style={{borderBottom: i<mine.length-1 ? '1px solid #f5f6fc' : 'none', transition:'background .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#fafbff'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={{padding:'14px 24px'}}>
                      <span style={{fontFamily:'monospace',fontWeight:800,color:'var(--c-blue)',fontSize:13,background:'#eef1ff',padding:'3px 8px',borderRadius:6}}>{c.id}</span>
                    </td>
                    <td style={{padding:'14px',fontWeight:600,color:'var(--c-navy)',maxWidth:240,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:13}} title={c.title}>{c.title}</td>
                    <td style={{padding:'14px'}}>
                      <span style={{background:'#f0f2fb',padding:'3px 10px',borderRadius:7,fontSize:12,fontWeight:700,color:'var(--c-ink)',fontFamily:'Plus Jakarta Sans'}}>{c.category}</span>
                    </td>
                    <td style={{padding:'14px',color:'var(--c-sub)',fontFamily:'monospace',fontSize:12}}>{c.date}</td>
                    <td style={{padding:'14px 24px 14px 14px'}}><Badge s={c.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{background:'#fff',borderRadius:20,boxShadow:'0 2px 12px rgba(20,40,120,.07)',padding:'52px 24px',textAlign:'center'}}>
          <div style={{width:64,height:64,borderRadius:20,background:'#f0f2fc',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#9ba3c8" strokeWidth="1.6" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="#9ba3c8" strokeWidth="1.6" strokeLinejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="#9ba3c8" strokeWidth="1.6" strokeLinecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="#9ba3c8" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </div>
          <div style={{fontFamily:'Plus Jakarta Sans',fontWeight:800,fontSize:16,color:'var(--c-navy)',marginBottom:6}}>No complaints yet</div>
          <div style={{fontSize:13.5,color:'var(--c-sub)'}}>Submit your first grievance and we'll route it to the right team.</div>
        </div>
      )}
    </div>
  );
}

function Submit({ user, complaints, setComplaints }) {
  const [form,    setForm]    = useState({ title:'', desc:'', category:'Hostel', anon:false });
  const [done,    setDone]    = useState(null);
  const [dup,     setDup]     = useState(false);
  const [showSug, setShowSug] = useState(false);
  const wrapRef = useRef(null);
  const sugg = getSugg(form.title, form.category);

  useEffect(() => {
    const fn = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSug(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  function upd(k, v) {
    setForm(f => ({...f, [k]: v}));
    if (k === 'title') {
      setDup(v.length > 5 && complaints.some(c => c.title.toLowerCase() === v.toLowerCase().trim()));
      setShowSug(true);
    }
  }

  function submit() {
    if (!form.title.trim() || !form.desc.trim()) { alert('Please fill all required fields.'); return; }
    const hd = hostelDept(form.title, form.desc);
    const assignedTo = form.category === 'Hostel' ? hd.dept : (DEPT_MAP[form.category] || 'Administrative Office');
    const c = {
      id: mkId(), title: form.title.trim(), desc: form.desc.trim(),
      category: form.category, status: 'Submitted', assignedTo,
      sRoll: user.roll, sName: form.anon ? 'Anonymous' : user.name,
      anon: form.anon, date: mkDate(),
      token: form.anon ? mkToken() : null, remarks: '',
    };
    setComplaints(p => [c, ...p]);
    setDone(c);
  }

  if (done) return (
    <div className="page">
      <div style={{background:'#fff',borderRadius:20,boxShadow:'0 2px 16px rgba(20,40,120,.07)',textAlign:'center',padding:'48px 40px'}}>
        <div style={{width:68,height:68,background:'linear-gradient(135deg,#e8fdf4,#c5f5e2)',border:'2px solid rgba(6,183,126,.25)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}>
          <svg width="30" height="30" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#06b77e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{fontFamily:'Plus Jakarta Sans',fontSize:24,fontWeight:800,color:'var(--c-navy)',marginBottom:6,letterSpacing:'-.5px'}}>Complaint Submitted!</div>
        <div style={{fontSize:14,color:'var(--c-sub)',marginBottom:28}}>Your grievance has been recorded and assigned to the right team.</div>
        <div style={{background:'linear-gradient(135deg,#f0f4ff,#e8edff)',border:'2px dashed rgba(67,97,238,.25)',borderRadius:16,padding:'20px 28px',marginBottom:24,display:'inline-block',minWidth:260}}>
          <div style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:1.2,color:'var(--c-sub)',fontFamily:'Plus Jakarta Sans',marginBottom:6}}>Your Ticket ID</div>
          <div style={{fontFamily:'monospace',fontSize:28,fontWeight:900,color:'var(--c-blue)',letterSpacing:2}}>{done.id}</div>
          <div style={{fontSize:11.5,color:'var(--c-sub)',marginTop:6}}>Save this ID to track your complaint</div>
        </div>
        {done.token && (
          <div style={{background:'#fffbeb',border:'1.5px solid #fde68a',borderRadius:12,padding:'14px 18px',margin:'0 0 20px',textAlign:'left'}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'#92400e',marginBottom:4,fontFamily:'Plus Jakarta Sans'}}>Anonymous Token</div>
            <div style={{fontFamily:'monospace',fontSize:20,fontWeight:800,color:'#b45309'}}>{done.token}</div>
            <div style={{fontSize:12,color:'#92400e',marginTop:3}}>Use this token to track your complaint without revealing your identity.</div>
          </div>
        )}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:24,textAlign:'left'}}>
          {[['Category',done.category],['Assigned To',done.assignedTo],['Status','Submitted'],['Date',done.date]].map(([k,v])=>(
            <div key={k} style={{background:'#f8f9ff',borderRadius:12,padding:'12px 16px',border:'1px solid #eef0fb'}}>
              <div style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.7px',color:'var(--c-sub)',marginBottom:3,fontFamily:'Plus Jakarta Sans'}}>{k}</div>
              <div style={{fontSize:13.5,fontWeight:700,color:'var(--c-navy)',fontFamily:'Plus Jakarta Sans'}}>{v}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={()=>setDone(null)}>Submit Another</button>
      </div>
    </div>
  );

  const assignLabel = form.category === 'Hostel'
    ? hostelDept(form.title, form.desc).label
    : (DEPT_MAP[form.category] || 'Administrative Office');

  const catColors = {Hostel:'#4361ee',Academic:'#06b77e',Exam:'#f59f00',Administrative:'#7c4dff',Library:'#0ea5c9',Other:'#6b7280'};

  return (
    <div className="page">
      {/* Page header */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'var(--c-blue)',fontFamily:'Plus Jakarta Sans',marginBottom:6}}>New Grievance</div>
        <h2 style={{fontFamily:'Plus Jakarta Sans',fontSize:26,fontWeight:800,color:'var(--c-navy)',letterSpacing:'-.5px',marginBottom:4}}>Submit a Complaint</h2>
        <p style={{fontSize:14,color:'var(--c-sub)'}}>Fill in the details and we'll route it to the right department automatically.</p>
      </div>

      <div style={{background:'#fff',borderRadius:20,boxShadow:'0 2px 16px rgba(20,40,120,.07)',padding:'28px 32px'}}>
        {/* Title field */}
        <div ref={wrapRef} className="field" style={{position:'relative'}}>
          <label>Complaint Title <span className="req">*</span></label>
          <input type="text" value={form.title} onChange={e=>upd('title',e.target.value)} onFocus={()=>setShowSug(true)}
            placeholder="Brief title describing your issue" autoComplete="off"/>
          {showSug && sugg.length > 0 && (
            <div className="sug-box">
              {sugg.map(s=><div key={s.text} className="sug-item" onMouseDown={()=>{setForm(f=>({...f,title:s.text}));setShowSug(false);setDup(false);}}>{s.text}</div>)}
            </div>
          )}
        </div>
        {dup && <div className="notice n-warn" style={{marginTop:-10,marginBottom:14}}>A similar complaint already exists. You may still proceed if it's a different issue.</div>}

        <Field label="Description" req>
          <textarea value={form.desc} onChange={e=>upd('desc',e.target.value)}
            placeholder="Describe your issue in detail — include location, dates, or any relevant context…"/>
        </Field>

        {/* Category pills */}
        <div className="field">
          <label>Category</label>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:4}}>
            {['Hostel','Academic','Exam','Administrative','Library','Other'].map(cat=>(
              <button key={cat} onClick={()=>upd('category',cat)} style={{
                padding:'7px 16px',borderRadius:10,border:'1.5px solid',fontSize:13,fontWeight:700,cursor:'pointer',transition:'all .15s',fontFamily:'Plus Jakarta Sans',
                borderColor: form.category===cat ? catColors[cat] : '#e2e6f0',
                background:  form.category===cat ? `${catColors[cat]}15` : '#f8f9ff',
                color:       form.category===cat ? catColors[cat] : 'var(--c-sub)',
              }}>{cat}</button>
            ))}
          </div>
        </div>

        {/* Routing banner */}
        <div style={{background:'linear-gradient(135deg,#f0f4ff,#e8edff)',border:'1.5px solid rgba(67,97,238,.18)',borderRadius:14,padding:'14px 18px',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--c-blue)" strokeWidth="1.8"/><line x1="12" y1="8" x2="12" y2="12" stroke="var(--c-blue)" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="16" r="1" fill="var(--c-blue)"/></svg>
            <span style={{fontSize:12,fontWeight:700,color:'var(--c-blue)',fontFamily:'Plus Jakarta Sans'}}>Will be assigned to: <strong>{assignLabel}</strong></span>
          </div>
          <div style={{fontSize:11.5,color:'#5a6bc4',fontFamily:'Plus Jakarta Sans'}}>
            {form.category==='Hostel'       && 'Caretaker → Hostel Warden → Deputy Chief Warden → Chief Warden → Registrar'}
            {form.category==='Academic'     && 'Academic Committee → HOD → Dean of Academics'}
            {form.category==='Exam'         && 'Deputy COE → COE → Dean of Academics'}
            {form.category==='Library'      && 'Librarian → Chief Librarian → Administrative Office'}
            {form.category==='Administrative'&&'Administrative Office → Registrar'}
          </div>
        </div>

        {/* Anonymous toggle */}
        <label style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer',marginBottom:28,padding:'14px 16px',background:'#f8f9ff',borderRadius:12,border:'1.5px solid #e2e6f0'}}>
          <input type="checkbox" checked={form.anon} onChange={e=>upd('anon',e.target.checked)} style={{width:16,height:16}}/>
          <div>
            <div style={{fontSize:13.5,fontWeight:700,color:'var(--c-navy)',fontFamily:'Plus Jakarta Sans'}}>Submit anonymously</div>
            <div style={{fontSize:12,color:'var(--c-sub)'}}>Your name stays hidden — you'll receive a private tracking token</div>
          </div>
        </label>

        <button className="btn btn-primary" onClick={submit} style={{width:'100%',padding:'13px',fontSize:15}}>Submit Complaint →</button>
      </div>
    </div>
  );
}

function Track({ complaints }) {
  const [q,   setQ]   = useState('');
  const [res, setRes] = useState(null);
  const [nf,  setNf]  = useState(false);

  function doTrack() {
    const f = complaints.find(c =>
      c.id.toUpperCase() === q.trim().toUpperCase() ||
      (c.token && c.token.toUpperCase() === q.trim().toUpperCase())
    );
    f ? (setRes(f), setNf(false)) : (setRes(null), setNf(true));
  }

  const statusColor = { Submitted:'#4361ee', 'Under Review':'#f59f00', Resolved:'#06b77e', Rejected:'#f03e3e', Escalated:'#7c4dff' };

  return (
    <div className="page">
      {/* Header */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'var(--c-blue)',fontFamily:'Plus Jakarta Sans',marginBottom:6}}>Status Check</div>
        <h2 style={{fontFamily:'Plus Jakarta Sans',fontSize:26,fontWeight:800,color:'var(--c-navy)',letterSpacing:'-.5px',marginBottom:4}}>Track Your Complaint</h2>
        <p style={{fontSize:14,color:'var(--c-sub)'}}>Enter your Ticket ID or anonymous token to view the current status.</p>
      </div>

      {/* Search box */}
      <div style={{background:'#fff',borderRadius:20,padding:'24px 28px',boxShadow:'0 2px 16px rgba(20,40,120,.07)',marginBottom:20}}>
        <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
          <div style={{flex:1,position:'relative'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}><circle cx="11" cy="11" r="8" stroke="#9ba3c8" strokeWidth="1.8"/><path d="m21 21-4.35-4.35" stroke="#9ba3c8" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <input type="text" value={q} onChange={e=>setQ(e.target.value)}
              placeholder="e.g. GRV1032 or anonymous token A93F2"
              style={{paddingLeft:42,marginBottom:0}}
              onKeyDown={e=>e.key==='Enter'&&doTrack()}/>
          </div>
          <button className="btn btn-primary" style={{flexShrink:0,padding:'11px 24px'}} onClick={doTrack}>Track →</button>
        </div>
        {nf && (
          <div style={{marginTop:14,padding:'11px 14px',background:'#fff5f5',border:'1.5px solid #fecaca',borderRadius:10,fontSize:13,color:'#b91c1c',fontWeight:500}}>
            No complaint found with that Ticket ID or Token. Please double-check and try again.
          </div>
        )}
      </div>

      {/* Result */}
      {res && (
        <div style={{background:'#fff',borderRadius:20,boxShadow:'0 2px 16px rgba(20,40,120,.07)',overflow:'hidden'}}>
          {/* status strip */}
          <div style={{height:4,background:`linear-gradient(90deg,${statusColor[res.status]||'#4361ee'},transparent)`}}/>
          <div style={{padding:'24px 28px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,flexWrap:'wrap',gap:10}}>
              <span style={{fontFamily:'monospace',fontSize:20,fontWeight:800,color:'var(--c-blue)',background:'#eef1ff',padding:'4px 12px',borderRadius:8}}>{res.id}</span>
              <Badge s={res.status}/>
            </div>
            <div style={{fontFamily:'Plus Jakarta Sans',fontSize:18,fontWeight:800,color:'var(--c-navy)',marginBottom:6,letterSpacing:'-.3px'}}>{res.title}</div>
            <p style={{fontSize:13.5,color:'var(--c-sub)',marginBottom:20,lineHeight:1.7}}>{res.desc}</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              {[['Category',res.category],['Assigned To',res.assignedTo],['Filed By',res.sName],['Date',res.date]].map(([k,v])=>(
                <div key={k} style={{background:'#f8f9ff',borderRadius:12,padding:'12px 16px',border:'1px solid #eef0fb'}}>
                  <div style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.7px',color:'var(--c-sub)',marginBottom:4,fontFamily:'Plus Jakarta Sans'}}>{k}</div>
                  <div style={{fontSize:13.5,fontWeight:700,color:'var(--c-navy)',fontFamily:'Plus Jakarta Sans'}}>{v}</div>
                </div>
              ))}
            </div>
            {res.remarks && (
              <div style={{background:'#e8fdf4',border:'1.5px solid rgba(6,183,126,.25)',borderRadius:12,padding:'12px 16px',fontSize:13.5,color:'#047a55'}}>
                <strong style={{fontFamily:'Plus Jakarta Sans'}}>Authority Remarks:</strong> {res.remarks}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Profile({ user }) {
  const [old, setOld] = useState('');
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  function doChange() {
    if (old !== user.password)  { setErr('Current password is incorrect.'); setMsg(''); return; }
    if (pw1.length < 6)          { setErr('Minimum 6 characters required.');  setMsg(''); return; }
    if (pw1 !== pw2)             { setErr('Passwords do not match.');          setMsg(''); return; }
    user.password = pw1;
    setOld(''); setPw1(''); setPw2('');
    setErr(''); setMsg('Password updated successfully.');
  }

  const initials = user.name.split(' ').map(n=>n[0]).join('').slice(0,2);

  return (
    <div className="page">
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'var(--c-blue)',fontFamily:'Plus Jakarta Sans',marginBottom:6}}>Account</div>
        <h2 style={{fontFamily:'Plus Jakarta Sans',fontSize:26,fontWeight:800,color:'var(--c-navy)',letterSpacing:'-.5px'}}>My Profile</h2>
      </div>

      {/* Account card */}
      <div style={{background:'#fff',borderRadius:20,boxShadow:'0 2px 16px rgba(20,40,120,.07)',overflow:'hidden',marginBottom:18}}>
        {/* banner — avatar lives inside, bottom-left */}
        <div style={{height:130,background:'linear-gradient(135deg,#0c1340 0%,#1a2d8f 60%,#0e1f6b 100%)',position:'relative',overflow:'hidden',display:'flex',alignItems:'flex-end',padding:'0 28px 20px'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',border:'1.5px solid rgba(255,255,255,.07)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',top:15,right:70,width:90,height:90,borderRadius:'50%',border:'1px solid rgba(255,255,255,.04)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:-30,left:200,width:110,height:110,borderRadius:'50%',background:'radial-gradient(circle,rgba(86,207,238,.1) 0%,transparent 70%)',pointerEvents:'none'}}/>
          {/* avatar sits cleanly inside banner */}
          <div style={{
            width:60,height:60,borderRadius:'50%',flexShrink:0,
            background:'linear-gradient(140deg,#56cfee,#3451d1)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontFamily:'Plus Jakarta Sans',fontWeight:800,fontSize:18,color:'#fff',
            boxShadow:'0 4px 16px rgba(0,0,0,.3)',
            border:'2.5px solid rgba(255,255,255,.3)',
            marginRight:14, position:'relative', zIndex:1,
          }}>{initials}</div>
          <div style={{position:'relative',zIndex:1}}>
            <div style={{fontFamily:'Plus Jakarta Sans',fontSize:16,fontWeight:800,color:'#fff',lineHeight:1.2}}>{user.name}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.55)',marginTop:2}}>{rollEmail(user.roll)}</div>
          </div>
        </div>
        {/* info grid below banner */}
        <div style={{padding:'22px 28px 28px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[['Full Name',user.name],['Roll Number',user.roll],['Email Address',rollEmail(user.roll)],['Role',user.role==='student'?'Student':'Authority']].map(([k,v])=>(
              <div key={k} style={{background:'#f8f9ff',borderRadius:12,padding:'13px 16px',border:'1px solid #eef0fb'}}>
                <div style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.7px',color:'var(--c-sub)',marginBottom:4,fontFamily:'Plus Jakarta Sans'}}>{k}</div>
                <div style={{fontSize:13.5,fontWeight:700,color:'var(--c-navy)',fontFamily:'Plus Jakarta Sans',wordBreak:'break-all'}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Change password */}
      <div style={{background:'#fff',borderRadius:20,boxShadow:'0 2px 16px rgba(20,40,120,.07)',padding:'28px 32px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:24,paddingBottom:16,borderBottom:'1.5px solid #f0f2fb'}}>
          <div style={{width:36,height:36,borderRadius:10,background:'rgba(245,159,0,.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#f59f00" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#f59f00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{fontFamily:'Plus Jakarta Sans',fontWeight:800,fontSize:15,color:'var(--c-navy)'}}>Change Password</div>
        </div>
        <Field label="Current Password">
          <input type="password" value={old} onChange={e=>setOld(e.target.value)} placeholder="Enter current password"/>
        </Field>
        <Field label="New Password">
          <input type="password" value={pw1} onChange={e=>setPw1(e.target.value)} placeholder="Minimum 6 characters"/>
        </Field>
        <Field label="Confirm New Password">
          <input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="Re-enter new password"/>
        </Field>
        {err && <div className="notice n-err">{err}</div>}
        {msg && <div className="notice n-ok">{msg}</div>}
        <button className="btn btn-primary" style={{width:'100%',padding:'13px'}} onClick={doChange}>Update Password →</button>
      </div>
    </div>
  );
}

function AuthDash({ user, complaints, setComplaints }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [rFor,   setRFor]   = useState(null);
  const [rTxt,   setRTxt]   = useState('');

  const mine = complaints.filter(c => c.assignedTo === user.dept);
  const list = mine.filter(c =>
    (filter === 'All' || c.status === filter) &&
    (!search || [c.id, c.title, c.sName].some(x => x.toLowerCase().includes(search.toLowerCase())))
  );

  const setStatus = (id, status) => setComplaints(p => p.map(c => c.id === id ? {...c, status} : c));
  const saveRemark = id => {
    setComplaints(p => p.map(c => c.id === id ? {...c, remarks: rTxt} : c));
    setRFor(null); setRTxt('');
  };

  const total     = mine.length;
  const newCount  = mine.filter(c=>c.status==='Submitted').length;
  const inReview  = mine.filter(c=>c.status==='Under Review').length;
  const resolved  = mine.filter(c=>c.status==='Resolved').length;
  const resRate   = total > 0 ? Math.round((resolved/total)*100) : 0;

  const stats = [
    { num:total,    label:'Total',     color:'#4361ee', bg:'linear-gradient(135deg,#eef1ff,#dde3ff)',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#4361ee" strokeWidth="1.8" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="#4361ee" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
    { num:newCount, label:'New',       color:'#0ea5c9', bg:'linear-gradient(135deg,#ecfeff,#cffafe)',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#0ea5c9" strokeWidth="1.8"/><line x1="12" y1="8" x2="12" y2="16" stroke="#0ea5c9" strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="12" x2="16" y2="12" stroke="#0ea5c9" strokeWidth="1.8" strokeLinecap="round"/></svg> },
    { num:inReview, label:'In Review', color:'#f59f00', bg:'linear-gradient(135deg,#fff9e6,#ffefc0)',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#f59f00" strokeWidth="1.8"/><path d="m21 21-4.35-4.35" stroke="#f59f00" strokeWidth="1.8" strokeLinecap="round"/></svg> },
    { num:resolved, label:'Resolved',  color:'#06b77e', bg:'linear-gradient(135deg,#e8fdf4,#c5f5e2)',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#06b77e" strokeWidth="1.8" strokeLinecap="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="#06b77e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ];

  const initials = user.name.split(' ').map(n=>n[0]).join('').slice(0,2);

  return (
    <div className="page-lg">

      {/* ── HERO ── */}
      <div style={{
        background:'linear-gradient(135deg,#0c1340 0%,#1a2d8f 55%,#0e1f6b 100%)',
        borderRadius:20, padding:'28px 32px', marginBottom:24, position:'relative', overflow:'hidden'
      }}>
        <div style={{position:'absolute',top:-50,right:-50,width:200,height:200,borderRadius:'50%',border:'1.5px solid rgba(255,255,255,.06)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:-40,left:180,width:140,height:140,borderRadius:'50%',background:'radial-gradient(circle,rgba(86,207,238,.12) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
          <div>
            <div style={{fontSize:10.5,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'rgba(255,255,255,.45)',fontFamily:'Plus Jakarta Sans',marginBottom:6}}>Authority Panel</div>
            <div style={{fontFamily:'Plus Jakarta Sans',fontSize:24,fontWeight:800,color:'#fff',letterSpacing:'-.5px'}}>
              {user.dept}
            </div>
            <div style={{fontSize:12.5,color:'rgba(255,255,255,.5)',marginTop:5,fontFamily:'Plus Jakarta Sans'}}>
              {user.name} &nbsp;·&nbsp; {user.roll}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:11,color:'rgba(255,255,255,.45)',fontFamily:'Plus Jakarta Sans',marginBottom:3}}>Resolution rate</div>
              <div style={{fontFamily:'Plus Jakarta Sans',fontSize:22,fontWeight:800,color:'#56cfee'}}>{resRate}%</div>
            </div>
            <div style={{width:52,height:52,borderRadius:'50%',background:'rgba(255,255,255,.1)',border:'2px solid rgba(86,207,238,.3)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Plus Jakarta Sans',fontWeight:800,fontSize:16,color:'#56cfee'}}>
              {initials}
            </div>
          </div>
        </div>
        {/* mini progress */}
        <div style={{marginTop:18,position:'relative',zIndex:1}}>
          <div style={{height:4,background:'rgba(255,255,255,.1)',borderRadius:10,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${resRate}%`,background:'linear-gradient(90deg,#56cfee,#4361ee)',borderRadius:10,transition:'width .6s ease'}}/>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
        {stats.map(s=>(
          <div key={s.label} style={{background:'#fff',borderRadius:16,padding:'18px 20px',boxShadow:'0 2px 12px rgba(20,40,120,.07)',border:'1px solid rgba(255,255,255,.9)',transition:'transform .2s,box-shadow .2s',cursor:'default'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(20,40,120,.12)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 12px rgba(20,40,120,.07)'}}>
            <div style={{width:40,height:40,borderRadius:12,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14}}>{s.icon}</div>
            <div style={{fontFamily:'Plus Jakarta Sans',fontSize:32,fontWeight:800,color:s.color,lineHeight:1,letterSpacing:'-1.5px'}}>{s.num}</div>
            <div style={{fontSize:12,color:'#7b82a8',marginTop:5,fontWeight:600,fontFamily:'Plus Jakarta Sans'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── COMPLAINTS TABLE ── */}
      <div style={{background:'#fff',borderRadius:20,boxShadow:'0 2px 16px rgba(20,40,120,.07)',overflow:'hidden'}}>
        {/* toolbar */}
        <div style={{padding:'18px 24px',borderBottom:'1px solid #f0f2fb',display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
          <div style={{position:'relative',flex:1,minWidth:200}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}><circle cx="11" cy="11" r="8" stroke="#9ba3c8" strokeWidth="1.8"/><path d="m21 21-4.35-4.35" stroke="#9ba3c8" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search ticket ID, title or student…"
              style={{paddingLeft:36,marginBottom:0,maxWidth:300,background:'#f8f9ff'}}/>
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {['All','Submitted','Under Review','Resolved','Rejected','Escalated'].map(s=>(
              <button key={s} className={`chip${filter===s?' on':''}`} onClick={()=>setFilter(s)} style={{fontSize:11.5}}>{s}</button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <div style={{textAlign:'center',padding:'52px 20px'}}>
            <div style={{width:56,height:56,borderRadius:16,background:'#f0f2fc',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#9ba3c8" strokeWidth="1.6" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="#9ba3c8" strokeWidth="1.6" strokeLinejoin="round"/></svg>
            </div>
            <div style={{fontFamily:'Plus Jakarta Sans',fontWeight:800,fontSize:15,color:'var(--c-navy)',marginBottom:5}}>No complaints found</div>
            <div style={{fontSize:13,color:'var(--c-sub)'}}>Try adjusting your search or filter criteria.</div>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#f8f9ff'}}>
                  {['Ticket ID','Title','Category','Student','Date','Status','Actions'].map(h=>(
                    <th key={h} style={{padding:'10px 16px',fontSize:10.5,fontWeight:800,color:'var(--c-sub)',textTransform:'uppercase',letterSpacing:'.7px',textAlign:'left',fontFamily:'Plus Jakarta Sans',borderBottom:'1.5px solid #eef0fb',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((c,i)=>(
                  <React.Fragment key={c.id}>
                    <tr style={{borderBottom:i<list.length-1?'1px solid #f5f6fc':'none',transition:'background .15s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#fafbff'}
                      onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td style={{padding:'13px 16px'}}>
                        <span style={{fontFamily:'monospace',fontWeight:800,color:'var(--c-blue)',fontSize:12.5,background:'#eef1ff',padding:'3px 8px',borderRadius:6}}>{c.id}</span>
                      </td>
                      <td style={{padding:'13px 16px',fontWeight:600,color:'var(--c-navy)',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:13}} title={c.title}>{c.title}</td>
                      <td style={{padding:'13px 16px'}}>
                        <span style={{background:'#f0f2fb',padding:'3px 10px',borderRadius:7,fontSize:11.5,fontWeight:700,color:'var(--c-ink)',fontFamily:'Plus Jakarta Sans'}}>{c.category}</span>
                      </td>
                      <td style={{padding:'13px 16px',color:'var(--c-sub)',fontSize:13,fontWeight:500}}>{c.sName}</td>
                      <td style={{padding:'13px 16px',color:'var(--c-sub)',fontFamily:'monospace',fontSize:11.5}}>{c.date}</td>
                      <td style={{padding:'13px 16px'}}><Badge s={c.status}/></td>
                      <td style={{padding:'13px 16px'}}>
                        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                          {c.status==='Submitted'                              && <button className="ab ab-gray"   onClick={()=>setStatus(c.id,'Under Review')}>Review</button>}
                          {c.status!=='Resolved'&&c.status!=='Rejected'        && <button className="ab ab-green"  onClick={()=>setStatus(c.id,'Resolved')}>Resolve</button>}
                          {c.status!=='Rejected'&&c.status!=='Resolved'        && <button className="ab ab-red"    onClick={()=>setStatus(c.id,'Rejected')}>Reject</button>}
                          {c.status==='Under Review'                           && <button className="ab ab-purple" onClick={()=>setStatus(c.id,'Escalated')}>Escalate</button>}
                          <button className="ab ab-gray" onClick={()=>{setRFor(rFor===c.id?null:c.id);setRTxt(c.remarks);}}>Remark</button>
                        </div>
                      </td>
                    </tr>
                    {rFor===c.id&&(
                      <tr>
                        <td colSpan={7} style={{padding:0,background:'#f8f9ff',borderBottom:'1px solid var(--c-line)'}}>
                          <div style={{padding:'12px 16px'}}>
                            <div style={{display:'flex',gap:8,alignItems:'center'}}>
                              <input type="text" value={rTxt} onChange={e=>setRTxt(e.target.value)} placeholder="Write authority remark…" style={{flex:1,marginBottom:0}}/>
                              <button className="ab ab-green" style={{flexShrink:0}} onClick={()=>saveRemark(c.id)}>Save</button>
                              <button className="ab ab-gray"  style={{flexShrink:0}} onClick={()=>setRFor(null)}>Cancel</button>
                            </div>
                            {c.remarks&&<div style={{fontSize:11.5,color:'var(--c-sub)',marginTop:7}}>Current: <em>"{c.remarks}"</em></div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [screen,     setScreen]     = useState('login');
  const [user,       setUser]       = useState(null);
  const [page,       setPage]       = useState('dashboard');
  const [complaints, setComplaints] = useState(SEED);

  if (screen === 'login')  return <Login onLogin={u => { setUser(u); setScreen('app'); setPage('dashboard'); }} onForgot={() => setScreen('forgot')}/>;
  if (screen === 'forgot') return <Forgot onBack={() => setScreen('login')}/>;

  return (
    <div className="app-body">
      <Topbar user={user} page={page} setPage={setPage} onLogout={() => { setUser(null); setScreen('login'); }}/>
      {user.role === 'student' && page === 'dashboard' && <Dashboard user={user} complaints={complaints} setPage={setPage}/>}
      {user.role === 'student' && page === 'submit'    && <Submit    user={user} complaints={complaints} setComplaints={setComplaints}/>}
      {user.role === 'student' && page === 'track'     && <Track     complaints={complaints}/>}
      {user.role === 'student' && page === 'profile'   && <Profile   user={user}/>}
      {user.role === 'authority'                       && <AuthDash  user={user} complaints={complaints} setComplaints={setComplaints}/>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
