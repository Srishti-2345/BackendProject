import { useEffect, useState } from "react";

import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const DiscussionPanel = ({
  contextType,
  contextId,
  topicSlug = "community",
  title = "Discussion",
  subtitle = "Ask questions, share implementation notes, and help the next learner move faster.",
  className = "",
}) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [threadForm, setThreadForm] = useState({
    title: "",
    body: "",
    tag: "question",
  });
  const [replyDrafts, setReplyDrafts] = useState({});

  useEffect(() => {
    if (!contextId) {
      return;
    }

    const loadThreads = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const { data } = await api.get("/discussions", {
          params: { contextType, contextId },
        });
        setThreads(data.threads);
      } catch (error) {
        setThreads([]);
        setErrorMessage(error.response?.data?.message || "Could not load discussion");
      } finally {
        setLoading(false);
      }
    };

    loadThreads();
  }, [contextId, contextType]);

  const createThread = async (event) => {
    event.preventDefault();

    try {
      setErrorMessage("");
      const { data } = await api.post("/discussions", {
        ...threadForm,
        contextType,
        contextId,
        topicSlug,
      });
      setThreads((current) => [data.thread, ...current]);
      setThreadForm({ title: "", body: "", tag: "question" });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Could not start thread");
    }
  };

  const replyToThread = async (threadId) => {
    const body = replyDrafts[threadId];
    if (!body) {
      return;
    }

    try {
      setErrorMessage("");
      const { data } = await api.post(`/discussions/${threadId}/replies`, { body, topicSlug });
      setThreads((current) =>
        current.map((thread) => (thread._id === threadId ? data.thread : thread))
      );
      setReplyDrafts((current) => ({ ...current, [threadId]: "" }));
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Could not send reply");
    }
  };

  return (
    <section className={`panel discussion-panel ${className}`.trim()}>
      <div className="discussion-panel-head">
        <div>
          <span className="eyebrow">Course discussion</span>
          <h3>{title}</h3>
        </div>
        <p>{subtitle}</p>
      </div>

      {user ? (
        <form className="discussion-form" onSubmit={createThread}>
          <div className="discussion-compose">
            <div className="discussion-compose-row">
              <input
                placeholder="Thread title"
                value={threadForm.title}
                onChange={(event) =>
                  setThreadForm((current) => ({ ...current, title: event.target.value }))
                }
              />
              <select
                value={threadForm.tag}
                onChange={(event) =>
                  setThreadForm((current) => ({ ...current, tag: event.target.value }))
                }
              >
                <option value="question">Question</option>
                <option value="help">Help</option>
                <option value="tips">Tips</option>
                <option value="review">Review</option>
                <option value="project_showcase">Project showcase</option>
              </select>
            </div>
            <textarea
              rows="3"
              placeholder="Ask a question or share a useful insight"
              value={threadForm.body}
              onChange={(event) =>
                setThreadForm((current) => ({ ...current, body: event.target.value }))
              }
            />
            <div className="discussion-compose-actions">
              <span className="discussion-helper-copy">
                Visible to enrolled learners in this course.
              </span>
              <button className="primary-button" type="submit">
                Start Thread
              </button>
            </div>
          </div>
        </form>
      ) : (
        <p>Login to join the discussion.</p>
      )}

      {errorMessage ? <div className="error-note">{errorMessage}</div> : null}

      {loading ? (
        <div className="state-card compact">Loading discussion...</div>
      ) : (
        <div className="discussion-stack">
          {threads.length ? (
            threads.map((thread) => (
              <article key={thread._id} className="discussion-thread">
                <div className="discussion-head">
                  <div>
                    <strong>{thread.title}</strong>
                    <p>{thread.author?.name} - {thread.tag}</p>
                  </div>
                  <div className="discussion-thread-meta">
                    <span className="badge">{thread.status}</span>
                    <span className="discussion-reply-count">
                      {thread.replies.length} replies
                    </span>
                  </div>
                </div>
                <p>{thread.body}</p>

                <div className="reply-stack">
                  {thread.replies.map((reply) => (
                    <div key={reply._id} className="reply-item">
                      <strong>{reply.author?.name}</strong>
                      <p>{reply.body}</p>
                    </div>
                  ))}
                </div>

                {user ? (
                  <div className="reply-form">
                    <textarea
                      rows="2"
                      placeholder="Reply to this thread"
                      value={replyDrafts[thread._id] || ""}
                      onChange={(event) =>
                        setReplyDrafts((current) => ({
                          ...current,
                          [thread._id]: event.target.value,
                        }))
                      }
                    />
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => replyToThread(thread._id)}
                    >
                      Reply
                    </button>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="state-card compact">No threads yet. Start the conversation.</div>
          )}
        </div>
      )}
    </section>
  );
};

export default DiscussionPanel;
