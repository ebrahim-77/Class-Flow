import { Mail, Lock, ArrowRight, User, Camera, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Page } from '../App';

interface LoginPageProps {
  onNavigate: (page: Page) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB.');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(reader.result as string);
      setUploadingPhoto(false);
    };
    reader.onerror = () => {
      setError('Failed to read the image file.');
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removePhoto = () => {
    setProfilePhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let success: boolean;
      if (isRegister) {
        success = await register(name, email, password, profilePhoto || undefined);
      } else {
        success = await login(email, password);
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
    <div className="w-full min-h-screen flex">
      {/* Left Side - Illustration */}
      <div className="w-1/2 min-h-screen bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] relative overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-16 text-white">
          <div className="mb-8 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <div className="w-12 h-12 bg-white rounded-lg"></div>
            </div>
            <h1 className="text-4xl font-bold mb-4">ClassFlow</h1>
            <p className="text-blue-100 max-w-md text-lg">
              University Class Routine & Room Management System
            </p>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          
          {/* Features */}
          <div className="grid grid-cols-2 gap-4 mt-12 max-w-lg">
            {[
              { title: 'View Schedules', desc: 'Access your class timetable anytime' },
              { title: 'Book Rooms', desc: 'Reserve rooms for study sessions' },
              { title: 'Teacher Access', desc: 'Post and manage class schedules' },
              { title: 'Admin Control', desc: 'Approve requests and manage rooms' }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-blue-100 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login/Register Form */}
      <div className="w-1/2 min-h-screen bg-[#F8FAFC] flex items-center justify-center p-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-block bg-[#3B82F6] text-white px-4 py-2 rounded-lg mb-4 text-sm font-medium">
              University Portal
            </div>
            <h2 className="text-[#1E293B] text-2xl font-bold mb-2">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-600">
              {isRegister ? 'Register to access ClassFlow' : 'Sign in to access ClassFlow'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Profile Photo Upload (Register only) */}
            {isRegister && (
              <div className="flex flex-col items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Upload profile photo"
                />
                
                <div 
                  className="relative cursor-pointer group"
                  onClick={triggerFileInput}
                >
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-slate-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-slate-200 flex items-center justify-center">
                      {uploadingPhoto ? (
                        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                      ) : (
                        <Camera className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-slate-600">
                    {profilePhoto ? 'Click to change photo' : 'Add profile photo (optional)'}
                  </p>
                  {profilePhoto && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removePhoto(); }}
                      className="text-sm text-red-500 hover:text-red-700 mt-1"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Name Input (Register only) */}
            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-[#1E293B] font-medium mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="name"
                    type="text"
                    placeholder="John Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none transition-colors text-slate-900"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-[#1E293B] font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none transition-colors text-slate-900"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-[#1E293B] font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none transition-colors text-slate-900"
                  required
                  minLength={6}
                />
              </div>
              {isRegister && (
                <p className="text-slate-500 text-sm mt-1">Minimum 6 characters</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3B82F6] text-white py-3 rounded-xl hover:bg-[#2563EB] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          {/* Demo Accounts */}
          {!isRegister && (
            <div className="mt-8 p-4 bg-slate-100 rounded-xl">
              <p className="text-slate-600 text-sm font-medium mb-2">Demo Accounts:</p>
              <div className="space-y-1 text-sm text-slate-500">
                <p>Student: jamil@student.com / password123</p>
                <p>Teacher: sarah@teacher.com / password123</p>
                <p>Admin: admin@classflow.com / admin123</p>
              </div>
            </div>
          )}

          {/* Toggle Login/Register */}
          <p className="text-center mt-8 text-slate-600">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-[#3B82F6] hover:underline font-medium"
            >
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
