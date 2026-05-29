const axios = require("axios");
const fs = require("fs");
const path = require("path");

const PINS_DB = path.join(__dirname, "../data/pins.json");

function loadPins() {
  if (!fs.existsSync(PINS_DB)) return { pins: [] };
  return JSON.parse(fs.readFileSync(PINS_DB, "utf8"));
}

function savePins(data) {
  fs.mkdirSync(path.dirname(PINS_DB), { recursive: true });
  fs.writeFileSync(PINS_DB, JSON.stringify(data, null, 2));
}

// ─── Generate pin content using Gemini ──────────────────────────────────────

async function generatePinContent(product) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return getMockPin(product);
  }

  const prompt = `You are an expert Pinterest content creator who creates viral affiliate marketing pins.

Create Pinterest pin content for this product:
- Product: ${product.name}
- Category: ${product.category}
- Pinterest Appeal: ${product.pinterestAppeal}
- Price Range: ${product.priceRange}

Generate a JSON object with:
- title: Catchy pin title (max 60 chars, uses power words, includes emoji)
- description: Engaging description (max 150 chars, includes call to action)
- hashtags: Array of 15 highly relevant hashtags (no # symbol, just the word)
- board: Best Pinterest board name to post this on
- altText: Image alt text for accessibility
- postingStrategy: One tip for maximizing this pin's reach
- bestTimeToPost: Best time to post (e.g. "9:00 AM weekdays")
- imagePrompt: Detailed prompt to generate an AI image for this pin

Return ONLY valid JSON. No explanation.`;

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
          maxOutputTokens: 1000,
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
    console.error("[Content] Gemini content gen failed:", err.message);
    return getMockPin(product);
  }
}

// ─── Generate weekly strategy using Gemini ──────────────────────────────────

async function generateWeeklyStrategy(approvedProducts) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return getMockStrategy(approvedProducts);
  }

  const prompt = `You are a Pinterest marketing strategist.

I have these approved products for affiliate marketing:
${approvedProducts.map((p) => `- ${p.name} (${p.category})`).join("\n")}

Create a 7-day Pinterest posting strategy JSON with:
- weekSummary: Brief strategy overview (2 sentences)
- dailyPlan: Array of 7 objects, each with:
  - day: "Monday" etc
  - pins: Array of pin titles to post that day
  - focus: The marketing focus for that day
  - bestTime: Best posting time
- keyInsights: Array of 3 strategic tips
- estimatedReach: Expected weekly reach estimate

Return ONLY valid JSON.`;

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
          maxOutputTokens: 1200,
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
    console.error("[Content] Strategy gen failed:", err.message);
    return getMockStrategy(approvedProducts);
  }
}

// ─── Generate all pins for approved products ─────────────────────────────────

async function generateAllPins(approvedProducts) {
  console.log(`[Content] Generating pins for ${approvedProducts.length} products...`);

  const pins = [];
  for (const product of approvedProducts) {
    const content = await generatePinContent(product);
    pins.push({
      id: Date.now() + Math.random(),
      productId: product.id,
      productName: product.name,
      emoji: product.emoji,
      ...content,
      status: "draft",
      scheduledTime: null,
      postedAt: null,
      pinterestPinId: null,
      createdAt: new Date().toISOString(),
    });
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  const db = loadPins();
  db.pins = [...db.pins.filter((p) => p.status === "posted"), ...pins];
  savePins(db);

  console.log(`[Content] Generated ${pins.length} pins.`);
  return pins;
}

// ─── Mock fallbacks ───────────────────────────────────────────────────────────

function getMockPin(product) {
  return {
    title: `${product.emoji} Transform Your Life with ${product.name}`,
    description: `Discover the ${product.name} everyone is talking about! Perfect for your lifestyle upgrade. Shop now & save! 🛒`,
    hashtags: ["HomeDecor", "LifestyleUpgrade", "ShopNow", "AffiliateLink", "MustHave", "TrendingNow", "GiftsForHer", "GiftsForHim", "PinterestFinds", "OnlineShopping", "ProductReview", "DailyEssentials", "ViralProduct", "BestDeals", "NewArrival"],
    board: product.category,
    altText: `${product.name} product showcase`,
    postingStrategy: "Post at 9 AM for maximum morning traffic engagement",
    bestTimeToPost: "9:00 AM weekdays",
    imagePrompt: `Professional product photo of ${product.name} on a clean white background with soft shadows, lifestyle setting`,
  };
}

function getMockStrategy(products) {
  return {
    weekSummary: "Focus on lifestyle and aspirational content this week. Mix product showcases with helpful tips to maximize saves and clicks.",
    dailyPlan: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day, i) => ({
      day,
      pins: [products[i % products.length]?.name || "Product pin"].slice(0, 1),
      focus: ["Motivation & lifestyle","Product showcase","Tips & tricks","Before & after","Customer value","Weekend inspiration","Weekly recap"][i],
      bestTime: ["9:00 AM","9:00 AM","12:00 PM","9:00 AM","9:00 AM","10:00 AM","7:00 PM"][i],
    })),
    keyInsights: [
      "Vertical images (2:3 ratio) get 60% more engagement on Pinterest",
      "Pins with prices get 36% more clicks — always include the price",
      "Re-pin your top content to multiple boards for wider reach",
    ],
    estimatedReach: "2,000–5,000 weekly impressions",
  };
}

function getPins() {
  return loadPins();
}

function updatePinStatus(pinId, status, extra = {}) {
  const db = loadPins();
  db.pins = db.pins.map((p) =>
    p.id === pinId ? { ...p, status, ...extra } : p
  );
  savePins(db);
}

module.exports = { generateAllPins, generateWeeklyStrategy, getPins, updatePinStatus };
