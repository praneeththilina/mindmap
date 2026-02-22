import { ArrowLeft, Lock, Eye, EyeOff, RotateCcw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="bg-[#f6f7f8] dark:bg-[#111921] min-h-screen flex flex-col items-center justify-center font-display text-slate-900 dark:text-slate-100 antialiased overflow-hidden">
      {/* Main Container: Centered on larger screens, full height on mobile */}
      <main className="relative w-full max-w-md h-full min-h-screen md:min-h-0 md:h-auto bg-white dark:bg-[#1a2632] md:rounded-xl shadow-none md:shadow-lg flex flex-col overflow-y-auto no-scrollbar">
        {/* Header / Navigation Area */}
        <header className="flex items-center justify-between p-4 pb-2">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="w-10"></div> {/* Spacer for balance */}
        </header>
        
        {/* Content Area */}
        <div className="flex-1 px-6 pt-2 pb-8 flex flex-col">
          {/* Title Section */}
          <div className="mb-8 text-center">
            <div className="mx-auto w-16 h-16 bg-[#4c99e6]/10 rounded-full flex items-center justify-center mb-6 text-[#4c99e6]">
              <RotateCcw size={32} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Reset Password</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed px-4">
              Create a strong password to secure your study space. Your new password must be different from previous ones.
            </p>
          </div>
          
          {/* Form Section */}
          <form className="flex flex-col gap-6 w-full" onSubmit={(e) => { e.preventDefault(); navigate('/password-reset-success'); }}>
            {/* New Password Field */}
            <div className="space-y-2 group">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="new-password">New Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <Lock size={20} />
                </span>
                <input 
                  id="new-password" 
                  className="w-full pl-10 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4c99e6]/50 focus:border-[#4c99e6] text-slate-900 dark:text-white placeholder:text-slate-400 transition-all text-sm" 
                  placeholder="Enter new password" 
                  type={showPassword ? "text" : "password"}
                />
                <button 
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-1" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              <div className="pt-1 space-y-1.5">
                <div className="flex gap-1.5 h-1.5 w-full">
                  <div className="flex-1 rounded-full bg-[#4c99e6] h-full"></div>
                  <div className="flex-1 rounded-full bg-[#4c99e6] h-full"></div>
                  <div className="flex-1 rounded-full bg-slate-200 dark:bg-slate-700 h-full"></div>
                  <div className="flex-1 rounded-full bg-slate-200 dark:bg-slate-700 h-full"></div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Strength: <span className="text-[#4c99e6] font-medium">Medium</span></span>
                  <span className="text-slate-400 dark:text-slate-500">Min. 8 chars</span>
                </div>
              </div>
            </div>
            
            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="confirm-password">Confirm Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <Lock size={20} />
                </span>
                <input 
                  id="confirm-password" 
                  className="w-full pl-10 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4c99e6]/50 focus:border-[#4c99e6] text-slate-900 dark:text-white placeholder:text-slate-400 transition-all text-sm" 
                  placeholder="Re-enter new password" 
                  type={showConfirmPassword ? "text" : "password"}
                />
                <button 
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-1" 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>
            
            {/* Spacer */}
            <div className="h-4"></div>
            
            {/* Action Button */}
            <button className="w-full bg-[#4c99e6] hover:bg-[#3b82d0] text-white font-semibold py-4 rounded-xl shadow-lg shadow-[#4c99e6]/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2">
              <span>Update Password</span>
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
        
        {/* Decorative Bottom Element (Subtle) */}
        <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-[#4c99e6]/20 to-transparent"></div>
      </main>
    </div>
  );
};
