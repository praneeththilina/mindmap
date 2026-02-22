import { ArrowLeft, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#f6f7f8] dark:bg-[#111921] font-display antialiased text-slate-900 dark:text-slate-100 min-h-screen flex flex-col items-center justify-center">
        <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-[#f6f7f8] dark:bg-[#111921] min-h-screen">
          <div className="flex items-center p-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"
            >
              <ArrowLeft size={24} />
            </button>
          </div>
          <main className="flex-1 flex flex-col px-6 pt-4 pb-8 items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={32} className="text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Check Your Email</h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                We've sent a password reset link to <span className="font-semibold">{email}</span>
              </p>
              <button 
                onClick={() => navigate('/login')}
                className="text-[#308ce8] font-semibold hover:underline"
              >
                Back to Login
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
              <div 
                className="w-32 h-32 bg-contain bg-center bg-no-repeat opacity-90" 
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBqYaHUsv9Ld1zAzMdSg60LqIIJoN3mdn513LInSt0Y9Rtr3ESlv1syUkAoUXZg3brZrpZC8VwStFKQ9OWryUP_tSU8IbXXg9LibCeFrMw6VpLB_zyj6d9SVaANeIfGpKRWm_FWJRUzwvRBkKsJblPjWWlwGfJf80lqGMncI_ixaza5p6g-YMZNbP3YV0QVDl8pz6qvkY3KLLcu0UUUCt10LCVWUKu-2LyKOcZv4QCQw8Yaczu4vp_rnVPAnvMG9Wu1jsr0grOp_3br")' }}
                aria-label="Illustration of a friendly secure notebook with a key"
              >
              </div>
            </div>
          </div>
          
          {/* Text Content */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">Forgot Password?</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed px-4">
              Don't worry, it happens. Enter your email address below to receive a recovery link.
            </p>
          </div>
          
          {/* Form */}
          <form className="space-y-6 w-full" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1" htmlFor="email">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail size={20} />
                </div>
                <input 
                  id="email" 
                  className="block w-full rounded-xl border-0 bg-white dark:bg-slate-800 py-4 pl-11 pr-4 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#308ce8] sm:text-base sm:leading-6 transition-all" 
                  placeholder="student@university.edu" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <div className="pt-2">
              <button 
                disabled={isLoading}
                className="flex w-full justify-center rounded-xl bg-[#308ce8] px-3 py-4 text-base font-semibold leading-6 text-white shadow-md hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#308ce8] transition-all active:scale-[0.98] disabled:opacity-50" 
                type="submit"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
          
          <div className="mt-auto pt-8 text-center">
            <Link to="/login" className="inline-flex items-center text-sm font-semibold text-[#308ce8] hover:text-blue-600 transition-colors gap-1 group">
              <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
              Back to Login
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};
