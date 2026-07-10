import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { MembersListPage } from "./pages/MembersListPage";
import { MemberFormPage } from "./pages/MemberFormPage";
import { DepartmentsListPage } from "./pages/DepartmentsListPage";
import { DepartmentFormPage } from "./pages/DepartmentFormPage";
import { JoinRequestsPage } from "./pages/JoinRequestsPage";
import { EventsListPage } from "./pages/EventsListPage";
import { EventFormPage } from "./pages/EventFormPage";
import { JoinPage } from "./pages/public/JoinPage";
import { PublicEventsPage } from "./pages/public/PublicEventsPage";
import { RsvpPage } from "./pages/public/RsvpPage";
import "./App.css";

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
            path="/members/:memberId"
            element={
              <ProtectedRoute>
                <Layout>
                  <MemberFormPage />
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
            path="/departments/:departmentId"
            element={
              <ProtectedRoute>
                <Layout>
                  <DepartmentFormPage />
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
            path="/events/:eventId"
            element={
              <ProtectedRoute>
                <Layout>
                  <EventFormPage />
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
