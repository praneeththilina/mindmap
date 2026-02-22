import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OnboardingStep1 = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#f6f7f8] dark:bg-[#111921] font-display text-slate-900 dark:text-slate-100 antialiased selection:bg-[#308ce8]/20 min-h-screen flex items-center justify-center">
      <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-md mx-auto bg-white dark:bg-[#111921] shadow-xl">
        {/* Skip Button Header */}
        <div className="flex w-full px-6 py-4 justify-end z-10 pt-12">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <span>Skip</span>
          </button>
        </div>
        
        {/* Main Content Area */}
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          {/* Hero Illustration */}
          <div className="relative mb-8 flex w-full flex-col items-center justify-center">
            {/* Abstract blobs for calm background effect */}
            <div className="absolute -z-10 h-64 w-64 rounded-full bg-[#308ce8]/10 blur-3xl filter dark:bg-[#308ce8]/20"></div>
            <div className="absolute -right-4 -top-4 -z-10 h-32 w-32 rounded-full bg-blue-200/30 blur-2xl filter dark:bg-blue-900/20"></div>
            <div 
              className="h-72 w-full overflow-hidden rounded-2xl bg-cover bg-center bg-no-repeat shadow-sm" 
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBnitWJH8qMVV8u1BowcwRWSzoTRFUJG_5Vg1u4av6kXKRh0QGuUZJlc68JUaIr0PFT-SibVho_9fdxQ_Q11Bc83O0aNsclcAZYMCqDWLpAgj_SvnDDHnbClgrDuomH5gitwt9ap-gDnSnysBzShgRWTQiXCoJUP7dCOR1ylAzGcXvS0LgPtv0qw158EEhiQ4fC8QtQ-DgJnUUlz2gJ30W4M-lfBnYAZe9Nape432dagSwAuHSCGPTPzjVhnlxyR1izkOz9mUS_Pten")' }}
              aria-label="Illustration of students studying together"
            ></div>
          </div>
          
          {/* Typography */}
          <div className="flex w-full flex-col items-center text-center">
            <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
              Organize Your <span className="text-[#308ce8]">Thoughts</span>
            </h1>
            <p className="mb-8 max-w-[320px] text-base leading-relaxed text-slate-500 dark:text-slate-400">
              Visualize complex topics and boost your memory retention with intuitive mind maps designed for focus.
            </p>
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="flex w-full flex-col items-center gap-6 px-6 pb-10 pt-4">
          {/* Progress Indicators */}
          <div className="flex flex-row items-center justify-center gap-2">
            <div className="h-2 w-6 rounded-full bg-[#308ce8] transition-all duration-300"></div>
            <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          </div>
          
          {/* Next Button */}
          <button 
            onClick={() => navigate('/onboarding/2')}
            className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-xl bg-[#308ce8] text-white shadow-lg shadow-[#308ce8]/25 transition-all hover:bg-[#1a6ac9] active:scale-[0.98]"
          >
            <span className="mr-2 text-lg font-semibold tracking-wide">Next</span>
            <ArrowRight className="text-xl transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
