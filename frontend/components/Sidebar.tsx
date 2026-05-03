import { LayoutDashboard, DoorOpen, Calendar, BookOpen, LogOut, Plus, Settings } from 'lucide-react';
import AppLogo from './AppLogo';
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
  // Admin: Dashboard, Manage Rooms
  const menuItems: MenuItem[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['student', 'teacher', 'admin'] },
    { id: 'timetable', icon: Calendar, label: 'Timetable', roles: ['student', 'teacher'] },
    { id: 'post-schedule', icon: Plus, label: 'Post Schedule', roles: ['teacher'] },
    { id: 'rooms', icon: DoorOpen, label: 'Rooms', roles: ['teacher'] },
    { id: 'my-bookings', icon: BookOpen, label: 'My Bookings', roles: ['teacher'] },
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
    <div className="fixed top-0 left-0 bottom-0 z-50 w-64 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-colors duration-300">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <AppLogo onClick={() => onNavigate('dashboard')} />
      </div>

      {/* Navigation */}
      <nav className="p-4 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-300 ${isActive
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <item.icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
        >
          <LogOut className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors duration-300" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
