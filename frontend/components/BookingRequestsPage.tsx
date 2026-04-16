import { Layout } from './Layout';
import type { Page } from '../App';
import { CheckCircle, XCircle, Clock, MapPin, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { bookingAPI } from '../src/api';

interface BookingRequestsPageProps {
  onNavigate: (page: Page) => void;
}

interface BookingRequest {
  _id: string;
  userName: string;
  userEmail: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  userId: {
    role: string;
  };
}

export function BookingRequestsPage({ onNavigate }: BookingRequestsPageProps) {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getAll();
      // Filter out teacher bookings - they are auto-approved
      const studentBookings = response.data.bookings.filter(
        (booking: BookingRequest) => booking.userId.role === 'student'
      );
      setRequests(studentBookings);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch requests:', err);
      setError('Failed to load booking requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await bookingAPI.approve(id);
      fetchRequests();
    } catch (err: any) {
      alert('Failed to approve booking: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await bookingAPI.reject(id);
      fetchRequests();
    } catch (err: any) {
      alert('Failed to reject booking: ' + (err.response?.data?.message || err.message));
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
    <Layout currentPage="booking-requests" onNavigate={onNavigate} title="Booking Requests">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-[#1E293B] mb-2">Booking Requests</h2>
        <p className="text-slate-600">Review and manage room booking requests.</p>
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
          {!loading && pendingRequests.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Pending Requests</h3>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request._id} className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h4 className="font-semibold text-[#1E293B]">{request.userName}</h4>
                          <span className="text-slate-500 text-sm">{request.userEmail}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="w-4 h-4" />
                            <span>Room {request.roomName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(request.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="w-4 h-4" />
                            <span>{request.startTime} - {request.endTime}</span>
                          </div>
                        </div>
                        <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">
                          <span className="font-medium">Purpose:</span> {request.purpose}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-6">
                        <button
                          onClick={() => handleApprove(request._id)}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2"
                          aria-label="Approve booking"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request._id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                          aria-label="Reject booking"
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

          {/* Processed Requests Table */}
          {processedRequests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Processed Requests</h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-4 font-medium text-slate-700">User</th>
                      <th className="text-left p-4 font-medium text-slate-700">Room</th>
                      <th className="text-left p-4 font-medium text-slate-700">Date & Time</th>
                      <th className="text-left p-4 font-medium text-slate-700">Purpose</th>
                      <th className="text-left p-4 font-medium text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedRequests.map((request) => (
                      <tr key={request._id} className="border-b border-slate-100 last:border-0">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-[#1E293B]">{request.userName}</p>
                            <p className="text-slate-500 text-sm">{request.userEmail}</p>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">{request.roomName}</td>
                        <td className="p-4 text-slate-600">
                          <div>{new Date(request.date).toLocaleDateString()}</div>
                          <div className="text-sm text-slate-500">{request.startTime} - {request.endTime}</div>
                        </td>
                        <td className="p-4 text-slate-600">{request.purpose}</td>
                        <td className="p-4">{getStatusBadge(request.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

      {/* Empty State */}
      {!loading && requests.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-semibold text-[#1E293B] mb-2">No Student Booking Requests</h3>
          <p className="text-slate-600">There are no student booking requests. Teacher bookings are auto-approved.</p>
        </div>
      )}
    </Layout>
  );
}
