import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client.js";

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/topics").then(({ data }) => setTopics(data.topics)).catch(console.error);
  }, []);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/courses", {
          params: { search, topic },
        });
        setCourses(data.courses);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [search, topic]);

  return (
    <section className="section-stack">
      <div className="section-header">
        <div>
          <span className="eyebrow">Browse courses</span>
          <h2>Find the right learning path</h2>
          <p className="section-copy">
            Curated learning tracks built around real progression, not endless playlists.
          </p>
        </div>
        <div className="filters-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title"
          />
          <select value={topic} onChange={(event) => setTopic(event.target.value)}>
            <option value="">All topics</option>
            {topics.map((item) => (
              <option key={item._id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="state-card">Loading courses...</div>
      ) : (
        <div className="card-grid">
          {courses.length ? (
            courses.map((course) => (
              <article className="course-card editorial-card" key={course._id}>
                <img src={course.thumbnailUrl} alt={course.title} className="course-thumb" />
                <div className="course-card-body">
                  <span className="badge">{course.topicSlug}</span>
                  <h3>{course.title}</h3>
                  <p>{course.subtitle}</p>
                  <div className="meta-row">
                    <span>by {course.instructor?.name}</span>
                    <strong>Rs. {course.price}</strong>
                  </div>
                  <Link className="primary-button full-width" to={`/courses/${course.slug}`}>
                    View Details
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="state-card">No courses match your filters yet.</div>
          )}
        </div>
      )}
    </section>
  );
};

export default CoursesPage;
