import app from "./app.js";
import connectDatabase from "./config/db.js";
import { ensureDefaultTopics } from "./utils/bootstrapTopics.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDatabase();
  await ensureDefaultTopics();
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
