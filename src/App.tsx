import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MembersListPage } from "./pages/MembersListPage";
import { DepartmentsListPage } from "./pages/DepartmentsListPage";
import { JoinRequestsPage } from "./pages/JoinRequestsPage";
import { EventsListPage } from "./pages/EventsListPage";
import { CalendarPage } from "./pages/CalendarPage";
import { AttendancePage } from "./pages/AttendancePage";
import { AnnouncementsListPage } from "./pages/AnnouncementsListPage";
import { HomePage } from "./pages/public/HomePage";
import { JoinPage } from "./pages/public/JoinPage";
import { PublicEventsPage } from "./pages/public/PublicEventsPage";
import { RsvpPage } from "./pages/public/RsvpPage";
import { AttendanceSubmitPage } from "./pages/public/AttendanceSubmitPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/upcoming" element={<PublicEventsPage />} />
          <Route path="/rsvp/:eventId" element={<RsvpPage />} />
          <Route path="/attendance/submit" element={<AttendanceSubmitPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <Layout>
                  <MembersListPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/departments"
            element={
              <ProtectedRoute>
                <Layout>
                  <DepartmentsListPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/join-requests"
            element={
              <ProtectedRoute>
                <Layout>
                  <JoinRequestsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Layout>
                  <EventsListPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Layout>
                  <CalendarPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <Layout>
                  <AttendancePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <Layout>
                  <AnnouncementsListPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
