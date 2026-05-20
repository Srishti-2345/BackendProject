import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

const NavBar = ({ theme, onToggleTheme }) => {
  const { user, logout } = useAuth();

  return (
    <header className="nav-shell">
      <Link to="/" className="brand-lockup">
        <span className="brand-mark">OpenLearn</span>
        <span className="brand-subline">Future-ready learning network</span>
      </Link>

      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/courses">Courses</NavLink>
        {user?.role !== "reviewer" && user && <NavLink to="/quiz-studio">Quiz Studio</NavLink>}
        <NavLink to="/blogs">Blogs</NavLink>
        {user?.role !== "reviewer" && user && <NavLink to="/dashboard">Dashboard</NavLink>}
        {user?.role !== "reviewer" && user && <NavLink to="/create">Create</NavLink>}
        {user?.role === "reviewer" && <NavLink to="/review">Review</NavLink>}
      </nav>

      <div className="nav-actions">
        <button
          className={`theme-toggle ${theme === "dark" ? "theme-toggle-dark" : "theme-toggle-light"}`}
          onClick={onToggleTheme}
          type="button"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="theme-toggle-track">
            <span className="theme-toggle-thumb" aria-hidden="true" />
          </span>
        </button>
        {user ? (
          <>
            <span className="user-pill">{user.name}</span>
            <button className="ghost-button" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="ghost-button">
              Login
            </Link>
            <Link to="/register" className="primary-button">
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default NavBar;
