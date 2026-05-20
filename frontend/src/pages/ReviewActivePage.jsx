import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client.js";

const decisionOptions = [
  { value: "approve", label: "Approve and publish" },
  { value: "request_changes", label: "Request changes" },
  { value: "reject", label: "Reject" },
];

const ReviewActivePage = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [decision, setDecision] = useState("approve");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const { data } = await api.get(`/creator/reviews/${type}/${id}`);
        setActiveItem(data.item);
        setReviewNotes(data.item.reviewNotes || "");
      } catch (error) {
        setMessage({
          tone: "error-note",
          text: error.response?.data?.message || "Could not load review item.",
        });
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [type, id]);

  const activeMeta = useMemo(() => {
    if (!activeItem) return [];
    return [activeItem.topicSlug, activeItem.details.category, activeItem.details.level].filter(Boolean);
  }, [activeItem]);

  const submitReview = async () => {
    if (!activeItem) return;

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
      setTimeout(() => navigate("/review"), 1500);
    } catch (error) {
      setMessage({
        tone: "error-note",
        text: error.response?.data?.message || "Could not submit review.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="state-card">Loading review item...</div>;

  return (
    <section className="section-stack">
      <div className="section-header">
        <div>
          <button className="ghost-button spacer-bottom" onClick={() => navigate("/review")}>
            Back to Queue
          </button>
          <h2>Review Submission</h2>
        </div>
      </div>

      {message ? <div className={message.tone}>{message.text}</div> : null}

      {activeItem ? (
        <div className="reviewer-stage reviewer-stage-centered">
          <div className="panel editorial-panel">
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

            <div className="reviewer-summary-grid flow-space">
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
          </div>

          {activeItem.details.subtitle ? <p className="lead reviewer-stage-copy">{activeItem.details.subtitle}</p> : null}
          {activeItem.details.excerpt ? <p className="lead reviewer-stage-copy">{activeItem.details.excerpt}</p> : null}

          <div className="panel review-content-block">
            {activeItem.details.description ? (
              <div className="spacer-bottom">
                <h4>Description</h4>
                <p>{activeItem.details.description}</p>
              </div>
            ) : null}
            {activeItem.details.content ? (
              <div>
                <h4>Blog content</h4>
                <div className="article-body">{activeItem.details.content}</div>
              </div>
            ) : null}
            {activeItem.details.sections?.length ? (
              <div>
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
          </div>

          <div className="panel review-decision-panel">
            <h3>Decision</h3>
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
              <button className="primary-button" type="button" onClick={submitReview} disabled={submitting}>
                {submitting ? "Saving..." : "Submit decision"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="state-card">Item not found.</div>
      )}
    </section>
  );
};

export default ReviewActivePage;
