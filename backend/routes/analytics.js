const express = require("express");
const router = express.Router();
const { getPins } = require("../services/contentService");
const { getSchedule } = require("../services/schedulerService");
const { getPinAnalytics } = require("../services/pinterestService");

// GET /api/analytics/summary — dashboard summary stats
router.get("/summary", async (req, res) => {
  try {
    const { pins } = getPins();
    const { queue } = getSchedule();

    const posted = pins.filter((p) => p.status === "posted");
    const scheduled = queue.filter((e) => e.status === "queued");
    const failed = queue.filter((e) => e.status === "failed");

    res.json({
      success: true,
      summary: {
        totalPins: pins.length,
        postedPins: posted.length,
        scheduledPins: scheduled.length,
        failedPins: failed.length,
        draftPins: pins.filter((p) => p.status === "draft").length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/pins — get analytics for all posted pins
router.get("/pins", async (req, res) => {
  try {
    const { pins } = getPins();
    const posted = pins.filter((p) => p.pinterestPinId);

    // Fetch analytics for each posted pin (in parallel, max 5)
    const analytics = await Promise.allSettled(
      posted.slice(0, 5).map(async (pin) => {
        const data = await getPinAnalytics(pin.pinterestPinId);
        return { pin: pin.title, productName: pin.productName, analytics: data };
      })
    );

    res.json({
      success: true,
      pins: analytics.map((r) => (r.status === "fulfilled" ? r.value : null)).filter(Boolean),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
