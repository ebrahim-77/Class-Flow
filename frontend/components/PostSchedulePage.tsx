import { Layout } from './Layout';
import type { Page } from '../App';
import { Calendar, Clock, MapPin, BookOpen, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { scheduleAPI, roomAPI } from '../src/api';

interface PostSchedulePageProps {
  onNavigate: (page: Page) => void;
}

interface Room {
  _id: string;
  name: string;
  building: string;
  capacity: number;
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

type DegreeOption = 'BSc Engg' | 'MSc Engg (Regular)' | 'MSc Engg (Evening)' | 'PhD Program';

const degreeOptions: DegreeOption[] = ['BSc Engg', 'MSc Engg (Regular)', 'MSc Engg (Evening)', 'PhD Program'];

const degreeNeedsBatch = (degree: DegreeOption | '') => degree === 'BSc Engg' || degree === 'MSc Engg (Regular)' || degree === 'MSc Engg (Evening)';

export function PostSchedulePage({ onNavigate }: PostSchedulePageProps) {
  const [courseName, setCourseName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [degree, setDegree] = useState<DegreeOption | ''>('');
  const [batch, setBatch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingConflict, setCheckingConflict] = useState(false);
  
  const [hasConflict, setHasConflict] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState<SuggestedSlot[]>([]);
  const [suggestedRooms, setSuggestedRooms] = useState<SuggestedRoom[]>([]);
  const [noSlotsAvailable, setNoSlotsAvailable] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Get day name from date
  function getDayFromDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (degree === 'PhD Program') {
      setBatch('');
    }
  }, [degree]);

  async function fetchRooms() {
    try {
      setLoading(true);
      const response = await roomAPI.getAll();
      if (response.data.success) {
        setRooms(response.data.rooms);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setError('Failed to load rooms. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }

  // Check for conflicts when room, date, or time changes
  useEffect(() => {
    if (roomId && selectedDate && startTime && endTime) {
      checkConflictAsync();
    } else {
      setHasConflict(false);
      setSuggestedSlots([]);
      setSuggestedRooms([]);
      setNoSlotsAvailable(false);
    }
  }, [roomId, selectedDate, startTime, endTime]);

  async function checkConflictAsync() {
    if (!roomId || !selectedDate || !startTime || !endTime) return;
    
    // Validate end time is after start time
    if (endTime <= startTime) {
      setError('End time must be after start time');
      return;
    }
    
    setError('');
    setCheckingConflict(true);
    
    try {
      const response = await scheduleAPI.checkConflict({
        roomId,
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

  function formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
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
    setRoomId(room._id);
    setHasConflict(false);
    setSuggestedSlots([]);
    setSuggestedRooms([]);
    setNoSlotsAvailable(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (hasConflict) {
      setError('Cannot submit: There is a scheduling conflict.');
      return;
    }
    
    if (!courseName || !roomId || !degree || !selectedDate || !startTime || !endTime) {
      setError('Please fill in all required fields.');
      return;
    }

    if (degreeNeedsBatch(degree)) {
      const parsedBatch = Number(batch);
      if (!batch || !Number.isInteger(parsedBatch) || parsedBatch < 1) {
        setError('Batch is required and must be a valid integer.');
        return;
      }
    }
    
    if (endTime <= startTime) {
      setError('End time must be after start time.');
      return;
    }
    
    setError('');
    setSubmitting(true);
    
    try {
      const response = await scheduleAPI.create({
        courseName,
        roomId,
        degree,
        ...(degreeNeedsBatch(degree) ? { batch: Number(batch) } : {}),
        date: selectedDate,
        startTime,
        endTime
      });
      
      if (response.data.success) {
        setSubmitted(true);
        // Reset form after 2 seconds
        setTimeout(() => {
          setSubmitted(false);
          setCourseName('');
          setRoomId('');
          setDegree('');
          setBatch('');
          setSelectedDate('');
          setStartTime('');
          setEndTime('');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Failed to create schedule:', err);
      const responseData = err.response?.data;
      
      // Handle conflict response from server
      if (responseData?.hasConflict) {
        setHasConflict(true);
        setSuggestedSlots(responseData.suggestedSlots || []);
        setSuggestedRooms(responseData.suggestedRooms || []);
        setNoSlotsAvailable(responseData.noSlotsAvailable || false);
        setError(responseData.message || 'This room is already booked at the selected time.');
      } else {
        setError(responseData?.message || 'Failed to create schedule. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const selectedRoom = rooms.find(r => r._id === roomId);

  return (
    <Layout currentPage="post-schedule" onNavigate={onNavigate} title="Post Schedule">
      <div className="mx-auto w-full max-w-[480px] px-4 pb-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#1E293B] mb-2">Create Class Schedule</h2>
          <p className="text-slate-600">Add a new class to the university timetable</p>
        </div>

        {/* Success Message */}
        {submitted && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700">Schedule posted successfully! It will appear in your timetable.</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Conflict Warning with Suggestions */}
        {hasConflict && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <span className="text-red-700 font-medium">Schedule Conflict Detected</span>
                  <p className="text-red-600 text-sm">This room is already booked for the selected time.</p>
              </div>
            </div>

              {suggestedRooms.length > 0 && (
                <div className="mt-4 pt-4 border-t border-red-200">
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
                <p className="text-slate-700 font-medium mb-2">Available time slots for this room:</p>
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

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-slate-600 mt-2">Loading rooms...</p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-5">
            {/* Course Name */}
            <div>
              <label htmlFor="course" className="flex items-center gap-2 text-[#1E293B] font-medium mb-2">
                <BookOpen className="w-4 h-4" />
                Course Name *
              </label>
              <input
                id="course"
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g., Data Structures, Web Development"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
                required
              />
            </div>

            {/* Degree Selection */}
            <div>
              <label htmlFor="degree" className="block text-[#1E293B] font-medium mb-2">
                Degree *
              </label>
              <select
                id="degree"
                value={degree}
                onChange={(e) => setDegree(e.target.value as DegreeOption | '')}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
                required
              >
                <option value="">Select degree</option>
                {degreeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Batch Input (conditional) */}
            {degreeNeedsBatch(degree) && (
              <div>
                <label htmlFor="batch" className="block text-[#1E293B] font-medium mb-2">
                  Batch *
                </label>
                <input
                  id="batch"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  placeholder="e.g., 13"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
                  required
                />
              </div>
            )}

            {/* Room Selection */}
            <div>
              <label htmlFor="room" className="flex items-center gap-2 text-[#1E293B] font-medium mb-2">
                <MapPin className="w-4 h-4" />
                Room *
              </label>
              <select
                id="room"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
                required
              >
                <option value="">Select a room</option>
                {rooms.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} - {r.building} (Capacity: {r.capacity})
                  </option>
                ))}
              </select>
              {selectedRoom && (
                <p className="text-sm text-slate-500 mt-1">
                  Building: {selectedRoom.building} | Capacity: {selectedRoom.capacity}
                </p>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label htmlFor="date" className="flex items-center gap-2 text-[#1E293B] font-medium mb-2">
                <Calendar className="w-4 h-4" />
                Date *
              </label>
              <input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getTodayDate()}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
                required
              />
              {selectedDate && (
                <p className="text-sm text-slate-500 mt-1">
                  Day: {getDayFromDate(selectedDate)}
                </p>
              )}
            </div>

            {/* Time Selection */}
            <div className="space-y-4">
              <div>
                <label htmlFor="startTime" className="flex items-center gap-2 text-[#1E293B] font-medium mb-2">
                  <Clock className="w-4 h-4" />
                  Start Time *
                </label>
                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
                  required
                />
              </div>
              <div>
                <label htmlFor="endTime" className="flex items-center gap-2 text-[#1E293B] font-medium mb-2">
                  <Clock className="w-4 h-4" />
                  End Time *
                </label>
                <input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
                  required
                />
              </div>
            </div>

            {/* Conflict Check Status */}
            {checkingConflict && (
              <div className="flex items-center gap-2 text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Checking for conflicts...</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={hasConflict || submitting || checkingConflict}
              className="w-full py-3 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-colors shadow-lg shadow-blue-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Posting Schedule...
                </>
              ) : (
                'Post Schedule'
              )}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
