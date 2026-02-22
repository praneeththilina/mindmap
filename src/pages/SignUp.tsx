import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SignUp = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    agreeToTerms: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();

      if (res.ok) {
        login(data.user);
        navigate('/');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f6f8f7] dark:bg-[#102218] font-display antialiased text-[#111814] dark:text-white min-h-screen flex items-center justify-center">
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden max-w-md mx-auto bg-white dark:bg-[#102218] shadow-sm">
        {/* Header Section */}
        <div className="flex flex-col gap-2 p-4 pb-2">
          <div className="flex items-center h-12 justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="text-[#111814] dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-[#f6f8f7] dark:hover:bg-[#13ec6d]/20 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          </div>
          <div className="px-4 pt-2">
            <h2 className="text-[#111814] dark:text-white text-3xl font-bold leading-tight tracking-tight">Create Account</h2>
            <p className="text-[#618972] dark:text-gray-400 text-sm font-normal leading-normal pt-2">Start mapping your mind today</p>
          </div>
        </div>

        {/* Form Section */}
        <form className="flex-1 flex flex-col px-6 py-4 gap-5" onSubmit={handleSubmit}>
          {/* Full Name */}
          <label className="flex flex-col w-full group">
            <span className="text-[#111814] dark:text-gray-200 text-sm font-medium leading-normal pb-2 ml-1">Full Name</span>
            <div className="relative">
              <input 
                className="form-input w-full rounded-xl border border-[#dbe6e0] dark:border-gray-700 bg-[#f6f8f7] dark:bg-gray-800/50 h-14 px-4 text-base text-[#111814] dark:text-white placeholder:text-[#618972]/70 focus:outline-none focus:border-[#13ec6d] focus:ring-1 focus:ring-[#13ec6d] transition-all duration-200" 
                placeholder="e.g., Alex Smith" 
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
              />
              <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-[#13ec6d] opacity-0 group-focus-within:opacity-100 transition-opacity" size={20} />
            </div>
          </label>

          {/* Email */}
          <label className="flex flex-col w-full group">
            <span className="text-[#111814] dark:text-gray-200 text-sm font-medium leading-normal pb-2 ml-1">Email</span>
            <div className="relative">
              <input 
                className="form-input w-full rounded-xl border border-[#dbe6e0] dark:border-gray-700 bg-[#f6f8f7] dark:bg-gray-800/50 h-14 px-4 text-base text-[#111814] dark:text-white placeholder:text-[#618972]/70 focus:outline-none focus:border-[#13ec6d] focus:ring-1 focus:ring-[#13ec6d] transition-all duration-200" 
                placeholder="name@example.com" 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
              <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-[#13ec6d] opacity-0 group-focus-within:opacity-100 transition-opacity" size={20} />
            </div>
          </label>

          {/* Password */}
          <label className="flex flex-col w-full group">
            <span className="text-[#111814] dark:text-gray-200 text-sm font-medium leading-normal pb-2 ml-1">Password</span>
            <div className="relative">
              <input 
                className="form-input w-full rounded-xl border border-[#dbe6e0] dark:border-gray-700 bg-[#f6f8f7] dark:bg-gray-800/50 h-14 px-4 text-base text-[#111814] dark:text-white placeholder:text-[#618972]/70 focus:outline-none focus:border-[#13ec6d] focus:ring-1 focus:ring-[#13ec6d] transition-all duration-200" 
                placeholder="••••••••" 
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#618972] hover:text-[#111814] dark:hover:text-white transition-colors" 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </label>

          {/* Terms Checkbox */}
          <label className="flex items-center gap-3 mt-1 cursor-pointer">
            <input 
              className="w-5 h-5 rounded border-gray-300 text-[#13ec6d] focus:ring-[#13ec6d] dark:bg-gray-800 dark:border-gray-600" 
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={(e) => setFormData({...formData, agreeToTerms: e.target.checked})}
              required
            />
            <span className="text-sm text-[#618972] dark:text-gray-400">
              I agree to the <a className="text-[#13ec6d] font-medium hover:underline" href="#">Terms</a> & <a className="text-[#13ec6d] font-medium hover:underline" href="#">Privacy Policy</a>
            </span>
          </label>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {/* Primary Action Button */}
          <button disabled={isLoading} className="w-full bg-[#13ec6d] hover:bg-[#13ec6d]/90 disabled:opacity-50 text-[#102218] font-bold h-14 rounded-xl mt-2 transition-transform active:scale-[0.98] shadow-lg shadow-[#13ec6d]/20 flex items-center justify-center gap-2">
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>

          {/* Divider */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-[#dbe6e0] dark:border-gray-700"></div>
            <span className="flex-shrink-0 mx-4 text-[#618972] dark:text-gray-500 text-sm">Or sign up with</span>
            <div className="flex-grow border-t border-[#dbe6e0] dark:border-gray-700"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex gap-4">
            <button type="button" className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-[#dbe6e0] dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-[#f6f8f7] dark:hover:bg-gray-700 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="text-[#111814] dark:text-white font-medium text-sm">Google</span>
            </button>
            <button type="button" className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-[#dbe6e0] dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-[#f6f8f7] dark:hover:bg-gray-700 transition-colors">
              <svg className="w-5 h-5 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.56-2.09-.48-3.08.02-1.06.53-2.19.46-3.13-.53-.88-.93-1.58-2.69-.93-4.64.66-1.97 2.38-3.09 4.29-2.91 1.03.09 1.76.51 2.38.51.62 0 1.58-.55 2.8-.46 2.29.17 3.37 1.76 3.37 1.76-.09.04-1.92 1.1-1.92 3.26-.01 2.6 2.3 3.48 2.3 3.48-.15.48-.48 1.45-1.12 2.39-.73 1.07-1.49 1.95-1.88 1.95zM12.03 7.25c-.15 2.23 1.93 4.08 1.93 4.08 2.05-.18 3.52-2.34 3.33-4.22-.19-1.91-2.12-3.2-3.95-3.02-.32 1.77-1.31 3.16-1.31 3.16z"></path>
              </svg>
              <span className="text-[#111814] dark:text-white font-medium text-sm">Apple</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-auto p-6 text-center">
            <p className="text-[#618972] dark:text-gray-400 text-sm">
              Already have an account? 
              <Link to="/login" className="text-[#111814] dark:text-[#13ec6d] font-semibold hover:text-[#13ec6d] transition-colors ml-1">Log In</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
