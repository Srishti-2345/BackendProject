import { Link } from "react-router-dom";

const HomePage = () => (
  <section className="section-stack">
    <div className="home-hero editorial-panel">
      <div className="home-hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">Learn, practice, prove, publish</span>
          <h1>Build skill in public before you earn the right to teach it.</h1>
          <p>
            LearnSphere turns passive course browsing into a progression system.
            Learners move through lessons, generate quizzes from real study
            material, earn verified topic XP, and unlock creator access only
            after demonstrating depth.
          </p>
          <div className="button-row">
            <Link to="/courses" className="primary-button">
              Explore Courses
            </Link>
            <Link to="/quiz-studio" className="ghost-button">
              Try Quiz Studio
            </Link>
          </div>
        </div>

        <div className="home-summary-panel">
          <div className="hero-mini-stat">
            <strong>Learn with structure</strong>
            <span>Courses, topics, and guided lessons that keep progress clear.</span>
          </div>
          <div className="hero-mini-stat">
            <strong>Practice from real material</strong>
            <span>Generate quizzes from documents or videos and earn topic XP as you improve.</span>
          </div>
          <div className="hero-mini-stat">
            <strong>Earn creator access</strong>
            <span>Publishing opens up after demonstrated progress and reviewer approval.</span>
          </div>
        </div>
      </div>
    </div>

    <div className="section-header">
      <div>
        <span className="eyebrow">Why it feels different</span>
        <h2>A tighter loop from learner to creator.</h2>
      </div>
      <p className="section-copy">
        Instead of treating learning, testing, and publishing as separate tools,
        LearnSphere connects them into one loop that rewards demonstrated skill.
      </p>
    </div>

    <div className="stats-grid">
      <div className="panel numbered-panel">
        <h3>1. Learn deeply</h3>
        <p>Enroll in courses, complete lessons, and build topic fluency over time.</p>
      </div>
      <div className="panel numbered-panel">
        <h3>2. Prove competence</h3>
        <p>Generate quizzes from documents or video links, build streaks, and earn verified topic XP.</p>
      </div>
      <div className="panel numbered-panel">
        <h3>3. Contribute back</h3>
        <p>Apply as a creator, publish content, and grow your reputation with review support.</p>
      </div>
    </div>

    <div className="home-cta panel">
      <div className="home-cta-copy">
        <span className="eyebrow">Start somewhere real</span>
        <h2>Open a course, generate a quiz, and let the product explain itself.</h2>
        <p>
          The strongest first impression here is action. Jump into the catalog or
          head straight to quiz practice and see how the learning loop fits
          together.
        </p>
      </div>
      <div className="button-row">
        <Link to="/courses" className="primary-button">
          Browse Courses
        </Link>
        <Link to="/blogs" className="ghost-button">
          Read Blogs
        </Link>
      </div>
    </div>
  </section>
);

export default HomePage;
