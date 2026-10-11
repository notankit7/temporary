import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Droplets, Sprout, ArrowLeft } from 'lucide-react';
import { login, saveSession } from '../services/api';

const Login = ({ setAuth }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !pass) { setError('Please fill all fields'); return; }
    setError('');
    setLoading(true);
    try {
      saveSession(await login(email, pass));
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

      <div className="auth-card liquid-glass">
        <div className="auth-header">
          <Droplets color="var(--primary)" size={44} />
          <h1>AgriSense</h1>
          <p>Smart Irrigation Advisory System</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          {error && <div style={{color:'var(--danger)',fontSize:'0.85rem',textAlign:'center'}}>{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} />
          </div>
          <button type="submit" className="btn auth-btn" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>

      <div className="bg-shape shape-1"><Sprout size={140} color="rgba(21,128,61,0.10)" /></div>
      <div className="bg-shape shape-2"><Droplets size={180} color="rgba(202,138,4,0.10)" /></div>
    </div>
  );
};

export default Login;
