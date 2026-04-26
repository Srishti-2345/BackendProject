import { Navigate, Route, Routes } from "react-router-dom";

import NavBar from "./components/NavBar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import BlogDetailsPage from "./pages/BlogDetailsPage.jsx";
import BlogsPage from "./pages/BlogsPage.jsx";
import ChallengesPage from "./pages/ChallengesPage.jsx";
import CourseDetailsPage from "./pages/CourseDetailsPage.jsx";
import CoursesPage from "./pages/CoursesPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import InstructorDashboardPage from "./pages/InstructorDashboardPage.jsx";
import LearningPage from "./pages/LearningPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ReviewDashboardPage from "./pages/ReviewDashboardPage.jsx";
import TopicDetailsPage from "./pages/TopicDetailsPage.jsx";

const App = () => (
  <div className="app-shell">
    <NavBar />
    <main className="page-shell">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:slug" element={<CourseDetailsPage />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/blogs/:slug" element={<BlogDetailsPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/topics/:slug" element={<TopicDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student", "instructor"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learn/:enrollmentId"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <LearningPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute allowedRoles={["student", "instructor"]}>
              <InstructorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/review"
          element={
            <ProtectedRoute allowedRoles={["reviewer"]}>
              <ReviewDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  </div>
);

export default App;
