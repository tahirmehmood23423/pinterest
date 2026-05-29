/* ============================================================
   Global Affiliate Link Router
   - Detects visitor country from IP
   - Routes to the right Amazon marketplace automatically
   - Supports Genius Links as fallback (one link → all countries)
   - Tracks clicks per country and program
   ============================================================ */

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const CLICKS_DB = path.join(__dirname, "../data/clicks.json");

// ── Amazon marketplace configs per country ─────────────────────
const AMAZON_MARKETS = {
  US: { domain: "amazon.com",    tag: process.env.AMAZON_TAG_US || "",    currency: "$",  name: "Amazon US" },
  GB: { domain: "amazon.co.uk",  tag: process.env.AMAZON_TAG_UK || "",    currency: "£",  name: "Amazon UK" },
  CA: { domain: "amazon.ca",     tag: process.env.AMAZON_TAG_CA || "",    currency: "CA$",name: "Amazon Canada" },
  AU: { domain: "amazon.com.au", tag: process.env.AMAZON_TAG_AU || "",    currency: "A$", name: "Amazon Australia" },
  DE: { domain: "amazon.de",     tag: process.env.AMAZON_TAG_DE || "",    currency: "€",  name: "Amazon Germany" },
  FR: { domain: "amazon.fr",     tag: process.env.AMAZON_TAG_FR || "",    currency: "€",  name: "Amazon France" },
  IN: { domain: "amazon.in",     tag: process.env.AMAZON_TAG_IN || "",    currency: "₹",  name: "Amazon India" },
  PK: { domain: "daraz.pk",      tag: process.env.DARAZ_TAG || "",        currency: "₨",  name: "Daraz Pakistan" },
  AE: { domain: "amazon.ae",     tag: process.env.AMAZON_TAG_AE || "",    currency: "AED",name: "Amazon UAE" },
  SA: { domain: "amazon.sa",     tag: process.env.AMAZON_TAG_SA || "",    currency: "SAR",name: "Amazon Saudi" },
  DEFAULT: { domain: "amazon.com", tag: process.env.AMAZON_TAG_US || "", currency: "$", name: "Amazon US" },
};

// ── Commission rates by marketplace ───────────────────────────
const COMMISSION_RATES = {
  "amazon.com":    { avg: 0.04, categories: { electronics: 0.03, home: 0.08, fashion: 0.10, beauty: 0.10, fitness: 0.05, kitchen: 0.045 } },
  "amazon.co.uk":  { avg: 0.05, categories: { electronics: 0.03, home: 0.05, fashion: 0.07, beauty: 0.06, fitness: 0.05, kitchen: 0.05 } },
  "amazon.ca":     { avg: 0.04, categories: { electronics: 0.03, home: 0.06, fashion: 0.08, beauty: 0.07, fitness: 0.04, kitchen: 0.045 } },
  "amazon.com.au": { avg: 0.04, categories: { electronics: 0.02, home: 0.06, fashion: 0.08, beauty: 0.07, fitness: 0.04, kitchen: 0.04 } },
  "amazon.de":     { avg: 0.07, categories: { electronics: 0.05, home: 0.08, fashion: 0.10, beauty: 0.09, fitness: 0.06, kitchen: 0.07 } },
  "daraz.pk":      { avg: 0.05, categories: { electronics: 0.04, home: 0.05, fashion: 0.07, beauty: 0.06, fitness: 0.05, kitchen: 0.05 } },
};

// ── Country → Pinterest audience % (for earnings projection) ──
const PINTEREST_AUDIENCE_SHARE = {
  US: 0.42, GB: 0.08, CA: 0.06, AU: 0.04,
  DE: 0.04, FR: 0.03, IN: 0.03, PK: 0.01,
  AE: 0.01, SA: 0.01, OTHER: 0.27,
};

// ── Click tracking ─────────────────────────────────────────────
function loadClicks() {
  if (!fs.existsSync(CLICKS_DB)) return { clicks: [], totals: {} };
  return JSON.parse(fs.readFileSync(CLICKS_DB, "utf8"));
}

function saveClicks(data) {
  fs.mkdirSync(path.dirname(CLICKS_DB), { recursive: true });
  fs.writeFileSync(CLICKS_DB, JSON.stringify(data, null, 2));
}

function trackClick({ country, market, productName, pinId, estimatedEarnings }) {
  const db = loadClicks();
  db.clicks.push({
    id: Date.now(),
    country,
    market,
    productName,
    pinId,
    estimatedEarnings,
    timestamp: new Date().toISOString(),
  });
  db.totals[country] = (db.totals[country] || 0) + 1;
  saveClicks(db);
}

// ── Detect country from IP ─────────────────────────────────────
async function getCountryFromIP(ip) {
  // Skip localhost IPs
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168")) {
    return "US"; // Default for local dev
  }
  try {
    const res = await axios.get(`http://ip-api.com/json/${ip}?fields=countryCode`, { timeout: 3000 });
    return res.data?.countryCode || "US";
  } catch {
    return "US";
  }
}

// ── Build affiliate link for a product + country ───────────────
function buildAffiliateLink(productSearchTerm, countryCode) {
  const market = AMAZON_MARKETS[countryCode] || AMAZON_MARKETS.DEFAULT;
  const encoded = encodeURIComponent(productSearchTerm);

  // Special case for Pakistan — use Daraz
  if (countryCode === "PK") {
    const darazTag = process.env.DARAZ_TAG;
    if (darazTag) {
      return `https://www.daraz.pk/catalog/?q=${encoded}&spm=${darazTag}`;
    }
    return `https://www.daraz.pk/catalog/?q=${encoded}`;
  }

  // Amazon link with affiliate tag
  const tag = market.tag;
  if (tag) {
    return `https://${market.domain}/s?k=${encoded}&tag=${tag}`;
  }
  // No tag yet — plain search link (still works, just no commission)
  return `https://${market.domain}/s?k=${encoded}`;
}

// ── Genius Links universal URL (one link routes everywhere) ───
function buildGeniusLink(productSearchTerm) {
  const geniusId = process.env.GENIUS_LINKS_ID;
  if (!geniusId) {
    // Fallback: just use Amazon US
    return `https://amazon.com/s?k=${encodeURIComponent(productSearchTerm)}`;
  }
  return `https://geni.us/${geniusId}?q=${encodeURIComponent(productSearchTerm)}`;
}

// ── Estimate earnings for a click ─────────────────────────────
function estimateEarnings(productPrice, category, countryCode) {
  const market = AMAZON_MARKETS[countryCode] || AMAZON_MARKETS.DEFAULT;
  const rates = COMMISSION_RATES[market.domain] || COMMISSION_RATES["amazon.com"];
  const catKey = category?.toLowerCase().split(" ")[0];
  const rate = rates.categories[catKey] || rates.avg;
  const price = parseFloat(productPrice?.replace(/[^0-9.]/g, "")) || 25;
  return (price * rate).toFixed(2);
}

// ── Project monthly earnings across all countries ──────────────
function projectGlobalEarnings(monthlyClicks, avgProductPrice = 25) {
  const projection = {};
  let totalEstimate = 0;

  for (const [country, share] of Object.entries(PINTEREST_AUDIENCE_SHARE)) {
    if (country === "OTHER") continue;
    const market = AMAZON_MARKETS[country] || AMAZON_MARKETS.DEFAULT;
    const rates = COMMISSION_RATES[market.domain] || COMMISSION_RATES["amazon.com"];
    const clicks = Math.round(monthlyClicks * share);
    const conversionRate = 0.06; // 6% avg Amazon conversion
    const sales = Math.round(clicks * conversionRate);
    const earnings = (sales * avgProductPrice * rates.avg).toFixed(2);
    projection[country] = {
      country,
      marketName: market.name,
      currency: market.currency,
      expectedClicks: clicks,
      expectedSales: sales,
      estimatedEarnings: parseFloat(earnings),
      audienceShare: Math.round(share * 100) + "%",
    };
    totalEstimate += parseFloat(earnings);
  }

  return {
    breakdown: projection,
    totalMonthlyEstimate: totalEstimate.toFixed(2),
    topMarket: Object.entries(projection).sort((a, b) => b[1].estimatedEarnings - a[1].estimatedEarnings)[0][0],
  };
}

// ── Get click analytics summary ────────────────────────────────
function getClickAnalytics() {
  const db = loadClicks();
  const byCountry = {};
  const byMarket = {};
  let totalEarnings = 0;

  db.clicks.forEach((c) => {
    byCountry[c.country] = (byCountry[c.country] || 0) + 1;
    byMarket[c.market] = (byMarket[c.market] || 0) + 1;
    totalEarnings += parseFloat(c.estimatedEarnings || 0);
  });

  return {
    totalClicks: db.clicks.length,
    totalEstimatedEarnings: totalEarnings.toFixed(2),
    byCountry,
    byMarket,
    recentClicks: db.clicks.slice(-10).reverse(),
  };
}

// ── Get all supported markets info ────────────────────────────
function getSupportedMarkets() {
  return Object.entries(AMAZON_MARKETS)
    .filter(([k]) => k !== "DEFAULT")
    .map(([code, m]) => ({
      countryCode: code,
      ...m,
      audienceShare: PINTEREST_AUDIENCE_SHARE[code]
        ? Math.round(PINTEREST_AUDIENCE_SHARE[code] * 100) + "%"
        : "<1%",
      hasTag: !!m.tag,
    }));
}

module.exports = {
  getCountryFromIP,
  buildAffiliateLink,
  buildGeniusLink,
  estimateEarnings,
  projectGlobalEarnings,
  getClickAnalytics,
  getSupportedMarkets,
  trackClick,
  AMAZON_MARKETS,
  PINTEREST_AUDIENCE_SHARE,
};
