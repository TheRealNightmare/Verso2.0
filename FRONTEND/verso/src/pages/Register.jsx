import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Undo2, Camera } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  usePageTitle('Register');

  const [role, setRole] = useState('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!avatar) {
      setError('Please choose a profile picture.');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password, role, avatar, bio: role === 'author' ? bio : undefined });
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
      <div className="relative w-full max-w-md bg-white p-6 sm:p-10 rounded-2xl shadow-md">
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={() => navigate('/login')}
            aria-label="Back to log in"
            className="text-slate-500 hover:text-[#5b7c99] rounded p-0.5"
          >
            <Undo2 size={28} />
          </button>
        </div>

        <h1 className="text-2xl font-bold text-slate-800">Registration</h1>
        <p className="text-sm text-slate-500 mb-6">Be a worm</p>

        {error && (
          <p className="mb-4 px-3 py-2 rounded-md bg-red-50 text-sm text-red-600">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`py-2 rounded-lg border text-sm font-medium ${
                role === 'user'
                  ? 'bg-[#5b7c99] text-white border-[#5b7c99]'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              Reader
            </button>
            <button
              type="button"
              onClick={() => setRole('author')}
              className={`py-2 rounded-lg border text-sm font-medium ${
                role === 'author'
                  ? 'bg-[#5b7c99] text-white border-[#5b7c99]'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              Author
            </button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center text-slate-400 hover:border-[#5b7c99]"
              aria-label="Upload profile picture"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <Camera size={28} />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <span className="text-xs text-slate-500">Profile picture (required)</span>
          </div>

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
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
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
              <button
                type="button"
                onClick={() => setShowConfirmPassword((s) => !s)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showConfirmPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          {role === 'author' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-600">Author bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell readers about yourself"
                rows={3}
                maxLength={1000}
                className={inputCls}
              />
            </div>
          )}

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
