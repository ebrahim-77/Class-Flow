import { Search, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useRef } from 'react';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const { user, updateProfilePhoto } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [showUploadHint, setShowUploadHint] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB.');
      return;
    }

    setUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const success = await updateProfilePhoto(base64);
        if (success) {
          // Photo updated successfully
        } else {
          alert('Failed to update profile photo. Please try again.');
        }
        setUploading(false);
      };
      reader.onerror = () => {
        alert('Failed to read the image file.');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo.');
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
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
        {/* Profile with Photo Upload */}
        <div className="flex items-center gap-3">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload profile photo"
          />
          
          {/* Profile Photo */}
          <div 
            className="relative cursor-pointer group"
            onClick={triggerFileInput}
            onMouseEnter={() => setShowUploadHint(true)}
            onMouseLeave={() => setShowUploadHint(false)}
          >
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
            
            {/* Upload Overlay */}
            {(showUploadHint || uploading) && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
              </div>
            )}
          </div>
          
          <div className="text-right">
            <div className="text-slate-900 font-medium">{user?.name || 'User'}</div>
            <div className="text-slate-500 text-sm capitalize">{user?.role || 'Guest'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
