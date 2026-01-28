import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { TimetablePage } from "./components/TimetablePage";
import { RoomsPage } from "./components/RoomsPage";
import { MyBookingsPage } from "./components/MyBookingsPage";
import { PostSchedulePage } from "./components/PostSchedulePage";
import { RequestTeacherPage } from "./components/RequestTeacherPage";
import { TeacherRequestsPage } from "./components/TeacherRequestsPage";
import { BookingRequestsPage } from "./components/BookingRequestsPage";
import { ManageRoomsPage } from "./components/ManageRoomsPage";
import { useState } from "react";

export type Page =
  | "login"
  | "register"
  | "dashboard"
  | "timetable"
  | "rooms"
  | "my-bookings"
  | "post-schedule"
  | "request-teacher"
  | "teacher-requests"
  | "booking-requests"
  | "manage-rooms";

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("login");

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    if (currentPage !== "login" && currentPage !== "register") {
      return <LoginPage onNavigate={setCurrentPage} />;
    }
    return <LoginPage onNavigate={setCurrentPage} />;
  }

  // Role-based page access
  // Students: Dashboard, Timetable (read-only), Request Teacher Role
  // Teachers: Dashboard, Timetable, Rooms, My Bookings, Post Schedule
  // Admin: Dashboard, Teacher Requests, Manage Rooms
  const canAccessPage = (page: Page): boolean => {
    const studentPages: Page[] = ["dashboard", "timetable", "request-teacher"];
    const teacherPages: Page[] = ["dashboard", "timetable", "rooms", "my-bookings", "post-schedule"];
    const adminPages: Page[] = ["dashboard", "teacher-requests", "manage-rooms"];

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
      case "request-teacher":
        return user.role === "student" ? <RequestTeacherPage onNavigate={setCurrentPage} /> : null;
      case "teacher-requests":
        return user.role === "admin" ? <TeacherRequestsPage onNavigate={setCurrentPage} /> : null;
      case "booking-requests":
        return user.role === "admin" ? <BookingRequestsPage onNavigate={setCurrentPage} /> : null;
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
      <AppContent />
    </AuthProvider>
  );
}