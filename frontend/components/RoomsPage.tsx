import { Layout } from './Layout';
import type { Page } from '../App';
import { MapPin, Users, Wifi, Monitor, CheckCircle, XCircle, Clock, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BookingModal } from './BookingModal';
import { roomAPI } from '../src/api';
import { useAuth } from '../context/AuthContext';

interface RoomsPageProps {
  onNavigate: (page: Page) => void;
}

interface Room {
  _id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance';
  features: string[];
}

export function RoomsPage({ onNavigate }: RoomsPageProps) {
  const { user } = useAuth();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch rooms from API on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    try {
      setLoading(true);
      setError('');
      const response = await roomAPI.getAll();
      if (response.data.success) {
        setRooms(response.data.rooms);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setError('Failed to load rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'occupied':
        return 'bg-red-100 text-red-700';
      case 'maintenance':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return CheckCircle;
      case 'occupied':
        return XCircle;
      case 'maintenance':
        return Clock;
      default:
        return CheckCircle;
    }
  };

  const handleBookRoom = (roomName: string) => {
    setSelectedRoomForBooking(roomName);
    setShowBookingModal(true);
  };

  return (
    <Layout currentPage="rooms" onNavigate={onNavigate} title="Rooms">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#1E293B] mb-2">Available Rooms</h2>
          <p className="text-slate-600">Browse rooms. Teachers can book them for classes or meetings.</p>
        </div>
        <button
          onClick={fetchRooms}
          disabled={loading}
          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Refresh rooms"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={fetchRooms}
            className="ml-auto text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-slate-600 mt-2">Loading rooms...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No Rooms Available</h3>
          <p className="text-slate-500">No rooms have been added yet. Contact your administrator.</p>
        </div>
      ) : (
        /* Room Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const StatusIcon = getStatusIcon(room.status);
            
            return (
              <div
                key={room._id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Room Header */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-[#1E293B]">{room.name}</h3>
                    <span className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${getStatusColor(room.status)}`}>
                      <StatusIcon className="w-3 h-3" />
                      {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{room.floor}, {room.building}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Capacity: {room.capacity} people</span>
                    </div>
                  </div>
                </div>

                {/* Room Features */}
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(room.features || []).map((feature, idx) => {
                      const Icon = feature.includes('Projector') ? Monitor : Wifi;
                      return (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-sm">
                          <Icon className="w-3 h-3" />
                          {feature}
                        </span>
                    );
                  })}
                </div>

                {user?.role === 'teacher' && (
                  <button
                    onClick={() => handleBookRoom(room.name)}
                    disabled={room.status !== 'available'}
                    className={`w-full py-3 rounded-xl transition-colors font-medium ${
                      room.status === 'available'
                        ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-lg shadow-blue-500/30'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {room.status === 'available' ? 'Book Room' : 'Not Available'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {showBookingModal && (
        <BookingModal 
          onClose={() => {
            setShowBookingModal(false);
            setSelectedRoomForBooking(null);
          }} 
          preselectedRoom={selectedRoomForBooking}
        />
      )}
    </Layout>
  );
}
