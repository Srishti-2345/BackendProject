import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="app-footer footer-dark">
    <div className="footer-inner footer-grid">
      <div className="footer-col footer-brand-col">
        <div className="footer-logo-block">
          <span className="footer-logo">OpenLearn</span>
          <span className="footer-tagline">Learning, practice, and creator access in one place.</span>
        </div>
      </div>

      <div className="footer-col">
        <h3>Explore</h3>
        <Link to="/courses">Courses</Link>
        <Link to="/blogs">Blogs</Link>
        <Link to="/quiz-studio">Quiz Studio</Link>
      </div>

      <div className="footer-col">
        <h3>Creator</h3>
        <Link to="/create">Creator tools</Link>
        <Link to="/review">Review dashboard</Link>
        <Link to="/dashboard">Dashboard</Link>
      </div>

      <div className="footer-col">
        <h3>Account</h3>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
        <Link to="/dashboard">My account</Link>
      </div>
    </div>

    <div className="footer-bottom">
      <div className="footer-bottom-copy">© {new Date().getFullYear()} OpenLearn. All rights reserved.</div>
      <div className="footer-socials">
        <a href="#" aria-label="Facebook" className="social-icon">f</a>
        <a href="#" aria-label="Twitter" className="social-icon">t</a>
        <a href="#" aria-label="RSS" className="social-icon">📰</a>
        <a href="#" aria-label="Dribbble" className="social-icon">d</a>
      </div>
    </div>
  </footer>
);

export default Footer;
