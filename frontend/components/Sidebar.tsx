import { LayoutDashboard, DoorOpen, Calendar, BookOpen, LogOut, Plus, UserCheck, Settings } from 'lucide-react';
import type { Page } from '../App';
import { useAuth, type UserRole } from '../context/AuthContext';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

interface MenuItem {
  id: Page;
  icon: typeof LayoutDashboard;
  label: string;
  roles: UserRole[];
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();

  // Students: Dashboard, Timetable (read-only)
  // Teachers: Dashboard, Timetable, Post Schedule, Rooms, My Bookings
  // Admin: Dashboard, Booking Requests, Manage Rooms
  const menuItems: MenuItem[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['student', 'teacher', 'admin'] },
    { id: 'timetable', icon: Calendar, label: 'Timetable', roles: ['student', 'teacher'] },
    { id: 'post-schedule', icon: Plus, label: 'Post Schedule', roles: ['teacher'] },
    { id: 'rooms', icon: DoorOpen, label: 'Rooms', roles: ['teacher'] },
    { id: 'my-bookings', icon: BookOpen, label: 'My Bookings', roles: ['teacher'] },
    { id: 'booking-requests', icon: UserCheck, label: 'Booking Requests', roles: ['admin'] },
    { id: 'manage-rooms', icon: Settings, label: 'Manage Rooms', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    onNavigate('login');
  };

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        bottom: 0, 
        width: '256px',
        backgroundColor: '#1E293B',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50
      }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-slate-700" style={{ flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#3B82F6] rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 bg-white rounded"></div>
          </div>
          <h2 className="text-white font-semibold text-lg">ClassFlow</h2>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4" style={{ flex: 1, overflowY: 'auto' }}>
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${isActive 
                      ? 'bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20' 
                      : 'text-slate-300 hover:bg-slate-700/50'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-700">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
