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

  const inputCls =
    'w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5b7c99]/30';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f6f2] px-4 py-10">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-md">
        <div className="flex justify-center mb-6">
          <BookOpen size={80} color="#5b7c99" strokeWidth={1} />
        </div>

        <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">Welcome book worm</h1>

        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 mb-5"
        >
          <img
            src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Log in using Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400">Or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {error && (
          <p className="mb-4 px-3 py-2 rounded-md bg-red-50 text-sm text-red-600">{error}</p>
        )}

        <form onSubmit={handleLogin}>
          <div className="flex flex-col gap-1 mb-4">
            <label className="text-sm text-slate-600">Email</label>
            <input
              type="email"
              placeholder="email@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1 mb-4">
            <label className="text-sm text-slate-600">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls} pr-10`}
              />
              {showPassword ? (
                <Eye
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <EyeOff
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-5 text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input type="checkbox" className="rounded" /> Remember me
            </label>
            <a href="#" className="text-[#5b7c99] hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#5b7c99] text-white font-medium hover:bg-[#4a6a85] disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Start your Journey'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          Dont have an account?{' '}
          <Link to="/register" className="text-[#5b7c99] hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
