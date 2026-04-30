import { Link } from 'react-router-dom';

function Login() {
  return (
    <section className="auth-page">
      <div className="auth-card">
        
        <h1 className="auth-title">Welcome Book Worm</h1>
        <p className="auth-subtitle">Log in to your account</p>

        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="login-email" className="auth-label">Email</label>
          <input id="login-email" type="email" placeholder="you@example.com" className="auth-input" required />

          <label htmlFor="login-password" className="auth-label">Password</label>
          <input id="login-password" type="password" placeholder="Enter your password" className="auth-input" required />

          <button type="submit" className="auth-submit">Log In</button>
        </form>

        <p className="auth-switch-text">
          New here? <Link to="/register" className="auth-switch-link">Create an account</Link>
        </p>
      </div>
    </section>
  );
}

export default Login;
