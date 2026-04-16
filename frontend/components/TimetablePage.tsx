import { Layout } from './Layout';
import type { Page } from '../App';
import { ChevronLeft, ChevronRight, Plus, Loader2, Clock, MapPin, Building, User } from 'lucide-react';
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
  date: string;
  startTime: string;
  endTime: string;
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
  dateKey: string;
  dayLabel: string;
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
}

interface PositionedEvent extends TimetableEvent {
  laneIndex: number;
  laneCount: number;
}

const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timelineStartHour = 8;
const timelineEndHour = 18;
const timelineHeight = 600;
const minuteToPixel = timelineHeight / ((timelineEndHour - timelineStartHour) * 60);

function getWeekStart(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatDisplayTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatDayHeader(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function assignLanes(events: TimetableEvent[]): PositionedEvent[] {
  const sorted = [...events].sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);
  const laneEnds: number[] = [];
  const positioned = sorted.map((event) => {
    let laneIndex = laneEnds.findIndex((laneEnd) => laneEnd <= event.startMinutes);

    if (laneIndex === -1) {
      laneIndex = laneEnds.length;
      laneEnds.push(event.endMinutes);
    } else {
      laneEnds[laneIndex] = event.endMinutes;
    }

    return {
      ...event,
      laneIndex,
      laneCount: 1,
    };
  });

  const laneCount = Math.max(1, laneEnds.length);
  return positioned.map((event) => ({ ...event, laneCount }));
}

export function TimetablePage({ onNavigate }: TimetablePageProps) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimetableData();
  }, [currentWeekStart]);

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

      schedules.forEach((schedule: Schedule) => {
        const scheduleDate = new Date(schedule.date);
        const startMinutes = timeToMinutes(schedule.startTime);
        const endMinutes = timeToMinutes(schedule.endTime);

        if (scheduleDate >= currentWeekStart && scheduleDate <= weekEnd) {
          combinedEvents.push({
            id: schedule._id,
            type: 'schedule',
            title: schedule.courseName,
            subtitle: schedule.teacherName,
            room: schedule.roomName,
            building: schedule.roomId?.building || '',
            color: schedule.color || 'bg-blue-500',
            dateKey: getDateKey(scheduleDate),
            dayLabel: dayLabels[scheduleDate.getDay()],
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            startMinutes,
            endMinutes,
          });
        }
      });

      bookings.forEach((booking: Booking) => {
        const bookingDate = new Date(booking.date);
        const startMinutes = timeToMinutes(booking.startTime);
        const endMinutes = timeToMinutes(booking.endTime);

        if (bookingDate >= currentWeekStart && bookingDate <= weekEnd) {
          combinedEvents.push({
            id: booking._id,
            type: 'booking',
            title: booking.purpose,
            subtitle: booking.userName,
            room: booking.roomName,
            building: booking.roomId?.building || '',
            color: booking.userId.role === 'teacher' ? 'bg-violet-500' : 'bg-amber-500',
            dateKey: getDateKey(bookingDate),
            dayLabel: dayLabels[bookingDate.getDay()],
            startTime: booking.startTime,
            endTime: booking.endTime,
            startMinutes,
            endMinutes,
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
    const newWeekStart = addDays(currentWeekStart, -7);
    setCurrentWeekStart(getWeekStart(newWeekStart));
  }

  function goToNextWeek() {
    const newWeekStart = addDays(currentWeekStart, 7);
    setCurrentWeekStart(getWeekStart(newWeekStart));
  }

  function formatWeekRange(weekStart: Date): string {
    const weekEnd = getWeekEnd(weekStart);
    const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startLabel} - ${endLabel}`;
  }

  function getEventsForDay(dateKey: string): PositionedEvent[] {
    return assignLanes(events.filter((event) => event.dateKey === dateKey));
  }

  const dayColumns = Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index));
  const hourMarks = Array.from({ length: timelineEndHour - timelineStartHour + 1 }, (_, index) => timelineStartHour + index);

  return (
    <Layout currentPage="timetable" onNavigate={onNavigate} title="Timetable">
      <div className="mx-auto w-full max-w-[1100px] px-4 pb-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#1E293B] mb-1">Weekly Schedule</h2>
            <p className="text-slate-600">
              {isTeacher ? 'View and manage class schedules' : 'View your class schedule'}
            </p>
          </div>
          {isTeacher && (
            <button
              onClick={() => onNavigate('post-schedule')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition-colors hover:bg-[#2563EB] sm:w-auto"
            >
              <Plus className="h-5 w-5" />
              Post Schedule
            </button>
          )}
        </div>

        <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <button
            onClick={goToPreviousWeek}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">Week of</p>
            <p className="text-base font-semibold text-[#1E293B]">{formatWeekRange(currentWeekStart)}</p>
          </div>
          <button
            onClick={goToNextWeek}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
            aria-label="Next week"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center shadow-sm">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-slate-600">Loading timetable...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="min-w-[1080px]">
              <div className="grid grid-cols-[96px_repeat(7,minmax(130px,1fr))] border-b border-slate-200 bg-slate-50">
                <div className="px-4 py-4 text-sm font-medium text-slate-500">Time</div>
                {dayColumns.map((dayDate) => {
                  const isToday = dayDate.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={getDateKey(dayDate)}
                      className={`border-l border-slate-200 px-3 py-4 text-center ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      <p className="text-sm font-semibold text-[#1E293B]">{dayLabels[dayDate.getDay()]}</p>
                      <p className="text-xs text-slate-500">{formatDayHeader(dayDate)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-[96px_repeat(7,minmax(130px,1fr))]">
                <div className="relative border-r border-slate-200 bg-slate-50" style={{ height: `${timelineHeight}px` }}>
                  {hourMarks.map((hour) => {
                    const top = (hour - timelineStartHour) * 60 * minuteToPixel;
                    return (
                      <div key={hour} className="absolute left-0 right-0 -translate-y-1/2 px-3" style={{ top }}>
                        <div className="text-right text-xs font-medium text-slate-500">{formatDisplayTime(`${hour.toString().padStart(2, '0')}:00`)}</div>
                      </div>
                    );
                  })}
                </div>

                {dayColumns.map((dayDate) => {
                  const dayEvents = getEventsForDay(getDateKey(dayDate));
                  const isToday = dayDate.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={getDateKey(dayDate)}
                      className={`relative border-l border-slate-200 ${isToday ? 'bg-blue-50/30' : ''}`}
                      style={{
                        height: `${timelineHeight}px`,
                        backgroundImage: 'linear-gradient(to bottom, rgba(148, 163, 184, 0.16) 1px, transparent 1px)',
                        backgroundSize: `100% 60px`,
                      }}
                    >
                      {dayEvents.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-slate-400">
                          No events
                        </div>
                      ) : (
                        dayEvents.map((event) => {
                          const top = (event.startMinutes - timelineStartHour * 60) * minuteToPixel;
                          const height = Math.max((event.endMinutes - event.startMinutes) * minuteToPixel, 44);
                          const laneWidth = 100 / event.laneCount;
                          const left = event.laneIndex * laneWidth;

                          return (
                            <div
                              key={event.id}
                              className={`absolute rounded-2xl px-3 py-2 text-white shadow-lg shadow-slate-900/10 ${event.color}`}
                              style={{
                                top,
                                height,
                                left: `calc(${left}% + 4px)`,
                                width: `calc(${laneWidth}% - 8px)`,
                              }}
                              title={`${event.title}\n${event.subtitle}\n${event.room}${event.building ? ` - ${event.building}` : ''}\n${event.startTime} - ${event.endTime}`}
                            >
                              <p className="text-sm font-semibold leading-tight line-clamp-2">{event.title}</p>
                              <div className="mt-1 space-y-1 text-[11px] text-white/90">
                                <p className="flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDisplayTime(event.startTime)} - {formatDisplayTime(event.endTime)}</span>
                                </p>
                                <p className="flex items-center gap-1.5">
                                  <MapPin className="h-3 w-3" />
                                  <span className="line-clamp-1">{event.room}</span>
                                </p>
                                <p className="flex items-center gap-1.5">
                                  <User className="h-3 w-3" />
                                  <span className="line-clamp-1">{event.subtitle}</span>
                                </p>
                                {event.building && (
                                  <p className="flex items-center gap-1.5">
                                    <Building className="h-3 w-3" />
                                    <span className="line-clamp-1">{event.building}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
