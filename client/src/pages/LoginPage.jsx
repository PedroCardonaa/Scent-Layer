import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { useApp } from '../context/AppContext.jsx';

export function LoginPage() {
  const { login, user } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { document.body.classList.add('dark'); return () => document.body.classList.remove('dark'); }, []);
  useEffect(() => { if (user) navigate('/profile', { replace: true }); }, [user, navigate]);

  async function submit(e) {
    e.preventDefault();
    setError(null); setSubmitting(true);
    try {
      await login(email, password);
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Nav theme="dark" />
      <div className="auth-page">
        <form className="auth-card" onSubmit={submit}>
          <p className="auth-eyebrow">Welcome back</p>
          <h1 className="auth-title">Sign in to your<br/><em>profile.</em></h1>
          <p className="auth-sub">Your wishlist, quiz result, and source history live in your account.</p>
          {error && <div className="auth-error">{error}</div>}
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input className="auth-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="current-password" />
          </div>
          <button type="submit" className="auth-submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign In'}</button>
          <p className="auth-switch">New here? <Link to="/signup">Create an account</Link></p>
        </form>
      </div>
    </>
  );
}
