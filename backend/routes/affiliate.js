const express = require("express");
const router = express.Router();
const {
  getCountryFromIP,
  buildAffiliateLink,
  buildGeniusLink,
  estimateEarnings,
  projectGlobalEarnings,
  getClickAnalytics,
  getSupportedMarkets,
  trackClick,
} = require("../services/affiliateService");

// GET /api/affiliate/markets
// Returns all supported markets + setup status
router.get("/markets", (req, res) => {
  try {
    const markets = getSupportedMarkets();
    res.json({ success: true, markets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/affiliate/redirect?product=LED+Lamp&pin=123
// Smart redirect — detects country, sends to right Amazon marketplace
router.get("/redirect", async (req, res) => {
  const { product, pin, price, category } = req.query;
  if (!product) return res.status(400).json({ error: "product param required" });

  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
  const country = await getCountryFromIP(ip);
  const affiliateUrl = buildAffiliateLink(product, country);
  const earnings = estimateEarnings(price || "25", category || "home", country);

  // Track the click
  trackClick({
    country,
    market: affiliateUrl.split("/")[2],
    productName: product,
    pinId: pin || null,
    estimatedEarnings: earnings,
  });

  // Redirect to the right marketplace
  res.redirect(302, affiliateUrl);
});

// GET /api/affiliate/link?product=LED+Lamp
// Returns the smart redirect URL to embed in pins
router.get("/link", (req, res) => {
  const { product, pin } = req.query;
  if (!product) return res.status(400).json({ error: "product param required" });

  const baseUrl = process.env.BASE_URL || "http://localhost:3001";
  const smartLink = `${baseUrl}/api/affiliate/redirect?product=${encodeURIComponent(product)}&pin=${pin || ""}`;
  const geniusLink = buildGeniusLink(product);

  res.json({
    success: true,
    smartLink,   // Use this in pins — auto-routes by country
    geniusLink,  // Alternative if you use Genius Links service
    note: "smartLink automatically sends each visitor to their local Amazon marketplace",
  });
});

// GET /api/affiliate/project?clicks=1000&price=25
// Projects monthly earnings across all countries
router.get("/project", (req, res) => {
  const clicks = parseInt(req.query.clicks) || 1000;
  const price = parseFloat(req.query.price) || 25;
  const projection = projectGlobalEarnings(clicks, price);
  res.json({ success: true, projection, monthlyClicks: clicks, avgPrice: price });
});

// GET /api/affiliate/analytics
// Click stats, earnings, country breakdown
router.get("/analytics", (req, res) => {
  try {
    const analytics = getClickAnalytics();
    res.json({ success: true, analytics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
