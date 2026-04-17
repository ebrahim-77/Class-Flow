import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { scheduleAPI } from '../src/api';

interface Schedule {
  _id: string;
  courseName: string;
  teacherName: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  editMessage?: string;
}

interface SuggestedSlot {
  startTime: string;
  endTime: string;
  date: string;
  day: string;
}

interface EditScheduleModalProps {
  schedule: Schedule | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditScheduleModal: React.FC<EditScheduleModalProps> = ({
  schedule,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [editType, setEditType] = useState<'update' | 'reschedule' | 'cancel'>('update');
  const [message, setMessage] = useState('');
  const [newDate, setNewDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedSlot[] | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen && schedule) {
      setEditType('update');
      setMessage('');
      setNewDate(schedule.date ? new Date(schedule.date).toISOString().split('T')[0] : '');
      setStartTime(schedule.startTime || '');
      setEndTime(schedule.endTime || '');
      setError(null);
      setSuggestions(null);
      setSuccessMessage(null);
    }
  }, [isOpen, schedule]);

  const validateForm = (): boolean => {
    setError(null);

    if (editType === 'reschedule') {
      if (!newDate || !startTime || !endTime) {
        setError('Please provide new date, start time, and end time');
        return false;
      }

      // Validate end time is after start time
      if (endTime <= startTime) {
        setError('End time must be after start time');
        return false;
      }

      // Validate date is not in the past
      const selectedDate = new Date(newDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        setError('Cannot reschedule to a past date');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !schedule) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: any = {
        type: editType,
        editMessage: message || undefined
      };

      if (editType === 'reschedule') {
        payload.newDate = newDate;
        payload.startTime = startTime;
        payload.endTime = endTime;
      }

      const response = await scheduleAPI.editSchedule(schedule._id, payload);

      if (response.data.success) {
        setSuccessMessage('Schedule updated successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.hasConflict) {
        // Conflict detected - show suggestions
        setError(err.response.data.message || 'Room conflict detected');
        setSuggestions(err.response.data.suggestedSlots || []);
      } else {
        setError(err.response?.data?.message || 'Failed to update schedule');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionSelect = (slot: SuggestedSlot) => {
    setNewDate(slot.date);
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setSuggestions(null);
  };

  return (
    <>
      {isOpen && schedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b px-6 py-4 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">Edit Class: {schedule.courseName}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select update type:
            </label>

            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="editType"
                  value="update"
                  checked={editType === 'update'}
                  onChange={(e) => setEditType(e.target.value as 'update')}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Update Message Only</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="editType"
                  value="reschedule"
                  checked={editType === 'reschedule'}
                  onChange={(e) => setEditType(e.target.value as 'reschedule')}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Reschedule</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="editType"
                  value="cancel"
                  checked={editType === 'cancel'}
                  onChange={(e) => setEditType(e.target.value as 'cancel')}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Cancel Class</span>
              </label>
            </div>
          </div>

          {/* Message Field - shown for all types */}
          {editType !== 'cancel' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  editType === 'reschedule'
                    ? 'e.g., due to room unavailability...'
                    : 'e.g., due to rain, moved online...'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          )}

          {editType === 'cancel' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g., due to emergency, teacher unavailable..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  ⚠️ This class will be marked as cancelled and students will be notified.
                </p>
              </div>
            </div>
          )}

          {/* Reschedule Fields */}
          {editType === 'reschedule' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  aria-label="New date for rescheduling"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    aria-label="Start time for rescheduling"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    aria-label="End time for rescheduling"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 font-medium">{successMessage}</p>
            </div>
          )}

          {/* Suggested Slots */}
          {suggestions && suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Need to reschedule? Here are available time slots:
              </h4>
              <div className="space-y-2">
                {suggestions.map((slot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestionSelect(slot)}
                    className="w-full p-3 text-left bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <p className="text-sm font-medium text-blue-900">
                      {slot.day} - {slot.startTime} to {slot.endTime}
                    </p>
                    <p className="text-xs text-blue-700">{slot.date}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                editType === 'cancel'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EditScheduleModal;
