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
  currentRole: "",
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

const toLineBreakText = (items = []) => items.join("\n");
const getReviewNotes = (item) => item.reviewNotes || item.feedback || "";

const InstructorDashboardPage = () => {
  const { user, refreshUser } = useAuth();
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
  const [topics, setTopics] = useState([]);
  const [message, setMessage] = useState("");
  const [openLearnMessage, setOpenLearnMessage] = useState(null);
  const [openLearnSubmitting, setOpenLearnSubmitting] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState("");
  const [editingBlogId, setEditingBlogId] = useState("");
  const [courseDrawerTab, setCourseDrawerTab] = useState("create");
  const [blogDrawerTab, setBlogDrawerTab] = useState("create");
  const [drawerView, setDrawerView] = useState(null);

  const contributorAccess = creatorDashboard?.contributorAccess;
  const approvedTopicSlugs = contributorAccess?.approvedTopics || [];
  const accessibleTopics = useMemo(
    () => topics.filter((topic) => approvedTopicSlugs.includes(topic.slug)),
    [approvedTopicSlugs, topics]
  );
  const hasUploadAccess = accessibleTopics.length > 0;

  const isMyCourse = (course) =>
    String(course.instructor?._id || course.instructor) === String(user?._id || user?.id);
  const isMyBlog = (blog) => String(blog.author?._id || blog.author) === String(user?._id || user?.id);

  const myCourses = useMemo(() => courses.filter(isMyCourse), [courses, user]);
  const myBlogs = useMemo(() => blogs.filter(isMyBlog), [blogs, user]);

  const loadInstructorData = async () => {
    const [coursesResponse, analyticsResponse, creatorDashboardResponse, topicsResponse, blogsResponse] =
      await Promise.all([
        api.get("/courses/instructor/me"),
        api.get("/courses/instructor/analytics"),
        api.get("/creator/dashboard"),
        api.get("/topics"),
        api.get("/blogs/me"),
      ]);

    setCourses(coursesResponse.data.courses);
    setAnalytics(analyticsResponse.data.analytics);
    setCreatorDashboard(creatorDashboardResponse.data);
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

  const applyTopicDefaults = (topicSlug, formSetter, currentForm) => {
    const topic = accessibleTopics.find((item) => item.slug === topicSlug);
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
        text: "Reviewing your resume and matching it to upload topics. This can take a few seconds.",
      });

      const formData = new FormData();
      formData.append("fullName", openLearnForm.fullName || user?.name || "Learner");
      formData.append("currentRole", openLearnForm.currentRole);
      formData.append("experienceSummary", openLearnForm.experienceSummary);
      formData.append("resume", resumeFile);

      const { data } = await api.post("/creator/openlearn/applications", formData);
      const approvedTopics = data.contributorAccess?.approvedTopics || [];

      setOpenLearnMessage({
        tone: approvedTopics.length ? "success-note" : "error-note",
        text: approvedTopics.length
          ? `Resume review completed. You can now upload in: ${approvedTopics.join(", ")}.`
          : data.application?.analysisSummary ||
            "No topics were approved from this resume yet. Try a resume with clearer topic evidence.",
      });

      setResumeFile(null);
      await refreshUser().catch(() => null);
      await loadInstructorData();
    } catch (error) {
      setOpenLearnMessage({
        tone: "error-note",
        text: error.response?.data?.message || "Could not submit resume review",
      });
    } finally {
      setOpenLearnSubmitting(false);
    }
  };

  const startCourseEdit = (course) => {
    setEditingCourseId(course._id);
    setCourseForm({
      title: course.title || "",
      subtitle: course.subtitle || "",
      description: course.description || "",
      category: course.category || accessibleTopics[0]?.category || "Web Development",
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

  const openDrawer = (view) => () => setDrawerView(view);
  const closeDrawer = () => setDrawerView(null);

  const renderDrawerHeader = () => {
    switch (drawerView) {
      case "resume":
        return { label: "Resume review", title: "Upload resume" };
      case "course":
        return { label: "Course tools", title: "Manage courses" };
      case "blog":
        return { label: "Blog tools", title: "Manage blogs" };
      default:
        return { label: "", title: "" };
    }
  };

  const renderLockedState = () => (
    <div className="state-card compact">
      Upload access is topic-based now. Submit your resume first, then create content only in the
      approved topics.
    </div>
  );

  const renderDrawerContent = () => {
    if (drawerView === "resume") {
      return (
        <form className="panel creator-form-panel drawer-form" onSubmit={handleOpenLearnSubmit}>
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
            placeholder="Add a short summary of the work most relevant to the topics you want to upload in"
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
      );
    }

    if (drawerView === "course") {
      if (!hasUploadAccess) {
        return renderLockedState();
      }

      return (
        <div className="drawer-section-stack">
          <div className="drawer-tabs">
            <button
              className={`drawer-tab ${courseDrawerTab === "create" ? "active" : ""}`}
              type="button"
              onClick={() => setCourseDrawerTab("create")}
            >
              Create Course
            </button>
            <button
              className={`drawer-tab ${courseDrawerTab === "mywork" ? "active" : ""}`}
              type="button"
              onClick={() => setCourseDrawerTab("mywork")}
            >
              My Work
            </button>
          </div>

          {courseDrawerTab === "create" ? (
            <form className="panel creator-form-panel drawer-form" onSubmit={handleCourseSubmit}>
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
                    applyTopicDefaults(event.target.value, setCourseForm, courseForm)
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
          ) : (
            <div className="panel drawer-list-panel">
              <div className="list-stack">
                {myCourses.length ? (
                  myCourses.map((course) => (
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
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => {
                          startCourseEdit(course);
                          setCourseDrawerTab("create");
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="state-card compact">No courses created yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (drawerView === "blog") {
      if (!hasUploadAccess) {
        return renderLockedState();
      }

      return (
        <div className="drawer-section-stack">
          <div className="drawer-tabs">
            <button
              className={`drawer-tab ${blogDrawerTab === "create" ? "active" : ""}`}
              type="button"
              onClick={() => setBlogDrawerTab("create")}
            >
              Create Blog
            </button>
            <button
              className={`drawer-tab ${blogDrawerTab === "mywork" ? "active" : ""}`}
              type="button"
              onClick={() => setBlogDrawerTab("mywork")}
            >
              My Work
            </button>
          </div>

          {blogDrawerTab === "create" ? (
            <form className="panel creator-form-panel drawer-form" onSubmit={handleBlogSubmit}>
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
          ) : (
            <div className="panel drawer-list-panel">
              <div className="list-stack">
                {myBlogs.length ? (
                  myBlogs.map((blog) => (
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
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => {
                          startBlogEdit(blog);
                          setBlogDrawerTab("create");
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="state-card compact">No blog drafts yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const drawerHeader = renderDrawerHeader();

  return (
    <section className="section-stack creator-shell">
      <div className="section-header">
        <div>
          <span className="eyebrow">Creator workspace</span>
          <h2>Upload only in your approved resume topics</h2>
        </div>
      </div>

      {message ? <div className="success-note">{message}</div> : null}

      <section className="creator-actions-grid">
        <button className="action-card" type="button" onClick={openDrawer("resume")}>
          <span>Upload Resume</span>
          <p>Get topic approval from your resume before creating content.</p>
        </button>
        <button className="action-card" type="button" onClick={openDrawer("course")}>
          <span>Manage Courses</span>
          <p>Create courses only in your approved topics.</p>
        </button>
        <button className="action-card" type="button" onClick={openDrawer("blog")}>
          <span>Manage Blogs</span>
          <p>Create blog content only in your approved topics.</p>
        </button>
      </section>

      <div className="creator-status-grid">
        <section className="panel creator-status-panel">
          <div className="creator-hero-copy">
            <span className="eyebrow">Status overview</span>
            <h3>Resume approval controls upload access</h3>
            <p>XP is no longer used for creator access. Your resume decides which topics you can publish in.</p>
          </div>
          {analytics && creatorDashboard ? (
            <div className="stats-grid creator-stats">
              <div className="metric-card metric-card-compact">
                <strong>{analytics.totalCourses}</strong>
                <span>Courses</span>
              </div>
              <div className="metric-card metric-card-compact">
                <strong>{analytics.totalEnrollments}</strong>
                <span>Enrollments</span>
              </div>
              <div className="metric-card metric-card-compact">
                <strong>Rs. {analytics.totalRevenue}</strong>
                <span>Revenue</span>
              </div>
              <div className="metric-card metric-card-compact">
                <strong>{creatorDashboard.creatorPerformance.creatorReputation}</strong>
                <span>Reputation</span>
              </div>
            </div>
          ) : null}
        </section>

        <section className="panel creator-access-panel">
          <div className="creator-panel-head">
            <div>
              <span className="eyebrow">Approved topics</span>
              <h3>Your upload scope</h3>
              <p>
                {hasUploadAccess
                  ? "You can upload content only in the topics listed below."
                  : "No topics are approved yet. Upload your resume to unlock topic-based creation."}
              </p>
            </div>
            <span className="badge">
              {contributorAccess?.openLearnApplicationStatus || "none"}
            </span>
          </div>

          {hasUploadAccess ? (
            <div className="list-stack">
              {accessibleTopics.map((topic) => (
                <div key={topic._id} className="creator-access-card">
                  <div>
                    <strong>{topic.name}</strong>
                    <p>{topic.description}</p>
                  </div>
                  <span className="badge">{topic.category}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="state-card compact">
              Your next step is just the resume review. Once topics are approved, the course and blog
              editors will use only those topics.
            </div>
          )}

          {contributorAccess?.analysisSummary ? (
            <div className="creator-access-card">
              <div>
                <strong>Latest review summary</strong>
                <p>{contributorAccess.analysisSummary}</p>
              </div>
            </div>
          ) : null}

          {contributorAccess?.reviewHighlights?.length ? (
            <div className="creator-access-card">
              <div>
                <strong>Review highlights</strong>
                <p>{contributorAccess.reviewHighlights.join(" ")}</p>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {drawerView ? <div className="drawer-overlay" onClick={closeDrawer} /> : null}

      <aside className={`creator-drawer ${drawerView ? "open" : ""}`}>
        <div className="drawer-panel">
          <div className="drawer-head">
            <div>
              <span className="eyebrow">{drawerHeader.label}</span>
              <h3>{drawerHeader.title}</h3>
            </div>
            <button className="icon-button drawer-close" type="button" onClick={closeDrawer}>
              ×
            </button>
          </div>
          <div className="drawer-body">{renderDrawerContent()}</div>
        </div>
      </aside>
    </section>
  );
};

export default InstructorDashboardPage;
