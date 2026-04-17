import { Calendar, Clock, MapPin, User, Building } from 'lucide-react';
import { Layout } from './Layout';
import type { Page } from '../App';
import { useState, useEffect } from 'react';
import { dashboardAPI, scheduleAPI } from '../src/api';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

interface ScheduleItem {
  _id: string;
  courseName: string;
  teacherName: string;
  degree: 'BSc Engg' | 'MSc Engg (Regular)' | 'MSc Engg (Evening)' | 'PhD Program';
  batch?: number;
  date: string;
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

interface AdminStats {
  totalRooms: number;
  totalSchedules: number;
  totalTeachers: number;
  mostUsedRoom: string;
}

const degreeOptions = ['BSc Engg', 'MSc Engg (Regular)', 'MSc Engg (Evening)', 'PhD Program'] as const;

const degreeNeedsBatch = (degree: string) => degree === 'BSc Engg' || degree === 'MSc Engg (Regular)' || degree === 'MSc Engg (Evening)';

function getOrdinalSuffix(n: number) {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

function formatDegreeBatch(schedule: ScheduleItem) {
  if (degreeNeedsBatch(schedule.degree) && schedule.batch) {
    return `${schedule.degree} (${schedule.batch}${getOrdinalSuffix(schedule.batch)} batch)`;
  }
  return schedule.degree;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalRooms: 0,
    totalSchedules: 0,
    totalTeachers: 0,
    mostUsedRoom: 'N/A'
  });
  const [now, setNow] = useState(Date.now());
  const [selectedDegree, setSelectedDegree] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminStats();
    } else {
      fetchSchedules();
    }
  }, [user?.role]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  async function fetchSchedules() {
    try {
      setLoading(true);
      setError('');
      const response = await scheduleAPI.getAll();
      if (response.data.success) {
        const allSchedules = response.data.schedules || [];
        setSchedules(allSchedules);
        setFilteredSchedules(allSchedules);
      } else {
        setSchedules([]);
        setFilteredSchedules([]);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      setError('Failed to load schedules.');
      setSchedules([]);
      setFilteredSchedules([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAdminStats() {
    try {
      setLoading(true);
      setError('');
      const response = await dashboardAPI.getStats();
      if (response.data.success) {
        const stats = response.data.stats || {};
        setAdminStats({
          totalRooms: stats.totalRooms || 0,
          totalSchedules: stats.totalSchedules || 0,
          totalTeachers: stats.totalTeachers || 0,
          mostUsedRoom: stats.mostUsedRoom || 'N/A'
        });
      }
    } catch (fetchError) {
      console.error('Failed to fetch admin stats:', fetchError);
      setError('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    setError('');

    let nextFiltered = schedules;

    if (selectedDegree) {
      nextFiltered = nextFiltered.filter((schedule) => schedule.degree === selectedDegree);

      if (degreeNeedsBatch(selectedDegree) && selectedBatch.trim()) {
        const parsedBatch = Number(selectedBatch);
        if (Number.isInteger(parsedBatch) && parsedBatch > 0) {
          nextFiltered = nextFiltered.filter((schedule) => Number(schedule.batch) === parsedBatch);
        }
      }
    }

    setFilteredSchedules(nextFiltered);
  }

  function formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  function getDateValue(dateString: string): number {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  useEffect(() => {
    if (!degreeNeedsBatch(selectedDegree)) {
      setSelectedBatch('');
    }
  }, [selectedDegree]);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayValue = today.getTime();

  const visibleSchedules = filteredSchedules;

  const upcomingSchedules = visibleSchedules
    .filter((schedule) => getDateValue(schedule.date) >= todayValue)
    .sort((a, b) => {
      const byDate = getDateValue(a.date) - getDateValue(b.date);
      if (byDate !== 0) return byDate;
      return a.startTime.localeCompare(b.startTime);
    });

  const pastSchedules = visibleSchedules
    .filter((schedule) => getDateValue(schedule.date) < todayValue)
    .sort((a, b) => {
      const byDate = getDateValue(b.date) - getDateValue(a.date);
      if (byDate !== 0) return byDate;
      return b.startTime.localeCompare(a.startTime);
    });

  if (user?.role === 'admin') {
    return (
      <Layout currentPage="dashboard" onNavigate={onNavigate} title="Dashboard">
        <div className="mx-auto w-full max-w-[720px] px-4 pb-6">
          <div className="space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-600">Loading analytics...</p>
              </div>
            ) : (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-[#1E293B]">Analytics</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-600">Total Rooms</p>
                    <p className="mt-2 text-3xl font-bold text-[#1E293B]">{adminStats.totalRooms}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-600">Total Schedules</p>
                    <p className="mt-2 text-3xl font-bold text-[#1E293B]">{adminStats.totalSchedules}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-600">Most Used Room</p>
                    <p className="mt-2 text-3xl font-bold text-[#1E293B]">{adminStats.mostUsedRoom}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-600">Total Teachers</p>
                    <p className="mt-2 text-3xl font-bold text-[#1E293B]">{adminStats.totalTeachers}</p>
                  </div>
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#1E293B]">Quick Actions</h2>
              <button
                type="button"
                onClick={() => onNavigate('manage-rooms')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 md:w-auto"
              >
                Manage Rooms
              </button>
            </section>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="dashboard" onNavigate={onNavigate} title="Dashboard">
      <div className="mx-auto w-full max-w-[480px] px-4 pb-6">
        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-3">
              <div>
                <label htmlFor="degree-filter" className="mb-2 block text-sm font-medium text-[#1E293B]">Degree</label>
                <select
                  id="degree-filter"
                  value={selectedDegree}
                  onChange={(e) => setSelectedDegree(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#3B82F6] focus:outline-none"
                >
                  <option value="">Select degree</option>
                  {degreeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {degreeNeedsBatch(selectedDegree) && (
                <div>
                  <label htmlFor="batch-filter" className="mb-2 block text-sm font-medium text-[#1E293B]">Batch</label>
                  <input
                    id="batch-filter"
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    placeholder="Enter batch"
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Search
                </button>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-600">Loading schedules...</p>
            </div>
          )}

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1E293B]">Upcoming Classes</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Future</span>
            </div>
            {upcomingSchedules.length === 0 ? (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm">
                <p className="text-sm text-slate-500">No upcoming classes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSchedules.map((schedule) => (
                  <div key={schedule._id} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                    <h3 className="text-base font-bold text-[#1E293B]">{schedule.courseName}</h3>
                    <p className="mt-1 text-sm text-slate-600">{formatDegreeBatch(schedule)}</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#3B82F6]" />
                        <span>{new Date(schedule.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#3B82F6]" />
                        <span>{schedule.day}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#3B82F6]" />
                        <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#3B82F6]" />
                        <span>{schedule.roomName}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-[#3B82F6]" />
                        <span>{schedule.roomId?.building || 'N/A'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#3B82F6]" />
                        <span>{schedule.teacherName}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1E293B]">Past Classes</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Archive</span>
            </div>
            {pastSchedules.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <p className="text-sm text-slate-500">No past classes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastSchedules.map((schedule) => (
                  <div key={schedule._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <h3 className="text-base font-bold text-[#1E293B]">{schedule.courseName}</h3>
                    <p className="mt-1 text-sm text-slate-600">{formatDegreeBatch(schedule)}</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#3B82F6]" />
                        <span>{new Date(schedule.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#3B82F6]" />
                        <span>{schedule.day}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#3B82F6]" />
                        <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#3B82F6]" />
                        <span>{schedule.roomName}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-[#3B82F6]" />
                        <span>{schedule.roomId?.building || 'N/A'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#3B82F6]" />
                        <span>{schedule.teacherName}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
