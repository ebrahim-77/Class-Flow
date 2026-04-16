import { Calendar, Clock, MapPin, User, Building } from 'lucide-react';
import { Layout } from './Layout';
import type { Page } from '../App';
import { useState, useEffect } from 'react';
import { scheduleAPI } from '../src/api';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [selectedDegree, setSelectedDegree] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, []);

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
        setSchedules(response.data.schedules || []);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      setError('Failed to load schedules.');
    } finally {
      setLoading(false);
    }
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

  const filteredSchedules = schedules.filter((schedule) => {
    if (selectedDegree && schedule.degree !== selectedDegree) {
      return false;
    }

    if (degreeNeedsBatch(selectedDegree) && selectedBatch) {
      return Number(schedule.batch) === Number(selectedBatch);
    }

    return true;
  });

  const upcomingSchedules = filteredSchedules
    .filter((schedule) => getDateValue(schedule.date) >= todayValue)
    .sort((a, b) => {
      const byDate = getDateValue(a.date) - getDateValue(b.date);
      if (byDate !== 0) return byDate;
      return a.startTime.localeCompare(b.startTime);
    });

  const pastSchedules = filteredSchedules
    .filter((schedule) => getDateValue(schedule.date) < todayValue)
    .sort((a, b) => {
      const byDate = getDateValue(b.date) - getDateValue(a.date);
      if (byDate !== 0) return byDate;
      return b.startTime.localeCompare(a.startTime);
    });

  return (
    <Layout currentPage="dashboard" onNavigate={onNavigate} title="Dashboard">
      <div className="mx-auto w-full max-w-[480px] px-4 pb-6">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">Loading schedules...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-3 sm:flex-1">
                  <div>
                    <label htmlFor="degree-filter" className="mb-2 block text-sm font-medium text-[#1E293B]">Degree</label>
                    <select
                      id="degree-filter"
                      value={selectedDegree}
                      onChange={(e) => setSelectedDegree(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#3B82F6] focus:outline-none"
                    >
                      <option value="">All Degrees</option>
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
                </div>

                {user?.role === 'teacher' && (
                  <button
                    type="button"
                    onClick={() => onNavigate('post-schedule')}
                    className="w-full rounded-xl bg-[#3B82F6] px-4 py-3 font-medium text-white shadow-lg shadow-blue-500/30 transition-colors hover:bg-[#2563EB] sm:self-end sm:w-auto"
                  >
                    Post Schedule
                  </button>
                )}
              </div>
            </section>

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
        )}
      </div>
    </Layout>
  );
}
