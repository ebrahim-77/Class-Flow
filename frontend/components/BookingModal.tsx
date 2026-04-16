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

interface SuggestedSlot {
  startTime: string;
  endTime: string;
}

interface SuggestedRoom {
  _id: string;
  name: string;
  building: string;
  capacity: number;
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
  
  // Conflict detection state
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState<SuggestedSlot[]>([]);
  const [suggestedRooms, setSuggestedRooms] = useState<SuggestedRoom[]>([]);
  const [noSlotsAvailable, setNoSlotsAvailable] = useState(false);

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Time slots from 8 AM to 5 PM
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  // Format time for display
  function formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  // Check for conflicts when room, date, or time changes
  useEffect(() => {
    if (selectedRoomId && selectedDate && startTime && endTime && endTime > startTime) {
      checkConflictAsync();
    } else {
      setHasConflict(false);
      setSuggestedSlots([]);
      setSuggestedRooms([]);
      setNoSlotsAvailable(false);
    }
  }, [selectedRoomId, selectedDate, startTime, endTime]);

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

  async function checkConflictAsync() {
    setCheckingConflict(true);
    setError('');
    
    try {
      const response = await bookingAPI.checkConflict({
        roomId: selectedRoomId,
        date: selectedDate,
        startTime,
        endTime
      });
      
      if (response.data.success) {
        setHasConflict(response.data.hasConflict);
        setSuggestedSlots(response.data.suggestedSlots || []);
        setSuggestedRooms(response.data.suggestedRooms || []);
        setNoSlotsAvailable(response.data.noSlotsAvailable || false);
      }
    } catch (err) {
      console.error('Failed to check conflict:', err);
    } finally {
      setCheckingConflict(false);
    }
  }

  function selectSuggestedSlot(slot: SuggestedSlot) {
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setHasConflict(false);
    setSuggestedSlots([]);
    setSuggestedRooms([]);
    setNoSlotsAvailable(false);
  }

  function selectSuggestedRoom(room: SuggestedRoom) {
    setSelectedRoomId(room._id);
    setHasConflict(false);
    setSuggestedSlots([]);
    setSuggestedRooms([]);
    setNoSlotsAvailable(false);
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

    if (hasConflict) {
      setError('Cannot submit: There is a booking conflict.');
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
      const responseData = err.response?.data;
      
      // Handle conflict response from server
      if (responseData?.hasConflict) {
        setHasConflict(true);
        setSuggestedSlots(responseData.suggestedSlots || []);
        setSuggestedRooms(responseData.suggestedRooms || []);
        setNoSlotsAvailable(responseData.noSlotsAvailable || false);
        setError(responseData.message || 'This room is already booked at the selected time.');
      } else {
        setError(responseData?.message || 'Failed to submit booking. Please try again.');
      }
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
          <h2 className="text-xl font-semibold text-[#1E293B] mb-2">Booking Confirmed</h2>
          <p className="text-slate-600">Your room booking has been saved successfully.</p>
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
          {error && !hasConflict && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Conflict Warning with Suggestions */}
          {hasConflict && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <span className="text-red-700 font-medium">Booking Conflict Detected</span>
                  <p className="text-red-600 text-sm">This room is already booked for the selected time.</p>
                </div>
              </div>

              {suggestedRooms.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-slate-700 font-medium mb-2">Try another room at the same time:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedRooms.map((room) => (
                      <button
                        key={room._id}
                        type="button"
                        onClick={() => selectSuggestedRoom(room)}
                        className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-left text-sm text-blue-700 transition-colors hover:bg-blue-50"
                      >
                        <span className="block font-medium">{room.name}</span>
                        <span className="block text-xs text-blue-600">{room.building} • Capacity {room.capacity}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {noSlotsAvailable ? (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-red-700 font-medium">No available time slots on this day for this room.</p>
                  <p className="text-red-600 text-sm mt-1">Please try a different date or room.</p>
                </div>
              ) : suggestedSlots.length > 0 && (
                <div className="mt-4 pt-4 border-t border-red-200">
                  <p className="text-slate-700 font-medium mb-2">Available time slots:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectSuggestedSlot(slot)}
                        className="px-3 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                      >
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                <select
                  id="start-time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
                  required
                >
                  <option value="">Select time</option>
                  {timeSlots.slice(0, -1).map((t) => (
                    <option key={t} value={t}>{formatTime(t)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="end-time" className="block text-[#1E293B] font-medium mb-2">
                End Time *
              </label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  id="end-time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
                  required
                >
                  <option value="">Select time</option>
                  {timeSlots.slice(1).map((t) => (
                    <option key={t} value={t}>{formatTime(t)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Conflict Check Status */}
          {checkingConflict && (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Checking availability...</span>
            </div>
          )}

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
            disabled={!selectedRoomId || !selectedDate || !startTime || !endTime || !purpose || submitting || hasConflict || checkingConflict}
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
