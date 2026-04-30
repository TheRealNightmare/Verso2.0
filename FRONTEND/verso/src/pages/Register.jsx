import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ name, email, password });
      navigate('/');
    } catch (err) {
      if (err.errors) {
        const firstError = Object.values(err.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(err.message ?? 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">Get started</p>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Be a worm</p>

        {error && <p className="auth-error">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="register-name" className="auth-label">Full name</label>
          <input
            id="register-name"
            type="text"
            placeholder="Peter Parker"
            className="auth-input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label htmlFor="register-email" className="auth-label">Email</label>
          <input
            id="register-email"
            type="email"
            placeholder="you@example.com"
            className="auth-input"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="register-password" className="auth-label">Password</label>
          <input
            id="register-password"
            type="password"
            placeholder="Create a password"
            className="auth-input"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch-text">
          Already have an account? <Link to="/login" className="auth-switch-link">Sign in</Link>
        </p>
      </div>
    </section>
  );
}

export default Register;
