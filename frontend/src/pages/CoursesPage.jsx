import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client.js";

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const PRICE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "free", label: "Free" },
  { value: "under-1000", label: "Rs 0 - 1000" },
  { value: "1001-1500", label: "Rs 1001 - 1500" },
  { value: "1500-plus", label: "Rs 1500+" },
];

const DURATION_OPTIONS = [
  { value: "all", label: "All" },
  { value: "0-2", label: "0-2 Hours" },
  { value: "3-6", label: "3-6 Hours" },
  { value: "7-16", label: "7-16 Hours" },
  { value: "17-plus", label: "17+ Hours" },
];

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [priceRange, setPriceRange] = useState("all");
  const [durationRange, setDurationRange] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/topics").then(({ data }) => setTopics(data.topics)).catch(console.error);
  }, []);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/courses", {
          params: {
            search,
            topic,
            levels: selectedLevels.join(","),
            priceRange,
            durationRange,
          },
        });
        setCourses(data.courses);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [search, topic, selectedLevels, priceRange, durationRange]);

  const toggleLevel = (level) => {
    setSelectedLevels((currentLevels) =>
      currentLevels.includes(level)
        ? currentLevels.filter((item) => item !== level)
        : [...currentLevels, level]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setTopic("");
    setSelectedLevels([]);
    setPriceRange("all");
    setDurationRange("all");
  };

  return (
    <section className="catalog-shell">
      <aside className="catalog-sidebar panel">
        <div className="catalog-sidebar-block">
          <input
            className="catalog-search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search courses..."
          />
        </div>

        <div className="catalog-sidebar-head">
          <h3>Filters</h3>
          <button className="tiny-button" type="button" onClick={clearFilters}>
            Clear all
          </button>
        </div>

        <div className="catalog-sidebar-block">
          <span className="catalog-label">Difficulty level</span>
          <div className="catalog-toggle-list">
            {LEVEL_OPTIONS.map((option) => {
              const active = selectedLevels.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`catalog-toggle-row ${active ? "catalog-toggle-row-active" : ""}`}
                  onClick={() => toggleLevel(option.value)}
                >
                  <span>{option.label}</span>
                  <span className={`catalog-switch ${active ? "catalog-switch-active" : ""}`} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="catalog-sidebar-block">
          <span className="catalog-label">Topic</span>
          <select value={topic} onChange={(event) => setTopic(event.target.value)}>
            <option value="">All topics</option>
            {topics.map((item) => (
              <option key={item._id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="catalog-sidebar-block">
          <span className="catalog-label">Price range</span>
          <div className="catalog-pill-grid">
            {PRICE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`catalog-pill ${priceRange === option.value ? "catalog-pill-active" : ""}`}
                onClick={() => setPriceRange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="catalog-sidebar-block">
          <span className="catalog-label">Duration</span>
          <div className="catalog-pill-grid">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`catalog-pill ${durationRange === option.value ? "catalog-pill-active" : ""}`}
                onClick={() => setDurationRange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="catalog-content">
        <div className="catalog-heading">
          <span className="eyebrow">Trending courses</span>
          <h2>Find the right learning path</h2>
          <p className="section-copy">
            Curated learning tracks built around real progression, not endless playlists.
          </p>
        </div>

        {loading ? (
          <div className="state-card">Loading courses...</div>
        ) : courses.length ? (
          <div className="catalog-card-grid">
            {courses.map((course) => (
              <article className="catalog-course-card course-card editorial-card" key={course._id}>
                <div className="catalog-course-media">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="course-thumb" />
                  ) : (
                    <div className="catalog-course-media-fallback" />
                  )}
                </div>
                <div className="course-card-body">
                  <div className="catalog-card-topline">
                    <span className="badge">{course.level}</span>
                    <span className="catalog-card-progress">
                      {course.enrolledCount || 0} enrolled
                    </span>
                  </div>
                  <h3>{course.title}</h3>
                  <p>{course.subtitle}</p>
                  <div className="meta-row course-card-meta">
                    <span>by {course.instructor?.name}</span>
                    <span>{course.totalDurationLabel}</span>
                  </div>
                  <div className="meta-row course-card-meta">
                    <span>{course.topicSlug}</span>
                    <strong>Rs. {course.price}</strong>
                  </div>
                  <Link className="primary-button full-width" to={`/courses/${course.slug}`}>
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="state-card">No courses match your filters yet.</div>
        )}
      </div>
    </section>
  );
};

export default CoursesPage;
