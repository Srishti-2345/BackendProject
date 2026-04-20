import jwt from "jsonwebtoken";

import User from "../models/User.js";

export const protect = async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    const error = new Error("Not authorized");
    error.statusCode = 401;
    return next(error);
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      const error = new Error("User no longer exists");
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;
    next();
  } catch (error) {
    error.statusCode = 401;
    next(error);
  }
};

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    return next(error);
  }

  next();
};

export const optionalAuth = async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    req.user = user || null;
  } catch (_error) {
    req.user = null;
  }

  next();
};
