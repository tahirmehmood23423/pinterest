require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const researchRouter = require("./routes/research");
const contentRouter = require("./routes/content");
const pinterestRouter = require("./routes/pinterest");
const schedulerRouter = require("./routes/scheduler");
const analyticsRouter = require("./routes/analytics");
const affiliateRouter = require("./routes/affiliate");

const { runScheduledPosts } = require("./services/schedulerService");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/research", researchRouter);
app.use("/api/content", contentRouter);
app.use("/api/pinterest", pinterestRouter);
app.use("/api/scheduler", schedulerRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/affiliate", affiliateRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Auto-run research every 6 hours
cron.schedule("0 */6 * * *", async () => {
  console.log("[CRON] Running scheduled market research...");
  try {
    const { runResearch } = require("./services/researchService");
    await runResearch();
    console.log("[CRON] Research complete.");
  } catch (e) {
    console.error("[CRON] Research failed:", e.message);
  }
});

// Auto-post pins every 30 minutes (checks schedule)
cron.schedule("*/30 * * * *", async () => {
  console.log("[CRON] Checking scheduled pins...");
  try {
    await runScheduledPosts();
  } catch (e) {
    console.error("[CRON] Post failed:", e.message);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`PinAutoFlow backend running on port ${PORT}`));
