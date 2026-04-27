import { useEffect, useMemo, useState } from "react";

import api from "../api/client.js";

const QuizStudioPage = () => {
  const [topics, setTopics] = useState([]);
  const [history, setHistory] = useState([]);
  const [sourceType, setSourceType] = useState("pdf");
  const [topicSlug, setTopicSlug] = useState("react");
  const [pdfFile, setPdfFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const loadInitialData = async () => {
    const [topicsResponse, historyResponse] = await Promise.all([
      api.get("/topics"),
      api.get("/quizzes/history"),
    ]);

    setTopics(topicsResponse.data.topics);
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

  useEffect(() => {
    if (!topics.length || topicSlug) {
      return;
    }

    setTopicSlug(topics[0].slug);
  }, [topics, topicSlug]);

  const questionCount = activeAttempt?.questions?.length || 0;
  const answeredCount = useMemo(
    () => answers.filter((answer) => Number.isInteger(answer) && answer >= 0).length,
    [answers]
  );

  const handleGenerate = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage(null);
      setResult(null);

      const formData = new FormData();
      formData.append("sourceType", sourceType);
      formData.append("topicSlug", topicSlug);

      if (sourceType === "pdf") {
        if (!pdfFile) {
          setMessage({ tone: "error-note", text: "Please choose a PDF before generating a quiz." });
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
      setActiveAttempt(data.attempt);
      setAnswers(new Array(data.attempt.questions.length).fill(-1));
      await loadInitialData();
      setMessage({
        tone: "success-note",
        text: "Quiz generated. Answer the questions below and submit when ready.",
      });
    } catch (error) {
      setMessage({
        tone: "error-note",
        text: error.response?.data?.message || "Could not generate quiz.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeAttempt) {
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post(`/quizzes/${activeAttempt.id}/submit`, { answers });
      setResult(data.result);
      await loadInitialData();
      setMessage({
        tone: "success-note",
        text: `Quiz submitted. You scored ${data.result.score}/${data.result.totalQuestions}.`,
      });
    } catch (error) {
      setMessage({
        tone: "error-note",
        text: error.response?.data?.message || "Could not submit quiz.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-stack">
      <div className="section-header">
        <div>
          <span className="eyebrow">Quiz Studio</span>
          <h2>Generate a quiz from a PDF or video link</h2>
        </div>
      </div>

      {message ? <div className={message.tone}>{message.text}</div> : null}

      <div className="quiz-studio-grid">
        <aside className="panel quiz-sidebar">
          <form className="quiz-generator-form" onSubmit={handleGenerate}>
            <div className="creator-panel-head">
              <div>
                <h3>New quiz</h3>
                <p>Pick a topic, add a source, and let the app build a fresh quiz.</p>
              </div>
            </div>
            <div className="split-row">
              <select value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
                <option value="pdf">PDF upload</option>
                <option value="video_url">Video URL</option>
              </select>
              <select value={topicSlug} onChange={(event) => setTopicSlug(event.target.value)}>
                {topics.map((topic) => (
                  <option key={topic._id} value={topic.slug}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            {sourceType === "pdf" ? (
              <label className="creator-upload-field">
                <span>Study PDF</span>
                <small>{pdfFile ? pdfFile.name : "Upload a PDF with readable text"}</small>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
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

          <div className="quiz-history">
            <div className="creator-panel-head">
              <div>
                <h3>Recent quizzes</h3>
                <p>Your latest generated sessions and scores.</p>
              </div>
            </div>
            <div className="list-stack">
              {history.length ? (
                history.map((attempt) => (
                  <button
                    key={attempt.id}
                    type="button"
                    className={`review-queue-item ${activeAttempt?.id === attempt.id ? "review-queue-item-active" : ""}`}
                    onClick={() => {
                      setActiveAttempt(attempt);
                      setAnswers(
                        attempt.result?.answers?.length
                          ? attempt.result.answers
                          : new Array(attempt.questions.length).fill(-1)
                      );
                      setResult(null);
                    }}
                  >
                    <div className="meta-row">
                      <span className="badge">{attempt.sourceType === "pdf" ? "PDF" : "Video"}</span>
                      <span>{attempt.topicSlug}</span>
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

        <section className="quiz-stage">
          {activeAttempt ? (
            <>
              <div className="panel quiz-summary-panel">
                <div className="meta-row">
                  <span className="badge">{activeAttempt.topicSlug}</span>
                  <span>{answeredCount}/{questionCount} answered</span>
                </div>
                <h3>{activeAttempt.sourceLabel}</h3>
                <p>{activeAttempt.sourceExcerpt || "Quiz source ready."}</p>
                {!result ? (
                  <button
                    className="primary-button"
                    type="button"
                    disabled={submitting || answeredCount !== questionCount}
                    onClick={handleSubmitQuiz}
                  >
                    {submitting ? "Submitting..." : "Submit quiz"}
                  </button>
                ) : null}
              </div>

              <div className="quiz-question-stack">
                {activeAttempt.questions.map((question, questionIndex) => (
                  <div key={`${activeAttempt.id}-${questionIndex}`} className="panel quiz-question-card">
                    <div className="meta-row">
                      <span className="eyebrow">Question {questionIndex + 1}</span>
                      {result ? (
                        <span
                          className={`badge ${result.questionResults[questionIndex]?.correct ? "quiz-badge-pass" : "quiz-badge-fail"}`}
                        >
                          {result.questionResults[questionIndex]?.correct ? "Correct" : "Review"}
                        </span>
                      ) : null}
                    </div>
                    <h3>{question.prompt}</h3>
                    <div className="quiz-options">
                      {question.options.map((option, optionIndex) => {
                        const checked = answers[questionIndex] === optionIndex;
                        return (
                          <label key={option} className={`quiz-option ${checked ? "quiz-option-active" : ""}`}>
                            <input
                              type="radio"
                              name={`question-${questionIndex}`}
                              checked={checked}
                              onChange={() =>
                                setAnswers((current) =>
                                  current.map((item, index) => (index === questionIndex ? optionIndex : item))
                                )
                              }
                              disabled={Boolean(result)}
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                    {result ? (
                      <div className="quiz-feedback">
                        <strong>Correct answer:</strong> {result.questionResults[questionIndex]?.correctOption}
                        <p>{result.questionResults[questionIndex]?.explanation}</p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {result ? (
                <div className="panel quiz-result-panel">
                  <h3>Stored result</h3>
                  <p>
                    Score: {result.score}/{result.totalQuestions} ({result.percentage}%)
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="state-card">Generate a quiz to start practicing.</div>
          )}
        </section>
      </div>
    </section>
  );
};

export default QuizStudioPage;
