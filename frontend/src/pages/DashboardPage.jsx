import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client.js";

const DashboardPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEnrollments = async () => {
      try {
        const [enrollmentsResponse, summaryResponse] = await Promise.all([
          api.get("/enrollments/me"),
          api.get("/topics/dashboard/me"),
        ]);
        setEnrollments(enrollmentsResponse.data.enrollments);
        setSummary(summaryResponse.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadEnrollments();
  }, []);

  const toggleLesson = async (enrollmentId, lessonTitle, completed) => {
    const { data } = await api.patch(`/enrollments/${enrollmentId}/progress`, {
      lessonTitle,
      completed: !completed,
    });

    setEnrollments((current) =>
      current.map((item) => (item._id === enrollmentId ? data.enrollment : item))
    );
  };

  if (loading) {
    return <div className="state-card">Loading your dashboard...</div>;
  }

  return (
    <section className="section-stack">
      <div className="section-header">
        <div>
          <span className="eyebrow">Student dashboard</span>
          <h2>Your learning progress</h2>
        </div>
      </div>

      {summary ? (
        <div className="stats-grid">
          <div className="metric-card">
            <strong>{summary.profile.streak}</strong>
            <span>Current streak</span>
          </div>
          <div className="metric-card">
            <strong>{summary.profile.topicStats.reduce((sum, item) => sum + item.xp, 0)}</strong>
            <span>Total XP</span>
          </div>
          <div className="metric-card">
            <strong>{summary.profile.topicStats.filter((item) => item.uploaderUnlocked).length}</strong>
            <span>Unlocked topics</span>
          </div>
        </div>
      ) : null}

      {summary ? (
        <div className="dashboard-grid">
          <div className="panel">
            <h3>Skill map</h3>
            <div className="list-stack">
              {summary.profile.topicStats.length ? (
                summary.profile.topicStats.map((item) => (
                  <div key={item.topicSlug} className="list-item">
                    <div>
                      <strong>{item.topicSlug}</strong>
                      <p>
                        Level {item.level} - {item.challengeSolvedCount} solved
                      </p>
                    </div>
                    <Link to={`/topics/${item.topicSlug}`}>{item.xp} XP</Link>
                  </div>
                ))
              ) : (
                <div className="state-card compact">Start learning to build your topic graph.</div>
              )}
            </div>
          </div>

          <div className="panel">
            <h3>Recent XP activity</h3>
            <div className="list-stack">
              {summary.xpEvents.map((event) => (
                <div key={event._id} className="list-item">
                  <div>
                    <strong>{event.sourceType.replaceAll("_", " ")}</strong>
                    <p>{event.topicSlug}</p>
                  </div>
                  <span>+{event.xp} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="card-grid">
        {enrollments.length ? (
          enrollments.map((enrollment) => (
            <article className="panel" key={enrollment._id}>
              <h3>{enrollment.course?.title}</h3>
              <p>Instructor: {enrollment.course?.instructor?.name}</p>
              <p>Progress: {enrollment.completionPercentage}%</p>
              <ul className="progress-list">
                {enrollment.progress.map((item) => (
                  <li key={item.lessonTitle}>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() =>
                          toggleLesson(enrollment._id, item.lessonTitle, item.completed)
                        }
                      />
                      <span>{item.lessonTitle}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </article>
          ))
        ) : (
          <div className="state-card">You have not enrolled in any courses yet.</div>
        )}
      </div>
    </section>
  );
};

export default DashboardPage;
