const fs = require("fs");
const path = require("path");
const { postPin } = require("./pinterestService");
const { updatePinStatus, getPins } = require("./contentService");

const SCHEDULE_DB = path.join(__dirname, "../data/schedule.json");

function loadSchedule() {
  if (!fs.existsSync(SCHEDULE_DB)) return { queue: [] };
  return JSON.parse(fs.readFileSync(SCHEDULE_DB, "utf8"));
}

function saveSchedule(data) {
  fs.mkdirSync(path.dirname(SCHEDULE_DB), { recursive: true });
  fs.writeFileSync(SCHEDULE_DB, JSON.stringify(data, null, 2));
}

// ─── Schedule a pin ───────────────────────────────────────────────────────────

function schedulePin(pin, scheduledTime, boardId) {
  const db = loadSchedule();
  const entry = {
    id: Date.now(),
    pinId: pin.id,
    boardId: boardId || process.env.PINTEREST_BOARD_ID,
    title: pin.title,
    description: pin.description,
    hashtags: pin.hashtags,
    imageUrl: pin.imageUrl || null,
    affiliateLink: pin.affiliateLink || "",
    scheduledTime,
    status: "queued",
    createdAt: new Date().toISOString(),
  };
  db.queue.push(entry);
  saveSchedule(db);
  return entry;
}

// ─── Auto-schedule approved pins across the week ──────────────────────────────

function autoScheduleWeek(pins) {
  const postTimes = (process.env.POST_TIMES || "09:00,14:00,19:00").split(",");
  const days = 7;
  const db = loadSchedule();

  // Clear old queued (not posted) entries
  db.queue = db.queue.filter((e) => e.status === "posted");

  const now = new Date();
  let slotIndex = 0;

  const scheduled = [];

  for (const pin of pins) {
    const dayOffset = Math.floor(slotIndex / postTimes.length);
    const timeSlot = postTimes[slotIndex % postTimes.length];

    if (dayOffset >= days) break;

    const [h, m] = timeSlot.split(":").map(Number);
    const scheduledDate = new Date(now);
    scheduledDate.setDate(now.getDate() + dayOffset);
    scheduledDate.setHours(h, m, 0, 0);

    const entry = {
      id: Date.now() + slotIndex,
      pinId: pin.id,
      boardId: process.env.PINTEREST_BOARD_ID || "default",
      title: pin.title,
      description: `${pin.description}\n\n${(pin.hashtags || []).map((h) => "#" + h).join(" ")}`,
      imageUrl: pin.imageUrl || null,
      affiliateLink: pin.affiliateLink || "",
      scheduledTime: scheduledDate.toISOString(),
      status: "queued",
      createdAt: new Date().toISOString(),
    };

    db.queue.push(entry);
    scheduled.push(entry);
    slotIndex++;
  }

  saveSchedule(db);
  console.log(`[Scheduler] Scheduled ${scheduled.length} pins across ${days} days.`);
  return scheduled;
}

// ─── Run scheduled posts (called by cron every 30 min) ───────────────────────

async function runScheduledPosts() {
  const db = loadSchedule();
  const now = new Date();

  const due = db.queue.filter((e) => {
    if (e.status !== "queued") return false;
    const scheduledTime = new Date(e.scheduledTime);
    return scheduledTime <= now;
  });

  if (due.length === 0) {
    console.log("[Scheduler] No pins due right now.");
    return { posted: 0 };
  }

  console.log(`[Scheduler] ${due.length} pins due — posting now...`);
  let posted = 0;

  for (const entry of due) {
    try {
      const result = await postPin({
        boardId: entry.boardId,
        title: entry.title,
        description: entry.description,
        link: entry.affiliateLink,
        imageUrl: entry.imageUrl,
        altText: entry.title,
      });

      // Mark as posted in schedule DB
      const idx = db.queue.findIndex((e) => e.id === entry.id);
      if (idx !== -1) {
        db.queue[idx].status = "posted";
        db.queue[idx].postedAt = new Date().toISOString();
        db.queue[idx].pinterestPinId = result.id;
      }

      // Mark pin as posted in pins DB
      updatePinStatus(entry.pinId, "posted", {
        postedAt: new Date().toISOString(),
        pinterestPinId: result.id,
      });

      posted++;
      console.log(`[Scheduler] Posted: "${entry.title}"`);

      // Delay between posts to be safe
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`[Scheduler] Failed to post "${entry.title}":`, err.message);
      const idx = db.queue.findIndex((e) => e.id === entry.id);
      if (idx !== -1) db.queue[idx].status = "failed";
    }
  }

  saveSchedule(db);
  return { posted, failed: due.length - posted };
}

function getSchedule() {
  return loadSchedule();
}

function deleteScheduledPin(id) {
  const db = loadSchedule();
  db.queue = db.queue.filter((e) => e.id !== id);
  saveSchedule(db);
}

module.exports = { schedulePin, autoScheduleWeek, runScheduledPosts, getSchedule, deleteScheduledPin };
