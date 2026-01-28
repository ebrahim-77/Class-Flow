import { Layout } from './Layout';
import type { Page } from '../App';
import { Plus, Edit2, Trash2, Users, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { roomAPI } from '../src/api';

interface ManageRoomsPageProps {
  onNavigate: (page: Page) => void;
}

interface Room {
  _id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  features: string[];
  status: 'available' | 'occupied' | 'maintenance';
}

const FEATURES_LIST = ['Wifi', 'Projector', 'Whiteboard', 'AC', 'Sound System', 'Microphone'];
const BUILDINGS = ['Building A', 'Building B', 'Building C'];
const FLOORS = ['1st Floor', '2nd Floor', '3rd Floor', '4th Floor'];

export function ManageRoomsPage({ onNavigate }: ManageRoomsPageProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    floor: '',
    capacity: '',
    features: [] as string[],
    status: 'available' as 'available' | 'occupied' | 'maintenance'
  });

  useEffect(() => {
    fetchRooms();
  }, []);

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

  function resetForm() {
    setFormData({
      name: '',
      building: '',
      floor: '',
      capacity: '',
      features: [],
      status: 'available'
    });
  }

  function openAddModal() {
    resetForm();
    setShowAddModal(true);
  }

  function openEditModal(room: Room) {
    setSelectedRoom(room);
    setFormData({
      name: room.name,
      building: room.building,
      floor: room.floor,
      capacity: room.capacity.toString(),
      features: room.features,
      status: room.status
    });
    setShowEditModal(true);
  }

  function openDeleteModal(room: Room) {
    setSelectedRoom(room);
    setShowDeleteModal(true);
  }

  function toggleFeature(feature: string) {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  }

  async function handleAddRoom(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name || !formData.building || !formData.floor || !formData.capacity) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setError('');
    setSubmitting(true);
    
    try {
      const response = await roomAPI.create({
        name: formData.name,
        building: formData.building,
        floor: formData.floor,
        capacity: parseInt(formData.capacity),
        features: formData.features,
        status: formData.status
      });
      
      if (response.data.success) {
        setRooms(prev => [...prev, response.data.room]);
        setShowAddModal(false);
        resetForm();
        setSuccess('Room added successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      console.error('Failed to add room:', err);
      const message = err.response?.data?.message || 'Failed to add room. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditRoom(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedRoom) return;
    
    if (!formData.name || !formData.building || !formData.floor || !formData.capacity) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setError('');
    setSubmitting(true);
    
    try {
      const response = await roomAPI.update(selectedRoom._id, {
        name: formData.name,
        building: formData.building,
        floor: formData.floor,
        capacity: parseInt(formData.capacity),
        features: formData.features,
        status: formData.status
      });
      
      if (response.data.success) {
        setRooms(prev => prev.map(r => r._id === selectedRoom._id ? response.data.room : r));
        setShowEditModal(false);
        setSelectedRoom(null);
        resetForm();
        setSuccess('Room updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      console.error('Failed to update room:', err);
      const message = err.response?.data?.message || 'Failed to update room. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteRoom() {
    if (!selectedRoom) return;
    
    setError('');
    setSubmitting(true);
    
    try {
      const response = await roomAPI.delete(selectedRoom._id);
      
      if (response.data.success) {
        setRooms(prev => prev.filter(r => r._id !== selectedRoom._id));
        setShowDeleteModal(false);
        setSelectedRoom(null);
        setSuccess('Room deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      console.error('Failed to delete room:', err);
      const message = err.response?.data?.message || 'Failed to delete room. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'occupied': return 'bg-blue-100 text-blue-700';
      case 'maintenance': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'available': return 'Available';
      case 'occupied': return 'Occupied';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  }

  // Room Form Component (used in both Add and Edit modals)
  const RoomForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void, submitLabel: string }) => (
    <form onSubmit={onSubmit}>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="room-name" className="block text-slate-700 font-medium mb-2">
              Room Name *
            </label>
            <input
              id="room-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., B-210"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
              required
            />
          </div>

          <div>
            <label htmlFor="capacity" className="block text-slate-700 font-medium mb-2">
              Capacity *
            </label>
            <input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              placeholder="e.g., 30"
              min="1"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="building" className="block text-slate-700 font-medium mb-2">
              Building *
            </label>
            <select
              id="building"
              value={formData.building}
              onChange={(e) => setFormData(prev => ({ ...prev, building: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
              required
            >
              <option value="">Select Building</option>
              {BUILDINGS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="floor" className="block text-slate-700 font-medium mb-2">
              Floor *
            </label>
            <select
              id="floor"
              value={formData.floor}
              onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
              required
            >
              <option value="">Select Floor</option>
              {FLOORS.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="status" className="block text-slate-700 font-medium mb-2">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
          >
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-2">Features</label>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES_LIST.map((feature) => (
              <label key={feature} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.features.includes(feature)}
                  onChange={() => toggleFeature(feature)}
                  className="w-4 h-4 rounded border-slate-300 text-[#3B82F6] focus:ring-[#3B82F6]" 
                />
                <span className="text-slate-700">{feature}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-200 flex gap-4">
        <button
          type="button"
          onClick={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            resetForm();
          }}
          className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
          disabled={submitting}
        >
          Cancel
        </button>
        <button 
          type="submit"
          disabled={submitting}
          className="flex-1 py-3 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );

  return (
    <Layout currentPage="manage-rooms" onNavigate={onNavigate} title="Manage Rooms">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-[#1E293B] mb-1">Room Management</h2>
          <p className="text-slate-600">Add, edit, or remove rooms from the system</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-6 py-3 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-5 h-5" />
          Add New Room
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && !showAddModal && !showEditModal && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-slate-600 mt-2">Loading rooms...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-slate-500">No rooms found. Add your first room to get started.</p>
        </div>
      ) : (
        /* Rooms Table */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left font-medium text-slate-700">Room Name</th>
                  <th className="px-6 py-4 text-left font-medium text-slate-700">Location</th>
                  <th className="px-6 py-4 text-left font-medium text-slate-700">Capacity</th>
                  <th className="px-6 py-4 text-left font-medium text-slate-700">Features</th>
                  <th className="px-6 py-4 text-left font-medium text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rooms.map((room) => (
                  <tr key={room._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{room.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-slate-900">{room.building}</div>
                        <div className="text-sm text-slate-500">{room.floor}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="w-4 h-4" />
                        <span>{room.capacity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {room.features.slice(0, 3).map((feature, idx) => (
                          <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">
                            {feature}
                          </span>
                        ))}
                        {room.features.length > 3 && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">
                            +{room.features.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-sm ${getStatusColor(room.status)}`}>
                        {getStatusLabel(room.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openEditModal(room)}
                          className="p-2 text-[#3B82F6] hover:bg-blue-50 rounded-lg transition-colors"
                          aria-label={`Edit room ${room.name}`}
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(room)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label={`Delete room ${room.name}`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1E293B]">Add New Room</h2>
              <button 
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            {error && (
              <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <RoomForm onSubmit={handleAddRoom} submitLabel="Add Room" />
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1E293B]">Edit Room: {selectedRoom.name}</h2>
              <button 
                onClick={() => { setShowEditModal(false); setSelectedRoom(null); resetForm(); }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            {error && (
              <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <RoomForm onSubmit={handleEditRoom} submitLabel="Save Changes" />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-[#1E293B]">Delete Room</h2>
            </div>
            
            <div className="p-6">
              <p className="text-slate-600">
                Are you sure you want to delete <strong>{selectedRoom.name}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-4">
              <button
                onClick={() => { setShowDeleteModal(false); setSelectedRoom(null); }}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteRoom}
                disabled={submitting}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Room'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
