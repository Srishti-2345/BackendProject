import { Link } from "react-router-dom";

const HomePage = () => (
  <section className="section-stack">
    <div className="hero-grid">
      <div className="hero-copy editorial-panel">
        <span className="eyebrow">Learn - gain XP - become uploader</span>
        <h1>Turn proven learners into trusted creators.</h1>
        <p>
          LearnSphere combines structured courses, challenge solving, topic XP,
          and community discussions so users can unlock creator access only after
          demonstrating real skill.
        </p>
        <div className="button-row">
          <Link to="/courses" className="primary-button">
            Start Learning
          </Link>
          <Link to="/challenges" className="ghost-button">
            Practice Challenges
          </Link>
        </div>
      </div>

      <div className="hero-panel">
        <div className="metric-card feature-tile feature-tile-cream">
          <strong>Learner loop</strong>
          <span>Courses, practice, discussions, XP, and streaks</span>
        </div>
        <div className="metric-card feature-tile feature-tile-sage">
          <strong>Uploader unlock</strong>
          <span>Topic-based thresholds and creator applications</span>
        </div>
        <div className="metric-card feature-tile feature-tile-terra">
          <strong>Content lifecycle</strong>
          <span>Draft, review, publish, and community feedback</span>
        </div>
        <div className="palette-board">
          <div className="swatch-card swatch-cream">
            <span>#E1DDD3</span>
          </div>
          <div className="swatch-card swatch-fog">
            <span>#C9D2D1</span>
          </div>
          <div className="swatch-card swatch-sage">
            <span>#A4B2B0</span>
          </div>
          <div className="swatch-card swatch-sand">
            <span>#DAB89D</span>
          </div>
          <div className="swatch-card swatch-ink">
            <span>#302B2D</span>
          </div>
          <div className="swatch-card swatch-clay">
            <span>#A47C66</span>
          </div>
        </div>
      </div>
    </div>

    <div className="stats-grid">
      <div className="panel numbered-panel">
        <h3>1. Learn deeply</h3>
        <p>Enroll in courses, complete lessons, and follow topic paths.</p>
      </div>
      <div className="panel numbered-panel">
        <h3>2. Prove competence</h3>
        <p>Solve challenges, build streaks, and earn verified topic XP.</p>
      </div>
      <div className="panel numbered-panel">
        <h3>3. Contribute back</h3>
        <p>Apply as a creator, publish content, and grow your reputation.</p>
      </div>
    </div>
  </section>
);

export default HomePage;
