import { Layout } from './Layout';
import type { Page } from '../App';
import { MapPin, Users, Wifi, Monitor, CheckCircle, XCircle, Clock, Loader2, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { roomAPI } from '../src/api';

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

interface RoomWithAvailability extends Room {
  id: string;
  isAvailable: boolean;
}

export function RoomsPage({ onNavigate }: RoomsPageProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availabilityMap, setAvailabilityMap] = useState<{ [roomId: string]: boolean }>({});
  const [filterApplied, setFilterApplied] = useState(false);
  
  // Filter states
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStartTime, setSelectedStartTime] = useState('08:00');
  const [selectedEndTime, setSelectedEndTime] = useState('09:00');
  const [validationError, setValidationError] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize date to today
  useEffect(() => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    setSelectedDate(todayString);
  }, []);

  // Fetch rooms on mount and check availability for today 08:00-09:00
  useEffect(() => {
    fetchRoomsAndCheckAvailability();
  }, []);

  async function fetchRoomsAndCheckAvailability() {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all rooms
      const roomsResponse = await roomAPI.getAll();
      if (roomsResponse.data.success) {
        setRooms(roomsResponse.data.rooms);
      }

      // Check availability for today 08:00-09:00
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      try {
        const availResponse = await roomAPI.checkAvailability(todayString, '08:00', '09:00');
        const availMap: { [roomId: string]: boolean } = {};
        (availResponse.data || []).forEach((room: RoomWithAvailability) => {
          availMap[String(room.id)] = room.isAvailable;
        });
        setAvailabilityMap(availMap);
        setFilterApplied(true);
      } catch (availErr) {
        console.error('Failed to check initial availability:', availErr);
        // Fail silently for initial load
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setError('Failed to load rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Generate time slots (30-minute increments from 08:00 to 17:00)
  const timeSlots = (() => {
    const slots = [];
    for (let hour = 8; hour < 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    slots.push('17:00');
    return slots;
  })();

  const handleSearch = async () => {
    setValidationError('');
    setError('');
    
    // Validate inputs
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      setValidationError('Please select date and time');
      return;
    }

    // Validate end time is after start time
    if (selectedEndTime <= selectedStartTime) {
      setValidationError('End time must be after start time');
      return;
    }

    const parsedDate = new Date(selectedDate);
    if (Number.isNaN(parsedDate.getTime())) {
      setValidationError('Invalid date format');
      return;
    }

    const formattedDate = parsedDate.toISOString().split('T')[0];
    const startTime = selectedStartTime;
    const endTime = selectedEndTime;

    try {
      setSearchLoading(true);
      console.log('Sending request:', { date: formattedDate, startTime, endTime });
      const response = await roomAPI.checkAvailability(formattedDate, startTime, endTime);

      const availMap: { [roomId: string]: boolean } = {};
      (response.data || []).forEach((room: RoomWithAvailability) => {
        availMap[String(room.id)] = room.isAvailable;
      });
      setAvailabilityMap(availMap);
      setFilterApplied(true);
    } catch (error) {
      console.error(error);
      setError('Failed to check availability. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const getAvailabilityBadge = (roomId: string) => {
    if (!filterApplied) {
      return {
        color: 'bg-gray-100 text-gray-700',
        label: 'Available',
        icon: CheckCircle
      };
    }

    if (availabilityMap[roomId]) {
      return {
        color: 'bg-green-100 text-green-700',
        label: 'Available',
        icon: CheckCircle
      };
    } else {
      return {
        color: 'bg-red-100 text-red-700',
        label: 'Not Available',
        icon: XCircle
      };
    }
  };

  return (
    <Layout currentPage="rooms" onNavigate={onNavigate} title="Rooms">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#1E293B] mb-2">Check Room Availability</h2>
          <p className="text-slate-600">View room availability for a specific date and time</p>
        </div>
        <button
          onClick={fetchRoomsAndCheckAvailability}
          disabled={loading}
          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Check Availability</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Input */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-2">Date</label>
            <input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Start Time Input */}
          <div>
            <label htmlFor="start-time" className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
            <select
              id="start-time"
              value={selectedStartTime}
              onChange={(e) => setSelectedStartTime(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeSlots.map((time) => (
                <option key={`start-${time}`} value={time}>{time}</option>
              ))}
            </select>
          </div>

          {/* End Time Input */}
          <div>
            <label htmlFor="end-time" className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
            <select
              id="end-time"
              value={selectedEndTime}
              onChange={(e) => setSelectedEndTime(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeSlots.map((time) => (
                <option key={`end-${time}`} value={time}>{time}</option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="w-full py-2 px-4 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] disabled:bg-slate-400 transition-colors font-medium flex items-center justify-center gap-2"
            >
              {searchLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </div>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-red-700">{validationError}</span>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={fetchRoomsAndCheckAvailability}
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
            const badge = getAvailabilityBadge(room._id);
            const BadgeIcon = badge.icon;
            
            return (
              <div
                key={room._id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Room Header */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-[#1E293B]">{room.name}</h3>
                    <span className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${badge.color}`}>
                      <BadgeIcon className="w-3 h-3" />
                      {badge.label}
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
                  <div className="flex flex-wrap gap-2">
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
