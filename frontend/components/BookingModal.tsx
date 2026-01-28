import { X, Calendar, Clock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { roomAPI, bookingAPI } from '../src/api';

interface BookingModalProps {
  onClose: () => void;
  preselectedRoom?: string | null;
}

interface Room {
  _id: string;
  name: string;
  building: string;
  capacity: number;
  status: string;
}

export function BookingModal({ onClose, preselectedRoom }: BookingModalProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    try {
      setLoadingRooms(true);
      const response = await roomAPI.getAll();
      if (response.data.success) {
        const availableRooms = response.data.rooms.filter((r: Room) => r.status === 'available');
        setRooms(availableRooms);
        
        // If a room was preselected by name, find its ID
        if (preselectedRoom && availableRooms.length > 0) {
          const matchedRoom = availableRooms.find((r: Room) => r.name === preselectedRoom);
          if (matchedRoom) {
            setSelectedRoomId(matchedRoom._id);
          } else {
            setSelectedRoomId(availableRooms[0]._id);
          }
        } else if (availableRooms.length > 0) {
          setSelectedRoomId(availableRooms[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setError('Failed to load rooms.');
    } finally {
      setLoadingRooms(false);
    }
  }

  const handleSubmit = async () => {
    if (!selectedRoomId || !selectedDate || !startTime || !endTime || !purpose) {
      setError('Please fill in all fields.');
      return;
    }

    if (endTime <= startTime) {
      setError('End time must be after start time.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await bookingAPI.create({
        roomId: selectedRoomId,
        date: selectedDate,
        startTime,
        endTime,
        purpose
      });

      if (response.data.success) {
        setSubmitted(true);
        // Close modal after showing success
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Failed to create booking:', err);
      const message = err.response?.data?.message || 'Failed to submit booking. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-[#1E293B] mb-2">Booking Submitted!</h2>
          <p className="text-slate-600">
            Your booking request has been submitted and is pending approval from an administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#1E293B]">Book a Room</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Room Selection */}
          <div>
            <label htmlFor="room" className="block text-[#1E293B] font-medium mb-2">
              Room *
            </label>
            {loadingRooms ? (
              <div className="flex items-center gap-2 text-slate-600 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading rooms...</span>
              </div>
            ) : rooms.length === 0 ? (
              <p className="text-slate-500 py-3">No available rooms found.</p>
            ) : (
              <select
                id="room"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
              >
                {rooms.map((room) => (
                  <option key={room._id} value={room._id}>
                    {room.name} - {room.building} (Capacity: {room.capacity})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <label htmlFor="date" className="block text-[#1E293B] font-medium mb-2">
              Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getTodayDate()}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
                required
              />
            </div>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-time" className="block text-[#1E293B] font-medium mb-2">
                Start Time *
              </label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="end-time" className="block text-[#1E293B] font-medium mb-2">
                End Time *
              </label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className="block text-[#1E293B] font-medium mb-2">
              Purpose *
            </label>
            <textarea
              id="purpose"
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Group study session, project meeting..."
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none resize-none text-slate-900"
              required
            ></textarea>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedRoomId || !selectedDate || !startTime || !endTime || !purpose || submitting}
            className="flex-1 py-3 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-colors shadow-lg shadow-blue-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
