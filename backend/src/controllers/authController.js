import jwt from "jsonwebtoken";

import User from "../models/User.js";

const REVIEWER_EMAIL_DOMAIN = "chitkara.edu.in";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  streak: user.streak,
  creatorReputation: user.creatorReputation,
  badges: user.badges,
  contributorAccess: user.contributorAccess,
  topicStats: user.topicStats,
});

const isReviewerEmail = (email = "") =>
  email.toLowerCase().endsWith(`@${REVIEWER_EMAIL_DOMAIN}`);

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      const error = new Error("Name, email, and password are required");
      error.statusCode = 400;
      throw error;
    }

    if (role === "reviewer" && !isReviewerEmail(email)) {
      const error = new Error(
        `Reviewer accounts must use an @${REVIEWER_EMAIL_DOMAIN} email address`
      );
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("User already exists with this email");
      error.statusCode = 409;
      throw error;
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "student",
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    if (user.role === "reviewer" && !isReviewerEmail(user.email)) {
      const error = new Error(
        `Reviewer access is restricted to @${REVIEWER_EMAIL_DOMAIN} email addresses`
      );
      error.statusCode = 403;
      throw error;
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user),
  });
};
