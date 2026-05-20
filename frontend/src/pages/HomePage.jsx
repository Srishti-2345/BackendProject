import { Link } from "react-router-dom";

const spotlightCards = [
  {
    title: "Immersive course tracks",
    description: "Explore structured paths that move from fundamentals to build-ready execution.",
    tags: ["Guided", "Hands-on", "Progressive"],
    link: "/courses",
    cta: "Browse courses",
  },
  {
    title: "Focused quiz studio",
    description: "Generate practice sessions, reinforce concepts, and track topic confidence fast.",
    tags: ["Adaptive", "Instant", "Sharpen"],
    link: "/quiz-studio",
    cta: "Open quiz studio",
  },
  {
    title: "Editorial blog library",
    description: "Read explainers, implementation notes, and fresh thinking from the community.",
    tags: ["Readable", "Practical", "Curated"],
    link: "/blogs",
    cta: "Read blogs",
  },
];

const heroSignalCards = [
  {
    label: "Structured paths",
    sublabel: "Courses that move from basics to build-ready execution",
  },
  {
    label: "Practice daily",
    sublabel: "Quizzes that sharpen confidence topic by topic",
  },
  {
    label: "Grow into creator",
    sublabel: "Learn, prove skill, and unlock contribution",
  },
];

const HomePage = () => (
  <section className="home-minimal">
    <div className="home-hero editorial-panel">
      <div className="home-hero-grid">
        <div className="hero-copy hero-copy-centered">
          <span className="eyebrow">OpenLearn</span>
          <h1>Discover the future of learning and practice.</h1>
          <p>
            Unlock courses, sharpen with quizzes, and move from learner to contributor
            inside one focused platform.
          </p>
          <div className="button-row button-row-center">
            <Link to="/courses" className="primary-button">
              Start learning now
            </Link>
            <Link to="/dashboard" className="ghost-button">
              View dashboard
            </Link>
          </div>
        </div>

        <div className="hero-reference-visual" aria-hidden="true">
          <div className="hero-visual-bars">
            {heroSignalCards.map((item) => (
              <div key={item.label} className="hero-visual-bar">
                <strong>{item.label}</strong>
                <span>{item.sublabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <div className="home-reference-grid">
      {spotlightCards.map((card) => (
        <article key={card.title} className="feature-profession-card panel">
          <div className="section-stack">
            <span className="badge">OpenLearn module</span>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <div className="feature-card-tags">
              {card.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <Link to={card.link} className="ghost-button">
              {card.cta}
            </Link>
          </div>
          <div className="feature-card-orb" />
        </article>
      ))}
    </div>
  </section>
);

export default HomePage;
