import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Droplets, Sprout, ArrowLeft } from 'lucide-react';
import { register, saveSession } from '../services/api';

const today = new Date().toISOString().slice(0, 10);

const Register = ({ setAuth }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'', location:'', crop:'sugarcane', sowingDate:today });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(prev => ({...prev, [key]: val}));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError('Please fill all fields'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 4) { setError('Password must be at least 4 characters'); return; }
    setError('');
    setLoading(true);
    try {
      const { confirm: _confirm, ...payload } = form;
      saveSession(await register(payload));
      if (setAuth) setAuth(true);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Link to="/" className="auth-back-link"><ArrowLeft size={15} /> Back to home</Link>

      <div className="auth-card liquid-glass" style={{ maxWidth: '480px' }}>
        <div className="auth-header">
          <Droplets color="var(--primary)" size={36} />
          <h2>Create Account</h2>
          <p>Join AgriSense to manage your farm</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          {error && <div style={{color:'var(--danger)',fontSize:'0.85rem',textAlign:'center'}}>{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="Your name" value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Create password" value={form.password} onChange={e => update('password', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" placeholder="Confirm password" value={form.confirm} onChange={e => update('confirm', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Farm Location</label>
            <input type="text" placeholder="e.g. Pune, Maharashtra" value={form.location} onChange={e => update('location', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Crop Type</label>
              <select value={form.crop} onChange={e => update('crop', e.target.value)}>
                <option value="sugarcane">Sugarcane</option>
                <option value="wheat">Wheat</option>
                <option value="cotton">Cotton</option>
                <option value="rice">Rice</option>
              </select>
            </div>
            <div className="form-group">
              <label>Sowing Date</label>
              <input type="date" max={today} value={form.sowingDate} onChange={e => update('sowingDate', e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn auth-btn" disabled={loading}>{loading ? 'Creating account…' : 'Register'}</button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>

      <div className="bg-shape shape-1"><Sprout size={140} color="rgba(21,128,61,0.10)" /></div>
      <div className="bg-shape shape-2"><Droplets size={180} color="rgba(202,138,4,0.10)" /></div>
    </div>
  );
};

export default Register;
