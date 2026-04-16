import { Layout } from './Layout';
import type { Page } from '../App';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { scheduleAPI } from '../src/api';

interface TimetablePageProps {
  onNavigate: (page: Page) => void;
}

interface ScheduleItem {
  _id: string;
  courseName: string;
  teacherName?: string;
  teacherId?: {
    name?: string;
  };
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
}

type DegreeOption = 'BSc Engg' | 'MSc Engg (Regular)' | 'MSc Engg (Evening)' | 'PhD Program';

const degreeOptions: DegreeOption[] = ['BSc Engg', 'MSc Engg (Regular)', 'MSc Engg (Evening)', 'PhD Program'];
const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

function degreeNeedsBatch(degree: DegreeOption | '') {
  return degree === 'BSc Engg' || degree === 'MSc Engg (Regular)' || degree === 'MSc Engg (Evening)';
}

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

function formatHeaderDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = getWeekEnd(weekStart);
  const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endLabel = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startLabel} - ${endLabel}`;
}

function formatTimeLabel(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function TimetablePage({ onNavigate }: TimetablePageProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [selectedDegree, setSelectedDegree] = useState<DegreeOption | ''>('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!degreeNeedsBatch(selectedDegree)) {
      setSelectedBatch('');
    }
    setSchedules([]);
    setHasSearched(false);
    setError('');
  }, [selectedDegree]);

  useEffect(() => {
    setSchedules([]);
    setHasSearched(false);
    setError('');
  }, [selectedBatch]);

  async function fetchSchedules(degree: DegreeOption, batch?: number) {
    try {
      setLoading(true);
      setError('');
      const weekEnd = getWeekEnd(currentWeekStart);

      const response = await scheduleAPI.getAll({
        degree,
        ...(typeof batch === 'number' ? { batch } : {}),
        weekStart: currentWeekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
      });

      if (response.data.success) {
        setSchedules(response.data.schedules || []);
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!selectedDegree) {
      setError('Please select degree and batch');
      setSchedules([]);
      setHasSearched(false);
      return;
    }

    if (degreeNeedsBatch(selectedDegree) && !selectedBatch.trim()) {
      setError('Please select degree and batch');
      setSchedules([]);
      setHasSearched(false);
      return;
    }

    const parsedBatch = Number(selectedBatch);
    if (degreeNeedsBatch(selectedDegree) && (!Number.isInteger(parsedBatch) || parsedBatch < 1)) {
      setError('Please select degree and batch');
      setSchedules([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    await fetchSchedules(selectedDegree, degreeNeedsBatch(selectedDegree) ? parsedBatch : undefined);
  }

  function goToPreviousWeek() {
    setCurrentWeekStart((prev) => getWeekStart(addDays(prev, -7)));
    setSchedules([]);
    setHasSearched(false);
    setError('');
  }

  function goToNextWeek() {
    setCurrentWeekStart((prev) => getWeekStart(addDays(prev, 7)));
    setSchedules([]);
    setHasSearched(false);
    setError('');
  }

  function getCellSchedules(dayIndex: number, slotHour: string) {
    return schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.date);
      const dayMatches = scheduleDate.getDay() === dayIndex;
      const hourMatches = schedule.startTime.split(':')[0] === slotHour.split(':')[0];
      return dayMatches && hourMatches;
    });
  }

  return (
    <Layout currentPage="timetable" onNavigate={onNavigate} title="Timetable">
      <div className="mx-auto w-full max-w-[1100px] px-4 pb-6">
        <div className="mb-4">
          <h2 className="mb-1 text-xl font-semibold text-[#1E293B]">Weekly Schedule</h2>
          <p className="text-slate-600">Sunday to Saturday class timetable</p>
        </div>

        <div className="mb-5 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:w-2/3">
          <div className="grid w-full gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="degree-filter" className="mb-2 block text-sm font-medium text-[#1E293B]">
                  Degree
                </label>
                <select
                  id="degree-filter"
                  value={selectedDegree}
                  onChange={(e) => setSelectedDegree(e.target.value as DegreeOption | '')}
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#3B82F6] focus:outline-none"
                >
                  <option value="">Select degree</option>
                  {degreeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {degreeNeedsBatch(selectedDegree) ? (
                <div>
                  <label htmlFor="batch-filter" className="mb-2 block text-sm font-medium text-[#1E293B]">
                    Batch
                  </label>
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
              ) : (
                <div className="hidden sm:block" />
              )}

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Search
                </button>
              </div>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
            {error}
          </div>
        )}

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
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
            <p className="mt-3 text-slate-600">Loading timetable...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[980px] w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="w-32 border-b border-r border-slate-200 px-3 py-3 text-left text-sm font-medium text-slate-600">
                    Day
                  </th>
                  {timeSlots.map((slot) => (
                    <th
                      key={slot}
                      className="border-b border-r border-slate-200 px-2 py-3 text-center text-xs font-medium text-slate-600"
                    >
                      {formatTimeLabel(slot)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayLabels.map((dayLabel, dayIndex) => {
                  const dayDate = addDays(currentWeekStart, dayIndex);
                  const isToday = dayDate.toDateString() === new Date().toDateString();

                  return (
                    <tr key={dayLabel} className={isToday ? 'bg-blue-50/40' : 'bg-white'}>
                      <td className="border-b border-r border-slate-200 px-3 py-3 align-top">
                        <p className="text-sm font-semibold text-[#1E293B]">{dayLabel}</p>
                        <p className="text-xs text-slate-500">{formatHeaderDate(dayDate)}</p>
                      </td>

                      {timeSlots.map((slot) => {
                        const cellSchedules = hasSearched ? getCellSchedules(dayIndex, slot) : [];

                        return (
                          <td key={`${dayLabel}-${slot}`} className="h-[76px] border-b border-r border-slate-200 p-1 align-top">
                            <div className="space-y-1">
                              {cellSchedules.map((schedule) => (
                                <div
                                  key={schedule._id}
                                  className="rounded-md bg-blue-500 px-2 py-1 text-left text-white"
                                  title={`${schedule.courseName}\n${schedule.startTime} - ${schedule.endTime}`}
                                >
                                  <p className="truncate text-[12px] font-semibold leading-tight">{schedule.courseName}</p>
                                  <p className="truncate text-[10px] text-white/85 leading-tight">{schedule.startTime} - {schedule.endTime}</p>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
