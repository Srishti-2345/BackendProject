import { useEffect, useState } from "react";

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

const initialChallengeForm = {
  title: "",
  topicSlug: "react",
  difficulty: "easy",
  prompt: "",
  constraints: "",
  examples: "",
  tags: "",
  starterCode: "function solution() {\n  \n}\n\nmodule.exports = solution;",
  publicTestCases: '[\n  {\n    "input": [],\n    "expectedOutput": "",\n    "explanation": ""\n  }\n]',
  hiddenTestCases: "[]",
  editorial: "",
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

const sourceLabelMap = {
  openlearn_email: "OpenLearn email",
  openlearn_resume: "Resume review",
  xp_unlock: "XP unlock",
  manual_review: "Manual approval",
};

const InstructorDashboardPage = () => {
  const { user } = useAuth();
  const [courseForm, setCourseForm] = useState(initialCourseForm);
  const [blogForm, setBlogForm] = useState(initialBlogForm);
  const [challengeForm, setChallengeForm] = useState(initialChallengeForm);
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

  const applyTopicDefaults = (topicSlug, formSetter, currentForm, availableTopics = topics) => {
    const topic = availableTopics.find((item) => item.slug === topicSlug);
    formSetter({
      ...currentForm,
      topicSlug,
      ...(topic ? { category: topic.category } : {}),
    });
  };

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
    loadInstructorData().catch((error) => console.error(error));
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
    if (topics.length) {
      const selectedTopic = topics.find((topic) => topic.slug === courseForm.topicSlug);
      if (selectedTopic && selectedTopic.category !== courseForm.category) {
        setCourseForm((current) => ({
          ...current,
          category: selectedTopic.category,
        }));
      }
    }
  }, [topics, courseForm.topicSlug, courseForm.category]);

  const contributorAccess = creatorDashboard?.contributorAccess;
  const accessibleTopics = readiness
    .filter((item) => item.contributionAccess)
    .map((item) => item.topic);
  const hasUploadAccess = accessibleTopics.length > 0;

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

    if (!accessibleTopics.some((topic) => topic.slug === challengeForm.topicSlug)) {
      setChallengeForm((current) => ({
        ...current,
        topicSlug: firstTopic.slug,
      }));
    }
  }, [accessibleTopics, blogForm.topicSlug, challengeForm.topicSlug, courseForm.topicSlug]);

  const handleCourseSubmit = async (event) => {
    event.preventDefault();

    try {
      await api.post("/courses", {
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
      });

      setMessage("Course created successfully.");
      setCourseForm(initialCourseForm);
      await loadInstructorData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not create course");
    }
  };

  const handleBlogSubmit = async (event) => {
    event.preventDefault();

    try {
      await api.post("/blogs", blogForm);
      setMessage("Blog draft submitted.");
      setBlogForm(initialBlogForm);
      await loadInstructorData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not create blog draft");
    }
  };

  const handleChallengeSubmit = async (event) => {
    event.preventDefault();

    try {
      await api.post("/challenges", {
        title: challengeForm.title,
        topicSlug: challengeForm.topicSlug,
        difficulty: challengeForm.difficulty,
        prompt: challengeForm.prompt,
        constraints: challengeForm.constraints
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        examples: challengeForm.examples
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        tags: challengeForm.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        starterCode: challengeForm.starterCode,
        publicTestCases: JSON.parse(challengeForm.publicTestCases),
        hiddenTestCases: JSON.parse(challengeForm.hiddenTestCases),
        editorial: challengeForm.editorial,
      });

      setMessage("Challenge created successfully.");
      setChallengeForm(initialChallengeForm);
      await loadInstructorData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not create challenge");
    }
  };

  const handleOpenLearnSubmit = async (event) => {
    event.preventDefault();

    try {
      if (!resumeFile) {
        setMessage("Please upload a PDF resume before submitting.");
        return;
      }

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

      await api.post("/creator/openlearn/applications", formData);

      setMessage("OpenLearn contributor application reviewed successfully.");
      setResumeFile(null);
      await loadInstructorData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not submit OpenLearn application");
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
          <p>
            Track contribution access, unlock topics, and create courses, challenges, and blog
            drafts from a cleaner workflow.
          </p>
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
            {creatorDashboard ? (
              <div className="list-stack">
                <div className="creator-access-card">
                  <div>
                    <strong>OpenLearn email</strong>
                    <p>
                      {contributorAccess.hasOpenLearnEmail
                        ? "Your account already has platform-wide contributor access."
                        : "Use an @openlearn.com email for immediate contributor access."}
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
                      {item.stat.challengeSolvedCount}/
                      {item.topic.uploaderRequirements.challengeSolvedThreshold} solved
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

          <div className="panel">
            <div className="creator-panel-head">
              <div>
                <span className="eyebrow">Pipeline</span>
                <h3>Content status</h3>
              </div>
            </div>
            <div className="list-stack">
              {creatorDashboard ? (
                <>
                  <div className="list-item">
                    <div>
                      <strong>Drafts</strong>
                      <p>Content not submitted yet</p>
                    </div>
                    <span>{creatorDashboard.contentPipeline.drafts}</span>
                  </div>
                  <div className="list-item">
                    <div>
                      <strong>Under review</strong>
                      <p>Awaiting moderator decision</p>
                    </div>
                    <span>{creatorDashboard.contentPipeline.underReview}</span>
                  </div>
                  <div className="list-item">
                    <div>
                      <strong>Needs changes</strong>
                      <p>Revise and resubmit</p>
                    </div>
                    <span>{creatorDashboard.contentPipeline.needsChanges}</span>
                  </div>
                  <div className="list-item">
                    <div>
                      <strong>Published</strong>
                      <p>Live content in the community</p>
                    </div>
                    <span>{creatorDashboard.contentPipeline.published}</span>
                  </div>
                </>
              ) : (
                <div className="state-card compact">Loading creator pipeline...</div>
              )}
            </div>
          </div>
        </aside>

        <div className="creator-content">
          <section className="creator-section">
            <div className="creator-section-head">
              <div>
                <span className="eyebrow">Apply</span>
                <h3>OpenLearn contributor review</h3>
              </div>
              <p>Upload a PDF resume once and get topic suggestions from your profile.</p>
            </div>
            <form className="panel creator-form-panel" onSubmit={handleOpenLearnSubmit}>
              <div className="creator-form-grid">
                <input
                  placeholder="Full name"
                  value={openLearnForm.fullName}
                  onChange={(event) =>
                    setOpenLearnForm({ ...openLearnForm, fullName: event.target.value })
                  }
                />
                <input
                  placeholder="Phone"
                  value={openLearnForm.phone}
                  onChange={(event) =>
                    setOpenLearnForm({ ...openLearnForm, phone: event.target.value })
                  }
                />
                <input
                  placeholder="Current role"
                  value={openLearnForm.currentRole}
                  onChange={(event) =>
                    setOpenLearnForm({ ...openLearnForm, currentRole: event.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Years of experience"
                  value={openLearnForm.yearsOfExperience}
                  onChange={(event) =>
                    setOpenLearnForm({ ...openLearnForm, yearsOfExperience: event.target.value })
                  }
                />
                <input
                  placeholder="LinkedIn URL"
                  value={openLearnForm.linkedinUrl}
                  onChange={(event) =>
                    setOpenLearnForm({ ...openLearnForm, linkedinUrl: event.target.value })
                  }
                />
                <input
                  placeholder="Portfolio URL"
                  value={openLearnForm.portfolioUrl}
                  onChange={(event) =>
                    setOpenLearnForm({ ...openLearnForm, portfolioUrl: event.target.value })
                  }
                />
              </div>
              <input
                placeholder="Education"
                value={openLearnForm.education}
                onChange={(event) =>
                  setOpenLearnForm({ ...openLearnForm, education: event.target.value })
                }
              />
              <textarea
                rows="4"
                placeholder="Brief summary of your experience"
                value={openLearnForm.experienceSummary}
                onChange={(event) =>
                  setOpenLearnForm({ ...openLearnForm, experienceSummary: event.target.value })
                }
              />
              <label className="creator-upload-field">
                <span>Upload resume PDF</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                />
                <small>{resumeFile ? resumeFile.name : "PDF only, up to 5 MB."}</small>
              </label>
              <button className="primary-button creator-submit" type="submit">
                Analyze Resume and Apply
              </button>
            </form>
          </section>

          {hasUploadAccess ? (
            <>
              <section className="creator-section">
                <div className="creator-section-head">
                  <div>
                    <span className="eyebrow">Create</span>
                    <h3>Publish new learning content</h3>
                  </div>
                  <p>Use the content tools below once you have access in the relevant topic.</p>
                </div>
                <div className="creator-forms-grid">
                  <form className="panel creator-form-panel" onSubmit={handleCourseSubmit}>
                    <div className="creator-panel-head">
                      <div>
                        <h3>Create a course</h3>
                        <p>Build a structured learning path for a topic you can contribute to.</p>
                      </div>
                    </div>
                    <input
                      placeholder="Course title"
                      value={courseForm.title}
                      onChange={(event) =>
                        setCourseForm({ ...courseForm, title: event.target.value })
                      }
                    />
                    <input
                      placeholder="Subtitle"
                      value={courseForm.subtitle}
                      onChange={(event) =>
                        setCourseForm({ ...courseForm, subtitle: event.target.value })
                      }
                    />
                    <textarea
                      placeholder="Description"
                      rows="5"
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
                        onChange={(event) =>
                          setCourseForm({ ...courseForm, category: event.target.value })
                        }
                      >
                        {[...new Set(accessibleTopics.map((topic) => topic.category))].map(
                          (category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          )
                        )}
                      </select>
                      <select
                        value={courseForm.topicSlug}
                        onChange={(event) =>
                          applyTopicDefaults(
                            event.target.value,
                            setCourseForm,
                            courseForm,
                            accessibleTopics
                          )
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
                        onChange={(event) =>
                          setCourseForm({ ...courseForm, level: event.target.value })
                        }
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
                        onChange={(event) =>
                          setCourseForm({ ...courseForm, price: event.target.value })
                        }
                      />
                      <select
                        value={courseForm.status}
                        onChange={(event) =>
                          setCourseForm({ ...courseForm, status: event.target.value })
                        }
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Learning outcomes, one per line"
                      rows="4"
                      value={courseForm.learningOutcomes}
                      onChange={(event) =>
                        setCourseForm({ ...courseForm, learningOutcomes: event.target.value })
                      }
                    />
                    <textarea
                      placeholder="Requirements, one per line"
                      rows="4"
                      value={courseForm.requirements}
                      onChange={(event) =>
                        setCourseForm({ ...courseForm, requirements: event.target.value })
                      }
                    />
                    <button className="primary-button creator-submit" type="submit">
                      Save Course
                    </button>
                  </form>

                  <form className="panel creator-form-panel" onSubmit={handleChallengeSubmit}>
                    <div className="creator-panel-head">
                      <div>
                        <h3>Create a challenge</h3>
                        <p>Upload a coding task with test cases and starter code.</p>
                      </div>
                    </div>
                    <input
                      placeholder="Challenge title"
                      value={challengeForm.title}
                      onChange={(event) =>
                        setChallengeForm({ ...challengeForm, title: event.target.value })
                      }
                    />
                    <div className="split-row">
                      <select
                        value={challengeForm.topicSlug}
                        onChange={(event) =>
                          setChallengeForm({ ...challengeForm, topicSlug: event.target.value })
                        }
                      >
                        {accessibleTopics.map((topic) => (
                          <option key={topic._id} value={topic.slug}>
                            {topic.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={challengeForm.difficulty}
                        onChange={(event) =>
                          setChallengeForm({ ...challengeForm, difficulty: event.target.value })
                        }
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <textarea
                      rows="5"
                      placeholder="Prompt"
                      value={challengeForm.prompt}
                      onChange={(event) =>
                        setChallengeForm({ ...challengeForm, prompt: event.target.value })
                      }
                    />
                    <textarea
                      rows="3"
                      placeholder="Constraints, one per line"
                      value={challengeForm.constraints}
                      onChange={(event) =>
                        setChallengeForm({ ...challengeForm, constraints: event.target.value })
                      }
                    />
                    <textarea
                      rows="3"
                      placeholder="Examples, one per line"
                      value={challengeForm.examples}
                      onChange={(event) =>
                        setChallengeForm({ ...challengeForm, examples: event.target.value })
                      }
                    />
                    <input
                      placeholder="Tags, comma separated"
                      value={challengeForm.tags}
                      onChange={(event) =>
                        setChallengeForm({ ...challengeForm, tags: event.target.value })
                      }
                    />
                    <textarea
                      rows="7"
                      placeholder="Starter code"
                      value={challengeForm.starterCode}
                      onChange={(event) =>
                        setChallengeForm({ ...challengeForm, starterCode: event.target.value })
                      }
                    />
                    <textarea
                      rows="6"
                      placeholder='Public test cases as JSON, e.g. [{"input":[1],"expectedOutput":1}]'
                      value={challengeForm.publicTestCases}
                      onChange={(event) =>
                        setChallengeForm({ ...challengeForm, publicTestCases: event.target.value })
                      }
                    />
                    <textarea
                      rows="4"
                      placeholder='Hidden test cases as JSON, e.g. [{"input":[1],"expectedOutput":1}]'
                      value={challengeForm.hiddenTestCases}
                      onChange={(event) =>
                        setChallengeForm({ ...challengeForm, hiddenTestCases: event.target.value })
                      }
                    />
                    <textarea
                      rows="4"
                      placeholder="Editorial or solution notes"
                      value={challengeForm.editorial}
                      onChange={(event) =>
                        setChallengeForm({ ...challengeForm, editorial: event.target.value })
                      }
                    />
                    <button className="primary-button creator-submit" type="submit">
                      Publish Challenge
                    </button>
                  </form>
                </div>
              </section>

              <section className="creator-section">
                <div className="creator-section-head">
                  <div>
                    <span className="eyebrow">Write</span>
                    <h3>Blog drafts and content library</h3>
                  </div>
                  <p>Draft blogs and review everything you have already created.</p>
                </div>
                <div className="creator-forms-grid">
                  <form className="panel creator-form-panel" onSubmit={handleBlogSubmit}>
                    <div className="creator-panel-head">
                      <div>
                        <h3>Create a blog draft</h3>
                        <p>Share topic knowledge in article form and submit when ready.</p>
                      </div>
                    </div>
                    <input
                      placeholder="Blog title"
                      value={blogForm.title}
                      onChange={(event) =>
                        setBlogForm({ ...blogForm, title: event.target.value })
                      }
                    />
                    <input
                      placeholder="Short excerpt"
                      value={blogForm.excerpt}
                      onChange={(event) =>
                        setBlogForm({ ...blogForm, excerpt: event.target.value })
                      }
                    />
                    <select
                      value={blogForm.topicSlug}
                      onChange={(event) =>
                        setBlogForm({ ...blogForm, topicSlug: event.target.value })
                      }
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
                      onChange={(event) =>
                        setBlogForm({ ...blogForm, content: event.target.value })
                      }
                    />
                    <select
                      value={blogForm.status}
                      onChange={(event) => setBlogForm({ ...blogForm, status: event.target.value })}
                    >
                      <option value="draft">Draft</option>
                      <option value="pending_review">Submit for review</option>
                    </select>
                    <button className="primary-button creator-submit" type="submit">
                      Save Blog Draft
                    </button>
                  </form>

                  <div className="creator-lists-grid">
                    <div className="panel">
                      <div className="creator-panel-head">
                        <div>
                          <h3>Your courses</h3>
                          <p>Recently created learning paths.</p>
                        </div>
                      </div>
                      <div className="list-stack">
                        {courses.length ? (
                          courses.map((course) => (
                            <div key={course._id} className="list-item">
                              <div>
                                <strong>{course.title}</strong>
                                <p>
                                  {course.topicSlug} - {course.category}
                                </p>
                              </div>
                              <span className="badge">{course.status}</span>
                            </div>
                          ))
                        ) : (
                          <div className="state-card compact">No courses created yet.</div>
                        )}
                      </div>
                    </div>

                    <div className="panel">
                      <div className="creator-panel-head">
                        <div>
                          <h3>Your challenges</h3>
                          <p>Challenge uploads and solve activity.</p>
                        </div>
                      </div>
                      <div className="list-stack">
                        {creatorDashboard?.challenges?.length ? (
                          creatorDashboard.challenges.map((challenge) => (
                            <div key={challenge._id} className="list-item">
                              <div>
                                <strong>{challenge.title}</strong>
                                <p>
                                  {challenge.topicSlug} - {challenge.difficulty}
                                </p>
                              </div>
                              <span className="badge">{challenge.solveCount} solves</span>
                            </div>
                          ))
                        ) : (
                          <div className="state-card compact">No challenges created yet.</div>
                        )}
                      </div>
                    </div>

                    <div className="panel">
                      <div className="creator-panel-head">
                        <div>
                          <h3>Your blog drafts</h3>
                          <p>Drafts waiting for polish or review.</p>
                        </div>
                      </div>
                      <div className="list-stack">
                        {blogs.length ? (
                          blogs.map((blog) => (
                            <div key={blog._id} className="list-item">
                              <div>
                                <strong>{blog.title}</strong>
                                <p>{blog.topicSlug}</p>
                              </div>
                              <span className="badge">{blog.status}</span>
                            </div>
                          ))
                        ) : (
                          <div className="state-card compact">No blog drafts yet.</div>
                        )}
                      </div>
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
                <p>
                  Course, challenge, and blog upload options are shown only when you have
                  contribution access in at least one topic.
                </p>
              </div>
            </section>
          )}
        </div>
      </section>
    </section>
  );
};

export default InstructorDashboardPage;
