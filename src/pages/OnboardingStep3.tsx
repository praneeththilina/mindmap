import { ArrowRight, CheckCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const OnboardingStep3 = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <div className="bg-[#f6f7f8] dark:bg-[#111921] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col items-center justify-between overflow-hidden relative selection:bg-[#308ce8]/30 font-display">
      {/* Progress Indicator */}
      <div className="w-full pt-12 pb-2 px-6 flex justify-center items-center gap-3 z-10">
        <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700"></div>
        <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700"></div>
        <div className="h-2 w-8 rounded-full bg-[#308ce8] transition-all duration-300"></div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md px-6 flex flex-col items-center pt-4 pb-24 overflow-y-auto">
        {/* Headers */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight mb-3">Choose Your Vibe</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-relaxed">Select a theme that fits your study style and helps you focus.</p>
        </div>

        {/* Theme Selection Grid */}
        <div className="w-full grid grid-cols-1 gap-4">
          {/* Card 1: Calm Light */}
          <label className="group relative cursor-pointer block">
            <input 
              className="peer sr-only" 
              name="theme" 
              type="radio" 
              checked={theme === 'calm'}
              onChange={() => setTheme('calm')}
            />
            <div className="relative overflow-hidden rounded-xl border-2 border-transparent bg-white dark:bg-slate-800 shadow-sm transition-all duration-200 peer-checked:border-[#308ce8] peer-checked:shadow-md peer-checked:ring-4 peer-checked:ring-[#308ce8]/10 hover:scale-[1.02]">
              <div className="flex items-center p-4 gap-4">
                <div className="h-20 w-20 shrink-0 rounded-lg overflow-hidden relative bg-slate-100 border border-slate-100">
                  <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBDwfx-xGt2JwD2yEwP4h57D0ZuysbAlMGZFYVDmTuymRJcnSOQPbMS6EiP3WANGigFw-OkQf3J9aqFskWEofzkVkhHjkjMKfiSP7NHkUHTw7Pp4FfnSe4g8L1WUbfk29d2MPleoyPgSyi1ysvHRvhiZULyvgLxztpK0jiqo0r60-uIB8mqmRAFDen4CFUNEEtbVUDXGl0b3x_M2D3jt06bDprIu0yvJJbD64KZH_RGZlOXT7PtGsndfn79UQq7GF-9bYVsAN7PcCsQ")' }}
                    aria-label="Bright clean minimal desk setup"
                  ></div>
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]"></div>
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#308ce8] transition-colors">Calm Light</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Soft colors and airy spaces for a relaxed mind.</p>
                </div>
              </div>
            </div>
            {/* Selection Indicator Overlay Logic handled by peer-checked on parent input */}
            <div className="absolute top-4 right-4 text-[#308ce8] opacity-0 peer-checked:opacity-100 transition-opacity duration-200 pointer-events-none">
              <CheckCircle className="fill-current" />
            </div>
          </label>

          {/* Card 2: Dark Focus */}
          <label className="group relative cursor-pointer block">
            <input 
              className="peer sr-only" 
              name="theme" 
              type="radio" 
              checked={theme === 'dark'}
              onChange={() => setTheme('dark')}
            />
            <div className="relative overflow-hidden rounded-xl border-2 border-transparent bg-white dark:bg-slate-800 shadow-sm transition-all duration-200 peer-checked:border-[#308ce8] peer-checked:shadow-md peer-checked:ring-4 peer-checked:ring-[#308ce8]/10 hover:scale-[1.02]">
              <div className="flex items-center p-4 gap-4">
                <div className="h-20 w-20 shrink-0 rounded-lg overflow-hidden relative bg-slate-900 border border-slate-800">
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-80" 
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBVFc0u0SSulTjMxlJwYqyC61Rwye-nPa3ftThmKFCOUmJOkg-6Wvvi2vsLip0RM0TFGqu2INx2QKl5Ll4o2m4xc4iE5BF5rPIuQjeTGvu4vSPjLERn_xi5criLNaA-QvVX9eJ6rbEJE26AWl7TcDQyfsIC0MXVsMNfe2GslG0Hy0oYp9OiKwWOcxvta620Saw5eGZRF7_0E-EWpPs8HyDSGwZ7pCrvggY9Ov_lhyUmTOAVJgBINOQYlIfXA7tPZGw9gn3B-_h70sIU")' }}
                    aria-label="Dark moody abstract night mode interface"
                  ></div>
                  <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply"></div>
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#308ce8] transition-colors">Dark Focus</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">High contrast dark mode for late night sessions.</p>
                </div>
              </div>
            </div>
            <div className="absolute top-4 right-4 text-[#308ce8] opacity-0 peer-checked:opacity-100 transition-opacity duration-200 pointer-events-none">
              <CheckCircle className="fill-current" />
            </div>
          </label>

          {/* Card 3: Exam Boost */}
          <label className="group relative cursor-pointer block">
            <input 
              className="peer sr-only" 
              name="theme" 
              type="radio" 
              checked={theme === 'exam'}
              onChange={() => setTheme('exam')}
            />
            <div className="relative overflow-hidden rounded-xl border-2 border-transparent bg-white dark:bg-slate-800 shadow-sm transition-all duration-200 peer-checked:border-[#308ce8] peer-checked:shadow-md peer-checked:ring-4 peer-checked:ring-[#308ce8]/10 hover:scale-[1.02]">
              {/* Gradient accent for Exam Boost */}
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#308ce8] to-blue-400"></div>
              <div className="flex items-center p-4 gap-4 pl-5"> {/* Added extra padding left for accent bar */}
                <div className="h-20 w-20 shrink-0 rounded-lg overflow-hidden relative bg-blue-50 border border-blue-100">
                  <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCR1zN5MO6boOPqlej4IHpWLCK8NfUcJJ5Vz-K2UfBprubd2GDvZ625gpDvJWA04jTFOd47kpcUvc5D1JkIPq1BIY6d_LqONmr5asoaCfDht4tGmqlcHeNG3ZqZwc7WTktkOQtXfto6PtOnpXXhKth015nq7T283Gf9lGbb0NbWkzRJQg_3vq8U0MhlmpgOuAk3k5OLhipDIvSsY2k6rJvrZNr04mI6OS7stHeWz_tor-4S578WjjBr11MCaDXSj2sKjg7QywXJx0x7")' }}
                    aria-label="Energetic blue educational abstract pattern"
                  ></div>
                  <div className="absolute inset-0 bg-[#308ce8]/20 mix-blend-overlay"></div>
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#308ce8] transition-colors">Exam Boost</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Energetic accents to keep motivation high.</p>
                </div>
              </div>
            </div>
            <div className="absolute top-4 right-4 text-[#308ce8] opacity-0 peer-checked:opacity-100 transition-opacity duration-200 pointer-events-none">
              <CheckCircle className="fill-current" />
            </div>
          </label>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <Info size={18} />
          <span>You can change this later in settings</span>
        </div>
      </main>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#f6f7f8] via-[#f6f7f8]/95 to-transparent dark:from-[#111921] dark:via-[#111921]/95 z-20">
        <div className="max-w-md mx-auto w-full">
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 rounded-lg h-14 bg-[#308ce8] hover:bg-blue-600 active:scale-[0.98] transition-all text-white text-lg font-bold tracking-wide shadow-lg shadow-[#308ce8]/30"
          >
            <span>Get Started</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
