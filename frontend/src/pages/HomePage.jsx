import { Link } from "react-router-dom";

const HomePage = () => (
  <section className="home-minimal">
    <div className="home-hero editorial-panel">
      <div className="home-hero-grid">
        <div className="hero-copy hero-copy-centered">
          <span className="eyebrow">OpenLearn</span>
          <h1>Simple learning. Courses and blogs in one place.</h1>
          <p>Choose where to begin and keep the homepage clean.</p>
          <div className="button-row button-row-center">
            <Link to="/courses" className="primary-button">
              Browse Courses
            </Link>
            <Link to="/blogs" className="ghost-button">
              Browse Blogs
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HomePage;
