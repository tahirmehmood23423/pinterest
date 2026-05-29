# 📌 PinAutoFlow — Pinterest Affiliate Automation System

Fully automated Pinterest affiliate marketing tool.
You approve products → AI generates content → Tool posts automatically.

---

## 🗂️ Project Structure

```
pinautoflow/
├── backend/               ← Node.js API server
│   ├── server.js          ← Main server + cron jobs
│   ├── routes/
│   │   ├── research.js    ← Market research endpoints
│   │   ├── content.js     ← Content generation endpoints
│   │   ├── pinterest.js   ← Pinterest API endpoints
│   │   ├── scheduler.js   ← Auto-scheduler endpoints
│   │   └── analytics.js   ← Analytics endpoints
│   ├── services/
│   │   ├── researchService.js   ← Google Trends + Claude scoring
│   │   ├── contentService.js    ← Claude pin generation
│   │   ├── pinterestService.js  ← Pinterest API v5
│   │   └── schedulerService.js  ← Auto-post queue
│   ├── data/              ← JSON database (auto-created)
│   └── .env.example       ← Config template
└── README.md
```

---

## 🚀 STEP-BY-STEP SETUP

### Step 1 — Install Node.js
Download from: https://nodejs.org (choose LTS version)

### Step 2 — Install dependencies
```bash
cd pinautoflow/backend
npm install
```

### Step 3 — Get your API keys (all FREE)

#### A) Claude API Key (for AI content generation)
1. Go to: https://console.anthropic.com
2. Sign up for free
3. Click "API Keys" → "Create Key"
4. Copy the key

#### B) Pinterest Access Token
1. Go to: https://developers.pinterest.com
2. Create a free developer account
3. Click "Create App"
4. Fill in: App name "PinAutoFlow", description "Personal automation tool"
5. Under "Scopes" select:
   - boards:read, boards:write
   - pins:read, pins:write
   - user_accounts:read
6. Go to "Access Token" tab → Generate token
7. Copy the token
8. Copy your Board ID from your Pinterest board URL:
   pinterest.com/username/board-name/ → board-name is the ID

#### C) Daraz Affiliate (for Pakistan — FREE)
1. Go to: https://affiliate.daraz.pk
2. Sign up with your phone number
3. Get your affiliate link format from the dashboard

#### D) Amazon Associates (optional, global)
1. Go to: https://affiliate-program.amazon.com
2. Sign up (needs a website/social media account)

### Step 4 — Configure your .env file
```bash
cp .env.example .env
```
Open `.env` and fill in your keys:
```
ANTHROPIC_API_KEY=sk-ant-...
PINTEREST_ACCESS_TOKEN=...
PINTEREST_BOARD_ID=...
```

### Step 5 — Start the server
```bash
node server.js
```
You should see:
```
PinAutoFlow backend running on port 3001
```

---

## 🔄 HOW THE AUTOMATION WORKS

```
Every 6 hours:
  → Research runs automatically
  → Scans Google Trends + Pinterest Trends
  → Claude scores and shortlists 6 products
  → YOU review and approve products (your only job!)

After you approve:
  → Hit "Generate Content" in the dashboard
  → Claude writes pin titles, descriptions, hashtags
  → Pins auto-schedule across the week

Every 30 minutes:
  → Scheduler checks if any pins are due
  → Posts them to Pinterest automatically
  → Tracks results
```

---

## 📡 API Endpoints

| Method | Endpoint | What it does |
|--------|----------|--------------|
| POST | /api/research/run | Trigger market research |
| GET | /api/research/products | Get shortlisted products |
| POST | /api/research/approve/:id | Approve/reject a product |
| POST | /api/content/generate | Generate pins for approved products |
| GET | /api/content/pins | Get all generated pins |
| POST | /api/content/strategy | Generate weekly strategy |
| GET | /api/pinterest/status | Check Pinterest connection |
| GET | /api/pinterest/boards | Get your Pinterest boards |
| POST | /api/scheduler/auto | Auto-schedule all pins |
| POST | /api/scheduler/run-now | Force post now (for testing) |
| GET | /api/analytics/summary | Dashboard stats |

---

## 💡 TIPS FOR SUCCESS

1. **Start with Daraz affiliate** — easier approval for Pakistan users
2. **Approve 3-4 products max** — quality over quantity
3. **Check your pins before scheduling** — make sure images look good
4. **Best niches for Pakistan on Pinterest**: Home decor, fashion, food, fitness
5. **Post consistently** — 3 pins/day is better than 20 in one day

---

## 🛠️ TROUBLESHOOTING

**"Pinterest token expired"** → Generate a new token from developers.pinterest.com

**"Claude API error"** → Check your API key in .env; ensure you have credits

**"No products shortlisted"** → Run research manually via API or wait 6 hours

**Posts not going out** → Check server is running; verify Pinterest token is valid

---

## 🔧 Customization

Edit `services/researchService.js` to change:
- Number of products shortlisted (default: 6)
- Minimum trend score threshold (default: 60)
- Categories to focus on

Edit `services/schedulerService.js` to change:
- Post frequency (default: 3/day)
- Posting times (default: 9 AM, 2 PM, 7 PM)

---

## 📈 Expected Results (Realistic)

| Timeline | Expected Outcome |
|----------|-----------------|
| Week 1 | Setup complete, first pins posted |
| Week 2-4 | 50-200 impressions/day |
| Month 2 | First affiliate clicks |
| Month 3 | $5-50/month affiliate income |
| Month 6 | $50-200/month with optimized content |

Results depend on niche, content quality, and consistency.
