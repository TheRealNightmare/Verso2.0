import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Undo2 } from 'lucide-react';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register({ name, email, password });
      navigate('/');
    } catch (err) {
      console.error('Registration Error:', err);
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

  const inputCls =
    'w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5b7c99]/30';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f6f2] px-4 py-10">
      <div className="relative w-full max-w-md bg-white p-10 rounded-2xl shadow-md">
        <div className="absolute top-4 right-4">
          <Undo2
            size={28}
            className="text-slate-500 hover:text-[#5b7c99] cursor-pointer"
            onClick={() => navigate('/login')}
          />
        </div>

        <h1 className="text-2xl font-bold text-slate-800">Registration</h1>
        <p className="text-sm text-slate-500 mb-6">Be a worm</p>

        {error && (
          <p className="mb-4 px-3 py-2 rounded-md bg-red-50 text-sm text-red-600">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600">Username</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Username"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
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

          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className={`${inputCls} pr-10`}
              />
              {showConfirmPassword ? (
                <Eye
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer"
                  onClick={() => setShowConfirmPassword(false)}
                />
              ) : (
                <EyeOff
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer"
                  onClick={() => setShowConfirmPassword(true)}
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#5b7c99] text-white font-medium hover:bg-[#4a6a85] disabled:opacity-60 mt-2"
          >
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          already have an account?{' '}
          <Link to="/login" className="text-[#5b7c99] hover:underline">
            Signup
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
