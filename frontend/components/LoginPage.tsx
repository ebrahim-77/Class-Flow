import { Mail, Lock, ArrowRight, User, GraduationCap, BookOpen, Shield, ChevronLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth, type UserRole } from '../context/AuthContext';
import type { Page } from '../App';
import AppLogo from './AppLogo';

interface LoginPageProps {
  onNavigate: (page: Page) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { login, register } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleOptions: Array<{
    role: UserRole;
    title: string;
    description: string;
    icon: typeof GraduationCap;
    color: string;
    bgColor: string;
    borderColor: string;
    hoverBg: string;
  }> = [
      {
        role: 'student',
        title: 'Student',
        description: 'View schedules and class information.',
        icon: GraduationCap,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        hoverBg: 'hover:bg-blue-100',
      },
      {
        role: 'teacher',
        title: 'Teacher',
        description: 'Post schedules and book rooms.',
        icon: BookOpen,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        hoverBg: 'hover:bg-purple-100',
      },
      {
        role: 'admin',
        title: 'Administrator',
        description: 'Manage rooms and system settings.',
        icon: Shield,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        hoverBg: 'hover:bg-amber-100',
      },
    ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedRole) {
      setError('Please choose a role first.');
      return;
    }

    setLoading(true);

    try {
      let success: boolean;
      if (isRegister) {
        success = await register(name, email, password, selectedRole);
      } else {
        success = await login(email, password, selectedRole);
      }

      if (success) {
        onNavigate('dashboard');
      } else {
        setError(isRegister ? 'Registration failed. Please check your details.' : 'Invalid email or password.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sm:p-8 space-y-6 animate-fade-in">
          {/* Header Section */}
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-6">
              <AppLogo onClick={() => onNavigate('dashboard')} />
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium">
              {selectedRole ? 'Welcome back' : 'Choose your role to get started'}
            </p>
          </div>

          {!selectedRole ? (
            /* Role Selection Cards */
            <div className="space-y-3 sm:space-y-4">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(option.role);
                      setError('');
                    }}
                    className={`group w-full rounded-xl border-2 transition-all duration-300 p-4 sm:p-5 text-left hover:scale-[1.01] hover:shadow-md ${option.borderColor} ${option.bgColor} ${option.hoverBg}`}
                  >
                    <div className="flex items-start gap-4 sm:gap-5">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${option.color} bg-white shadow-sm group-hover:shadow-md transition-shadow duration-300`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-lg sm:text-base">{option.title}</p>
                        <p className="mt-1.5 text-sm text-gray-700 leading-relaxed">{option.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Login/Register Form */
            <div className="space-y-6">
              {/* Form Header with Role Selector */}
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole(null);
                      setIsRegister(false);
                      setError('');
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 group"
                  >
                    <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
                    Change role
                  </button>
                  <div className="px-3 py-1.5 rounded-full bg-blue-100 border border-blue-300 text-xs font-semibold text-blue-900 capitalize">
                    {selectedRole === 'admin' ? 'Administrator' : selectedRole}
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {isRegister ? 'Create your account' : 'Welcome back'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {isRegister
                      ? `Sign up as a ${selectedRole === 'admin' ? 'admin' : selectedRole} to get started.`
                      : `Sign in to your ${selectedRole === 'admin' ? 'admin' : selectedRole} account.`}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-red-600" />
                  </div>
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {isRegister && (
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        id="name"
                        type="text"
                        placeholder="John Smith"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 pl-12 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 pl-12 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 pl-12 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      required
                      minLength={6}
                    />
                  </div>
                  {isRegister && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Minimum 6 characters</p>
                  )}
                </div>

                {isRegister && selectedRole === 'admin' && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-amber-600" />
                    </div>
                    <p className="text-sm text-amber-900 font-medium">Admin accounts are created manually by system administrators.</p>
                  </div>
                )}

               {/* Submit Button */}
<button
  type="submit"
  disabled={loading}
  onClick={handleSubmit}
  style={{
    backgroundColor: loading ? '#93c5fd' : '#2563eb',
    color: '#ffffff',
    cursor: loading ? 'not-allowed' : 'pointer',
  }}
  className="group w-full mt-6 relative overflow-hidden rounded-xl py-3 sm:py-3.5 px-4 font-semibold shadow-md transition-all duration-300 active:scale-95"
>
  <div className="flex items-center justify-center gap-2 relative z-10">
    {loading ? (
      <>
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Please wait...</span>
      </>
    ) : (
      <>
        <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
      </>
    )}
  </div>
</button>
              </form>

              {/* Toggle Register/Login */}
              <div className="text-center text-sm text-slate-600 dark:text-gray-300">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError('');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200"
                >
                  {isRegister ? 'Sign In' : 'Register'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
