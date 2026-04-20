import DiscussionThread from "../models/DiscussionThread.js";
import { awardXp } from "../utils/progression.js";

export const getThreads = async (req, res, next) => {
  try {
    const { contextType, contextId } = req.query;

    const threads = await DiscussionThread.find({ contextType, contextId })
      .populate("author", "name role")
      .populate("replies.author", "name role")
      .sort({ createdAt: -1 });

    res.json({ success: true, threads });
  } catch (error) {
    next(error);
  }
};

export const createThread = async (req, res, next) => {
  try {
    const { contextType, contextId, title, body, tag = "question" } = req.body;

    const thread = await DiscussionThread.create({
      contextType,
      contextId,
      title,
      body,
      tag,
      author: req.user._id,
    });

    const populatedThread = await DiscussionThread.findById(thread._id)
      .populate("author", "name role")
      .populate("replies.author", "name role");

    res.status(201).json({ success: true, thread: populatedThread });
  } catch (error) {
    next(error);
  }
};

export const replyToThread = async (req, res, next) => {
  try {
    const thread = await DiscussionThread.findById(req.params.threadId);
    if (!thread) {
      const error = new Error("Thread not found");
      error.statusCode = 404;
      throw error;
    }

    thread.replies.push({
      author: req.user._id,
      body: req.body.body,
    });

    await thread.save();

    const populatedThread = await DiscussionThread.findById(thread._id)
      .populate("author", "name role")
      .populate("replies.author", "name role");

    res.json({ success: true, thread: populatedThread });
  } catch (error) {
    next(error);
  }
};

export const acceptReply = async (req, res, next) => {
  try {
    const thread = await DiscussionThread.findById(req.params.threadId);
    if (!thread) {
      const error = new Error("Thread not found");
      error.statusCode = 404;
      throw error;
    }

    if (String(thread.author) !== String(req.user._id)) {
      const error = new Error("Only the thread author can accept a reply");
      error.statusCode = 403;
      throw error;
    }

    thread.replies = thread.replies.map((reply) => ({
      ...reply.toObject(),
      isAccepted: String(reply._id) === req.params.replyId,
    }));
    thread.status = "solved";
    await thread.save();

    const acceptedReply = thread.replies.find(
      (reply) => String(reply._id) === req.params.replyId
    );

    if (acceptedReply) {
      const replyAuthor = await req.models.User.findById(acceptedReply.author);
      if (replyAuthor) {
        await awardXp({
          user: replyAuthor,
          topicSlug: req.body.topicSlug || "community",
          xp: 30,
          sourceType: "discussion_helpful",
          metadata: { threadId: thread._id },
        });
      }
    }

    const populatedThread = await DiscussionThread.findById(thread._id)
      .populate("author", "name role")
      .populate("replies.author", "name role");

    res.json({ success: true, thread: populatedThread });
  } catch (error) {
    next(error);
  }
};

