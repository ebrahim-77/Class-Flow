import { Search, Camera, Loader2, X, User, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useRef } from 'react';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const { user, updateProfile } = useAuth();
  
  // Profile edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Profile edit modal handlers
  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditPhoto(user?.profilePhoto || null);
    setEditError('');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditName('');
    setEditPhoto(null);
    setEditError('');
  };

  const handleEditPhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEditError('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditError('Image size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEditPhoto(reader.result as string);
      setEditError('');
    };
    reader.onerror = () => {
      setEditError('Failed to read the image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setEditError('Name is required.');
      return;
    }

    setSaving(true);
    setEditError('');

    try {
      const updateData: { name?: string; profilePhoto?: string } = {};
      
      if (editName !== user?.name) {
        updateData.name = editName.trim();
      }
      
      if (editPhoto !== user?.profilePhoto) {
        updateData.profilePhoto = editPhoto || '';
      }

      if (Object.keys(updateData).length > 0) {
        const success = await updateProfile(updateData);
        if (success) {
          closeEditModal();
        } else {
          setEditError('Failed to update profile. Please try again.');
        }
      } else {
        closeEditModal();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setEditError('Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="h-20 flex-shrink-0 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
        {/* Title or Search */}
        <div className="flex-1 max-w-xl">
          {title ? (
            <h1 className="text-xl font-semibold text-[#1E293B]">{title}</h1>
          ) : (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search rooms, classes, bookings..."
                className="w-full pl-12 pr-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none transition-colors text-slate-900"
              />
            </div>
          )}
        </div>

        {/* Right Side - Profile Only */}
        <div className="flex items-center gap-6">
          {/* Profile - clickable to open edit modal */}
          <div 
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-xl px-3 py-2 transition-colors"
            onClick={openEditModal}
          >
            {/* Profile Photo */}
            <div className="relative">
              {user?.profilePhoto ? (
                <img 
                  src={user.profilePhoto} 
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            
            {/* Name and Role */}
            <div className="text-right">
              <div className="text-slate-900 font-medium">{user?.name || 'User'}</div>
              <div className="text-slate-500 text-sm capitalize">{user?.role || 'Guest'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1E293B]">Edit Profile</h2>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error Message */}
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {editError}
                </div>
              )}

              {/* Profile Photo */}
              <div className="flex flex-col items-center gap-3">
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditPhotoSelect}
                  className="hidden"
                  aria-label="Upload profile photo"
                />
                
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => editFileInputRef.current?.click()}
                >
                  {editPhoto ? (
                    <img 
                      src={editPhoto} 
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-slate-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold border-4 border-slate-200">
                      {editName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <p className="text-sm text-slate-600">Click to change photo</p>
                
                {editPhoto && (
                  <button
                    type="button"
                    onClick={() => setEditPhoto(null)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Remove photo
                  </button>
                )}
              </div>

              {/* Name Input */}
              <div>
                <label htmlFor="edit-name" className="block text-[#1E293B] font-medium mb-2">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="edit-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your display name"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#3B82F6] focus:outline-none text-slate-900"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 flex gap-4">
              <button
                onClick={closeEditModal}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving || !editName.trim()}
                className="flex-1 py-3 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-colors shadow-lg shadow-blue-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
