const toTrimmedString = (value = "") => String(value ?? "").trim();

const toStringList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => toTrimmedString(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const looksLikeLesson = (value) =>
  Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !Array.isArray(value.lessons) &&
      ("title" in value ||
        "duration" in value ||
        "videoUrl" in value ||
        "articleBody" in value ||
        "articleUrl" in value ||
        "contentType" in value)
  );

const normalizeLesson = (lesson, index = 0) => {
  if (typeof lesson === "string") {
    const title = toTrimmedString(lesson);
    return title ? { title, duration: "", videoUrl: "", contentType: "video", articleBody: "", articleUrl: "", resources: [], isPreview: false } : null;
  }

  if (!lesson || typeof lesson !== "object") {
    return null;
  }

  const title = toTrimmedString(lesson.title) || `Lesson ${index + 1}`;
  const duration = toTrimmedString(lesson.duration);
  const videoUrl = toTrimmedString(lesson.videoUrl);
  const articleBody = String(lesson.articleBody ?? "").trim();
  const articleUrl = toTrimmedString(lesson.articleUrl);
  const contentType =
    lesson.contentType === "article" || (!videoUrl && (articleBody || articleUrl))
      ? "article"
      : "video";

  return {
    title,
    duration,
    videoUrl,
    contentType,
    articleBody,
    articleUrl,
    resources: toStringList(lesson.resources),
    isPreview: Boolean(lesson.isPreview),
  };
};

export const normalizeCourseSections = (input) => {
  const rawSections = Array.isArray(input?.sections)
    ? input.sections
    : Array.isArray(input)
      ? input
      : Array.isArray(input?.lessons)
        ? [{ title: input.title || "Course Lessons", lessons: input.lessons }]
        : Array.isArray(input?.courseLessons)
          ? [{ title: "Course Lessons", lessons: input.courseLessons }]
          : [];

  const sections = rawSections.flatMap((section, sectionIndex) => {
    if (looksLikeLesson(section)) {
      const lesson = normalizeLesson(section, 0);
      return lesson
        ? [
            {
              title: "Course Lessons",
              lessons: [lesson],
            },
          ]
        : [];
    }

    if (!section || typeof section !== "object") {
      return [];
    }

    const lessons = Array.isArray(section.lessons)
      ? section.lessons.map((lesson, index) => normalizeLesson(lesson, index)).filter(Boolean)
      : [];

    if (!lessons.length) {
      return [];
    }

    return [
      {
        title: toTrimmedString(section.title) || `Section ${sectionIndex + 1}`,
        lessons,
      },
    ];
  });

  return sections;
};

export const normalizeCoursePayload = (payload = {}) => ({
  title: toTrimmedString(payload.title),
  subtitle: toTrimmedString(payload.subtitle),
  description: String(payload.description ?? "").trim(),
  category: toTrimmedString(payload.category),
  topicSlug: toTrimmedString(payload.topicSlug),
  level: ["beginner", "intermediate", "advanced"].includes(payload.level)
    ? payload.level
    : "beginner",
  thumbnailUrl: toTrimmedString(payload.thumbnailUrl),
  price: Number.isFinite(Number(payload.price)) ? Number(payload.price) : 0,
  learningOutcomes: toStringList(payload.learningOutcomes),
  requirements: toStringList(payload.requirements),
  sections: normalizeCourseSections(payload.sections?.length ? payload.sections : payload),
  status: payload.status,
});

export const normalizeCourseDocument = (course) => {
  if (!course) {
    return course;
  }

  const nextSections = normalizeCourseSections(course.sections?.length ? { sections: course.sections } : course);

  if (typeof course.toObject === "function") {
    return {
      ...course.toObject(),
      sections: nextSections,
      learningOutcomes: toStringList(course.learningOutcomes),
      requirements: toStringList(course.requirements),
    };
  }

  return {
    ...course,
    sections: nextSections,
    learningOutcomes: toStringList(course.learningOutcomes),
    requirements: toStringList(course.requirements),
  };
};
