const express = require("express");
const router = express.Router();
const { getUserProfile, getBoards, createBoard, postPin, getPinAnalytics, getOAuthUrl } = require("../services/pinterestService");

// GET /api/pinterest/status — check connection status
router.get("/status", async (req, res) => {
  try {
    const profile = await getUserProfile();
    res.json({ success: true, connected: !profile.mock, profile });
  } catch (err) {
    res.json({ success: false, connected: false, error: err.message });
  }
});

// GET /api/pinterest/auth-url — get OAuth URL for user to connect Pinterest
router.get("/auth-url", (req, res) => {
  const url = getOAuthUrl();
  res.json({ success: true, url });
});

// GET /api/pinterest/boards — get user's boards
router.get("/boards", async (req, res) => {
  try {
    const boards = await getBoards();
    res.json({ success: true, boards });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/pinterest/boards — create a new board
router.post("/boards", async (req, res) => {
  try {
    const { name, description } = req.body;
    const board = await createBoard(name, description);
    res.json({ success: true, board });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/pinterest/post — manually post a pin immediately
router.post("/post", async (req, res) => {
  try {
    const { boardId, title, description, link, imageUrl, altText } = req.body;
    const result = await postPin({ boardId, title, description, link, imageUrl, altText });
    res.json({ success: true, pin: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pinterest/analytics/:pinId — get analytics for a specific pin
router.get("/analytics/:pinId", async (req, res) => {
  try {
    const data = await getPinAnalytics(req.params.pinId);
    res.json({ success: true, analytics: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
