/* ============================================================
   PinAutoFlow — Frontend Application
   Connects to backend at http://localhost:3001
   ============================================================ */

const API = 'http://localhost:3001/api';

// ── State ─────────────────────────────────────────────────────
const state = {
  page: 'dashboard',
  products: [],
  pins: [],
  schedule: [],
  research: { running: false, progress: 0, steps: [] },
  generating: false,
  pinterestConnected: false,
};

// ── API helpers ───────────────────────────────────────────────
async function api(path, method = 'GET', body = null) {
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API + path, opts);
    return await res.json();
  } catch (e) {
    // Backend not running — return mock data
    return null;
  }
}

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.getElementById('toast') || (() => {
    const t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
    return t;
  })();
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '◆';
  const item = document.createElement('div');
  item.className = `toast-item ${type}`;
  item.innerHTML = `<span style="color:${type==='success'?'#6adba6':type==='error'?'#f08080':'#c9a84c'};font-weight:600">${icon}</span> ${msg}`;
  el.appendChild(item);
  setTimeout(() => item.remove(), 3500);
}

// ── Navigation ────────────────────────────────────────────────
function navigate(page) {
  state.page = page;
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });
  renderPage(page);
}

function renderPage(page) {
  const main = document.getElementById('main');
  const pages = {
    dashboard: renderDashboard,
    research:  renderResearch,
    products:  renderProducts,
    content:   renderContent,
    schedule:  renderSchedule,
    analytics: renderAnalytics,
    affiliate: renderAffiliate,
    settings:  renderSettings,
  };
  main.innerHTML = `<div class="page-enter">${(pages[page] || renderDashboard)()}</div>`;
  afterRender(page);
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────
function renderDashboard() {
  return `
  <div style="padding:32px 32px 0">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px">
      <div>
        <div style="font-family:var(--font-display);font-size:28px;font-weight:600;color:var(--cream);line-height:1.2">
          Good morning ✦
        </div>
        <div style="font-size:13px;color:var(--cream-muted);margin-top:6px">
          Your automation is running. Here's what's happening today.
        </div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost btn-sm" onclick="refreshDashboard()">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8a6 6 0 0112 0M2 8l2-2M2 8l-2-2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Refresh
        </button>
        <button class="btn btn-gold btn-sm" onclick="navigate('research')">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v6l4 2" stroke-linecap="round"/><circle cx="8" cy="8" r="6"/></svg>
          Run Research
        </button>
      </div>
    </div>
  </div>

  <div class="content-area">
    <!-- Stats -->
    <div class="stats-grid mb-24">
      ${statCard('47', 'Pins Posted', '↑ 12 this week', 'up', '📌', 'var(--gold)')}
      ${statCard('2.1K', 'Impressions', '↑ 34% vs last week', 'up', '👁', 'var(--accent-blue)')}
      ${statCard('89', 'Saves Today', '↑ 22 from yesterday', 'up', '🔖', 'var(--accent-green)')}
      ${statCard('$0', 'Earnings', 'Add affiliate links', 'neutral', '💰', 'var(--accent-amber)')}
    </div>

    <div class="grid-2 mb-18">
      <!-- Automation status -->
      <div class="card">
        <div class="card-title">Automation Status</div>
        <div class="card-subtitle">Live pipeline health</div>
        <div class="step-list">
          ${statusRow('🔍', 'Market Scanner', 'Runs every 6 hours — last: 2h ago', 'done')}
          ${statusRow('🤖', 'Content Engine', '4 pins queued and ready', 'done')}
          ${statusRow('📅', 'Auto Scheduler', 'Next post: today at 9:00 AM', 'done')}
          ${statusRow('📊', 'Analytics Sync', 'Last synced 4 minutes ago', 'done')}
        </div>
      </div>

      <!-- Top products -->
      <div class="card">
        <div class="card-title">Trending Products</div>
        <div class="card-subtitle">Shortlisted this scan · sorted by score</div>
        ${trendRow('🪔', 'Minimalist LED Desk Lamp', 'Home & Office', 91, '+47%')}
        ${trendRow('🥤', 'Portable Blender Bottle', 'Fitness & Kitchen', 88, '+61%')}
        ${trendRow('🧲', 'Magnetic Car Phone Mount', 'Automotive', 85, '+38%')}
        ${trendRow('🍃', 'Reusable Beeswax Wraps', 'Eco Home', 79, '+52%')}
      </div>
    </div>

    <!-- Upcoming pins -->
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div>
          <div class="card-title">Scheduled This Week</div>
          <div class="card-subtitle">Auto-posting on your behalf</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="navigate('schedule')">View all →</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
        ${miniPinCard('🪔', '#2a2210', 'Transform Your Workspace ✨', 'Mon · 9:00 AM', 'Home & Living')}
        ${miniPinCard('🥤', '#0f2215', 'Morning Routine Upgrade 🌿', 'Mon · 7:00 PM', 'Fitness Goals')}
        ${miniPinCard('🧲', '#0d1a2a', 'Never Miss Your Phone 📱', 'Wed · 9:00 AM', 'Tech & Gadgets')}
        ${miniPinCard('🍃', '#0f2215', 'Go Plastic Free 🌍', 'Thu · 12:00 PM', 'Eco Living')}
      </div>
    </div>
  </div>`;
}

function statCard(value, label, change, trend, icon, accent) {
  return `<div class="stat-card">
    <div class="stat-card-accent" style="background:${accent}"></div>
    <div class="stat-icon" style="background:${accent}18;margin-left:10px">${icon}</div>
    <div style="padding-left:10px">
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
      <div class="stat-change ${trend}">${change}</div>
    </div>
  </div>`;
}

function statusRow(icon, title, sub, status) {
  return `<div class="data-row">
    <div class="step-bubble done">${icon}</div>
    <div style="flex:1"><div class="row-title">${title}</div><div class="row-sub">${sub}</div></div>
    <span class="badge badge-green">Active</span>
  </div>`;
}

function trendRow(emoji, name, cat, score, growth) {
  return `<div class="data-row">
    <div class="row-emoji">${emoji}</div>
    <div style="flex:1">
      <div class="row-title">${name}</div>
      <div class="row-sub">${cat}</div>
    </div>
    <div style="width:80px">
      <div class="score-bar"><div class="score-fill" style="width:${score}%"></div></div>
      <div style="font-size:11px;color:var(--gold-light);text-align:right;margin-top:3px">${growth}</div>
    </div>
  </div>`;
}

function miniPinCard(emoji, bg, title, time, board) {
  return `<div style="background:${bg};border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;cursor:pointer" onclick="navigate('schedule')">
    <div style="height:70px;display:flex;align-items:center;justify-content:center;font-size:36px">${emoji}</div>
    <div style="padding:10px 12px">
      <div style="font-size:12px;font-weight:500;color:var(--cream);margin-bottom:4px;line-height:1.3">${title}</div>
      <div style="font-size:10px;color:var(--cream-muted)">${board}</div>
      <div style="margin-top:6px;font-family:var(--font-mono);font-size:10px;color:var(--gold)">${time}</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────
// RESEARCH
// ─────────────────────────────────────────────────────────────
const RESEARCH_STEPS = [
  'Scanning Google Trends data',
  'Analyzing Pinterest viral content',
  'Checking Amazon bestseller ranks',
  'Evaluating profit margins',
  'Scoring products with AI',
  'Generating final shortlist',
];

let researchInterval = null;

function renderResearch() {
  const r = state.research;
  return `
  <div style="padding:32px 32px 0">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px">
      <div>
        <div style="font-family:var(--font-display);font-size:28px;font-weight:600;color:var(--cream)">Market Research</div>
        <div style="font-size:13px;color:var(--cream-muted);margin-top:6px">AI scans the web and shortlists winning products automatically</div>
      </div>
      <button class="btn btn-gold" id="research-btn" onclick="startResearch()">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px"><circle cx="6.5" cy="6.5" r="4"/><path d="M14 14l-3-3" stroke-linecap="round"/></svg>
        Run Research Scan
      </button>
    </div>
  </div>
  <div class="content-area">
    <div class="grid-2 mb-18">
      <!-- Sources scanned -->
      <div class="card">
        <div class="card-title">Data Sources</div>
        <div class="card-subtitle">Scanned every 6 hours automatically</div>
        ${sourceRow('📈', 'Google Trends', 'Real-time search volume data', true)}
        ${sourceRow('📌', 'Pinterest Trends', 'Viral pins & rising searches', true)}
        ${sourceRow('🛒', 'AliExpress', 'Pricing & supplier availability', true)}
        ${sourceRow('⭐', 'Amazon BSR', 'Bestseller rankings live', true)}
      </div>
      <!-- Scoring criteria -->
      <div class="card">
        <div class="card-title">Scoring Criteria</div>
        <div class="card-subtitle">How Claude ranks each product</div>
        ${criteriaRow('Trend Momentum', 'Search growth over 30 days', 30)}
        ${criteriaRow('Profit Margin', 'Estimated earnings per unit', 25)}
        ${criteriaRow('Visual Appeal', 'Pinterest-friendliness score', 20)}
        ${criteriaRow('Competition', 'Lower = better opportunity', 15)}
        ${criteriaRow('Availability', 'Ease of sourcing product', 10)}
      </div>
    </div>

    <!-- Progress + Output -->
    <div class="card" id="research-output">
      <div class="card-title">Research Output</div>
      <div class="card-subtitle">Run a scan to see shortlisted products</div>
      <div id="research-progress" style="display:none">
        <div class="progress-track"><div class="progress-fill" id="res-bar" style="width:0%"></div></div>
        <div class="step-list" id="steps-list">
          ${RESEARCH_STEPS.map((s,i) => `
          <div class="data-row" id="step-${i}">
            <div class="step-bubble pending" id="step-bubble-${i}">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" style="width:12px"><circle cx="7" cy="7" r="5"/></svg>
            </div>
            <div style="flex:1"><div class="row-title" style="color:var(--cream-muted)">${s}</div></div>
            <span id="step-badge-${i}" class="badge badge-muted">Pending</span>
          </div>`).join('')}
        </div>
      </div>
      <div id="research-idle" style="text-align:center;padding:40px 0">
        <div style="font-size:48px;margin-bottom:16px">🔍</div>
        <div style="font-family:var(--font-display);font-size:18px;color:var(--cream);margin-bottom:8px">Ready to scan</div>
        <div style="font-size:13px;color:var(--cream-muted);margin-bottom:24px">Click "Run Research Scan" to find today's best products</div>
        <button class="btn btn-gold" onclick="startResearch()">Start scan now</button>
      </div>
      <div id="research-done" style="display:none">
        <div class="ai-box" id="ai-report"></div>
        <div style="margin-top:16px;display:flex;gap:10px">
          <button class="btn btn-gold" onclick="navigate('products')">Review products →</button>
          <button class="btn btn-ghost" onclick="startResearch()">Scan again</button>
        </div>
      </div>
    </div>
  </div>`;
}

function sourceRow(icon, name, desc, ok) {
  return `<div class="data-row">
    <div style="font-size:22px;width:28px;text-align:center">${icon}</div>
    <div style="flex:1"><div class="row-title">${name}</div><div class="row-sub">${desc}</div></div>
    <span class="badge ${ok ? 'badge-green' : 'badge-muted'}">${ok ? 'Active' : 'Setup needed'}</span>
  </div>`;
}

function criteriaRow(name, desc, weight) {
  return `<div class="data-row">
    <div style="flex:1"><div class="row-title">${name}</div><div class="row-sub">${desc}</div></div>
    <div style="text-align:right;min-width:40px">
      <div style="font-family:var(--font-mono);font-size:12px;color:var(--gold-light)">${weight}%</div>
    </div>
  </div>`;
}

function startResearch() {
  const btn = document.getElementById('research-btn');
  if (btn) btn.disabled = true;
  document.getElementById('research-idle').style.display = 'none';
  document.getElementById('research-done').style.display = 'none';
  document.getElementById('research-progress').style.display = 'block';

  // Call backend (runs in background, we simulate progress)
  api('/research/run', 'POST');
  toast('Research scan started — AI is scanning trends', 'info');

  let step = 0, progress = 0;
  const interval = setInterval(() => {
    progress = Math.min(progress + 3, 100);
    const bar = document.getElementById('res-bar');
    if (bar) bar.style.width = progress + '%';

    const newStep = Math.floor((progress / 100) * RESEARCH_STEPS.length);
    if (newStep > step && step < RESEARCH_STEPS.length) {
      // Mark previous step done
      if (step > 0) {
        const prev = document.getElementById(`step-bubble-${step - 1}`);
        const prevBadge = document.getElementById(`step-badge-${step - 1}`);
        if (prev) { prev.className = 'step-bubble done'; prev.innerHTML = '✓'; }
        if (prevBadge) { prevBadge.className = 'badge badge-green'; prevBadge.textContent = 'Done'; }
      }
      // Activate current
      const cur = document.getElementById(`step-bubble-${step}`);
      const curBadge = document.getElementById(`step-badge-${step}`);
      if (cur) { cur.className = 'step-bubble active'; cur.innerHTML = '⟳'; }
      if (curBadge) { curBadge.className = 'badge badge-gold'; curBadge.textContent = 'Running'; }
      const row = document.getElementById(`step-${step}`);
      if (row) row.querySelector('.row-title').style.color = 'var(--cream)';
      step = newStep;
    }

    if (progress >= 100) {
      clearInterval(interval);
      // Mark last step done
      for (let i = 0; i < RESEARCH_STEPS.length; i++) {
        const b = document.getElementById(`step-bubble-${i}`);
        const badge = document.getElementById(`step-badge-${i}`);
        if (b) { b.className = 'step-bubble done'; b.innerHTML = '✓'; }
        if (badge) { badge.className = 'badge badge-green'; badge.textContent = 'Done'; }
      }
      showResearchReport();
    }
  }, 120);
}

const REPORT = `◆ MARKET RESEARCH COMPLETE

🔥  TOP OPPORTUNITY
    Minimalist LED Desk Lamp · Score: 91/100
    Pinterest searches up +47% this month
    Estimated margin: $18–32 per unit

📈  TRENDING NICHES
    • Home Office Accessories  (+47%)
    • Portable Fitness Gear    (+61%)
    • Eco-Friendly Products    (+52%)
    • Car Accessories          (+38%)

✅  6 PRODUCTS SHORTLISTED
    All scored for visual appeal, profit margin,
    Pinterest audience fit & sourcing ease.

⚡  NEXT STEP
    Review & approve products on the Products tab.
    Claude will then generate your pin content.`;

function showResearchReport() {
  document.getElementById('research-progress').style.display = 'none';
  document.getElementById('research-done').style.display = 'block';
  const box = document.getElementById('ai-report');
  let i = 0;
  const t = setInterval(() => {
    if (!box) { clearInterval(t); return; }
    box.textContent = REPORT.slice(0, i);
    i += 4;
    if (i > REPORT.length) { clearInterval(t); box.textContent = REPORT; toast('Research complete! 6 products shortlisted.', 'success'); }
  }, 18);
}

// ─────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────
const MOCK_PRODUCTS = [
  { id:1, name:'Minimalist LED Desk Lamp', cat:'Home & Office', emoji:'🪔', score:91, growth:'+47%', margin:'$18–32', price:'$24–45', bg:'#2a2210', tags:['trending','high-margin','evergreen'], approved:null },
  { id:2, name:'Portable Blender Bottle', cat:'Kitchen & Fitness', emoji:'🥤', score:88, growth:'+61%', margin:'$12–22', price:'$18–35', bg:'#0f2215', tags:['viral','fitness-niche','gifting'], approved:null },
  { id:3, name:'Magnetic Car Phone Mount', cat:'Automotive', emoji:'🧲', score:85, growth:'+38%', margin:'$8–16', price:'$12–22', bg:'#0d1a2a', tags:['high-demand','repeat-buy','practical'], approved:null },
  { id:4, name:'Silicone Cable Organizer', cat:'Accessories', emoji:'🔌', score:82, growth:'+29%', margin:'$6–12', price:'$9–18', bg:'#1a1228', tags:['cheap-source','bundle-item','desk'], approved:null },
  { id:5, name:'Reusable Beeswax Wraps', cat:'Eco Home', emoji:'🍃', score:79, growth:'+52%', margin:'$10–20', price:'$15–28', bg:'#0f2215', tags:['eco-niche','gifting','kitchen'], approved:null },
  { id:6, name:'Foldable Travel Yoga Mat', cat:'Fitness', emoji:'🧘', score:77, growth:'+44%', margin:'$14–28', price:'$22–40', bg:'#2a100f', tags:['seasonal','high-visual','fitness'], approved:null },
];

if (!state.products.length) state.products = MOCK_PRODUCTS.map(p => ({...p}));

function renderProducts() {
  const approved = state.products.filter(p => p.approved === true).length;
  return `
  <div style="padding:32px 32px 0">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px">
      <div>
        <div style="font-family:var(--font-display);font-size:28px;font-weight:600;color:var(--cream)">My Products</div>
        <div style="font-size:13px;color:var(--cream-muted);margin-top:6px">Review shortlisted products — approve or skip each one</div>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        ${approved > 0 ? `<span class="badge badge-green">✓ ${approved} approved</span>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="approveAll()">Approve All</button>
        <button class="btn btn-gold ${approved === 0 ? 'btn-disabled' : ''}" onclick="navigate('content')" ${approved===0?'disabled':''}>
          Generate Content →
        </button>
      </div>
    </div>
  </div>
  <div class="content-area">
    <div class="products-grid">
      ${state.products.map(p => productCard(p)).join('')}
    </div>
  </div>`;
}

function productCard(p) {
  const cls = p.approved === true ? 'approved' : p.approved === false ? 'rejected' : '';
  return `<div class="product-card ${cls}" id="pcard-${p.id}">
    <div class="product-hero" style="background:${p.bg}">
      ${p.emoji}
      ${p.approved === true ? '<div style="position:absolute;top:10px;right:10px;z-index:2;background:rgba(76,175,130,0.2);border:1px solid rgba(76,175,130,0.4);border-radius:20px;padding:3px 9px;font-size:11px;color:#6adba6">✓ Approved</div>' : ''}
      ${p.approved === false ? '<div style="position:absolute;top:10px;right:10px;z-index:2;background:rgba(224,92,92,0.2);border:1px solid rgba(224,92,92,0.3);border-radius:20px;padding:3px 9px;font-size:11px;color:#f08080">✕ Skipped</div>' : ''}
    </div>
    <div class="product-body">
      <div class="product-name">${p.name}</div>
      <div class="product-cat">${p.cat}</div>
      <div class="product-metrics">
        <div><div class="metric-val">${p.score}/100</div><div class="metric-label">Trend score</div></div>
        <div><div class="metric-val">${p.growth}</div><div class="metric-label">Growth</div></div>
        <div><div class="metric-val">${p.margin}</div><div class="metric-label">Margin</div></div>
      </div>
      <div class="score-bar"><div class="score-fill" style="width:${p.score}%"></div></div>
      <div class="product-tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <div class="product-actions">
        <button class="btn btn-sm ${p.approved===true?'btn-gold':''}" style="flex:1;justify-content:center" onclick="approveProduct(${p.id}, true)">
          ✓ ${p.approved===true ? 'Approved' : 'Approve'}
        </button>
        <button class="btn btn-sm ${p.approved===false?'btn-danger':''}" style="flex:1;justify-content:center" onclick="approveProduct(${p.id}, false)">
          ✕ Skip
        </button>
      </div>
    </div>
  </div>`;
}

function approveProduct(id, approved) {
  state.products = state.products.map(p => p.id === id ? {...p, approved} : p);
  api(`/research/approve/${id}`, 'POST', { approved });
  renderPage('products');
  toast(approved ? 'Product approved!' : 'Product skipped', approved ? 'success' : 'info');
}

function approveAll() {
  state.products = state.products.map(p => ({...p, approved: true}));
  state.products.forEach(p => api(`/research/approve/${p.id}`, 'POST', { approved: true }));
  renderPage('products');
  toast('All products approved!', 'success');
}

// ─────────────────────────────────────────────────────────────
// CONTENT STUDIO
// ─────────────────────────────────────────────────────────────
const MOCK_PINS = [
  { id:1, emoji:'🪔', bg:'#2a2210', title:'Transform Your Workspace ✨', desc:'The lamp that changes everything. Soft warm light for deep focus sessions.', tags:['HomeDecor','WorkFromHome','DeskSetup','Aesthetic','StudyVibes'], board:'Home & Living', status:'scheduled', time:'Mon · 9:00 AM' },
  { id:2, emoji:'🥤', bg:'#0f2215', title:'Morning Routine Upgrade 🌿', desc:'Blend fresh smoothies anywhere. Your gym, office, car — anywhere you go.', tags:['FitnessLife','HealthyLiving','MorningRoutine','Smoothie','WellnessGoals'], board:'Fitness Goals', status:'posted', time:'Yesterday' },
  { id:3, emoji:'🧲', bg:'#0d1a2a', title:'Never Lose Your Phone Again 📱', desc:'One-tap magnetic mount. Keep eyes on the road, hands on the wheel.', tags:['CarGadgets','TechLife','CarAccessories','DriveSafe','MustHave'], board:'Tech & Gadgets', status:'scheduled', time:'Wed · 9:00 AM' },
  { id:4, emoji:'🍃', bg:'#0f2215', title:'Say Goodbye to Plastic Wrap 🌍', desc:'Reusable beeswax wraps that actually work. Save money, save the planet.', tags:['EcoLiving','Sustainable','ZeroWaste','GreenLiving','Kitchen'], board:'Eco Living', status:'draft', time:'—' },
  { id:5, emoji:'🔌', bg:'#1a1228', title:'Cable Chaos? Not Anymore ⚡', desc:'Finally, a desk that looks like it belongs in a magazine.', tags:['DeskSetup','CableManagement','HomeOffice','Organized','Productivity'], board:'Home Office', status:'draft', time:'—' },
  { id:6, emoji:'🧘', bg:'#2a100f', title:'Roll Out Anywhere 🧘', desc:'This foldable yoga mat fits in your bag. No more excuses.', tags:['Yoga','FitnessLife','WorkoutMotivation','FlexibleFitness','ActiveLife'], board:'Fitness Goals', status:'draft', time:'—' },
];

if (!state.pins.length) state.pins = MOCK_PINS.map(p => ({...p}));

function renderContent() {
  const approved = state.products.filter(p => p.approved === true).length;
  return `
  <div style="padding:32px 32px 0">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px">
      <div>
        <div style="font-family:var(--font-display);font-size:28px;font-weight:600;color:var(--cream)">Content Studio</div>
        <div style="font-size:13px;color:var(--cream-muted);margin-top:6px">AI generates Pinterest pin content for your approved products</div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost btn-sm" onclick="navigate('products')">← Products</button>
        <button class="btn btn-gold" id="gen-btn" onclick="generateContent()">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px"><path d="M8 1l1.8 4.2L14 7l-4.2 1.8L8 13l-1.8-4.2L2 7l4.2-1.8z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Generate All Pins
        </button>
      </div>
    </div>
  </div>
  <div class="content-area">
    <!-- Strategy strip -->
    <div class="card mb-18" style="background:linear-gradient(135deg,var(--bg-card),#1a1620)">
      <div style="display:flex;gap:28px;align-items:center">
        <div style="text-align:center;min-width:60px">
          <div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--cream)">${state.pins.length}</div>
          <div style="font-size:11px;color:var(--cream-muted)">Pins ready</div>
        </div>
        <div style="width:1px;height:40px;background:var(--border)"></div>
        <div style="text-align:center;min-width:60px">
          <div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--cream)">3</div>
          <div style="font-size:11px;color:var(--cream-muted)">Boards</div>
        </div>
        <div style="width:1px;height:40px;background:var(--border)"></div>
        <div style="text-align:center;min-width:60px">
          <div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--cream)">15</div>
          <div style="font-size:11px;color:var(--cream-muted)">Hashtags/pin</div>
        </div>
        <div style="width:1px;height:40px;background:var(--border)"></div>
        <div style="flex:1;padding-left:8px">
          <div style="font-size:13px;font-weight:500;color:var(--cream);margin-bottom:3px">AI Strategy</div>
          <div style="font-size:12px;color:var(--cream-muted);line-height:1.5">Post at 9 AM & 7 PM for maximum reach. Mix lifestyle content with product shots. Vertical 2:3 ratio gets 60% more engagement.</div>
        </div>
        <button class="btn btn-gold btn-sm" onclick="navigate('schedule')">Auto-schedule →</button>
      </div>
    </div>

    <div id="content-generating" style="display:none" class="card mb-18" style="text-align:center;padding:40px">
      <div style="text-align:center;padding:30px">
        <div style="font-size:44px;margin-bottom:12px">🤖</div>
        <div style="font-family:var(--font-display);font-size:18px;color:var(--cream);margin-bottom:6px">Claude is writing your pins...</div>
        <div style="font-size:13px;color:var(--cream-muted);margin-bottom:20px">Crafting titles, descriptions, hashtags & strategy</div>
        <div class="progress-track" style="max-width:300px;margin:0 auto"><div class="progress-fill" style="width:65%"></div></div>
      </div>
    </div>

    <div class="pins-grid" id="pins-grid">
      ${state.pins.map(p => pinCard(p)).join('')}
    </div>
  </div>`;
}

function pinCard(p) {
  const statusColor = p.status === 'posted' ? 'badge-green' : p.status === 'scheduled' ? 'badge-blue' : 'badge-muted';
  return `<div class="pin-card">
    <div class="pin-hero" style="background:${p.bg}">
      ${p.emoji}
      <div class="pin-status-float"><span class="badge ${statusColor}">${p.status}</span></div>
    </div>
    <div class="pin-body">
      <div style="font-size:10px;color:var(--cream-muted);margin-bottom:6px">📋 ${p.board}</div>
      <div class="pin-title">${p.title}</div>
      <div class="pin-desc">${p.desc}</div>
      <div class="pin-hashtags">${p.tags.slice(0,4).map(t => `<span class="hashtag">#${t}</span>`).join(' ')}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--gold)">${p.time}</div>
      </div>
      <div class="pin-actions">
        <button class="btn btn-ghost btn-xs" style="flex:1;justify-content:center" onclick="editPin(${p.id})">Edit</button>
        <button class="btn btn-gold btn-xs" style="flex:1;justify-content:center" onclick="schedulePin(${p.id})">Schedule</button>
      </div>
    </div>
  </div>`;
}

function generateContent() {
  const approved = state.products.filter(p => p.approved === true).length;
  if (approved === 0) { toast('Please approve at least one product first', 'error'); return; }
  document.getElementById('content-generating').style.display = 'block';
  document.getElementById('pins-grid').style.opacity = '0.3';
  api('/content/generate', 'POST');
  toast('Claude is generating your pin content...', 'info');
  setTimeout(() => {
    document.getElementById('content-generating').style.display = 'none';
    document.getElementById('pins-grid').style.opacity = '1';
    toast('6 pins generated successfully!', 'success');
  }, 3000);
}

function editPin(id) { toast('Edit mode — update content before scheduling', 'info'); }
function schedulePin(id) {
  state.pins = state.pins.map(p => p.id === id ? {...p, status: 'scheduled'} : p);
  toast('Pin scheduled!', 'success');
  renderPage('content');
}

// ─────────────────────────────────────────────────────────────
// SCHEDULER
// ─────────────────────────────────────────────────────────────
function renderSchedule() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const pinnedDays = {Mon:['🪔','🥤'], Wed:['🧲'], Thu:['🍃'], Fri:['🪔'], Sat:['🥤']};
  return `
  <div style="padding:32px 32px 0">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px">
      <div>
        <div style="font-family:var(--font-display);font-size:28px;font-weight:600;color:var(--cream)">Scheduler</div>
        <div style="font-size:13px;color:var(--cream-muted);margin-top:6px">Automated posting calendar — pins go live on their own</div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost btn-sm" onclick="navigate('content')">← Content</button>
        <button class="btn btn-gold" onclick="autoScheduleAll()">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px"><path d="M14 8A6 6 0 112 8" stroke-linecap="round"/><path d="M14 8V4M14 8h-4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Auto-Schedule All
        </button>
      </div>
    </div>
  </div>
  <div class="content-area">
    <!-- Calendar -->
    <div class="card mb-18">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div>
          <div class="card-title">This Week</div>
          <div class="card-subtitle">6 pins scheduled · AI chose optimal times</div>
        </div>
        <div style="display:flex;gap:6px">
          ${['9:00 AM','2:00 PM','7:00 PM'].map(t => `<span class="badge badge-gold">${t}</span>`).join('')}
        </div>
      </div>
      <div class="calendar-grid">
        ${days.map((d, i) => {
          const today = i === 0;
          const pins = pinnedDays[d] || [];
          return `<div class="cal-day">
            <div class="cal-day-label ${today?'today':''}">${d}${today?' ●':''}</div>
            <div class="cal-slot ${pins.length ? 'has-pin' : ''} ${today?'today-slot':''}">
              ${pins.length ? pins.map((e,j) => `
                <div style="font-size:${pins.length>1?'16px':'22px'}">${e}</div>
                ${j===0&&pins.length>0?`<div class="cal-time">${['9:00','19:00'][j]||'9:00'}</div>`:''}
              `).join('') : `<div style="font-size:20px;color:var(--border-mid)">+</div>`}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Queue list -->
    <div class="card">
      <div class="card-title">Post Queue</div>
      <div class="card-subtitle">Upcoming scheduled posts — all automated</div>
      <div class="schedule-list">
        ${scheduleRow('🪔','Transform Your Workspace ✨','Home & Living','Mon 09:00 AM','scheduled')}
        ${scheduleRow('🥤','Morning Routine Upgrade 🌿','Fitness Goals','Mon 07:00 PM','scheduled')}
        ${scheduleRow('🧲','Never Lose Your Phone Again 📱','Tech & Gadgets','Wed 09:00 AM','scheduled')}
        ${scheduleRow('🍃','Say Goodbye to Plastic Wrap 🌍','Eco Living','Thu 12:00 PM','scheduled')}
        ${scheduleRow('🪔','Transform Your Workspace ✨','Home & Living','Fri 09:00 AM','scheduled')}
        ${scheduleRow('🥤','Morning Routine Upgrade 🌿','Fitness Goals','Sat 03:00 PM','scheduled')}
      </div>
    </div>
  </div>`;
}

function scheduleRow(emoji, title, board, time, status) {
  return `<div class="data-row">
    <div class="row-emoji">${emoji}</div>
    <div style="flex:1">
      <div class="row-title">${title}</div>
      <div class="row-sub">Board: ${board}</div>
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      <span class="time-chip">${time}</span>
      <span class="badge badge-blue">Queued</span>
      <button class="btn btn-ghost btn-xs" onclick="toast('Post removed from queue','info')">✕</button>
    </div>
  </div>`;
}

function autoScheduleAll() {
  api('/scheduler/auto', 'POST');
  toast('All pins auto-scheduled across the week!', 'success');
}

// ─────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────
function renderAnalytics() {
  const bars = [20,35,28,60,45,82,55,70,40,88,65,47,92,78];
  return `
  <div style="padding:32px 32px 0">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px">
      <div>
        <div style="font-family:var(--font-display);font-size:28px;font-weight:600;color:var(--cream)">Performance</div>
        <div style="font-size:13px;color:var(--cream-muted);margin-top:6px">Track clicks, saves & affiliate earnings</div>
      </div>
      <div style="display:flex;gap:10px">
        ${['7 days','30 days','All time'].map((l,i) => `<button class="btn ${i===0?'btn-gold':'btn-ghost'} btn-sm">${l}</button>`).join('')}
      </div>
    </div>
  </div>
  <div class="content-area">
    <div class="stats-grid mb-18">
      ${statCard('2,143','Total Impressions','↑ 34% this week','up','👁','var(--accent-blue)')}
      ${statCard('89','Link Clicks','↑ 12% vs last week','up','🖱','var(--accent-green)')}
      ${statCard('234','Pin Saves','↑ 67% this week','up','🔖','var(--gold)')}
      ${statCard('4.1%','Click Rate','Industry avg: 2%','up','📊','var(--accent-amber)')}
    </div>

    <div class="grid-2 mb-18">
      <!-- Impressions chart -->
      <div class="card">
        <div class="card-title">Daily Impressions</div>
        <div class="card-subtitle">Last 14 days</div>
        <div class="bar-chart" style="margin-top:16px">
          ${bars.map((h, i) => `<div class="bar-col">
            <div class="bar" style="height:${h}%;opacity:${i===bars.length-1?1:0.5+i*0.04}"></div>
            ${i % 3 === 0 ? `<div class="bar-label">${['M','T','W','T','F','S','S'][i%7]}</div>` : '<div class="bar-label"></div>'}
          </div>`).join('')}
        </div>
      </div>
      <!-- AI insights -->
      <div class="card">
        <div class="card-title">AI Weekly Insights</div>
        <div class="card-subtitle">Auto-generated by Claude</div>
        <div class="ai-box" style="margin-top:4px">✅ LED Lamp is your star performer.
   Post 2× more of this next week.

⚡ Best window: 9 AM Mon–Wed
   Your audience peaks in mornings.

📈 Eco niche growing fast (+52%)
   Add more sustainable products.

💡 Only 2/6 pins have affiliate links
   Add links to unlock earnings.</div>
      </div>
    </div>

    <!-- Top pins -->
    <div class="card">
      <div class="card-title">Top Performing Pins</div>
      <div class="card-subtitle">Ranked by saves + clicks</div>
      ${[
        ['🪔','Transform Your Workspace ✨','Home & Living',87,34,'badge-green'],
        ['🥤','Morning Routine Upgrade 🌿','Fitness Goals',63,28,'badge-gold'],
        ['🧲','Never Lose Your Phone Again 📱','Tech & Gadgets',45,19,'badge-blue'],
        ['🍃','Say Goodbye to Plastic Wrap 🌍','Eco Living',21,8,'badge-muted'],
      ].map(([e,t,b,saves,clicks,cls]) => `
      <div class="data-row">
        <div class="row-emoji">${e}</div>
        <div style="flex:1">
          <div class="row-title">${t}</div>
          <div class="row-sub">Board: ${b}</div>
        </div>
        <div style="display:flex;align-items:center;gap:20px;margin-right:8px">
          <div style="text-align:center">
            <div style="font-family:var(--font-mono);font-size:16px;font-weight:500;color:var(--gold-light)">${saves}</div>
            <div style="font-size:10px;color:var(--cream-muted)">saves</div>
          </div>
          <div style="text-align:center">
            <div style="font-family:var(--font-mono);font-size:16px;font-weight:500;color:var(--cream)">${clicks}</div>
            <div style="font-size:10px;color:var(--cream-muted)">clicks</div>
          </div>
        </div>
        <span class="badge ${cls}">#${[1,2,3,4][[87,63,45,21].indexOf(saves)]}</span>
      </div>`).join('')}
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────
// GLOBAL AFFILIATE MANAGER
// ─────────────────────────────────────────────────────────────

const MARKETS = [
  { code:'US', flag:'🇺🇸', name:'Amazon US',        domain:'amazon.com',    currency:'$',   share:42, commission:'4–10%', priority:'⭐ #1 Priority', color:'#4caf82' },
  { code:'GB', flag:'🇬🇧', name:'Amazon UK',        domain:'amazon.co.uk',  currency:'£',   share:8,  commission:'5–10%', priority:'⭐ #2 Priority', color:'#5b8dee' },
  { code:'CA', flag:'🇨🇦', name:'Amazon Canada',    domain:'amazon.ca',     currency:'CA$', share:6,  commission:'4–8%',  priority:'#3',             color:'#5b8dee' },
  { code:'AU', flag:'🇦🇺', name:'Amazon Australia', domain:'amazon.com.au', currency:'A$',  share:4,  commission:'4–8%',  priority:'#4',             color:'#5b8dee' },
  { code:'DE', flag:'🇩🇪', name:'Amazon Germany',   domain:'amazon.de',     currency:'€',   share:4,  commission:'7–10%', priority:'#5 High rate',   color:'#e8a24a' },
  { code:'FR', flag:'🇫🇷', name:'Amazon France',    domain:'amazon.fr',     currency:'€',   share:3,  commission:'5–9%',  priority:'#6',             color:'#e8a24a' },
  { code:'IN', flag:'🇮🇳', name:'Amazon India',     domain:'amazon.in',     currency:'₹',   share:3,  commission:'4–8%',  priority:'#7 Growing',     color:'#e8a24a' },
  { code:'AE', flag:'🇦🇪', name:'Amazon UAE',       domain:'amazon.ae',     currency:'AED', share:1,  commission:'4–7%',  priority:'#8',             color:'#6b6454' },
  { code:'PK', flag:'🇵🇰', name:'Daraz Pakistan',   domain:'daraz.pk',      currency:'₨',   share:1,  commission:'5–7%',  priority:'Local market',   color:'#6b6454' },
];

// Earnings projections at different traffic levels
const PROJECTIONS = [
  { clicks:500,  label:'Beginner',    months:'Month 1–2',  earnings:'$8–25'   },
  { clicks:2000, label:'Growing',     months:'Month 3–4',  earnings:'$35–90'  },
  { clicks:5000, label:'Established', months:'Month 5–6',  earnings:'$90–220' },
  { clicks:15000,label:'Scaled',      months:'Month 7–12', earnings:'$270–650'},
];

function renderAffiliate() {
  return `
  <div style="padding:32px 32px 0">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px">
      <div>
        <div style="font-family:var(--font-display);font-size:28px;font-weight:600;color:var(--cream)">Global Affiliate Hub</div>
        <div style="font-size:13px;color:var(--cream-muted);margin-top:6px">One pin → auto-routes to the right Amazon marketplace for every visitor worldwide</div>
      </div>
      <button class="btn btn-gold" onclick="testSmartLink()">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zM4 8h8M8 4v8" stroke-linecap="round"/></svg>
        Test Smart Link
      </button>
    </div>
  </div>
  <div class="content-area">

    <!-- How it works banner -->
    <div class="card mb-24" style="background:linear-gradient(135deg,#0d1520,#131829);border-color:rgba(201,168,76,0.25)">
      <div style="display:flex;align-items:center;gap:32px">
        <div style="font-size:48px">🌍</div>
        <div style="flex:1">
          <div style="font-family:var(--font-display);font-size:18px;color:var(--cream);margin-bottom:8px">How Smart Link Routing Works</div>
          <div style="display:flex;align-items:center;gap:0;flex-wrap:wrap">
            ${['Visitor clicks your pin','IP detected instantly','Country identified','Routed to local Amazon','You earn commission'].map((s,i,arr) => `
              <div style="display:flex;align-items:center;gap:0">
                <div style="background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.25);border-radius:8px;padding:8px 12px;font-size:12px;color:var(--cream-dim)">${s}</div>
                ${i<arr.length-1?`<div style="font-size:16px;color:var(--gold-dim);padding:0 6px">→</div>`:''}
              </div>`).join('')}
          </div>
        </div>
        <div style="text-align:center;min-width:100px;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:14px">
          <div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--gold-light)">9</div>
          <div style="font-size:11px;color:var(--cream-muted)">Markets<br>supported</div>
        </div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="stats-grid mb-24">
      ${statCard('$0.00','Total Earned','Connect affiliate accounts','neutral','💵','var(--gold)')}
      ${statCard('0','Total Clicks','Start posting pins to get clicks','neutral','🖱','var(--accent-blue)')}
      ${statCard('9','Markets Active','Auto-routing to all countries','up','🌐','var(--accent-green)')}
      ${statCard('0%','Conversion Rate','Industry avg: 6%','neutral','📊','var(--accent-amber)')}
    </div>

    <!-- Markets grid -->
    <div class="card mb-24">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div>
          <div class="card-title">Supported Markets</div>
          <div class="card-subtitle">Set up affiliate tags for each — tool routes automatically</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <span style="font-size:11px;color:var(--cream-muted)">Pinterest audience:</span>
          <span class="badge badge-gold">42% from US</span>
          <span class="badge badge-blue">16% UK+CA</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        ${MARKETS.map(m => marketCard(m)).join('')}
      </div>
    </div>

    <div class="grid-2 mb-24">
      <!-- Earnings projections -->
      <div class="card">
        <div class="card-title">Earnings Projections</div>
        <div class="card-subtitle">Monthly estimates across all markets combined</div>
        <div style="margin-top:8px">
          ${PROJECTIONS.map((p,i) => `
          <div class="data-row">
            <div style="width:80px">
              <div style="font-size:10px;font-weight:600;letter-spacing:0.5px;color:var(--cream-muted);text-transform:uppercase">${p.label}</div>
              <div style="font-size:10px;color:var(--cream-muted)">${p.months}</div>
            </div>
            <div style="flex:1;padding:0 12px">
              <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden">
                <div style="height:100%;width:${[15,35,60,100][i]}%;background:linear-gradient(90deg,var(--gold-dim),var(--gold-light));border-radius:2px"></div>
              </div>
              <div style="font-size:10px;color:var(--cream-muted);margin-top:3px">${p.clicks.toLocaleString()} clicks/month</div>
            </div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:500;color:var(--gold-light);min-width:70px;text-align:right">${p.earnings}</div>
          </div>`).join('')}
        </div>
        <div style="margin-top:16px;padding:12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px">
          <div style="font-size:11px;color:var(--cream-muted);line-height:1.6">
            💡 <strong style="color:var(--cream)">Key insight:</strong> US visitors earn you 10× more than Pakistan visitors due to higher product prices and purchase rates. Always post in English targeting US/UK audiences.
          </div>
        </div>
      </div>

      <!-- Setup priority guide -->
      <div class="card">
        <div class="card-title">Setup Priority Guide</div>
        <div class="card-subtitle">Do these in order for maximum income</div>
        ${[
          ['1','Amazon US Associates','Covers 42% of Pinterest users. Highest earning potential.','amazon.com/associates','⭐ Do first','badge-green'],
          ['2','Amazon UK Associates','8% of audience, high purchase rates, £ commissions.','affiliate-program.amazon.co.uk','⭐ Do second','badge-green'],
          ['3','Genius Links','One universal link routes all countries. Saves setup time.','geni.us','⭐ Do third','badge-gold'],
          ['4','Amazon CA + AU','Combined 10% audience, easy to join after US account.','amazon.ca/associates','Optional','badge-muted'],
          ['5','Daraz Pakistan','Local market. Small income but easy approval.','affiliate.daraz.pk','Optional','badge-muted'],
        ].map(([n,name,desc,link,tag,bc]) => `
        <div class="data-row">
          <div style="width:22px;height:22px;border-radius:50%;background:var(--bg-elevated);border:1px solid var(--border-mid);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;color:var(--gold);flex-shrink:0">${n}</div>
          <div style="flex:1">
            <div class="row-title">${name}</div>
            <div class="row-sub">${desc}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
            <span class="badge ${bc}">${tag}</span>
            <button class="btn btn-ghost btn-xs" onclick="toast('Opening ${link}','info')">Join →</button>
          </div>
        </div>`).join('')}
      </div>
    </div>

    <!-- Smart link generator -->
    <div class="card">
      <div class="card-title">Smart Link Generator</div>
      <div class="card-subtitle">Generate a country-routing affiliate link for any product</div>
      <div style="display:flex;gap:10px;margin-top:4px;margin-bottom:16px">
        <input class="form-input" id="product-input" type="text" placeholder="e.g. Minimalist LED Desk Lamp" style="flex:1" />
        <input class="form-input" id="price-input" type="text" placeholder="Price e.g. $25" style="width:110px" />
        <button class="btn btn-gold" onclick="generateSmartLink()">Generate Link</button>
      </div>
      <div id="link-output" style="display:none">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="background:var(--bg-elevated);border:1px solid var(--border-mid);border-radius:10px;padding:14px">
            <div style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--gold);margin-bottom:8px">🔗 Smart Link (recommended)</div>
            <div id="smart-link-url" style="font-family:var(--font-mono);font-size:11px;color:var(--cream-dim);word-break:break-all;margin-bottom:10px"></div>
            <div style="font-size:11px;color:var(--cream-muted);margin-bottom:10px">Auto-routes each visitor to their local Amazon marketplace. Works for all 9 countries.</div>
            <button class="btn btn-gold btn-sm" onclick="copyLink('smart-link-url')">Copy link</button>
          </div>
          <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:10px;padding:14px">
            <div style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--cream-muted);margin-bottom:8px">Estimated earnings per 100 clicks</div>
            <div id="earnings-breakdown" style="display:flex;flex-direction:column;gap:6px"></div>
          </div>
        </div>
      </div>
    </div>

  </div>`;
}

function marketCard(m) {
  const isTop = m.share >= 8;
  return `<div style="background:var(--bg-elevated);border:1px solid ${isTop?'rgba(201,168,76,0.25)':'var(--border)'};border-radius:10px;padding:14px;transition:border-color 0.2s" onmouseover="this.style.borderColor='var(--border-mid)'" onmouseout="this.style.borderColor='${isTop?'rgba(201,168,76,0.25)':'var(--border)'}'">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:20px">${m.flag}</span>
        <div>
          <div style="font-size:12px;font-weight:500;color:var(--cream)">${m.name}</div>
          <div style="font-size:10px;color:var(--cream-muted)">${m.domain}</div>
        </div>
      </div>
      ${isTop?`<span class="badge badge-gold" style="font-size:9px">Top</span>`:''}
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
      <div><div style="font-size:10px;color:var(--cream-muted)">Pinterest audience</div><div style="font-family:var(--font-mono);font-size:13px;color:${m.color};margin-top:2px">${m.share}%</div></div>
      <div style="text-align:right"><div style="font-size:10px;color:var(--cream-muted)">Commission</div><div style="font-family:var(--font-mono);font-size:13px;color:var(--gold-light);margin-top:2px">${m.commission}</div></div>
    </div>
    <div style="height:3px;background:var(--border);border-radius:2px;overflow:hidden;margin-bottom:10px">
      <div style="height:100%;width:${Math.min(m.share*2.5,100)}%;background:${m.color};border-radius:2px;opacity:0.7"></div>
    </div>
    <div style="font-size:10px;color:var(--cream-muted)">${m.priority}</div>
  </div>`;
}

function generateSmartLink() {
  const product = document.getElementById('product-input').value.trim();
  const price = document.getElementById('price-input').value.replace(/[^0-9.]/g,'') || '25';
  if (!product) { toast('Enter a product name first', 'error'); return; }

  const base = 'http://localhost:3001';
  const smartLink = `${base}/api/affiliate/redirect?product=${encodeURIComponent(product)}&price=${price}`;

  document.getElementById('smart-link-url').textContent = smartLink;

  // Show per-country earnings breakdown
  const topMarkets = MARKETS.slice(0,5);
  const breakdownEl = document.getElementById('earnings-breakdown');
  breakdownEl.innerHTML = topMarkets.map(m => {
    const clicks = Math.round(100 * m.share / 100);
    const sales = Math.max(1, Math.round(clicks * 0.06));
    const rate = m.commission.split('–')[0].replace('%','') / 100;
    const earn = (sales * parseFloat(price) * rate).toFixed(2);
    return `<div style="display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:14px">${m.flag}</span>
        <span style="font-size:11px;color:var(--cream-dim)">${m.code} · ${m.share}% traffic</span>
      </div>
      <span style="font-family:var(--font-mono);font-size:12px;color:var(--gold-light)">${m.currency}${earn}</span>
    </div>`;
  }).join('');

  document.getElementById('link-output').style.display = 'block';
  toast('Smart link generated!', 'success');
}

function copyLink(id) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text).then(() => toast('Link copied to clipboard!', 'success'));
}

function testSmartLink() {
  toast('Smart link routes US visitors → amazon.com, UK → amazon.co.uk, PK → daraz.pk etc.', 'info');
}

function renderSettings() {
  return `
  <div style="padding:32px 32px 0">
    <div style="margin-bottom:32px">
      <div style="font-family:var(--font-display);font-size:28px;font-weight:600;color:var(--cream)">Settings</div>
      <div style="font-size:13px;color:var(--cream-muted);margin-top:6px">Connect your accounts and configure automation</div>
    </div>
  </div>
  <div class="content-area">
    <!-- API Keys -->
    <div class="card mb-18">
      <div class="card-title">API Connections</div>
      <div class="card-subtitle">Connect your accounts — the tool handles everything else</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px">
        ${connectCard('📌','Pinterest','Auto-post pins to your boards','Not Connected','red','developers.pinterest.com')}
        ${connectCard('🤖','Claude AI','Generates all content with AI','Not Connected','red','console.anthropic.com')}
        ${connectCard('🛒','Amazon Associates','Earn commissions on clicks','Not Connected','red','affiliate-program.amazon.com')}
        ${connectCard('🏪','Daraz Affiliate','Pakistan local affiliate network','Not Connected','red','affiliate.daraz.pk')}
      </div>
    </div>

    <div class="grid-2 mb-18">
      <!-- Research settings -->
      <div class="card">
        <div class="card-title">Research Automation</div>
        <div class="card-subtitle">How often to scan for trends</div>
        <div class="form-group">
          <label class="form-label">Scan Frequency</label>
          <select class="form-select">
            <option>Every 6 hours (recommended)</option>
            <option>Every 12 hours</option>
            <option>Once daily</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Products to shortlist</label>
          <select class="form-select">
            <option>6 products (recommended)</option>
            <option>10 products</option>
            <option>15 products</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Minimum trend score</label>
          <input class="form-input" type="text" value="60 / 100 minimum" />
        </div>
        <button class="btn btn-gold btn-sm" onclick="toast('Research settings saved','success')">Save settings</button>
      </div>

      <!-- Posting settings -->
      <div class="card">
        <div class="card-title">Posting Settings</div>
        <div class="card-subtitle">Auto-post configuration</div>
        <div class="form-group">
          <label class="form-label">Pins per day</label>
          <select class="form-select">
            <option>3 pins/day (Free plan)</option>
            <option>5 pins/day</option>
            <option>10 pins/day</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Posting times</label>
          <input class="form-input" type="text" value="9:00 AM, 2:00 PM, 7:00 PM" />
        </div>
        <div class="form-group">
          <label class="form-label">Default board</label>
          <input class="form-input" type="text" value="Home & Living" />
        </div>
        <button class="btn btn-gold btn-sm" onclick="toast('Posting settings saved','success')">Save settings</button>
      </div>
    </div>

    <!-- Setup guide -->
    <div class="card" style="background:linear-gradient(135deg,var(--bg-card),#1a1520)">
      <div class="card-title">Quick Setup Guide</div>
      <div class="card-subtitle">Get fully automated in 20 minutes</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:8px">
        ${setupStep(1,'Get Claude API Key','Free at console.anthropic.com','✓ Free')}
        ${setupStep(2,'Connect Pinterest','Create app at developers.pinterest.com','5 min')}
        ${setupStep(3,'Join Affiliate Program','Daraz or Amazon Associates','Free')}
        ${setupStep(4,'Start the server','Run node server.js in backend folder','1 min')}
      </div>
    </div>
  </div>`;
}

function connectCard(icon, name, desc, status, ok, link) {
  const connected = ok === 'green';
  return `<div class="connect-card">
    <div class="connect-icon" style="background:var(--bg-hover)">${icon}</div>
    <div class="connect-info">
      <div class="connect-name">${name}</div>
      <div class="connect-desc">${desc}</div>
    </div>
    <div class="connect-actions">
      <span class="badge ${connected?'badge-green':'badge-red'}">${status}</span>
      <button class="btn btn-ghost btn-sm" onclick="toast('Open ${link} to get your API key','info')">
        ${connected ? 'Manage' : 'Connect'}
      </button>
    </div>
  </div>`;
}

function setupStep(n, title, desc, tag) {
  return `<div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);padding:16px">
    <div style="font-family:var(--font-mono);font-size:11px;color:var(--gold);margin-bottom:8px">STEP ${n}</div>
    <div style="font-size:13px;font-weight:500;color:var(--cream);margin-bottom:4px;line-height:1.3">${title}</div>
    <div style="font-size:11px;color:var(--cream-muted);line-height:1.4;margin-bottom:10px">${desc}</div>
    <span class="badge badge-gold">${tag}</span>
  </div>`;
}

// ─────────────────────────────────────────────────────────────
// After render hooks
// ─────────────────────────────────────────────────────────────
function afterRender(page) {
  // Load live data from backend if available
  if (page === 'products') {
    api('/research/products').then(data => {
      if (data && data.products && data.products.length) {
        state.products = data.products;
        renderPage('products');
      }
    });
  }
  if (page === 'analytics') {
    api('/analytics/summary').then(data => {
      if (data && data.summary) console.log('[Analytics] Live data:', data.summary);
    });
  }
}

function refreshDashboard() {
  toast('Dashboard refreshed', 'success');
  renderPage('dashboard');
}

// ─────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  navigate('dashboard');

  // Check backend connectivity
  api('/health').then(data => {
    if (data && data.status === 'ok') {
      toast('Backend connected ✓', 'success');
    } else {
      toast('Backend offline — running in demo mode', 'info');
    }
  });
});
