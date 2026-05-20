import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";

import NavBar from "./components/NavBar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import BlogDetailsPage from "./pages/BlogDetailsPage.jsx";
import BlogsPage from "./pages/BlogsPage.jsx";
import CourseDetailsPage from "./pages/CourseDetailsPage.jsx";
import CoursesPage from "./pages/CoursesPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import InstructorDashboardPage from "./pages/InstructorDashboardPage.jsx";
import LearningPage from "./pages/LearningPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import QuizStudioPage from "./pages/QuizStudioPage.jsx";
import QuizActivePage from "./pages/QuizActivePage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ReviewDashboardPage from "./pages/ReviewDashboardPage.jsx";
import ReviewActivePage from "./pages/ReviewActivePage.jsx";
import TopicDetailsPage from "./pages/TopicDetailsPage.jsx";

const THEME_STORAGE_KEY = "openlearn_theme";

const App = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  return (
    <div className="app-shell">
      <NavBar theme={theme} onToggleTheme={toggleTheme} />
      <main className="page-shell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:slug" element={<CourseDetailsPage />} />
          <Route path="/blogs" element={<BlogsPage />} />
          <Route path="/blogs/:slug" element={<BlogDetailsPage />} />
          <Route path="/topics/:slug" element={<TopicDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/quiz-studio"
            element={
              <ProtectedRoute allowedRoles={["student", "instructor"]}>
                <QuizStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/:quizId"
            element={
              <ProtectedRoute allowedRoles={["student", "instructor"]}>
                <QuizActivePage />
              </ProtectedRoute>
            }
          />
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
          <Route
            path="/review/:type/:id"
            element={
              <ProtectedRoute allowedRoles={["reviewer"]}>
                <ReviewActivePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
