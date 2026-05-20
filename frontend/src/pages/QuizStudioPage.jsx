import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/client.js";

const QUESTION_COUNT_OPTIONS = [3, 5, 7, 10];

const formatTopicLabel = (topicSlug = "") =>
  String(topicSlug || "general")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const QuizStudioPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [sourceType, setSourceType] = useState("pdf");
  const [requestedQuestionCount, setRequestedQuestionCount] = useState(5);
  const [pdfFile, setPdfFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [newQuizReady, setNewQuizReady] = useState(null);

  const loadInitialData = async () => {
    const historyResponse = await api.get("/quizzes/history");
    setHistory(historyResponse.data.attempts);
  };

  useEffect(() => {
    loadInitialData().catch((error) => {
      setMessage({
        tone: "error-note",
        text: error.response?.data?.message || "Could not load quiz studio.",
      });
    });
  }, []);

  const handleGenerate = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage(null);
      setNewQuizReady(null);

      const formData = new FormData();
      formData.append("sourceType", sourceType);
      formData.append("questionCount", String(requestedQuestionCount));

      if (sourceType === "pdf") {
        if (!pdfFile) {
          setMessage({ tone: "error-note", text: "Please choose a PDF or ODT document before generating a quiz." });
          return;
        }
        formData.append("pdf", pdfFile);
      } else {
        if (!videoUrl.trim()) {
          setMessage({ tone: "error-note", text: "Please paste a video URL before generating a quiz." });
          return;
        }
        formData.append("videoUrl", videoUrl.trim());
      }

      const { data } = await api.post("/quizzes/generate", formData);
      setNewQuizReady(data.attempt);
      if (data.usedFallback) {
        setMessage({
          tone: "error-note",
          text:
            data.fallbackReason ||
            "The AI provider could not generate a structured quiz, so a fallback quiz was created instead.",
        });
      }
      await loadInitialData();
    } catch (error) {
      setMessage({
        tone: "error-note",
        text: error.response?.data?.message || "Could not generate quiz.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-stack">
      <div className="section-header">
        <div>
          <span className="eyebrow">Quiz Studio</span>
          <h2>Generate a quiz from a document or video link</h2>
        </div>
      </div>

      {message ? <div className={message.tone}>{message.text}</div> : null}

      <div className="quiz-studio-grid">
        <section className="quiz-stage">
          {newQuizReady ? (
            <div className="panel review-content-block">
              <span className="badge">Success</span>
              <h3>Quiz Generated Successfully!</h3>
              <p>{newQuizReady.sourceLabel}</p>
              <div className="button-row">
                <button
                  className="primary-button"
                  onClick={() => navigate(`/quiz/${newQuizReady.id}`)}
                >
                  Start Practice
                </button>
                <button
                  className="ghost-button"
                  onClick={() => {
                    setNewQuizReady(null);
                    setMessage({ tone: "success-note", text: "Quiz added to your history. Practice it anytime!" });
                  }}
                >
                  Practice Later
                </button>
              </div>
            </div>
          ) : (
            <form className="panel quiz-generator-form" onSubmit={handleGenerate}>
              <div className="creator-panel-head">
                <div>
                  <h3>New quiz</h3>
                  <p>Add a source, choose the quiz length, and let the app build a fresh quiz.</p>
                </div>
              </div>
              <div className="split-row">
                <select value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
                  <option value="pdf">Document upload</option>
                  <option value="video_url">Video URL</option>
                </select>
                <select
                  value={requestedQuestionCount}
                  onChange={(event) => setRequestedQuestionCount(Number(event.target.value))}
                >
                  {QUESTION_COUNT_OPTIONS.map((count) => (
                    <option key={count} value={count}>
                      {count} questions
                    </option>
                  ))}
                </select>
              </div>

              {sourceType === "pdf" ? (
                <label className="creator-upload-field">
                  <span>Study document</span>
                  <small>{pdfFile ? pdfFile.name : "Upload a PDF or ODT file with readable text"}</small>
                  <input
                    type="file"
                    accept="application/pdf,.pdf,application/vnd.oasis.opendocument.text,.odt"
                    onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
                  />
                </label>
              ) : (
                <input
                  placeholder="Paste a video URL"
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                />
              )}

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? "Generating..." : "Generate quiz"}
              </button>
            </form>
          )}

          {!newQuizReady && !loading && (
            <div className="state-card">
              Generate a new quiz or pick one from your history on the right to start practicing.
            </div>
          )}
        </section>

        <aside className="panel quiz-sidebar">
          <div className="quiz-history">
            <div className="creator-panel-head">
              <div>
                <h3>Recent quizzes</h3>
                <p>Your latest generated sessions and scores.</p>
              </div>
              {history.length > 4 && !showAllHistory && (
                <button className="tiny-button" onClick={() => setShowAllHistory(true)}>
                  See More
                </button>
              )}
            </div>
            <div className="list-stack">
              {history.length ? (
                (showAllHistory ? history : history.slice(0, 4)).map((attempt) => (
                  <button
                    key={attempt.id}
                    type="button"
                    className={`review-queue-item ${activeAttempt?.id === attempt.id ? "review-queue-item-active" : ""}`}
                    onClick={() => navigate(`/quiz/${attempt.id}`)}
                  >
                    <div className="meta-row">
                      <span className="badge">{attempt.sourceType === "pdf" ? "Document" : "Video"}</span>
                      <span>{formatTopicLabel(attempt.topicSlug)}</span>
                    </div>
                    <strong>{attempt.sourceLabel}</strong>
                    <p>
                      {attempt.result?.submittedAt
                        ? `Score ${attempt.result.score}/${attempt.result.totalQuestions}`
                        : "Not submitted yet"}
                    </p>
                  </button>
                ))
              ) : (
                <div className="state-card compact">No quizzes generated yet.</div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default QuizStudioPage;
