import { Layout } from './Layout';
import type { Page } from '../App';
import { Calendar, Clock, MapPin, Search, User, AlertCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { scheduleAPI } from '../src/api';

interface MyBookingsPageProps {
  onNavigate: (page: Page) => void;
}

interface Schedule {
  _id: string;
  courseName: string;
  teacherName?: string;
  teacherId?: { name?: string };
  roomName: string;
  roomId?: { name?: string };
  date: string;
  startTime: string;
  endTime: string;
}

export function MyBookingsPage({ onNavigate }: MyBookingsPageProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  const resolveRoomName = (schedule: Schedule) => {
    return schedule.roomName || schedule.roomId?.name || 'Unknown room';
  };

  const resolveTeacherName = (schedule: Schedule) => {
    return schedule.teacherName || schedule.teacherId?.name || 'Unknown teacher';
  };

  const selectedDateType = useMemo(() => {
    if (!selectedDate) return 'none';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const picked = new Date(selectedDate);
    picked.setHours(0, 0, 0, 0);

    if (picked < today) return 'past';
    if (picked > today) return 'future';
    return 'today';
  }, [selectedDate]);

  const nowTime = useMemo(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }, [hasSearched, selectedDate, searchLoading]);

  const classifiedSchedules = useMemo(() => {
    const upcoming: Schedule[] = [];
    const past: Schedule[] = [];

    if (selectedDateType === 'past') {
      return { upcoming, past: [...schedules] };
    }

    if (selectedDateType === 'future') {
      return { upcoming: [...schedules], past };
    }

    schedules.forEach((schedule) => {
      if (schedule.startTime > nowTime) {
        upcoming.push(schedule);
      } else if (schedule.endTime < nowTime) {
        past.push(schedule);
      } else {
        upcoming.push(schedule);
      }
    });

    return { upcoming, past };
  }, [schedules, selectedDateType, nowTime]);

  const handleSearch = async () => {
    setValidationError('');

    if (!selectedDate) {
      setValidationError('Please select a date');
      return;
    }

    try {
      setSearchLoading(true);
      const response = await scheduleAPI.getAll({ date: selectedDate });
      setSchedules(response.data.schedules || []);
      setError('');
      setHasSearched(true);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setError('Failed to load schedules');
      setHasSearched(true);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <Layout currentPage="my-bookings" onNavigate={onNavigate} title="Schedules by Date">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h2 className="text-xl font-semibold text-[#1E293B] mb-2">View All Schedules by Date</h2>
          <p className="text-slate-600">Select a date to view all classes for that day.</p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full">
            <label htmlFor="schedule-date" className="block text-sm font-medium text-slate-700 mb-2">
              Date
            </label>
            <input
              id="schedule-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-full sm:w-auto sm:min-w-[140px] sm:self-end">
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="w-full px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] disabled:bg-slate-400 transition-colors flex items-center justify-center gap-2"
            >
              {searchLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

        {validationError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            {validationError}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {searchLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4">Loading schedules...</p>
        </div>
      )}

      {/* Initial Prompt */}
      {!hasSearched && !searchLoading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-semibold text-[#1E293B] mb-2">Select a date and click search to view schedules</h3>
        </div>
      )}

      {/* Upcoming Classes */}
      {hasSearched && !searchLoading && classifiedSchedules.upcoming.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#1E293B] mb-3">Upcoming Classes</h3>
          <div className="space-y-4">
            {classifiedSchedules.upcoming.map((schedule) => (
              <div key={schedule._id} className="bg-white rounded-xl border border-slate-200 p-5">
                <h4 className="text-lg font-semibold text-[#1E293B] mb-3">{schedule.courseName}</h4>

                <div className="space-y-2 text-slate-600 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{schedule.startTime} - {schedule.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{resolveRoomName(schedule)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{resolveTeacherName(schedule)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Classes */}
      {hasSearched && !searchLoading && classifiedSchedules.past.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#1E293B] mb-3">Past Classes</h3>
          <div className="space-y-4">
            {classifiedSchedules.past.map((schedule) => (
              <div key={schedule._id} className="bg-white rounded-xl border border-slate-200 p-5">
                <h4 className="text-lg font-semibold text-[#1E293B] mb-3">{schedule.courseName}</h4>

                <div className="space-y-2 text-slate-600 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{schedule.startTime} - {schedule.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{resolveRoomName(schedule)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{resolveTeacherName(schedule)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State After Search */}
      {hasSearched && !searchLoading && classifiedSchedules.upcoming.length === 0 && classifiedSchedules.past.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-semibold text-[#1E293B] mb-2">No schedules found for this date</h3>
        </div>
      )}
    </Layout>
  );
}
