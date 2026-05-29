const axios = require("axios");

const BASE_URL = "https://api.pinterest.com/v5";

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.PINTEREST_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

// ─── Get user profile ─────────────────────────────────────────────────────────

async function getUserProfile() {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token || token === "your_pinterest_access_token_here") {
    return { mock: true, username: "your_username", id: "mock_id" };
  }

  try {
    const res = await axios.get(`${BASE_URL}/user_account`, {
      headers: getHeaders(),
    });
    return res.data;
  } catch (err) {
    throw new Error(`Pinterest profile fetch failed: ${err.response?.data?.message || err.message}`);
  }
}

// ─── Get boards ───────────────────────────────────────────────────────────────

async function getBoards() {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token || token === "your_pinterest_access_token_here") {
    return {
      mock: true,
      items: [
        { id: "mock_board_1", name: "Home & Living", pin_count: 45 },
        { id: "mock_board_2", name: "Fitness Goals", pin_count: 28 },
        { id: "mock_board_3", name: "Tech & Gadgets", pin_count: 19 },
        { id: "mock_board_4", name: "Eco Living", pin_count: 33 },
      ],
    };
  }

  try {
    const res = await axios.get(`${BASE_URL}/boards`, {
      headers: getHeaders(),
      params: { page_size: 25 },
    });
    return res.data;
  } catch (err) {
    throw new Error(`Boards fetch failed: ${err.response?.data?.message || err.message}`);
  }
}

// ─── Create a board ───────────────────────────────────────────────────────────

async function createBoard(name, description = "") {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token || token === "your_pinterest_access_token_here") {
    return { mock: true, id: "mock_board_" + Date.now(), name };
  }

  try {
    const res = await axios.post(
      `${BASE_URL}/boards`,
      { name, description, privacy: "PUBLIC" },
      { headers: getHeaders() }
    );
    return res.data;
  } catch (err) {
    throw new Error(`Board creation failed: ${err.response?.data?.message || err.message}`);
  }
}

// ─── Post a pin ───────────────────────────────────────────────────────────────
// Pinterest API v5 requires an image URL or media upload
// For affiliate marketing, we link to the product page

async function postPin({ boardId, title, description, link, imageUrl, altText }) {
  const token = process.env.PINTEREST_ACCESS_TOKEN;

  if (!token || token === "your_pinterest_access_token_here") {
    console.log("[Pinterest] Mock post — no real token yet");
    return {
      mock: true,
      id: "mock_pin_" + Date.now(),
      title,
      status: "posted",
    };
  }

  if (!boardId) boardId = process.env.PINTEREST_BOARD_ID;

  try {
    const payload = {
      board_id: boardId,
      title: title.slice(0, 100),
      description: description.slice(0, 500),
      link: link || "",
      media_source: imageUrl
        ? {
            source_type: "image_url",
            url: imageUrl,
          }
        : undefined,
      alt_text: altText || title,
    };

    const res = await axios.post(`${BASE_URL}/pins`, payload, {
      headers: getHeaders(),
    });

    console.log(`[Pinterest] Pin posted: ${res.data.id}`);
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`Pin post failed: ${msg}`);
  }
}

// ─── Get pin analytics ────────────────────────────────────────────────────────

async function getPinAnalytics(pinId) {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token || token === "your_pinterest_access_token_here") {
    return {
      mock: true,
      impressions: Math.floor(Math.random() * 500) + 100,
      saves: Math.floor(Math.random() * 50) + 5,
      clicks: Math.floor(Math.random() * 30) + 2,
    };
  }

  try {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

    const res = await axios.get(`${BASE_URL}/pins/${pinId}/analytics`, {
      headers: getHeaders(),
      params: {
        start_date: start,
        end_date: end,
        metric_types: "IMPRESSION,SAVE,PIN_CLICK",
      },
    });
    return res.data;
  } catch (err) {
    console.warn("[Pinterest] Analytics fetch failed:", err.message);
    return null;
  }
}

// ─── OAuth helper — generates the authorization URL ──────────────────────────
// User visits this URL, logs into Pinterest, and gets an access token

function getOAuthUrl() {
  const clientId = process.env.PINTEREST_CLIENT_ID || "YOUR_CLIENT_ID";
  const redirectUri = encodeURIComponent("http://localhost:3001/api/pinterest/callback");
  const scope = encodeURIComponent("boards:read,boards:write,pins:read,pins:write,user_accounts:read");
  return `https://www.pinterest.com/oauth/?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
}

module.exports = { getUserProfile, getBoards, createBoard, postPin, getPinAnalytics, getOAuthUrl };
