import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../api/client.js";

const TopicDetailsPage = () => {
  const { slug } = useParams();
  const [state, setState] = useState(null);

  useEffect(() => {
    api.get(`/topics/${slug}`).then(({ data }) => setState(data)).catch(console.error);
  }, [slug]);

  if (!state) {
    return <div className="state-card">Loading topic...</div>;
  }

  const { topic, courses, blogs, topicProgress, application } = state;

  return (
    <section className="section-stack">
      <div className="panel editorial-panel">
        <span className="eyebrow">Topic path</span>
        <h1>{topic.name}</h1>
        <p>{topic.description}</p>
        {topicProgress ? (
          <div className="stats-grid">
            <div className="metric-card">
              <strong>{topicProgress.xp}</strong>
              <span>XP</span>
            </div>
            <div className="metric-card">
              <strong>{topicProgress.quizCompletedCount}</strong>
              <span>Quizzes completed</span>
            </div>
            <div className="metric-card">
              <strong>{topicProgress.uploaderUnlocked ? "Unlocked" : "Locked"}</strong>
              <span>Uploader status</span>
            </div>
          </div>
        ) : null}
        {application ? <div className="success-note">Creator application status: {application.status}</div> : null}
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <h3>Courses</h3>
          <div className="list-stack">
            {courses.map((course) => (
              <div className="list-item" key={course._id}>
                <div>
                  <strong>{course.title}</strong>
                  <p>{course.instructor?.name}</p>
                </div>
                <Link to={`/courses/${course.slug}`}>Open</Link>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>Blogs</h3>
          <div className="list-stack">
            {blogs.map((blog) => (
              <div className="list-item" key={blog._id}>
                <div>
                  <strong>{blog.title}</strong>
                  <p>{blog.author?.name}</p>
                </div>
                <Link to={`/blogs/${blog.slug}`}>Read</Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopicDetailsPage;
