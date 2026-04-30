import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client.js";

const formatTopicLabel = (topicSlug = "") =>
  String(topicSlug || "general")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const QuizActivePage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const { data } = await api.get("/quizzes/history");
        const quiz = data.attempts.find(a => a.id === quizId);
        if (quiz) {
          setActiveAttempt(quiz);
          setAnswers(
            quiz.result?.answers?.length
              ? quiz.result.answers
              : new Array(quiz.questions.length).fill(-1)
          );
        } else {
          setMessage({ tone: "error-note", text: "Quiz session not found." });
        }
      } catch (error) {
        setMessage({ tone: "error-note", text: "Could not load quiz." });
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, [quizId]);

  const activeQuestionCount = activeAttempt?.questions?.length || 0;
  const answeredCount = useMemo(
    () => answers.filter((answer) => Number.isInteger(answer) && answer >= 0).length,
    [answers]
  );

  const handleSubmitQuiz = async () => {
    if (!activeAttempt) return;

    try {
      setSubmitting(true);
      const { data } = await api.post(`/quizzes/${activeAttempt.id}/submit`, { answers });
      setResult(data.result);
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

  if (loading) return <div className="state-card">Loading quiz...</div>;

  return (
    <section className="section-stack">
      <div className="section-header">
        <div>
          <button className="ghost-button" onClick={() => navigate("/quiz-studio")} style={{ marginBottom: '1rem' }}>
            Back to Studio
          </button>
          <h2>Practice Session</h2>
        </div>
      </div>

      {message ? <div className={message.tone}>{message.text}</div> : null}

      {activeAttempt ? (
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div className="panel quiz-summary-panel">
            <div className="meta-row">
              <span className="badge">{formatTopicLabel(activeAttempt.topicSlug)}</span>
              <span>{answeredCount}/{activeQuestionCount} answered</span>
            </div>
            <h3>{activeAttempt.sourceLabel}</h3>
            {!result ? (
              <button
                className="primary-button"
                type="button"
                disabled={submitting || answeredCount !== activeQuestionCount}
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
        </div>
      ) : (
        <div className="state-card">Quiz not found.</div>
      )}
    </section>
  );
};

export default QuizActivePage;
