import { useEffect, useMemo, useState } from "react";

import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const resultTone = {
  accepted: "success-note",
  wrong_answer: "error-note",
};

const ChallengesPage = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [difficulty, setDifficulty] = useState("");
  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [editorState, setEditorState] = useState({});
  const [message, setMessage] = useState("");
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadChallenges = async (currentDifficulty = "") => {
    setLoading(true);
    const { data } = await api.get("/challenges", {
      params: { difficulty: currentDifficulty },
    });
    setChallenges(data.challenges);
    setLoading(false);
  };

  useEffect(() => {
    loadChallenges(difficulty).catch(console.error);
  }, [difficulty]);

  useEffect(() => {
    if (!challenges.length) {
      return;
    }

    setEditorState((current) => {
      const next = { ...current };
      for (const challenge of challenges) {
        if (!next[challenge._id]) {
          next[challenge._id] = challenge.starterCode || "";
        }
      }
      return next;
    });

    if (!activeChallengeId) {
      setActiveChallengeId(challenges[0]._id);
    }
  }, [challenges, activeChallengeId]);

  const activeChallenge = useMemo(
    () => challenges.find((item) => item._id === activeChallengeId) || null,
    [challenges, activeChallengeId]
  );

  const activeCode = activeChallenge ? editorState[activeChallenge._id] || "" : "";

  const loadSubmissions = async (challengeId) => {
    if (!user || !challengeId) {
      setSubmissions([]);
      return;
    }

    setSubmissionLoading(true);
    try {
      const { data } = await api.get(`/challenges/${challengeId}/submissions`);
      setSubmissions(data.submissions);
    } catch (error) {
      console.error(error);
      setSubmissions([]);
    } finally {
      setSubmissionLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions(activeChallengeId).catch(console.error);
  }, [activeChallengeId, user]);

  const handleRun = async () => {
    if (!activeChallenge) {
      return;
    }

    try {
      const { data } = await api.post(`/challenges/${activeChallenge._id}/run`, {
        code: activeCode,
      });
      setRunResult(data.execution);
      setSubmitResult(null);
      setMessage(data.execution.passed ? "All visible test cases passed." : "Some test cases failed.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not run code");
      setRunResult(null);
    }
  };

  const handleSubmit = async () => {
    if (!activeChallenge) {
      return;
    }

    try {
      const { data } = await api.post(`/challenges/${activeChallenge._id}/submit`, {
        language: "javascript",
        code: activeCode,
      });
      setSubmitResult(data);
      setRunResult(data.execution);
      setMessage(
        data.submission.result === "accepted"
          ? `Challenge accepted. XP awarded: ${data.xpAwarded}`
          : "Submission failed hidden or visible checks."
      );
      setSubmissions((current) => [data.submission, ...current]);
      await loadChallenges(difficulty);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not submit challenge");
      setSubmitResult(null);
    }
  };

  return (
    <section className="section-stack">
      <div className="section-header">
        <div>
          <span className="eyebrow">Challenges</span>
          <h2>Practice like a skill-building platform</h2>
          <p className="section-copy">
            Build verification through repeatable problem solving and topic XP.
          </p>
        </div>
        <div className="filters-row">
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option value="">All levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {message ? <div className="success-note">{message}</div> : null}

      <div className="challenge-workbench">
        <aside className="challenge-list panel">
          <h3>Challenge library</h3>
          <div className="list-stack">
            {loading ? (
              <div className="state-card compact">Loading challenges...</div>
            ) : (
              challenges.map((challenge) => (
                <button
                  key={challenge._id}
                  type="button"
                  className={`challenge-list-item ${
                    activeChallengeId === challenge._id ? "challenge-list-item-active" : ""
                  }`}
                  onClick={() => {
                    setActiveChallengeId(challenge._id);
                    setRunResult(null);
                    setSubmitResult(null);
                    setSubmissions([]);
                    setMessage("");
                  }}
                >
                  <span className="badge">{challenge.difficulty}</span>
                  <strong>{challenge.title}</strong>
                  <span>{challenge.topicSlug}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="challenge-stage">
          {activeChallenge ? (
            <>
              <section className="panel challenge-brief">
                <div className="meta-row">
                  <span className="badge">{activeChallenge.topicSlug}</span>
                  <strong>{activeChallenge.xpReward} XP</strong>
                </div>
                <h3>{activeChallenge.title}</h3>
                <p>{activeChallenge.prompt}</p>

                <div className="challenge-block">
                  <h4>Constraints</h4>
                  <ul className="simple-list">
                    {activeChallenge.constraints.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="challenge-block">
                  <h4>Visible test cases</h4>
                  <div className="testcase-stack">
                    {activeChallenge.publicTestCases?.map((testCase, index) => (
                      <div className="testcase-card" key={`${activeChallenge._id}-${index}`}>
                        <strong>Case {index + 1}</strong>
                        <pre>{JSON.stringify(testCase.input, null, 2)}</pre>
                        <p>Expected: {JSON.stringify(testCase.expectedOutput)}</p>
                        {testCase.explanation ? <p>{testCase.explanation}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="panel challenge-editor-panel">
                <div className="challenge-editor-head">
                  <div>
                    <span className="eyebrow">JavaScript editor</span>
                    <h3>Write your solution</h3>
                  </div>
                  <div className="button-row">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={handleRun}
                      disabled={!user}
                    >
                      Run Code
                    </button>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={handleSubmit}
                      disabled={!user}
                    >
                      Submit Answer
                    </button>
                  </div>
                </div>

                <textarea
                  className="code-editor"
                  value={activeCode}
                  onChange={(event) =>
                    setEditorState((current) => ({
                      ...current,
                      [activeChallenge._id]: event.target.value,
                    }))
                  }
                  spellCheck={false}
                />

                {!user ? (
                  <div className="error-note">Login to run or submit challenge code.</div>
                ) : null}

                {submitResult ? (
                  <div className={resultTone[submitResult.submission.result] || "error-note"}>
                    Final result: {submitResult.submission.result}
                  </div>
                ) : null}

                {runResult ? (
                  <div className="challenge-block">
                    <h4>Execution results</h4>
                    <div className="testcase-stack">
                      {runResult.results.map((result) => (
                        <div
                          key={`${activeChallenge._id}-result-${result.index}`}
                          className={`testcase-card ${
                            result.passed ? "testcase-pass" : "testcase-fail"
                          }`}
                        >
                          <strong>
                            Case {result.index + 1} {result.passed ? "passed" : "failed"}
                          </strong>
                          <p>Input: {JSON.stringify(result.input)}</p>
                          <p>Expected: {JSON.stringify(result.expectedOutput)}</p>
                          <p>Actual: {JSON.stringify(result.actualOutput)}</p>
                          {result.error ? <p>Error: {result.error}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="panel challenge-submissions-panel">
                <div className="challenge-editor-head">
                  <div>
                    <span className="eyebrow">Submission history</span>
                    <h3>Your submissions</h3>
                  </div>
                </div>

                {!user ? (
                  <div className="state-card compact">Login to save and review submissions.</div>
                ) : submissionLoading ? (
                  <div className="state-card compact">Loading submissions...</div>
                ) : submissions.length ? (
                  <div className="submission-stack">
                    {submissions.map((submission) => (
                      <article className="submission-card" key={submission._id}>
                        <div className="meta-row">
                          <strong>{submission.result.replaceAll("_", " ")}</strong>
                          <span>{new Date(submission.createdAt).toLocaleString()}</span>
                        </div>
                        <p>Language: {submission.language}</p>
                        <p>Score: {submission.score}</p>
                        <pre>{submission.code}</pre>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="state-card compact">
                    No submissions yet for this challenge. Submit your code to see it here.
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="state-card">No challenge selected yet.</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ChallengesPage;
