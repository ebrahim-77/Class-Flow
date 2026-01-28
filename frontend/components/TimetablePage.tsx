import { Layout } from './Layout';
import type { Page } from '../App';
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { scheduleAPI } from '../src/api';

interface TimetablePageProps {
  onNavigate: (page: Page) => void;
}

interface Schedule {
  _id: string;
  courseName: string;
  teacherName: string;
  roomName: string;
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  color: string;
  roomId?: {
    building?: string;
  };
}

interface Booking {
  _id: string;
  userName: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  userId: {
    role: string;
  };
  roomId?: {
    building?: string;
  };
}

interface TimetableEvent {
  id: string;
  type: 'schedule' | 'booking';
  title: string;
  subtitle: string;
  room: string;
  building: string;
  color: string;
  day: string;
  startTime: string;
  endTime: string;
  startHour: number;
  duration: number;
}

export function TimetablePage({ onNavigate }: TimetablePageProps) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  // Time slots from 8 AM to 5 PM (hourly)
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  useEffect(() => {
    fetchTimetableData();
  }, [currentWeekStart]);

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
  }

  function getWeekEnd(weekStart: Date): Date {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    return weekEnd;
  }

  function getDayDate(weekStart: Date, dayIndex: number): Date {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayIndex);
    return date;
  }

  function timeToHour(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  }

  function calculateDuration(startTime: string, endTime: string): number {
    const start = timeToHour(startTime);
    const end = timeToHour(endTime);
    return end - start;
  }

  function formatTime(time: string): string {
    const [hours] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours} ${period}`;
  }

  async function fetchTimetableData() {
    try {
      setLoading(true);
      const weekEnd = getWeekEnd(currentWeekStart);
      
      const response = await scheduleAPI.getTimetable(
        currentWeekStart.toISOString(),
        weekEnd.toISOString()
      );

      const { schedules, bookings } = response.data;
      const combinedEvents: TimetableEvent[] = [];

      // Process schedules (now date-based, not recurring)
      schedules.forEach((schedule: Schedule) => {
        // Use the schedule's date to determine which day of the week it falls on
        const scheduleDate = new Date(schedule.date);
        const daysDiff = Math.floor(
          (scheduleDate.getTime() - currentWeekStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Only show schedules that fall within Monday-Friday of current week
        if (daysDiff >= 0 && daysDiff < 5) {
          combinedEvents.push({
            id: schedule._id,
            type: 'schedule',
            title: schedule.courseName,
            subtitle: schedule.teacherName,
            room: schedule.roomName,
            building: schedule.roomId?.building || '',
            color: schedule.color || 'bg-blue-500',
            day: days[daysDiff],
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            startHour: timeToHour(schedule.startTime),
            duration: schedule.duration || calculateDuration(schedule.startTime, schedule.endTime),
          });
        }
      });

      // Process bookings (specific dates)
      bookings.forEach((booking: Booking) => {
        const bookingDate = new Date(booking.date);
        const daysDiff = Math.floor(
          (bookingDate.getTime() - currentWeekStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Only show bookings that fall within Monday-Friday of current week
        if (daysDiff >= 0 && daysDiff < 5) {
          combinedEvents.push({
            id: booking._id,
            type: 'booking',
            title: booking.purpose,
            subtitle: booking.userName,
            room: booking.roomName,
            building: booking.roomId?.building || '',
            color: booking.userId.role === 'teacher' ? 'bg-purple-500' : 'bg-amber-500',
            day: days[daysDiff],
            startTime: booking.startTime,
            endTime: booking.endTime,
            startHour: timeToHour(booking.startTime),
            duration: calculateDuration(booking.startTime, booking.endTime),
          });
        }
      });

      setEvents(combinedEvents);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
    } finally {
      setLoading(false);
    }
  }

  function goToPreviousWeek() {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  }

  function goToNextWeek() {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  }

  function formatWeekRange(weekStart: Date): string {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4); // Friday
    
    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
    const startDay = weekStart.getDate();
    const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
    const endDay = weekEnd.getDate();
    const year = weekStart.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }

  // Get events for a specific day and time slot
  function getEventsForCell(day: string, slotTime: string): TimetableEvent[] {
    const slotHour = timeToHour(slotTime);
    return events.filter(event => {
      if (event.day !== day) return false;
      // Check if event starts in this hour slot
      return Math.floor(event.startHour) === Math.floor(slotHour);
    });
  }

  return (
    <Layout currentPage="timetable" onNavigate={onNavigate} title="Timetable">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[#1E293B] mb-1">Weekly Schedule</h2>
          <p className="text-slate-600">
            {isTeacher ? 'View and manage class schedules' : 'View your class schedule'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isTeacher && (
            <button
              onClick={() => onNavigate('post-schedule')}
              className="px-4 py-2 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30"
            >
              <Plus className="w-5 h-5" />
              Post Schedule
            </button>
          )}
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 border border-slate-200">
        <button 
          onClick={goToPreviousWeek}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors" 
          aria-label="Previous week"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <span className="text-slate-900 font-medium">
          Week of {formatWeekRange(currentWeekStart)}
        </span>
        <button 
          onClick={goToNextWeek}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors" 
          aria-label="Next week"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-slate-600 mt-4">Loading timetable...</p>
        </div>
      )}

      {/* Timetable Grid - ROWS = DAYS, COLUMNS = TIME SLOTS */}
      {!loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50">
                  {/* Day/Date Column Header */}
                  <th className="border-b border-r border-slate-200 p-3 text-left font-medium text-slate-700 w-32">
                    Day
                  </th>
                  {/* Time Slot Headers */}
                  {timeSlots.map((slot) => (
                    <th 
                      key={slot} 
                      className="border-b border-r border-slate-200 p-3 text-center font-medium text-slate-700 min-w-[100px]"
                    >
                      {formatTime(slot)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Each row is a day */}
                {days.map((day, dayIdx) => {
                  const dayDate = getDayDate(currentWeekStart, dayIdx);
                  return (
                    <tr key={day} className="hover:bg-slate-50/50">
                      {/* Day + Date Column */}
                      <td className="border-b border-r border-slate-200 p-3 bg-slate-50">
                        <div className="font-medium text-[#1E293B]">{day}</div>
                        <div className="text-sm text-slate-500">
                          {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      {/* Time Slot Cells */}
                      {timeSlots.map((slot) => {
                        const cellEvents = getEventsForCell(day, slot);
                        return (
                          <td 
                            key={`${day}-${slot}`} 
                            className="border-b border-r border-slate-200 p-1 align-top min-h-[80px] h-20"
                          >
                            {cellEvents.map((event) => (
                              <div
                                key={event.id}
                                className={`${event.color} rounded-lg p-2 text-white text-xs mb-1 cursor-pointer hover:opacity-90 transition-opacity`}
                                title={`${event.title}\n${event.subtitle}\n${event.room}${event.building ? ' - ' + event.building : ''}\n${event.startTime} - ${event.endTime}`}
                              >
                                <div className="font-medium line-clamp-1">{event.title}</div>
                                <div className="text-white/90 line-clamp-1">{event.room}</div>
                                <div className="text-white/80 line-clamp-1">{event.subtitle}</div>
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-sm text-slate-600 font-medium">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-slate-600">Regular Classes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-sm text-slate-600">Teacher Bookings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span className="text-sm text-slate-600">Student Bookings</span>
          </div>
        </div>
      </div>

      {/* No Events Message */}
      {!loading && events.length === 0 && (
        <div className="mt-6 text-center py-8 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">No classes or bookings scheduled for this week.</p>
          {isTeacher && (
            <button
              onClick={() => onNavigate('post-schedule')}
              className="mt-4 px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors"
            >
              Post a Schedule
            </button>
          )}
        </div>
      )}
    </Layout>
  );
}
