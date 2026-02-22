import { CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PasswordResetSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#f6f7f8] dark:bg-[#111921] font-display antialiased text-slate-900 dark:text-slate-100 min-h-screen flex flex-col items-center justify-center">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-[#f6f7f8] dark:bg-[#111921] min-h-screen">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col px-6 pt-4 pb-8 items-center justify-center">
          {/* Illustration Container */}
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative flex items-center justify-center size-48 rounded-full bg-green-50 dark:bg-slate-800 mb-6 shadow-inner ring-1 ring-green-500/10">
              <div className="flex items-center justify-center text-green-500">
                <CheckCircle size={64} />
              </div>
            </div>
          </div>
          
          {/* Text Content */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">Password Reset!</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed px-4">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
          </div>
          
          {/* Action Button */}
          <div className="pt-2 w-full">
            <button 
              className="flex w-full justify-center rounded-xl bg-[#308ce8] px-3 py-4 text-base font-semibold leading-6 text-white shadow-md hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#308ce8] transition-all active:scale-[0.98]" 
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
