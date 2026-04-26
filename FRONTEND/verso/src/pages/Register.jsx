import { Link } from 'react-router-dom';

function Register() {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">Get started</p>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Be a worm</p>

        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="register-name" className="auth-label">Full name</label>
          <input id="register-name" type="text" placeholder="Peter Parker" className="auth-input" required />

          <label htmlFor="register-email" className="auth-label">Email</label>
          <input id="register-email" type="email" placeholder="you@example.com" className="auth-input" required />

          <label htmlFor="register-password" className="auth-label">Password</label>
          <input id="register-password" type="password" placeholder="Create a password" className="auth-input" required />

          <button type="submit" className="auth-submit">Create Account</button>
        </form>

        <p className="auth-switch-text">
          Already have an account? <Link to="/login" className="auth-switch-link">Sign in</Link>
        </p>
      </div>
    </section>
  );
}

export default Register;
