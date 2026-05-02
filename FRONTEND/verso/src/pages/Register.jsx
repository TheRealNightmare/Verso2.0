import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeOff, Undo2 } from 'lucide-react';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevents page reload
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Ensure backend dev's register function receives the right object keys
      await register({ name, email, password });
      navigate('/'); 
    } catch (err) {
      console.error("Registration Error:", err);
      if (err.errors) {
        const firstError = Object.values(err.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card reg-card">
        
        {/* Top Undo Icon */}
        <div className="reg-undo-wrapper">
          <Undo2 
            size={32} 
            className="undo-icon" 
            onClick={() => navigate('/login')} 
          />
        </div>

        <h1 className="reg-title">Registration</h1>
        <p className="reg-subtitle">Be a worm</p>

        {error && <p className="auth-error-msg">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form-wrapper">
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Username"
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
              <EyeOff size={18} className="eye-icon" />
            </div>
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <div className="password-wrapper">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
              />
              <EyeOff size={18} className="eye-icon" />
            </div>
          </div>

          <button 
            type="submit" 
            className="login-submit-btn" 
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>

        <p className="register-text">
          already have an account? <Link to="/login">Signup</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;