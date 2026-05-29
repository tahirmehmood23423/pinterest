const express = require("express");
const router = express.Router();
const { runResearch, getProducts, approveProduct } = require("../services/researchService");

// GET /api/research/products — get all shortlisted products
router.get("/products", (req, res) => {
  try {
    const data = getProducts();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/research/run — trigger a new research scan
router.post("/run", async (req, res) => {
  try {
    res.json({ success: true, message: "Research started" });
    // Run in background
    runResearch().catch(console.error);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/research/approve/:id — approve or reject a product
router.post("/approve/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { approved } = req.body;
    const product = approveProduct(id, approved);
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
