import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

import User from "../models/User.js";

const REVIEWER_EMAIL_DOMAIN = "chitkara.edu.in";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const assertReviewerEligibility = (role, email) => {
  if (role === "reviewer" && !isReviewerEmail(email)) {
    const error = new Error(
      `Reviewer accounts must use an @${REVIEWER_EMAIL_DOMAIN} email address`
    );
    error.statusCode = 400;
    throw error;
  }
};

const verifyGoogleCredential = async (credential) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    const error = new Error("Google sign-in is not configured on the server");
    error.statusCode = 500;
    throw error;
  }

  if (!credential) {
    const error = new Error("Google credential is required");
    error.statusCode = 400;
    throw error;
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload?.sub) {
    const error = new Error("Could not verify Google account");
    error.statusCode = 401;
    throw error;
  }

  return payload;
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = name?.trim();

    if (!normalizedName || !normalizedEmail || !password) {
      const error = new Error("Name, email, and password are required");
      error.statusCode = 400;
      throw error;
    }

    assertReviewerEligibility(role, normalizedEmail);

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const error = new Error("User already exists with this email");
      error.statusCode = 409;
      throw error;
    }

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
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
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      const error = new Error("Email and password are required");
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    if (!user.password) {
      const error = new Error("This account uses Google sign-in. Continue with Google instead.");
      error.statusCode = 400;
      throw error;
    }

    if (!(await user.comparePassword(password))) {
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

export const loginWithGoogle = async (req, res, next) => {
  try {
    const { credential, role = "student" } = req.body;
    const payload = await verifyGoogleCredential(credential);
    const normalizedEmail = normalizeEmail(payload.email);
    const requestedRole = role || "student";

    assertReviewerEligibility(requestedRole, normalizedEmail);

    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email: normalizedEmail }],
    });

    if (!user) {
      user = await User.create({
        name: payload.name?.trim() || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        password: "",
        googleId: payload.sub,
        avatarUrl: payload.picture || "",
        role: requestedRole,
      });
    } else {
      if (user.role === "reviewer" && !isReviewerEmail(user.email)) {
        const error = new Error(
          `Reviewer access is restricted to @${REVIEWER_EMAIL_DOMAIN} email addresses`
        );
        error.statusCode = 403;
        throw error;
      }

      user.googleId = user.googleId || payload.sub;
      user.name = user.name || payload.name?.trim() || user.name;
      user.avatarUrl = user.avatarUrl || payload.picture || "";
      await user.save();
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
