import { Mail, Lock, ArrowRight, User, GraduationCap, BookOpen, Shield, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useAuth, type UserRole } from '../context/AuthContext';
import type { Page } from '../App';

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
  }> = [
    {
      role: 'student',
      title: 'Continue as Student',
      description: 'View schedules and class information.',
      icon: GraduationCap,
    },
    {
      role: 'teacher',
      title: 'Continue as Teacher',
      description: 'Post schedules and book rooms.',
      icon: BookOpen,
    },
    {
      role: 'admin',
      title: 'Continue as Admin',
      description: 'Manage rooms and system settings.',
      icon: Shield,
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-6">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center">
        <div className="w-full space-y-5">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3B82F6] text-white shadow-lg shadow-blue-500/30">
              <span className="text-lg font-bold">CF</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1E293B]">ClassFlow</h1>
            <p className="mt-2 text-sm text-slate-600">Choose your role to continue.</p>
          </div>

          {!selectedRole ? (
            <div className="space-y-3">
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
                    className="flex w-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#3B82F6]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#1E293B]">{option.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole(null);
                    setIsRegister(false);
                    setError('');
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Change role
                </button>
                <span className="rounded-full bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 capitalize">
                  {selectedRole}
                </span>
              </div>

              <div className="mb-5">
                <h2 className="text-xl font-semibold text-[#1E293B]">
                  {isRegister ? 'Create account' : 'Sign in'}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {isRegister
                    ? `Register as a ${selectedRole}.`
                    : `Continue as a ${selectedRole}.`}
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <div>
                    <label htmlFor="name" className="mb-2 block font-medium text-[#1E293B]">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="name"
                        type="text"
                        placeholder="John Smith"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 pl-12 text-slate-900 outline-none transition-colors focus:border-[#3B82F6]"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="mb-2 block font-medium text-[#1E293B]">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder="student@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 pl-12 text-slate-900 outline-none transition-colors focus:border-[#3B82F6]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block font-medium text-[#1E293B]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 pl-12 text-slate-900 outline-none transition-colors focus:border-[#3B82F6]"
                      required
                      minLength={6}
                    />
                  </div>
                  {isRegister && (
                    <p className="mt-1 text-sm text-slate-500">Minimum 6 characters</p>
                  )}
                </div>

                {isRegister && selectedRole === 'admin' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    Admin accounts are created manually.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] py-3 font-medium text-white shadow-lg shadow-blue-500/30 transition-colors hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
                  {!loading && <ArrowRight className="h-5 w-5" />}
                </button>
              </form>

              <div className="mt-4 text-center text-sm text-slate-600">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError('');
                  }}
                  className="font-medium text-[#3B82F6] hover:underline"
                >
                  {isRegister ? 'Sign In' : 'Register'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
