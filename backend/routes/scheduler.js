const express = require("express");
const router = express.Router();
const { schedulePin, autoScheduleWeek, runScheduledPosts, getSchedule, deleteScheduledPin } = require("../services/schedulerService");
const { getPins } = require("../services/contentService");

// GET /api/scheduler/queue — get full schedule queue
router.get("/queue", (req, res) => {
  try {
    const data = getSchedule();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/scheduler/auto — auto-schedule all draft pins across the week
router.post("/auto", (req, res) => {
  try {
    const { pins } = getPins();
    const drafts = pins.filter((p) => p.status === "draft");
    if (drafts.length === 0) {
      return res.status(400).json({ success: false, error: "No draft pins. Generate content first." });
    }
    const scheduled = autoScheduleWeek(drafts);
    res.json({ success: true, scheduled, count: scheduled.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/scheduler/pin — manually schedule a specific pin
router.post("/pin", (req, res) => {
  try {
    const { pin, scheduledTime, boardId } = req.body;
    const entry = schedulePin(pin, scheduledTime, boardId);
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/scheduler/run-now — manually trigger posting (for testing)
router.post("/run-now", async (req, res) => {
  try {
    const result = await runScheduledPosts();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/scheduler/pin/:id — remove a scheduled pin
router.delete("/pin/:id", (req, res) => {
  try {
    deleteScheduledPin(parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
