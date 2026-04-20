import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import challengeRoutes from "./routes/challengeRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import creatorRoutes from "./routes/creatorRoutes.js";
import discussionRoutes from "./routes/discussionRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import topicRoutes from "./routes/topicRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import User from "./models/User.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));
app.use((req, _res, next) => {
  req.models = { User };
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Server is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/creator", creatorRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
