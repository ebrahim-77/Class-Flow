import { Calendar, DoorOpen, Clock, MapPin, User, BookOpen, Building } from 'lucide-react';
import { Layout } from './Layout';
import type { Page } from '../App';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { scheduleAPI } from '../src/api';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

interface UpcomingClass {
  _id: string;
  courseName: string;
  teacherName: string;
  roomName: string;
  day: string;
  startTime: string;
  endTime: string;
  roomId?: {
    name: string;
    building: string;
    capacity: number;
  };
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'student' || user?.role === 'teacher') {
      fetchUpcomingClasses();
    } else {
      setLoading(false);
    }
  }, [user?.role]);

  async function fetchUpcomingClasses() {
    try {
      setLoading(true);
      const response = await scheduleAPI.getAll();
      if (response.data.success) {
        // Sort by day and time relative to today, get next 5
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
        const currentDayIndex = today === 0 ? 6 : today - 1; // Convert to Mon=0, Tue=1, etc.
        
        const sorted = response.data.schedules
          .map((s: UpcomingClass) => ({
            ...s,
            // Calculate days until this class (for sorting)
            daysUntil: (days.indexOf(s.day) - currentDayIndex + 7) % 7
          }))
          .sort((a: any, b: any) => {
            if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
            return a.startTime.localeCompare(b.startTime);
          })
          .slice(0, 5);
        setUpcomingClasses(sorted);
      }
    } catch (error) {
      console.error('Failed to fetch upcoming classes:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  const getWelcomeMessage = () => {
    switch (user.role) {
      case 'student':
        return 'View your class schedule and request teacher role.';
      case 'teacher':
        return 'Manage your class schedules and room bookings.';
      case 'admin':
        return 'Manage teacher requests and room settings.';
      default:
        return '';
    }
  };

  function formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  // Get the next occurrence date for a given day
  function getNextDate(day: string): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const targetDay = days.indexOf(day);
    const currentDay = today.getDay();
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    return nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <Layout currentPage="dashboard" onNavigate={onNavigate}>
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B] mb-2">
          Welcome back, {user.name}!
        </h1>
        <p className="text-slate-600">{getWelcomeMessage()}</p>
      </div>

      {/* Role Badge */}
      <div className="mb-6">
        <span className={`
          inline-flex items-center px-4 py-2 rounded-full text-sm font-medium
          ${user.role === 'student' ? 'bg-blue-100 text-blue-700' : ''}
          ${user.role === 'teacher' ? 'bg-purple-100 text-purple-700' : ''}
          ${user.role === 'admin' ? 'bg-green-100 text-green-700' : ''}
        `}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
        {user.role === 'student' && user.teacherRequestStatus === 'pending' && (
          <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-700">
            Teacher request pending
          </span>
        )}
      </div>

      {/* Upcoming Classes Section - for students and teachers */}
      {(user.role === 'student' || user.role === 'teacher') && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[#1E293B] mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#3B82F6]" />
            Upcoming Classes
          </h2>
          
          {loading ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-500 mt-2">Loading classes...</p>
            </div>
          ) : upcomingClasses.length > 0 ? (
            <div className="space-y-3">
              {upcomingClasses.map((cls) => (
                <div 
                  key={cls._id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-slate-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-[#1E293B]">{cls.courseName}</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {getNextDate(cls.day)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-[#3B82F6]" />
                      <span>{cls.day}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-[#3B82F6]" />
                      <span>{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-[#3B82F6]" />
                      <span>{cls.roomName}</span>
                    </div>
                    {cls.roomId?.building && (
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4 text-[#3B82F6]" />
                        <span>{cls.roomId.building}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4 text-[#3B82F6]" />
                      <span>{cls.teacherName}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No upcoming classes scheduled.</p>
              <p className="text-slate-400 text-sm mt-1">Check back later for your schedule.</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#1E293B] mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          {user.role === 'student' && (
            <>
              <button
                onClick={() => onNavigate('timetable')}
                className="bg-white rounded-xl px-6 py-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-[#1E293B]">View Timetable</span>
              </button>
              <button
                onClick={() => onNavigate('request-teacher')}
                className="bg-white rounded-xl px-6 py-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-[#1E293B]">Request Teacher Role</span>
              </button>
            </>
          )}

          {user.role === 'teacher' && (
            <>
              <button
                onClick={() => onNavigate('timetable')}
                className="bg-white rounded-xl px-6 py-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-[#1E293B]">View Timetable</span>
              </button>
              <button
                onClick={() => onNavigate('post-schedule')}
                className="bg-white rounded-xl px-6 py-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-[#1E293B]">Post Schedule</span>
              </button>
              <button
                onClick={() => onNavigate('rooms')}
                className="bg-white rounded-xl px-6 py-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <DoorOpen className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-[#1E293B]">Book a Room</span>
              </button>
            </>
          )}

          {user.role === 'admin' && (
            <>
              <button
                onClick={() => onNavigate('teacher-requests')}
                className="bg-white rounded-xl px-6 py-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-[#1E293B]">Teacher Requests</span>
              </button>
              <button
                onClick={() => onNavigate('manage-rooms')}
                className="bg-white rounded-xl px-6 py-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-[#1E293B]">Manage Rooms</span>
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
