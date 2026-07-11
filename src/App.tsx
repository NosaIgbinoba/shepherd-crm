import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { MembersListPage } from "./pages/MembersListPage";
import { DepartmentsListPage } from "./pages/DepartmentsListPage";
import { JoinRequestsPage } from "./pages/JoinRequestsPage";
import { EventsListPage } from "./pages/EventsListPage";
import { AnnouncementsListPage } from "./pages/AnnouncementsListPage";
import { JoinPage } from "./pages/public/JoinPage";
import { PublicEventsPage } from "./pages/public/PublicEventsPage";
import { RsvpPage } from "./pages/public/RsvpPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/upcoming" element={<PublicEventsPage />} />
          <Route path="/rsvp/:eventId" element={<RsvpPage />} />

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
            path="/announcements"
            element={
              <ProtectedRoute>
                <Layout>
                  <AnnouncementsListPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/members" replace />} />
          <Route path="*" element={<Navigate to="/members" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
