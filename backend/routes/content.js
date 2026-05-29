const express = require("express");
const router = express.Router();
const { generateAllPins, generateWeeklyStrategy, getPins, updatePinStatus } = require("../services/contentService");
const { getProducts } = require("../services/researchService");

// GET /api/content/pins — get all generated pins
router.get("/pins", (req, res) => {
  try {
    const data = getPins();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/content/generate — generate pins for all approved products
router.post("/generate", async (req, res) => {
  try {
    const db = getProducts();
    const approved = db.products.filter((p) => p.approved === true);
    if (approved.length === 0) {
      return res.status(400).json({ success: false, error: "No approved products. Approve products first." });
    }
    res.json({ success: true, message: `Generating pins for ${approved.length} products...` });
    // Run in background
    generateAllPins(approved).catch(console.error);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/content/strategy — generate weekly posting strategy
router.post("/strategy", async (req, res) => {
  try {
    const db = getProducts();
    const approved = db.products.filter((p) => p.approved === true);
    const strategy = await generateWeeklyStrategy(approved);
    res.json({ success: true, strategy });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/content/pins/:id — update a pin (edit before posting)
router.patch("/pins/:id", (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    updatePinStatus(parseFloat(id), updates.status || "draft", updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
