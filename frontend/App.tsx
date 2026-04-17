import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { TimetablePage } from "./components/TimetablePage";
import { RoomsPage } from "./components/RoomsPage";
import { MyBookingsPage } from "./components/MyBookingsPage";
import { PostSchedulePage } from "./components/PostSchedulePage";
import { ManageRoomsPage } from "./components/ManageRoomsPage";
import { useEffect, useState } from "react";

export type Page =
  | "login"
  | "register"
  | "dashboard"
  | "timetable"
  | "rooms"
  | "my-bookings"
  | "post-schedule"
  | "manage-rooms";

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("login");

  useEffect(() => {
    const handleNavigateDashboard = () => {
      setCurrentPage('dashboard');
    };

    window.addEventListener('classflow:navigate-dashboard', handleNavigateDashboard as EventListener);
    return () => window.removeEventListener('classflow:navigate-dashboard', handleNavigateDashboard as EventListener);
  }, []);

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    if (currentPage !== "login" && currentPage !== "register") {
      return <LoginPage onNavigate={setCurrentPage} />;
    }
    return <LoginPage onNavigate={setCurrentPage} />;
  }

  // Role-based page access
  // Students: Dashboard, Timetable (read-only)
  // Teachers: Dashboard, Timetable, Rooms, My Bookings, Post Schedule
  // Admin: Dashboard, Manage Rooms
  const canAccessPage = (page: Page): boolean => {
    const studentPages: Page[] = ["dashboard", "timetable"];
    const teacherPages: Page[] = ["dashboard", "timetable", "rooms", "my-bookings", "post-schedule"];
    const adminPages: Page[] = ["dashboard", "manage-rooms"];

    switch (user.role) {
      case "student":
        return studentPages.includes(page);
      case "teacher":
        return teacherPages.includes(page);
      case "admin":
        return adminPages.includes(page);
      default:
        return false;
    }
  };

  // If current page is not accessible, redirect to dashboard
  if (!canAccessPage(currentPage) && currentPage !== "login" && currentPage !== "register") {
    setCurrentPage("dashboard");
    return null;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={setCurrentPage} />;
      case "timetable":
        return <TimetablePage onNavigate={setCurrentPage} />;
      case "rooms":
        return <RoomsPage onNavigate={setCurrentPage} />;
      case "my-bookings":
        return <MyBookingsPage onNavigate={setCurrentPage} />;
      case "post-schedule":
        return user.role === "teacher" ? <PostSchedulePage onNavigate={setCurrentPage} /> : null;
      case "manage-rooms":
        return user.role === "admin" ? <ManageRoomsPage onNavigate={setCurrentPage} /> : null;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      {renderPage()}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}