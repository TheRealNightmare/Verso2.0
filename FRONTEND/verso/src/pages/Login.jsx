import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err.message ?? 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">

        <h1 className="auth-title">Welcome Book Worm</h1>
        <p className="auth-subtitle">Log in to your account</p>

        {error && <p className="auth-error">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email" className="auth-label">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            className="auth-input"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="login-password" className="auth-label">Password</label>
          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            className="auth-input"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="auth-switch-text">
          New here? <Link to="/register" className="auth-switch-link">Create an account</Link>
        </p>
      </div>
    </section>
  );
}

export default Login;
