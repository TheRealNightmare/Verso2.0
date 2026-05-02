import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="login-logo-wrapper">
          <BookOpen
            size={80}
            color="#5b7c99"
            strokeWidth={1}
          />
        </div>

        <h1 className="login-title">Welcome book worm</h1>

        <button className="google-login">
          <img
            src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
            alt="Google"
            className="google-icon"
          />
          Log in using Google
        </button>

        <div className="divider">
          <span>Or</span>
        </div>

        {error && <p className="auth-error-msg">{error}</p>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="email@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {showPassword
                ? <Eye size={18} className="eye-icon" onClick={() => setShowPassword(false)} />
                : <EyeOff size={18} className="eye-icon" onClick={() => setShowPassword(true)} />
              }
            </div>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="forgot-link">Forgot password?</a>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Start your Journey'}
          </button>
        </form>

        <p className="register-text">
          Dont have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
