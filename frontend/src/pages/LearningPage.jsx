import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/client.js";

const isYouTubeUrl = (value) => /youtube\.com\/watch\?v=|youtu\.be\//i.test(value || "");

const toYouTubeEmbed = (url) => {
  if (!url) return "";
  const match = url.match(/v=([^&]+)/);
  if (match?.[1]) return `https://www.youtube.com/embed/${match[1]}`;
  const short = url.match(/youtu\.be\/([^?]+)/);
  if (short?.[1]) return `https://www.youtube.com/embed/${short[1]}`;
  return url;
};

const flattenLessons = (sections) =>
  sections.flatMap((section) =>
    section.lessons.map((lesson) => ({
      sectionTitle: section.title,
      ...lesson,
    }))
  );

const renderArticle = (raw) => {
  const lines = String(raw || "").split("\n");
  const blocks = [];
  let buffer = [];
  let inCode = false;

  const flushParagraph = () => {
    const text = buffer.join("\n").trim();
    if (!text) return;
    blocks.push({ type: "paragraph", text });
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (trimmed.startsWith("```")) {
      if (inCode) {
        blocks.push({ type: "code", text: buffer.join("\n") });
        buffer = [];
        inCode = false;
      } else {
        flushParagraph();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      buffer.push(line);
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flushParagraph();
      blocks.push({ type: "h1", text: trimmed.slice(2).trim() });
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      blocks.push({ type: "h2", text: trimmed.slice(3).trim() });
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph();
      const prev = blocks[blocks.length - 1];
      if (prev?.type === "list") {
        prev.items.push(trimmed.slice(2).trim());
      } else {
        blocks.push({ type: "list", items: [trimmed.slice(2).trim()] });
      }
      continue;
    }

    if (trimmed === "") {
      flushParagraph();
      continue;
    }

    buffer.push(trimmed);
  }

  flushParagraph();
  if (inCode) {
    blocks.push({ type: "code", text: buffer.join("\n") });
  }

  return blocks;
};

const LearningPage = () => {
  const navigate = useNavigate();
  const { enrollmentId } = useParams();
  const [enrollment, setEnrollment] = useState(null);
  const [activeLessonTitle, setActiveLessonTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/enrollments/${enrollmentId}/course`);
        setEnrollment(data.enrollment);
        const firstLessonTitle =
          data.enrollment.course.sections?.[0]?.lessons?.[0]?.title || "";
        setActiveLessonTitle((current) => current || firstLessonTitle);
      } catch (error) {
        setMessage(error.response?.data?.message || "Could not load course access");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [enrollmentId]);

  const lessons = useMemo(
    () => (enrollment?.course?.sections ? flattenLessons(enrollment.course.sections) : []),
    [enrollment]
  );

  const activeLesson = useMemo(
    () => lessons.find((lesson) => lesson.title === activeLessonTitle) || null,
    [lessons, activeLessonTitle]
  );

  const progressMap = useMemo(() => {
    const map = new Map();
    (enrollment?.progress || []).forEach((item) => map.set(item.lessonTitle, item.completed));
    return map;
  }, [enrollment]);

  const toggleLessonComplete = async () => {
    if (!activeLesson) return;
    try {
      const completed = Boolean(progressMap.get(activeLesson.title));
      const { data } = await api.patch(`/enrollments/${enrollmentId}/progress`, {
        lessonTitle: activeLesson.title,
        completed: !completed,
      });
      setEnrollment((current) => ({ ...current, ...data.enrollment }));
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update progress");
    }
  };

  if (loading) {
    return <div className="state-card">Loading your course player...</div>;
  }

  if (!enrollment) {
    return <div className="state-card">{message || "Enrollment not found"}</div>;
  }

  const course = enrollment.course;

  return (
    <section className="learning-shell">
      <aside className="learning-sidebar panel">
        <div className="meta-row">
          <span className="badge">{course.topicSlug}</span>
          <button className="ghost-button" type="button" onClick={() => navigate("/dashboard")}>
            Back
          </button>
        </div>
        <h2 className="learning-title">{course.title}</h2>
        <p className="section-copy">Instructor: {course.instructor?.name}</p>

        <div className="learning-progress">
          <strong>Progress</strong>
          <span>{enrollment.completionPercentage}% complete</span>
        </div>

        <div className="learning-curriculum">
          {course.sections.map((section) => (
            <div key={section.title} className="learning-section">
              <h3>{section.title}</h3>
              <div className="learning-lesson-list">
                {section.lessons.map((lesson) => {
                  const completed = progressMap.get(lesson.title);
                  const active = lesson.title === activeLessonTitle;
                  return (
                    <button
                      key={lesson.title}
                      type="button"
                      className={`learning-lesson ${active ? "learning-lesson-active" : ""}`}
                      onClick={() => setActiveLessonTitle(lesson.title)}
                    >
                      <span className={`dot ${completed ? "dot-on" : ""}`} />
                      <span className="learning-lesson-title">{lesson.title}</span>
                      <span className="learning-lesson-meta">{lesson.contentType}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="learning-view">
        {activeLesson ? (
          <>
            <header className="panel learning-header">
              <div className="meta-row">
                <span className="eyebrow">{activeLesson.sectionTitle}</span>
                <button className="primary-button" type="button" onClick={toggleLessonComplete}>
                  {progressMap.get(activeLesson.title) ? "Mark Incomplete" : "Mark Complete"}
                </button>
              </div>
              <h1>{activeLesson.title}</h1>
              <p className="section-copy">{activeLesson.duration ? `Duration: ${activeLesson.duration}` : ""}</p>
              {message ? <div className="error-note">{message}</div> : null}
            </header>

            <section className="panel learning-content">
              {activeLesson.contentType === "video" && activeLesson.videoUrl ? (
                isYouTubeUrl(activeLesson.videoUrl) ? (
                  <div className="video-frame">
                    <iframe
                      title={activeLesson.title}
                      src={toYouTubeEmbed(activeLesson.videoUrl)}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <video controls className="native-video" src={activeLesson.videoUrl} />
                )
              ) : (
                <div className="article-render">
                  {activeLesson.articleUrl ? (
                    <div className="article-actions">
                      <a
                        className="ghost-button"
                        href={activeLesson.articleUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Read full article
                      </a>
                    </div>
                  ) : null}

                  {renderArticle(activeLesson.articleBody).map((block, index) => {
                    if (block.type === "h1") return <h2 key={index}>{block.text}</h2>;
                    if (block.type === "h2") return <h3 key={index}>{block.text}</h3>;
                    if (block.type === "list")
                      return (
                        <ul key={index} className="simple-list">
                          {block.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      );
                    if (block.type === "code")
                      return (
                        <pre key={index} className="article-code">
                          <code>{block.text}</code>
                        </pre>
                      );
                    return (
                      <p key={index} className="article-paragraph">
                        {block.text}
                      </p>
                    );
                  })}

                  {!activeLesson.articleBody ? (
                    <div className="state-card compact">No article content yet.</div>
                  ) : null}
                </div>
              )}

              {activeLesson.resources?.length ? (
                <div className="learning-resources">
                  <h3>Resources</h3>
                  <ul className="simple-list">
                    {activeLesson.resources.map((link) => (
                      <li key={link}>
                        <a href={link} target="_blank" rel="noreferrer">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          </>
        ) : (
          <div className="state-card">Pick a lesson to begin.</div>
        )}
      </div>
    </section>
  );
};

export default LearningPage;
