import { useEffect, useMemo, useState } from "react";

import api from "../api/client.js";

const decisionOptions = [
  { value: "approve", label: "Approve and publish" },
  { value: "request_changes", label: "Request changes" },
  { value: "reject", label: "Reject" },
];

const ReviewDashboardPage = () => {
  const [queue, setQueue] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activeKey, setActiveKey] = useState("");
  const [activeItem, setActiveItem] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [decision, setDecision] = useState("approve");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const loadQueue = async (preferredKey = "") => {
    setLoading(true);
    try {
      const { data } = await api.get("/creator/reviews/queue");
      setQueue(data.pendingItems);
      setRecentItems(data.recentItems);
      setSummary(data.summary);

      const fallbackKey = data.pendingItems[0]
        ? `${data.pendingItems[0].type}:${data.pendingItems[0].id}`
        : "";
      const nextKey =
        preferredKey && data.pendingItems.some((item) => `${item.type}:${item.id}` === preferredKey)
          ? preferredKey
          : fallbackKey;

      setActiveKey(nextKey);
    } catch (error) {
      setMessage({
        tone: "error-note",
        text: error.response?.data?.message || "Could not load the review queue.",
      });
      setQueue([]);
      setRecentItems([]);
      setSummary(null);
      setActiveKey("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue().catch(console.error);
  }, []);

  useEffect(() => {
    const loadDetails = async () => {
      if (!activeKey) {
        setActiveItem(null);
        setReviewNotes("");
        return;
      }

      const [contentType, contentId] = activeKey.split(":");
      const { data } = await api.get(`/creator/reviews/${contentType}/${contentId}`);
      setActiveItem(data.item);
      setReviewNotes(data.item.reviewNotes || "");
    };

    loadDetails().catch((error) => {
      console.error(error);
      setActiveItem(null);
      setReviewNotes("");
    });
  }, [activeKey]);

  const activeMeta = useMemo(() => {
    if (!activeItem) {
      return [];
    }

    return [
      activeItem.topicSlug,
      activeItem.details.category,
      activeItem.details.level,
      activeItem.details.difficulty,
    ].filter(Boolean);
  }, [activeItem]);

  const submitReview = async () => {
    if (!activeItem) {
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/creator/reviews/${activeItem.type}/${activeItem.id}`, {
        decision,
        reviewNotes,
      });

      setMessage({
        tone: "success-note",
        text: `${activeItem.title} reviewed successfully.`,
      });
      await loadQueue(activeKey);
    } catch (error) {
      setMessage({
        tone: "error-note",
        text: error.response?.data?.message || "Could not submit review.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-stack reviewer-shell">
      <div className="section-header">
        <div>
          <span className="eyebrow">Reviewer workspace</span>
          <h2>Moderate course, challenge, and blog submissions</h2>
          <p className="section-copy">
            Review pending content before it reaches learners and keep quality standards tight.
          </p>
        </div>
      </div>

      {message ? <div className={message.tone}>{message.text}</div> : null}

      {summary ? (
        <div className="stats-grid">
          <div className="metric-card">
            <strong>{summary.pendingCount}</strong>
            <span>Pending items</span>
          </div>
          <div className="metric-card">
            <strong>{summary.courseCount}</strong>
            <span>Courses</span>
          </div>
          <div className="metric-card">
            <strong>{summary.challengeCount}</strong>
            <span>Challenges</span>
          </div>
          <div className="metric-card">
            <strong>{summary.blogCount}</strong>
            <span>Blogs</span>
          </div>
        </div>
      ) : null}

      <div className="reviewer-grid">
        <aside className="panel reviewer-sidebar">
          <div className="creator-panel-head">
            <div>
              <span className="eyebrow">Queue</span>
              <h3>Pending reviews</h3>
            </div>
          </div>
          <div className="list-stack">
            {loading ? (
              <div className="state-card compact">Loading review queue...</div>
            ) : queue.length ? (
              queue.map((item) => {
                const itemKey = `${item.type}:${item.id}`;

                return (
                  <button
                    key={itemKey}
                    type="button"
                    className={`review-queue-item ${activeKey === itemKey ? "review-queue-item-active" : ""}`}
                    onClick={() => {
                      setActiveKey(itemKey);
                      setDecision("approve");
                    }}
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
              <div className="state-card compact">
                The moderation queue is clear right now.
              </div>
            )}
          </div>

          <div className="creator-panel-head reviewer-recent-head">
            <div>
              <span className="eyebrow">Recent</span>
              <h3>Your latest decisions</h3>
            </div>
          </div>
          <div className="list-stack">
            {recentItems.length ? (
              recentItems.map((item) => (
                <div key={`${item.type}:${item.id}:recent`} className="list-item">
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

        <section className="panel reviewer-stage">
          {activeItem ? (
            <>
              <div className="creator-section-head">
                <div>
                  <span className="eyebrow">Review item</span>
                  <h3>{activeItem.title}</h3>
                </div>
                <div className="button-row">
                  {activeMeta.map((item) => (
                    <span key={item} className="badge">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="reviewer-summary-grid">
                <div className="state-card compact">
                  <strong>Submitted by</strong>
                  <p>{activeItem.owner?.name || "Unknown contributor"}</p>
                  <p>{activeItem.owner?.email || ""}</p>
                </div>
                <div className="state-card compact">
                  <strong>Updated</strong>
                  <p>{new Date(activeItem.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              {activeItem.details.subtitle ? <p>{activeItem.details.subtitle}</p> : null}
              {activeItem.details.excerpt ? <p>{activeItem.details.excerpt}</p> : null}
              {activeItem.details.description ? (
                <div className="review-content-block">
                  <h4>Description</h4>
                  <p>{activeItem.details.description}</p>
                </div>
              ) : null}
              {activeItem.details.prompt ? (
                <div className="review-content-block">
                  <h4>Challenge prompt</h4>
                  <p>{activeItem.details.prompt}</p>
                </div>
              ) : null}
              {activeItem.details.content ? (
                <div className="review-content-block">
                  <h4>Blog content</h4>
                  <div className="article-body">{activeItem.details.content}</div>
                </div>
              ) : null}
              {activeItem.details.constraints.length ? (
                <div className="review-content-block">
                  <h4>Constraints</h4>
                  <ul className="simple-list">
                    {activeItem.details.constraints.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {activeItem.details.examples.length ? (
                <div className="review-content-block">
                  <h4>Examples</h4>
                  <ul className="simple-list">
                    {activeItem.details.examples.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {activeItem.details.publicTestCases.length ? (
                <div className="review-content-block">
                  <h4>Visible test cases</h4>
                  <div className="testcase-stack">
                    {activeItem.details.publicTestCases.map((testCase, index) => (
                      <div className="testcase-card" key={`${activeItem.id}-case-${index}`}>
                        <strong>Case {index + 1}</strong>
                        <pre>{JSON.stringify(testCase.input, null, 2)}</pre>
                        <p>Expected: {JSON.stringify(testCase.expectedOutput)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {activeItem.details.starterCode ? (
                <div className="review-content-block">
                  <h4>Starter code</h4>
                  <pre className="article-code">{activeItem.details.starterCode}</pre>
                </div>
              ) : null}
              {activeItem.details.sections.length ? (
                <div className="review-content-block">
                  <h4>Course structure</h4>
                  <div className="list-stack">
                    {activeItem.details.sections.map((section) => (
                      <div key={section.title} className="testcase-card">
                        <strong>{section.title}</strong>
                        <p>{section.lessons?.length || 0} lessons</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="review-decision-panel">
                <select value={decision} onChange={(event) => setDecision(event.target.value)}>
                  {decisionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <textarea
                  rows="5"
                  placeholder="Add guidance for the creator"
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                />
                <button
                  className="primary-button"
                  type="button"
                  onClick={submitReview}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Submit decision"}
                </button>
              </div>
            </>
          ) : (
            <div className="state-card">Select a pending item to start reviewing.</div>
          )}
        </section>
      </div>
    </section>
  );
};

export default ReviewDashboardPage;
