import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        login(data.user);
        navigate('/');
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f6f7f8] dark:bg-[#111921] text-[#1e293b] dark:text-slate-100 min-h-screen flex items-center justify-center font-display antialiased selection:bg-[#308ce8]/20 selection:text-[#308ce8]">
      <div className="w-full max-w-md h-full min-h-screen sm:min-h-0 sm:h-auto mx-auto flex flex-col bg-white dark:bg-[#1a242d] sm:rounded-3xl sm:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.02)] sm:border sm:border-slate-100 dark:border-slate-800 overflow-hidden relative">
        {/* Top decorative gradient element */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#308ce8]/60 via-[#308ce8] to-[#308ce8]/60"></div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col px-6 pt-10 pb-8 sm:px-10 sm:py-12">
          {/* Header Section */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex items-center justify-center w-14 h-14 rounded-2xl bg-[#308ce8]/10 text-[#308ce8] transform rotate-3">
              <Brain size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1e293b] dark:text-white mb-2">Welcome Back!</h1>
            <p className="text-[#64748b] dark:text-slate-400 text-base font-normal">Let's get back to your study maps.</p>
          </div>

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#1e293b] dark:text-slate-200" htmlFor="email">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="text-slate-400 group-focus-within:text-[#308ce8] transition-colors" size={20} />
                </div>
                <input 
                  id="email"
                  autoComplete="email" 
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[#1e293b] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#308ce8]/20 focus:border-[#308ce8] transition-all duration-200" 
                  placeholder="student@example.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-[#1e293b] dark:text-slate-200" htmlFor="password">Password</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="text-slate-400 group-focus-within:text-[#308ce8] transition-colors" size={20} />
                </div>
                <input 
                  id="password"
                  autoComplete="current-password" 
                  className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[#1e293b] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#308ce8]/20 focus:border-[#308ce8] transition-all duration-200" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <Link to="/forgot-password" className="text-sm font-medium text-[#308ce8] hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Forgot Password?</Link>
              </div>
            </div>

            {/* Action Button */}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button disabled={isLoading} className="w-full mt-2 flex items-center justify-center gap-2 bg-[#308ce8] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-[#308ce8]/25 hover:shadow-[#308ce8]/40 active:scale-[0.98]" type="submit">
              <span>Log In</span>
              <ArrowRight size={20} />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div aria-hidden="true" className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-[#1a242d] px-4 text-sm text-[#64748b] dark:text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-3 gap-4">
            <button className="flex items-center justify-center py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group">
              <img alt="Google Logo" className="w-6 h-6 group-hover:scale-110 transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBaj7uBelYPVWSFGDDZE5_zniRdYp_KNGuFbyKWCmqaQ5vp2Y4anHEpvP7CVlHrIJ1zyvIcWsgW9h6gzmSL_NmlbV9C4wZSpLNXqjNcYPOdGPuBbPsAdrbp3LM77Pz0lE3Lz4TkNTikehN1OS1Xco3WlZeeMVG1cvXj7wBbTRZ6-0TdmWdbok_A3bt78h0sW-lVpm46GIAhcMk8zhHjfKu1uypGzTru03__K__UmdjNj97V-FWxdw9E0aXuZCoudfwF8khBEOmDmF2" referrerPolicy="no-referrer" />
            </button>
            <button className="flex items-center justify-center py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group">
              <svg className="w-6 h-6 text-black dark:text-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.56-2.09-.48-3.08.02-1.06.53-2.19.46-3.13-.53-.88-.93-1.58-2.69-.93-4.64.66-1.97 2.38-3.09 4.29-2.91 1.03.09 1.76.51 2.38.51.62 0 1.58-.55 2.8-.46 2.29.17 3.37 1.76 3.37 1.76-.09.04-1.92 1.1-1.92 3.26-.01 2.6 2.3 3.48 2.3 3.48-.15.48-.48 1.45-1.12 2.39-.73 1.07-1.49 1.95-1.88 1.95zM12.03 7.25c-.15 2.23 1.93 4.08 1.93 4.08 2.05-.18 3.52-2.34 3.33-4.22-.19-1.91-2.12-3.2-3.95-3.02-.32 1.77-1.31 3.16-1.31 3.16z"></path>
              </svg>
            </button>
            <button className="flex items-center justify-center py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group">
              <img alt="Facebook Logo" className="w-6 h-6 group-hover:scale-110 transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDA6ZJOwS8gfKiZXZv95UFRDen-OFi29XHBQDGRX6u2Ob5EOz8PHdMzuXxn4raPxW832mPiEPGEwB0gg5SFLZa5x04aB-ub-tx6f6LjM7eyXzU5SBEfS00hLm7XxtQU-p3ehTLZINS-Vz-JcW5tl3i219SKYkKqwvadYtTncI_MkovsnGn82YHRaWRh7FoDCNSTYb-KsRv_0kkdTF5rseu-6jdJlGrNlnYZMuLj_S0-ffPKo-0NUxeh23s32Gh7AFZmynG_1yJsmDEH" referrerPolicy="no-referrer" />
            </button>
          </div>

          {/* Footer Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#64748b] dark:text-slate-400">
              Don't have an account? 
              <Link to="/signup" className="font-semibold text-[#308ce8] hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-1">Sign Up</Link>
            </p>
          </div>
        </div>

        {/* Decorative Bottom Area (Mobile Only) */}
        <div className="h-6 bg-transparent sm:hidden"></div>
      </div>
    </div>
  );
};
