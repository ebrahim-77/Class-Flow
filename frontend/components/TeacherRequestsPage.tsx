import { Layout } from './Layout';
import type { Page } from '../App';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { teacherRequestAPI } from '../src/api';

interface TeacherRequestsPageProps {
  onNavigate: (page: Page) => void;
}

interface TeacherRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  name: string;
  email: string;
  department: string;
  reason: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export function TeacherRequestsPage({ onNavigate }: TeacherRequestsPageProps) {
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await teacherRequestAPI.getAll();
      setRequests(response.data.requests);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch requests:', err);
      setError('Failed to load teacher requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await teacherRequestAPI.approve(id);
      // Refresh the list
      fetchRequests();
    } catch (err: any) {
      alert('Failed to approve request: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await teacherRequestAPI.reject(id);
      // Refresh the list
      fetchRequests();
    } catch (err: any) {
      alert('Failed to reject request: ' + (err.response?.data?.message || err.message));
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Layout currentPage="teacher-requests" onNavigate={onNavigate} title="Teacher Requests">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-[#1E293B] mb-2">Teacher Role Requests</h2>
        <p className="text-slate-600">Review and manage teacher role requests from students.</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4">Loading requests...</p>
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E293B]">{pendingRequests.length}</p>
                <p className="text-slate-600 text-sm">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E293B]">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
                <p className="text-slate-600 text-sm">Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E293B]">
                  {requests.filter(r => r.status === 'rejected').length}
                </p>
                <p className="text-slate-600 text-sm">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Pending Requests</h3>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request._id} className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#1E293B]">{request.name}</h4>
                          <p className="text-slate-600 text-sm">{request.email}</p>
                          <p className="text-slate-500 text-sm mt-1">
                            Department: {request.department} • Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                          </p>
                          <p className="mt-3 text-slate-700 bg-slate-50 p-3 rounded-lg">
                            "{request.reason}"
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request._id)}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2"
                          aria-label="Approve request"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request._id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                          aria-label="Reject request"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processed Requests */}
          {processedRequests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Processed Requests</h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-4 font-medium text-slate-700">Name</th>
                      <th className="text-left p-4 font-medium text-slate-700">Department</th>
                      <th className="text-left p-4 font-medium text-slate-700">Submitted</th>
                      <th className="text-left p-4 font-medium text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedRequests.map((request) => (
                      <tr key={request._id} className="border-b border-slate-100 last:border-0">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-[#1E293B]">{request.name}</p>
                            <p className="text-slate-500 text-sm">{request.email}</p>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">{request.department}</td>
                        <td className="p-4 text-slate-600">{new Date(request.submittedAt).toLocaleDateString()}</td>
                        <td className="p-4">{getStatusBadge(request.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

      {/* Empty State */}
      {requests.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-semibold text-[#1E293B] mb-2">No Requests</h3>
          <p className="text-slate-600">There are no teacher role requests at this time.</p>
        </div>
      )}
    </Layout>
  );
}
