const axios = require("axios");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/products.json");

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadDB() {
  if (!fs.existsSync(DB_PATH)) return { products: [], lastRun: null };
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function saveDB(data) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ─── Google Trends via SerpAPI (free tier available) ────────────────────────
// Alternative: scrape trends.google.com (no key needed)

async function fetchGoogleTrends(keyword) {
  try {
    // Free approach: use Google Trends unofficial endpoint
    const url = `https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=-300&geo=US&ns=15`;
    const res = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      timeout: 8000,
    });
    // Response starts with ")]}',\n" — strip it
    const json = JSON.parse(res.data.replace(")]}',\n", ""));
    const topics = json.default?.trendingSearchesDays?.[0]?.trendingSearches || [];
    return topics.slice(0, 20).map((t) => ({
      title: t.title?.query || "",
      traffic: t.formattedTraffic || "N/A",
      relatedQueries: t.relatedQueries?.map((q) => q.query) || [],
    }));
  } catch (err) {
    console.warn("[Research] Google Trends fetch failed:", err.message);
    return [];
  }
}

// ─── Pinterest Trends via public search ─────────────────────────────────────

async function fetchPinterestTrends() {
  try {
    const categories = [
      "home decor trending",
      "fitness products viral",
      "eco friendly products",
      "gadgets 2025",
      "kitchen accessories viral",
    ];
    // Pinterest has a public trends endpoint
    const res = await axios.get(
      "https://trends.pinterest.com/api/v1/trends?region=US&limit=20",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
        timeout: 8000,
      }
    );
    return res.data?.trends || [];
  } catch (err) {
    console.warn("[Research] Pinterest Trends fetch failed:", err.message);
    // Return static fallback categories for scoring
    return [
      { keyword: "minimalist home decor", volume: 92 },
      { keyword: "portable blender", volume: 87 },
      { keyword: "desk setup accessories", volume: 85 },
      { keyword: "eco products kitchen", volume: 81 },
      { keyword: "car phone mount", volume: 78 },
      { keyword: "cable organizer", volume: 72 },
      { keyword: "yoga mat foldable", volume: 70 },
      { keyword: "led lamp bedroom", volume: 88 },
    ];
  }
}

// ─── Gemini AI scoring ───────────────────────────────────────────────────────

async function scoreProductsWithClaude(trends) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.warn("[Research] No Gemini API key — using mock scoring");
    return getMockProducts();
  }

  const prompt = `You are an expert e-commerce product researcher specializing in Pinterest affiliate marketing.

Based on these trending topics: ${JSON.stringify(trends.slice(0, 15))}

Identify and score the TOP 6 most profitable products to promote on Pinterest as an affiliate.

For each product return a JSON array with:
- name: product name (specific, not generic)
- category: product category  
- emoji: relevant emoji
- trendScore: 0-100 score based on demand
- trendGrowth: percentage growth string like "+47%"
- estimatedMargin: margin range like "$12-25"
- priceRange: retail price range like "$18-35"
- tags: array of 3 relevant tags
- pinterestAppeal: why this works on Pinterest (1 sentence)
- affiliatePrograms: array of 2-3 affiliate programs to join

Return ONLY a valid JSON array. No explanation.`;

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1500,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const text = res.data.candidates[0].content.parts[0].text.trim();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("[Research] Gemini scoring failed:", err.message);
    return getMockProducts();
  }
}

// ─── Mock fallback (used when no API key yet) ────────────────────────────────

function getMockProducts() {
  return [
    { name: "Minimalist LED Desk Lamp", category: "Home & Office", emoji: "🪔", trendScore: 91, trendGrowth: "+47%", estimatedMargin: "$18-32", priceRange: "$24-45", tags: ["trending", "high-margin", "evergreen"], pinterestAppeal: "Perfect for aesthetic desk setup photos", affiliatePrograms: ["Amazon Associates", "AliExpress Affiliate"] },
    { name: "Portable Blender Bottle", category: "Kitchen & Fitness", emoji: "🥤", trendScore: 88, trendGrowth: "+61%", estimatedMargin: "$12-22", priceRange: "$18-35", tags: ["viral", "fitness-niche", "gifting"], pinterestAppeal: "Highly shareable healthy lifestyle content", affiliatePrograms: ["Amazon Associates", "Daraz Affiliate"] },
    { name: "Magnetic Phone Mount Car", category: "Automotive", emoji: "🧲", trendScore: 85, trendGrowth: "+38%", estimatedMargin: "$8-16", priceRange: "$12-22", tags: ["high-demand", "repeat-buy", "practical"], pinterestAppeal: "Car organization boards are huge on Pinterest", affiliatePrograms: ["Amazon Associates", "AliExpress Affiliate"] },
    { name: "Silicone Cable Organizer Set", category: "Accessories", emoji: "🔌", trendScore: 82, trendGrowth: "+29%", estimatedMargin: "$6-12", priceRange: "$9-18", tags: ["cheap-source", "bundle-item", "desk"], pinterestAppeal: "Desk organization is a top Pinterest category", affiliatePrograms: ["Amazon Associates"] },
    { name: "Reusable Beeswax Food Wraps", category: "Eco Home", emoji: "🍃", trendScore: 79, trendGrowth: "+52%", estimatedMargin: "$10-20", priceRange: "$15-28", tags: ["eco-niche", "gifting", "kitchen"], pinterestAppeal: "Eco-living boards drive massive engagement", affiliatePrograms: ["Amazon Associates", "Etsy Affiliate"] },
    { name: "Foldable Travel Yoga Mat", category: "Fitness", emoji: "🧘", trendScore: 77, trendGrowth: "+44%", estimatedMargin: "$14-28", priceRange: "$22-40", tags: ["seasonal", "high-visual", "fitness"], pinterestAppeal: "Fitness pins are top performers year-round", affiliatePrograms: ["Amazon Associates", "Daraz Affiliate"] },
  ];
}

// ─── Main research runner ────────────────────────────────────────────────────

async function runResearch() {
  console.log("[Research] Starting market research scan...");

  const [googleTrends, pinterestTrends] = await Promise.all([
    fetchGoogleTrends(),
    fetchPinterestTrends(),
  ]);

  const combinedTrends = [
    ...googleTrends.map((t) => t.title),
    ...pinterestTrends.map((t) => t.keyword || t),
  ].filter(Boolean);

  console.log(`[Research] Found ${combinedTrends.length} trending topics`);

  const products = await scoreProductsWithClaude(combinedTrends);

  const db = loadDB();
  db.products = products.map((p, i) => ({
    ...p,
    id: i + 1,
    approved: null,
    createdAt: new Date().toISOString(),
  }));
  db.lastRun = new Date().toISOString();
  db.trendCount = combinedTrends.length;
  saveDB(db);

  console.log(`[Research] Shortlisted ${products.length} products. Saved to DB.`);
  return db;
}

function getProducts() {
  return loadDB();
}

function approveProduct(id, approved) {
  const db = loadDB();
  db.products = db.products.map((p) =>
    p.id === id ? { ...p, approved } : p
  );
  saveDB(db);
  return db.products.find((p) => p.id === id);
}

module.exports = { runResearch, getProducts, approveProduct };
