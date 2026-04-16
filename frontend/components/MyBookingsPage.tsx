import { Layout } from './Layout';
import type { Page } from '../App';
import { Clock, CheckCircle, XCircle, MapPin, Calendar, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { bookingAPI } from '../src/api';

interface MyBookingsPageProps {
  onNavigate: (page: Page) => void;
}

interface Booking {
  _id: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

export function MyBookingsPage({ onNavigate }: MyBookingsPageProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getMyBookings();
      setBookings(response.data.bookings);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await bookingAPI.cancel(id);
      fetchBookings();
    } catch (err: any) {
      alert('Failed to cancel booking: ' + (err.response?.data?.message || err.message));
    }
  };

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
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const upcomingBookings = bookings.filter(b => b.status === 'approved' && new Date(b.date) >= new Date());
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const pastBookings = bookings.filter(b => b.status === 'rejected' || b.status === 'cancelled' || (b.status === 'approved' && new Date(b.date) < new Date()));

  return (
    <Layout currentPage="my-bookings" onNavigate={onNavigate} title="My Bookings">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-[#1E293B] mb-2">My Room Bookings</h2>
          <p className="text-slate-600">View your bookings and manage upcoming room reservations.</p>
        </div>
        <button
          onClick={() => onNavigate('rooms')}
          className="px-4 py-2 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-colors shadow-lg shadow-blue-500/30"
        >
          Book a Room
        </button>
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
          <p className="text-slate-600 mt-4">Loading bookings...</p>
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E293B]">{upcomingBookings.length}</p>
                <p className="text-slate-600 text-sm">Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E293B]">{pendingBookings.length}</p>
                <p className="text-slate-600 text-sm">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E293B]">{pastBookings.length}</p>
                <p className="text-slate-600 text-sm">Past/Rejected</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Bookings */}
      {!loading && pendingBookings.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Pending Approval</h3>
              <div className="space-y-4">
                {pendingBookings.map((booking) => (
                  <div key={booking._id} className="bg-white rounded-xl border border-amber-200 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                          <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-[#1E293B]">Room {booking.roomName}</span>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="flex items-center gap-4 text-slate-600 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(booking.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {booking.startTime} - {booking.endTime}
                            </span>
                          </div>
                          <p className="text-slate-500 text-sm mt-1">{booking.purpose}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancel(booking._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Cancel booking"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved Bookings */}
          {!loading && upcomingBookings.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Upcoming Bookings</h3>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking._id} className="bg-white rounded-xl border border-green-200 p-6">\n                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-[#1E293B]">Room {booking.roomName}</span>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="flex items-center gap-4 text-slate-600 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(booking.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {booking.startTime} - {booking.endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-600">{booking.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Bookings */}
          {!loading && pastBookings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Past Bookings</h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-4 font-medium text-slate-700">Room</th>
                      <th className="text-left p-4 font-medium text-slate-700">Date & Time</th>
                      <th className="text-left p-4 font-medium text-slate-700">Purpose</th>
                      <th className="text-left p-4 font-medium text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastBookings.map((booking) => (
                      <tr key={booking._id} className="border-b border-slate-100 last:border-0">
                        <td className="p-4 text-slate-900">{booking.roomName}</td>
                        <td className="p-4 text-slate-600">
                          <div>{new Date(booking.date).toLocaleDateString()}</div>
                          <div className="text-sm text-slate-500">{booking.startTime} - {booking.endTime}</div>
                        </td>
                        <td className="p-4 text-slate-600">{booking.purpose}</td>
                        <td className="p-4">{getStatusBadge(booking.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && bookings.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="font-semibold text-[#1E293B] mb-2">No Bookings Yet</h3>
              <p className="text-slate-600 mb-4">You haven't made any room bookings yet.</p>
              <button
                onClick={() => onNavigate('rooms')}
                className="px-4 py-2 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-colors"
              >
                Book a Room
              </button>
            </div>
          )}
    </Layout>
  );
}
