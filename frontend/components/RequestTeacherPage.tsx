import { Layout } from './Layout';
import type { Page } from '../App';
import { UserCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface RequestTeacherPageProps {
  onNavigate: (page: Page) => void;
}

export function RequestTeacherPage({ onNavigate }: RequestTeacherPageProps) {
  const { user, requestTeacherRole, refreshUser } = useAuth();
  const [reason, setReason] = useState('');
  const [department, setDepartment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check for role/status updates periodically if approved
  useEffect(() => {
    if (user?.teacherRequestStatus === 'approved' && user?.role === 'student') {
      // Role hasn't updated yet, refresh to check
      const interval = setInterval(async () => {
        await refreshUser();
      }, 3000); // Check every 3 seconds
      
      return () => clearInterval(interval);
    }
  }, [user?.teacherRequestStatus, user?.role, refreshUser]);

  const departments = [
    'Computer Science',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Business Administration',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const success = await requestTeacherRole(reason, department);
    
    if (!success) {
      setError('Failed to submit request. Please try again.');
    }
    
    setSubmitting(false);
  };

  const getStatusDisplay = () => {
    switch (user?.teacherRequestStatus) {
      case 'pending':
        return (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <Clock className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-medium text-amber-700">Request Pending</p>
              <p className="text-amber-600 text-sm">Your request is being reviewed by an administrator.</p>
            </div>
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-700">Request Approved</p>
              <p className="text-green-600 text-sm">Congratulations! You now have teacher privileges.</p>
            </div>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <XCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-medium text-red-700">Request Rejected</p>
              <p className="text-red-600 text-sm">Your request was not approved. You may submit a new request.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const canSubmit = user?.teacherRequestStatus === 'none' || user?.teacherRequestStatus === 'rejected';

  return (
    <Layout currentPage="request-teacher" onNavigate={onNavigate} title="Request Teacher Role">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#1E293B] mb-2">Request Teacher Role</h2>
          <p className="text-slate-600">
            Submit a request to become a teacher and gain access to post class schedules.
          </p>
        </div>

        {/* Status Display */}
        {user?.teacherRequestStatus !== 'none' && (
          <div className="mb-6">
            {getStatusDisplay()}
          </div>
        )}

        {/* Info Card */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
                  <p className="font-medium text-blue-700">Teacher Privileges Include:</p>
                  <ul className="text-blue-600 text-sm mt-2 space-y-1">
                    <li>• Post and manage class schedules</li>
                    <li>• Book rooms for classes</li>
                    <li>• View all timetables</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
            )}

            {/* Request Form */}
            {canSubmit && (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                {/* Department */}
                <div>
                  <label htmlFor="department" className="block text-[#1E293B] font-medium mb-2">
                    Department
                  </label>
                  <select
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
                    required
                  >
                    <option value="">Select your department</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Reason */}
                <div>
                  <label htmlFor="reason" className="block text-[#1E293B] font-medium mb-2">
                    Reason for Request
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why you need teacher privileges..."
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900 min-h-[120px] resize-none"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-colors shadow-lg shadow-blue-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            )}

            {/* Already Pending Message */}
            {user?.teacherRequestStatus === 'pending' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
                <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h3 className="font-semibold text-[#1E293B] mb-2">Request In Progress</h3>
                <p className="text-slate-600">
                  Please wait for an administrator to review your request. This usually takes 1-2 business days.
                </p>
              </div>
            )}
          </div>
    </Layout>
  );
}
