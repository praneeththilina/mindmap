import { ArrowLeft, Mail, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VerifyEmail = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#f6f7f8] dark:bg-[#111921] font-display antialiased text-slate-900 dark:text-slate-100 min-h-screen flex flex-col items-center justify-center">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-[#f6f7f8] dark:bg-[#111921] min-h-screen">
        {/* Header / Nav */}
        <div className="flex items-center p-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"
          >
            <ArrowLeft size={24} />
          </button>
        </div>
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col px-6 pt-4 pb-8">
          {/* Illustration Container */}
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative flex items-center justify-center size-48 rounded-full bg-blue-50 dark:bg-slate-800 mb-6 shadow-inner ring-1 ring-[#308ce8]/10">
              <div className="flex items-center justify-center text-[#308ce8]">
                <Mail size={64} />
              </div>
            </div>
          </div>
          
          {/* Text Content */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">Check your email</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed px-4">
              We've sent a password reset link to your email address.
            </p>
          </div>
          
          {/* Action Button */}
          <div className="pt-2 w-full">
            <button 
              className="flex w-full justify-center rounded-xl bg-[#308ce8] px-3 py-4 text-base font-semibold leading-6 text-white shadow-md hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#308ce8] transition-all active:scale-[0.98]" 
              onClick={() => navigate('/reset-password')}
            >
              Open Email App
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Didn't receive the email? <button className="text-[#308ce8] font-semibold hover:underline">Click to resend</button>
            </p>
          </div>
          
          <div className="mt-auto pt-8 text-center">
            <button onClick={() => navigate('/login')} className="inline-flex items-center text-sm font-semibold text-[#308ce8] hover:text-blue-600 transition-colors gap-1 group">
              <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
              Back to Login
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
