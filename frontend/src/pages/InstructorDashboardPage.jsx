import { useEffect, useMemo, useState } from "react";

import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const initialCourseForm = {
  title: "",
  subtitle: "",
  description: "",
  category: "Web Development",
  topicSlug: "react",
  level: "beginner",
  thumbnailUrl: "",
  price: 0,
  learningOutcomes: "",
  requirements: "",
  status: "draft",
};

const initialBlogForm = {
  title: "",
  excerpt: "",
  content: "",
  topicSlug: "react",
  status: "draft",
};

const initialOpenLearnForm = {
  fullName: "",
  phone: "",
  currentRole: "",
  yearsOfExperience: 0,
  linkedinUrl: "",
  portfolioUrl: "",
  education: "",
  experienceSummary: "",
};

const reviewStatusOptions = [
  { value: "draft", label: "Save as draft" },
  { value: "pending_review", label: "Submit for review" },
];

const statusLabelMap = {
  draft: "Draft",
  pending_review: "Pending review",
  needs_changes: "Needs changes",
  published: "Published",
  rejected: "Rejected",
};

const sourceLabelMap = {
  openlearn_email: "OpenLearn email",
  openlearn_resume: "Resume review",
  xp_unlock: "XP unlock",
  manual_review: "Manual approval",
};

const toLineBreakText = (items = []) => items.join("\n");
const getReviewNotes = (item) => item.reviewNotes || item.feedback || "";

const InstructorDashboardPage = () => {
  const { user } = useAuth();
  const [courseForm, setCourseForm] = useState(initialCourseForm);
  const [blogForm, setBlogForm] = useState(initialBlogForm);
  const [openLearnForm, setOpenLearnForm] = useState(() => ({
    ...initialOpenLearnForm,
    fullName: user?.name || "",
  }));
  const [resumeFile, setResumeFile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [creatorDashboard, setCreatorDashboard] = useState(null);
  const [readiness, setReadiness] = useState([]);
  const [topics, setTopics] = useState([]);
  const [message, setMessage] = useState("");
  const [openLearnMessage, setOpenLearnMessage] = useState(null);
  const [openLearnSubmitting, setOpenLearnSubmitting] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState("");
  const [editingBlogId, setEditingBlogId] = useState("");

  const accessibleTopics = useMemo(
    () => readiness.filter((item) => item.contributionAccess).map((item) => item.topic),
    [readiness]
  );
  const hasUploadAccess = accessibleTopics.length > 0;
  const contributorAccess = creatorDashboard?.contributorAccess;

  const loadInstructorData = async () => {
    const [
      coursesResponse,
      analyticsResponse,
      creatorDashboardResponse,
      readinessResponse,
      topicsResponse,
      blogsResponse,
    ] = await Promise.all([
      api.get("/courses/instructor/me"),
      api.get("/courses/instructor/analytics"),
      api.get("/creator/dashboard"),
      api.get("/creator/readiness"),
      api.get("/topics"),
      api.get("/blogs/me"),
    ]);

    setCourses(coursesResponse.data.courses);
    setAnalytics(analyticsResponse.data.analytics);
    setCreatorDashboard(creatorDashboardResponse.data);
    setReadiness(readinessResponse.data.readiness);
    setTopics(topicsResponse.data.topics);
    setBlogs(blogsResponse.data.blogs);
  };

  useEffect(() => {
    loadInstructorData().catch(console.error);
  }, []);

  useEffect(() => {
    if (user?.name) {
      setOpenLearnForm((current) => ({
        ...current,
        fullName: current.fullName || user.name,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!topics.length) {
      return;
    }

    const selectedTopic = topics.find((topic) => topic.slug === courseForm.topicSlug);
    if (selectedTopic && selectedTopic.category !== courseForm.category) {
      setCourseForm((current) => ({
        ...current,
        category: selectedTopic.category,
      }));
    }
  }, [topics, courseForm.topicSlug, courseForm.category]);

  useEffect(() => {
    if (!accessibleTopics.length) {
      return;
    }

    const firstTopic = accessibleTopics[0];
    if (!accessibleTopics.some((topic) => topic.slug === courseForm.topicSlug)) {
      setCourseForm((current) => ({
        ...current,
        topicSlug: firstTopic.slug,
        category: firstTopic.category,
      }));
    }

    if (!accessibleTopics.some((topic) => topic.slug === blogForm.topicSlug)) {
      setBlogForm((current) => ({
        ...current,
        topicSlug: firstTopic.slug,
      }));
    }
  }, [accessibleTopics, blogForm.topicSlug, courseForm.topicSlug]);

  const resetCourseEditor = () => {
    setCourseForm(initialCourseForm);
    setEditingCourseId("");
  };

  const resetBlogEditor = () => {
    setBlogForm(initialBlogForm);
    setEditingBlogId("");
  };

  const applyTopicDefaults = (topicSlug, formSetter, currentForm, availableTopics = topics) => {
    const topic = availableTopics.find((item) => item.slug === topicSlug);
    formSetter({
      ...currentForm,
      topicSlug,
      ...(topic ? { category: topic.category } : {}),
    });
  };

  const handleCourseSubmit = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        ...courseForm,
        price: Number(courseForm.price),
        learningOutcomes: courseForm.learningOutcomes
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        requirements: courseForm.requirements
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        sections: [
          {
            title: "Introduction",
            lessons: [
              {
                title: "Welcome to the course",
                duration: "05:00",
                isPreview: true,
              },
            ],
          },
        ],
      };

      if (editingCourseId) {
        await api.put(`/courses/${editingCourseId}`, payload);
        setMessage("Course updated successfully.");
      } else {
        await api.post("/courses", payload);
        setMessage(
          payload.status === "pending_review"
            ? "Course submitted for review."
            : "Course draft created successfully."
        );
      }

      resetCourseEditor();
      await loadInstructorData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save course");
    }
  };

  const handleBlogSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingBlogId) {
        await api.put(`/blogs/${editingBlogId}`, blogForm);
        setMessage("Blog updated successfully.");
      } else {
        await api.post("/blogs", blogForm);
        setMessage(
          blogForm.status === "pending_review" ? "Blog submitted for review." : "Blog draft saved."
        );
      }

      resetBlogEditor();
      await loadInstructorData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save blog draft");
    }
  };

  const handleOpenLearnSubmit = async (event) => {
    event.preventDefault();

    try {
      if (!resumeFile) {
        setOpenLearnMessage({
          tone: "error-note",
          text: "Please upload a PDF or ODT resume before submitting.",
        });
        return;
      }

      setOpenLearnSubmitting(true);
      setOpenLearnMessage({
        tone: "state-card compact",
        text: "Processing your resume document and matching it to topics with a free AI model. This can take a few seconds.",
      });

      const formData = new FormData();
      formData.append("fullName", openLearnForm.fullName);
      formData.append("phone", openLearnForm.phone);
      formData.append("currentRole", openLearnForm.currentRole);
      formData.append("yearsOfExperience", String(Number(openLearnForm.yearsOfExperience)));
      formData.append("linkedinUrl", openLearnForm.linkedinUrl);
      formData.append("portfolioUrl", openLearnForm.portfolioUrl);
      formData.append("education", openLearnForm.education);
      formData.append("experienceSummary", openLearnForm.experienceSummary);
      formData.append("resume", resumeFile);

      const { data } = await api.post("/creator/openlearn/applications", formData);
      const approvedTopics = data.contributorAccess?.approvedTopics || [];

      setOpenLearnMessage({
        tone: "success-note",
        text: approvedTopics.length
          ? `Resume review completed. Unlocked topics: ${approvedTopics.join(", ")}.`
          : data.application?.analysisSummary || "Resume review completed.",
      });

      setResumeFile(null);
      await loadInstructorData();
    } catch (error) {
      setOpenLearnMessage({
        tone: "error-note",
        text: error.response?.data?.message || "Could not submit OpenLearn application",
      });
    } finally {
      setOpenLearnSubmitting(false);
    }
  };

  const applyForTopic = async (topicSlug) => {
    try {
      await api.post("/creator/applications", {
        topicSlug,
        requestedLevel: 1,
        statement: "I have completed the learning path and want to contribute useful content.",
      });
      setMessage(`Contributor access granted for ${topicSlug}.`);
      await loadInstructorData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not apply for creator access");
    }
  };

  const startCourseEdit = (course) => {
    setEditingCourseId(course._id);
    setCourseForm({
      title: course.title || "",
      subtitle: course.subtitle || "",
      description: course.description || "",
      category: course.category || "Web Development",
      topicSlug: course.topicSlug || accessibleTopics[0]?.slug || "react",
      level: course.level || "beginner",
      thumbnailUrl: course.thumbnailUrl || "",
      price: course.price || 0,
      learningOutcomes: toLineBreakText(course.learningOutcomes),
      requirements: toLineBreakText(course.requirements),
      status:
        course.status === "published" || course.status === "rejected"
          ? "draft"
          : course.status || "draft",
    });
  };

  const startBlogEdit = (blog) => {
    setEditingBlogId(blog._id);
    setBlogForm({
      title: blog.title || "",
      excerpt: blog.excerpt || "",
      content: blog.content || "",
      topicSlug: blog.topicSlug || accessibleTopics[0]?.slug || "react",
      status:
        blog.status === "published" || blog.status === "rejected" ? "draft" : blog.status || "draft",
    });
  };

  return (
    <section className="section-stack creator-shell">
      <div className="section-header">
        <div>
          <span className="eyebrow">Creator workspace</span>
          <h2>Manage your uploader journey</h2>
        </div>
      </div>

      <section className="creator-hero panel">
        <div className="creator-hero-copy">
          <span className="eyebrow">Structured overview</span>
          <h3>Everything important in one place</h3>
          <p>Track access, submit content for review, and monitor feedback from one workspace.</p>
        </div>
        {analytics && creatorDashboard ? (
          <div className="stats-grid creator-stats">
            <div className="metric-card">
              <strong>{analytics.totalCourses}</strong>
              <span>Courses</span>
            </div>
            <div className="metric-card">
              <strong>{analytics.totalEnrollments}</strong>
              <span>Enrollments</span>
            </div>
            <div className="metric-card">
              <strong>Rs. {analytics.totalRevenue}</strong>
              <span>Revenue</span>
            </div>
            <div className="metric-card">
              <strong>{creatorDashboard.creatorPerformance.creatorReputation}</strong>
              <span>Creator reputation</span>
            </div>
          </div>
        ) : null}
      </section>

      {message ? <div className="success-note">{message}</div> : null}

      <section className="creator-main-grid">
        <aside className="creator-sidebar">
          <div className="panel">
            <div className="creator-panel-head">
              <div>
                <span className="eyebrow">Access</span>
                <h3>Contribution access</h3>
              </div>
            </div>
            {contributorAccess ? (
              <div className="list-stack">
                <div className="creator-access-card">
                  <div>
                    <strong>OpenLearn email</strong>
                    <p>
                      {contributorAccess.hasOpenLearnEmail
                        ? "Your account already has platform-wide contributor access."
                        : "Use an @openlearn.com email for instant contributor access."}
                    </p>
                  </div>
                  <span className="badge">
                    {contributorAccess.hasOpenLearnEmail ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="creator-access-card">
                  <div>
                    <strong>Resume-approved topics</strong>
                    <p>
                      {contributorAccess.approvedTopics.length
                        ? contributorAccess.approvedTopics.join(", ")
                        : "No topics approved from resume review yet."}
                    </p>
                  </div>
                  <span className="badge">{contributorAccess.openLearnApplicationStatus}</span>
                </div>
                {contributorAccess.analysisSummary ? (
                  <div className="success-note">{contributorAccess.analysisSummary}</div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="panel">
            <div className="creator-panel-head">
              <div>
                <span className="eyebrow">Readiness</span>
                <h3>Topic unlocks</h3>
              </div>
            </div>
            <div className="list-stack">
              {readiness.map((item) => (
                <div key={item.topic.slug} className="creator-readiness-card">
                  <div className="creator-readiness-copy">
                    <strong>{item.topic.name}</strong>
                    <p>
                      {item.stat.xp}/{item.topic.uploaderRequirements.xpThreshold} XP
                    </p>
                    <p>
                      {item.stat.quizCompletedCount}/
                      {item.topic.uploaderRequirements.quizCompletedThreshold} quizzes completed
                    </p>
                    <p>
                      {item.stat.masteredQuizCount}/
                      {item.topic.uploaderRequirements.masteredQuizThreshold} strong scores
                    </p>
                  </div>
                  {item.contributionAccess ? (
                    <span className="badge">{sourceLabelMap[item.accessSource] || item.accessSource}</span>
                  ) : item.application ? (
                    <span className="badge">{item.application.status}</span>
                  ) : item.meetsRequirements ? (
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => applyForTopic(item.topic.slug)}
                    >
                      Activate
                    </button>
                  ) : (
                    <span className="badge">Locked</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <form className="panel creator-form-panel" onSubmit={handleOpenLearnSubmit}>
            <div className="creator-panel-head">
              <div>
                <span className="eyebrow">Resume route</span>
                <h3>OpenLearn contributor review</h3>
              </div>
            </div>
            {openLearnMessage ? <div className={openLearnMessage.tone}>{openLearnMessage.text}</div> : null}
            <input
              placeholder="Full name"
              value={openLearnForm.fullName}
              onChange={(event) =>
                setOpenLearnForm({ ...openLearnForm, fullName: event.target.value })
              }
            />
            <input
              placeholder="Current role"
              value={openLearnForm.currentRole}
              onChange={(event) =>
                setOpenLearnForm({ ...openLearnForm, currentRole: event.target.value })
              }
            />
            <textarea
              rows="4"
              placeholder="Experience summary"
              value={openLearnForm.experienceSummary}
              onChange={(event) =>
                setOpenLearnForm({ ...openLearnForm, experienceSummary: event.target.value })
              }
            />
            <label className="creator-upload-field">
              <span>Resume document</span>
              <small>{resumeFile ? resumeFile.name : "Upload a PDF or ODT resume"}</small>
              <input
                type="file"
                accept="application/pdf,.pdf,application/vnd.oasis.opendocument.text,.odt"
                onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
              />
            </label>
            <button className="primary-button creator-submit" type="submit" disabled={openLearnSubmitting}>
              {openLearnSubmitting ? "Processing..." : "Submit for review"}
            </button>
          </form>
        </aside>

        <div className="creator-content">
          {hasUploadAccess ? (
            <>
              <section className="creator-section">
                <div className="creator-section-head">
                  <div>
                    <span className="eyebrow">Build</span>
                    <h3>Course publishing</h3>
                  </div>
                  <p>Create course drafts and send them into the reviewer queue.</p>
                </div>
                <div className="creator-forms-grid">
                  <form className="panel creator-form-panel" onSubmit={handleCourseSubmit}>
                    <div className="creator-panel-head">
                      <div>
                        <h3>{editingCourseId ? "Edit course" : "Create a course draft"}</h3>
                        <p>Use one topic you already unlocked.</p>
                      </div>
                      {editingCourseId ? (
                        <button className="ghost-button" type="button" onClick={resetCourseEditor}>
                          New course
                        </button>
                      ) : null}
                    </div>
                    <input
                      placeholder="Course title"
                      value={courseForm.title}
                      onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })}
                    />
                    <input
                      placeholder="Subtitle"
                      value={courseForm.subtitle}
                      onChange={(event) => setCourseForm({ ...courseForm, subtitle: event.target.value })}
                    />
                    <textarea
                      rows="5"
                      placeholder="Course description"
                      value={courseForm.description}
                      onChange={(event) =>
                        setCourseForm({ ...courseForm, description: event.target.value })
                      }
                    />
                    <input
                      placeholder="Thumbnail URL"
                      value={courseForm.thumbnailUrl}
                      onChange={(event) =>
                        setCourseForm({ ...courseForm, thumbnailUrl: event.target.value })
                      }
                    />
                    <div className="split-row">
                      <select
                        value={courseForm.category}
                        onChange={(event) => setCourseForm({ ...courseForm, category: event.target.value })}
                      >
                        {[...new Set(accessibleTopics.map((topic) => topic.category))].map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <select
                        value={courseForm.topicSlug}
                        onChange={(event) =>
                          applyTopicDefaults(event.target.value, setCourseForm, courseForm, accessibleTopics)
                        }
                      >
                        {accessibleTopics.map((topic) => (
                          <option key={topic._id} value={topic.slug}>
                            {topic.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={courseForm.level}
                        onChange={(event) => setCourseForm({ ...courseForm, level: event.target.value })}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="split-row">
                      <input
                        type="number"
                        placeholder="Price"
                        value={courseForm.price}
                        onChange={(event) => setCourseForm({ ...courseForm, price: event.target.value })}
                      />
                      <select
                        value={courseForm.status}
                        onChange={(event) => setCourseForm({ ...courseForm, status: event.target.value })}
                      >
                        {reviewStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      rows="4"
                      placeholder="Learning outcomes, one per line"
                      value={courseForm.learningOutcomes}
                      onChange={(event) =>
                        setCourseForm({ ...courseForm, learningOutcomes: event.target.value })
                      }
                    />
                    <textarea
                      rows="4"
                      placeholder="Requirements, one per line"
                      value={courseForm.requirements}
                      onChange={(event) =>
                        setCourseForm({ ...courseForm, requirements: event.target.value })
                      }
                    />
                    <button className="primary-button creator-submit" type="submit">
                      {editingCourseId ? "Update course" : "Save course"}
                    </button>
                  </form>

                  <div className="panel">
                    <div className="creator-panel-head">
                      <div>
                        <h3>Your courses</h3>
                        <p>Courses waiting for review or already published.</p>
                      </div>
                    </div>
                    <div className="list-stack">
                      {courses.length ? (
                        courses.map((course) => (
                          <div key={course._id} className="reviewable-list-card">
                            <div className="reviewable-list-head">
                              <div>
                                <strong>{course.title}</strong>
                                <p>
                                  {course.topicSlug} - {course.category}
                                </p>
                              </div>
                              <span className="badge">{statusLabelMap[course.status] || course.status}</span>
                            </div>
                            {getReviewNotes(course) ? (
                              <p className="review-note-inline">{getReviewNotes(course)}</p>
                            ) : null}
                            <button className="ghost-button" type="button" onClick={() => startCourseEdit(course)}>
                              Edit
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="state-card compact">No courses created yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="creator-section">
                <div className="creator-section-head">
                  <div>
                    <span className="eyebrow">Write</span>
                    <h3>Blog publishing</h3>
                  </div>
                  <p>Draft topic writeups and send them for review when they are ready.</p>
                </div>
                <div className="creator-forms-grid">
                  <form className="panel creator-form-panel" onSubmit={handleBlogSubmit}>
                    <div className="creator-panel-head">
                      <div>
                        <h3>{editingBlogId ? "Edit blog" : "Create a blog draft"}</h3>
                        <p>Share topic knowledge in article form.</p>
                      </div>
                      {editingBlogId ? (
                        <button className="ghost-button" type="button" onClick={resetBlogEditor}>
                          New blog
                        </button>
                      ) : null}
                    </div>
                    <input
                      placeholder="Blog title"
                      value={blogForm.title}
                      onChange={(event) => setBlogForm({ ...blogForm, title: event.target.value })}
                    />
                    <input
                      placeholder="Short excerpt"
                      value={blogForm.excerpt}
                      onChange={(event) => setBlogForm({ ...blogForm, excerpt: event.target.value })}
                    />
                    <select
                      value={blogForm.topicSlug}
                      onChange={(event) => setBlogForm({ ...blogForm, topicSlug: event.target.value })}
                    >
                      {accessibleTopics.map((topic) => (
                        <option key={topic._id} value={topic.slug}>
                          {topic.name}
                        </option>
                      ))}
                    </select>
                    <textarea
                      rows="8"
                      placeholder="Write your blog draft"
                      value={blogForm.content}
                      onChange={(event) => setBlogForm({ ...blogForm, content: event.target.value })}
                    />
                    <select
                      value={blogForm.status}
                      onChange={(event) => setBlogForm({ ...blogForm, status: event.target.value })}
                    >
                      {reviewStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button className="primary-button creator-submit" type="submit">
                      {editingBlogId ? "Update blog" : "Save blog"}
                    </button>
                  </form>

                  <div className="panel">
                    <div className="creator-panel-head">
                      <div>
                        <h3>Your blog drafts</h3>
                        <p>Drafts waiting for polish, review, or revision.</p>
                      </div>
                    </div>
                    <div className="list-stack">
                      {blogs.length ? (
                        blogs.map((blog) => (
                          <div key={blog._id} className="reviewable-list-card">
                            <div className="reviewable-list-head">
                              <div>
                                <strong>{blog.title}</strong>
                                <p>{blog.topicSlug}</p>
                              </div>
                              <span className="badge">{statusLabelMap[blog.status] || blog.status}</span>
                            </div>
                            {getReviewNotes(blog) ? (
                              <p className="review-note-inline">{getReviewNotes(blog)}</p>
                            ) : null}
                            <button className="ghost-button" type="button" onClick={() => startBlogEdit(blog)}>
                              Edit
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="state-card compact">No blog drafts yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <section className="creator-section">
              <div className="panel creator-locked-panel">
                <span className="eyebrow">Upload Access Required</span>
                <h3>Creation tools appear after approval</h3>
                <p>Course and blog upload options are shown only after you unlock contribution access in a topic.</p>
              </div>
            </section>
          )}
        </div>
      </section>
    </section>
  );
};

export default InstructorDashboardPage;
