import { useEffect, useState } from "react";

import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const DiscussionPanel = ({ contextType, contextId, topicSlug = "community" }) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
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
        const { data } = await api.get("/discussions", {
          params: { contextType, contextId },
        });
        setThreads(data.threads);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadThreads();
  }, [contextId, contextType]);

  const createThread = async (event) => {
    event.preventDefault();
    const { data } = await api.post("/discussions", {
      ...threadForm,
      contextType,
      contextId,
      topicSlug,
    });
    setThreads((current) => [data.thread, ...current]);
    setThreadForm({ title: "", body: "", tag: "question" });
  };

  const replyToThread = async (threadId) => {
    const body = replyDrafts[threadId];
    if (!body) {
      return;
    }

    const { data } = await api.post(`/discussions/${threadId}/replies`, { body, topicSlug });
    setThreads((current) =>
      current.map((thread) => (thread._id === threadId ? data.thread : thread))
    );
    setReplyDrafts((current) => ({ ...current, [threadId]: "" }));
  };

  return (
    <section className="panel">
      <h3>Discussion</h3>
      {user ? (
        <form className="discussion-form" onSubmit={createThread}>
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
          <textarea
            rows="3"
            placeholder="Ask a question or share a useful insight"
            value={threadForm.body}
            onChange={(event) =>
              setThreadForm((current) => ({ ...current, body: event.target.value }))
            }
          />
          <button className="primary-button" type="submit">
            Start Thread
          </button>
        </form>
      ) : (
        <p>Login to join the discussion.</p>
      )}

      {loading ? (
        <div className="state-card compact">Loading discussion...</div>
      ) : (
        <div className="list-stack">
          {threads.length ? (
            threads.map((thread) => (
              <article key={thread._id} className="discussion-thread">
                <div className="discussion-head">
                  <div>
                    <strong>{thread.title}</strong>
                    <p>
                      {thread.author?.name} - {thread.tag}
                    </p>
                  </div>
                  <span className="badge">{thread.status}</span>
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
