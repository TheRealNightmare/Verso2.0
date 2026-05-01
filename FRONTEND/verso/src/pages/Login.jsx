import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/');
  };

  

  return (
    <div className="login-container">
      <div className="login-card">
        
        <div className="login-logo-wrapper">
          <BookOpen 
            size={80} 
            color="#5b7c99"    /* The dark blue color */
            strokeWidth={1}    /* This makes the lines thick like your logo */
            /* Do NOT use fill if you want the pages to stay white/transparent */
          />
        </div>
        
        <h1 className="login-title">Welcome book worm</h1>

        {/* FIX: Use a reliable Google Icon URL */}
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

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="email@example.com" required />
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input type="password" required />
              <EyeOff size={18} className="eye-icon" />
            </div>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="forgot-link">Forgot password?</a>
          </div>

          <button type="submit" className="login-submit-btn">
            Start your Journey
          </button>
        </form>

        <p className="register-text">
          Dont have an account? <a href="#">Register</a>
        </p>
      </div>
    </div>
  );
};

export default Login;