import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OnboardingStep2 = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#111921] font-display h-screen flex flex-col justify-between overflow-hidden">
      {/* Top Navigation / Skip */}
      <div className="flex justify-between items-center px-6 pt-12 pb-4">
        <button 
          onClick={() => navigate(-1)}
          className="text-slate-500 hover:text-[#308ce8] dark:text-slate-400 dark:hover:text-[#308ce8] transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <button 
          onClick={() => navigate('/')}
          className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        {/* Illustration Container */}
        <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
          {/* Decorative background blob */}
          <div className="absolute inset-0 bg-[#308ce8]/10 dark:bg-[#308ce8]/20 rounded-full blur-3xl scale-90"></div>
          {/* Main Illustration Image */}
          <div 
            className="relative w-full h-full bg-contain bg-center bg-no-repeat z-10 drop-shadow-sm" 
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCyepXcWyc4P2R93u5g_8ujQGToYx7zlprBRiXO_-1wcM6mOiPS7E7h9KYEe2E0x9WDekW5YOlyqNkIfrB9cKlpeeeGkWhv9TM7UF3b2u96EGu4hd3t4-zSZ7RyoQru4Qnx8leWTlobdm6lurHgcI05QftjQx0pu7y0RDPLZ7Vtp-610FFR-T3oQJyT6w3vUeGzl7pd5PulVDyB1jeeb1C75AUicX06dOI1Rdpe_RwOwELWsMq64Vz_5ELbjMSdocX-YnKY4g1llXXx")' }}
            aria-label="Illustration showing a rising progress chart and a clock timer"
          ></div>
        </div>

        {/* Text Block */}
        <div className="text-center max-w-sm mx-auto">
          <h1 className="text-[#1E293B] dark:text-white text-[32px] font-bold leading-tight mb-4 tracking-tight">
            Track Your Progress
          </h1>
          <p className="text-[#64748B] dark:text-slate-400 text-base font-normal leading-relaxed px-2">
            Set clear exam goals and monitor your daily study hours. Watch your knowledge grow as you prepare for success.
          </p>
        </div>
      </div>

      {/* Bottom Controls Area */}
      <div className="w-full px-6 pb-10 pt-4 bg-[#F8FAFC] dark:bg-[#111921]">
        <div className="flex flex-col gap-8 max-w-md mx-auto">
          {/* Pagination Indicators */}
          <div className="flex justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700"></div>
            <div className="h-2 w-6 rounded-full bg-[#308ce8] transition-all duration-300"></div>
            <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700"></div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between w-full">
            {/* Back Button */}
            <button 
              onClick={() => navigate(-1)}
              aria-label="Go Back" 
              className="p-3 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors group"
            >
              <ArrowLeft className="text-2xl group-hover:-translate-x-1 transition-transform" />
            </button>
            
            {/* Next Button */}
            <button 
              onClick={() => navigate('/onboarding/3')}
              aria-label="Next Step" 
              className="bg-[#308ce8] hover:bg-[#308ce8]/90 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-[#308ce8]/30 flex items-center gap-2 transition-all active:scale-95"
            >
              Next
              <ArrowRight className="text-xl" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
