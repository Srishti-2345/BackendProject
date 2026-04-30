import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/client.js";

const ReviewDashboardPage = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [showAllQueue, setShowAllQueue] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/creator/reviews/queue");
      setQueue(data.pendingItems);
      setRecentItems(data.recentItems);
      setSummary(data.summary);
    } catch (error) {
      setMessage({
        tone: "error-note",
        text: error.response?.data?.message || "Could not load the review queue.",
      });
      setQueue([]);
      setRecentItems([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue().catch(console.error);
  }, []);

  return (
    <section className="section-stack reviewer-shell">
      <div className="section-header">
        <div>
          <span className="eyebrow">Reviewer workspace</span>
          <h2>Moderate course and blog submissions</h2>
          <p className="section-copy">Review pending content before it reaches learners.</p>
        </div>
      </div>

      {message ? <div className={message.tone}>{message.text}</div> : null}

      {summary ? (
        <div className="stats-grid">
          <div className="metric-card metric-card-compact">
            <strong>{summary.pendingCount}</strong>
            <span>Pending items</span>
          </div>
          <div className="metric-card metric-card-compact">
            <strong>{summary.courseCount}</strong>
            <span>Courses</span>
          </div>
          <div className="metric-card metric-card-compact">
            <strong>{summary.blogCount}</strong>
            <span>Blogs</span>
          </div>
        </div>
      ) : null}

      <div className="reviewer-grid">
        <section className="panel reviewer-stage">
          <div className="creator-panel-head">
            <div>
              <span className="eyebrow">Queue</span>
              <h3>Pending reviews</h3>
              <p>Items waiting for your moderation.</p>
            </div>
            {queue.length > 4 && !showAllQueue && (
              <button className="tiny-button" onClick={() => setShowAllQueue(true)}>
                Show more
              </button>
            )}
          </div>
          <div className="list-stack">
            {loading ? (
              <div className="state-card compact">Loading review queue...</div>
            ) : queue.length ? (
              (showAllQueue ? queue : queue.slice(0, 4)).map((item) => {
                return (
                  <button
                    key={`${item.type}:${item.id}`}
                    type="button"
                    className="review-queue-item"
                    onClick={() => navigate(`/review/${item.type}/${item.id}`)}
                  >
                    <div className="meta-row">
                      <span className="badge">{item.type}</span>
                      <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <strong>{item.title}</strong>
                    <p>
                      {item.owner?.name || "Unknown author"} · {item.topicSlug}
                    </p>
                  </button>
                );
              })
            ) : (
              <div className="state-card">The moderation queue is clear right now.</div>
            )}
          </div>
        </section>

        <aside className="panel reviewer-sidebar">
          <div className="creator-panel-head">
            <div>
              <span className="eyebrow">History</span>
              <h3>Recent decisions</h3>
            </div>
            {recentItems.length > 4 && !showAllRecent && (
              <button className="tiny-button" onClick={() => setShowAllRecent(true)}>
                Show more
              </button>
            )}
          </div>
          <div className="list-stack">
            {recentItems.length ? (
              (showAllRecent ? recentItems : recentItems.slice(0, 4)).map((item) => (
                <div key={`${item.type}:${item.id}:recent`} className="list-item list-item-compact">
                  <div>
                    <strong>{item.title}</strong>
                    <p>
                      {item.type} · {item.status.replaceAll("_", " ")}
                    </p>
                  </div>
                  <span>{item.topicSlug}</span>
                </div>
              ))
            ) : (
              <div className="state-card compact">No decisions recorded yet.</div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

export default ReviewDashboardPage;
