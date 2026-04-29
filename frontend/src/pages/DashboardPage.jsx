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

  if (loading) {
    return <div className="state-card">Loading your dashboard...</div>;
  }

  return (
    <section className="section-stack">
      <div className="section-header section-header-card">
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
                        Level {item.level} - {item.quizCompletedCount} quizzes completed
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
              {summary.xpEvents.slice(0, 5).length ? (
                summary.xpEvents.slice(0, 5).map((event) => (
                  <div key={event._id} className="list-item">
                    <div>
                      <strong>{event.sourceType.replaceAll("_", " ")}</strong>
                      <p>{event.topicSlug}</p>
                    </div>
                    <span>+{event.xp} XP</span>
                  </div>
                ))
              ) : (
                <div className="state-card compact">No XP activity yet.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <section className="dashboard-course-section">
        <div className="section-header">
          <div>
            <span className="eyebrow">Enrolled courses</span>
            <h2>Continue learning</h2>
          </div>
          <Link className="ghost-button" to="/courses">
            Browse courses
          </Link>
        </div>

        <div className="dashboard-course-grid">
          {enrollments.length ? (
            enrollments.map((enrollment) => {
              const totalLessons = enrollment.progress.length;
              const completedLessons = enrollment.progress.filter((item) => item.completed).length;
              const nextLesson = enrollment.progress.find((item) => !item.completed);

              return (
                <article className="panel enrollment-card" key={enrollment._id}>
                  <div className="enrollment-card-head">
                    {enrollment.course?.thumbnailUrl ? (
                      <img
                        src={enrollment.course.thumbnailUrl}
                        alt={enrollment.course?.title}
                        className="enrollment-thumb"
                      />
                    ) : (
                      <div className="enrollment-thumb enrollment-thumb-empty" />
                    )}
                    <div>
                      <div className="meta-row">
                        <span className="badge">{enrollment.course?.topicSlug || "course"}</span>
                        <span>{enrollment.completionPercentage}%</span>
                      </div>
                      <h3>{enrollment.course?.title}</h3>
                      <p>Instructor: {enrollment.course?.instructor?.name || "LearnSphere"}</p>
                    </div>
                  </div>

                  <div className="enrollment-progress-track" aria-hidden="true">
                    <span style={{ width: `${enrollment.completionPercentage}%` }} />
                  </div>

                  <div className="enrollment-card-summary">
                    <div>
                      <strong>{completedLessons}/{totalLessons}</strong>
                      <span>lessons complete</span>
                    </div>
                    <div>
                      <strong>{nextLesson?.lessonTitle || "Course complete"}</strong>
                      <span>{nextLesson ? "Next up" : "Ready for review"}</span>
                    </div>
                  </div>

                  <div className="button-row enrollment-card-actions">
                    <Link className="primary-button" to={`/learn/${enrollment._id}`}>
                      Continue Course
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="state-card">You have not enrolled in any courses yet.</div>
          )}
        </div>
      </section>
    </section>
  );
};

export default DashboardPage;
