import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client.js";

const DashboardPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [showAllCourses, setShowAllCourses] = useState(false);
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
          <div className="metric-card metric-card-compact">
            <strong>{summary.profile.streak}</strong>
            <span>Current streak</span>
          </div>
          <div className="metric-card metric-card-compact">
            <strong>{summary.profile.topicStats.reduce((sum, item) => sum + item.xp, 0)}</strong>
            <span>Total XP</span>
          </div>
          <div className="metric-card metric-card-compact">
            <strong>{summary.profile.topicStats.filter((item) => item.uploaderUnlocked).length}</strong>
            <span>Unlocked topics</span>
          </div>
        </div>
      ) : null}

      {summary ? (
        <div className="dashboard-grid">
          <div className="panel">
            <h3>Skill map</h3>
            <div className="list-stack" style={{gap: '0.5rem'}}>
              {summary.profile.topicStats.length ? (
                summary.profile.topicStats.map((item) => (
                  <div key={item.topicSlug} className="list-item list-item-compact">
                    <div>
                      <strong>{item.topicSlug}</strong>
                      <p>
                        Level {item.level} - {item.quizCompletedCount} quizzes
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
            <div className="list-stack" style={{gap: '0.5rem'}}>
              {summary.xpEvents.slice(0, 5).length ? (
                summary.xpEvents.slice(0, 5).map((event) => (
                  <div key={event._id} className="list-item list-item-compact">
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
          {enrollments.length > 3 && !showAllCourses && (
            <button className="ghost-button" onClick={() => setShowAllCourses(true)}>
              See More
            </button>
          )}
        </div>

        <div className="dashboard-course-grid">
          {enrollments.length ? (
            (showAllCourses ? enrollments : enrollments.slice(0, 3)).map((enrollment) => {
              const totalLessons = enrollment.progress.length;
              const completedLessons = enrollment.progress.filter((item) => item.completed).length;
              const nextLesson = enrollment.progress.find((item) => !item.completed);

              return (
  <div className="compact-enrollment-card" key={enrollment._id} style={{display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid #eee'}}>
    {enrollment.course?.thumbnailUrl ? (
      <img
        src={enrollment.course.thumbnailUrl}
        alt={enrollment.course?.title}
        style={{width: 48, height: 48, borderRadius: 8, objectFit: 'cover'}}
      />
    ) : (
      <div style={{width: 48, height: 48, borderRadius: 8, background: '#f0f0f0'}} />
    )}
    <div style={{flex: 1}}>
      <div style={{fontWeight: 600}}>{enrollment.course?.title}</div>
      <div style={{fontSize: 12, color: '#888'}}>Progress: {enrollment.completionPercentage}%</div>
    </div>
    <Link className="primary-button" style={{padding: '0.25rem 0.75rem', fontSize: 14}} to={`/learn/${enrollment._id}`}>
      Continue
    </Link>
  </div>
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
