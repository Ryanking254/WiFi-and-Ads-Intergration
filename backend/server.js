import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import { v4 as uuid } from "uuid";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const app = express();
const db = new Database(path.join(__dirname, "data/dsp.db"));

// Middleware
app.use(cors());
app.use(express.json());

// Simulated auth middleware (for demo - replace with real JWT in production)
const authMiddleware = (req, res, next) => {
  const advertiserId = req.headers["x-advertiser-id"];
  if (!advertiserId) {
    return res.status(401).json({ error: "Missing advertiser ID" });
  }
  req.advertiserId = advertiserId;
  next();
};

// ==================== AUTH ENDPOINTS ====================

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  try {
    const advertiser = db
      .prepare("SELECT * FROM advertisers WHERE email = ?")
      .get(email);

    if (!advertiser) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // In production: use bcrypt for password comparison
    // For demo: just return advertiser info
    res.json({
      id: advertiser.id,
      name: advertiser.name,
      email: advertiser.email,
      company: advertiser.company,
      daily_budget: advertiser.daily_budget,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, company } = req.body;

  try {
    const id = uuid();
    db.prepare(
      `
      INSERT INTO advertisers (id, name, email, password, company)
      VALUES (?, ?, ?, ?, ?)
    `,
    ).run(id, name, email, password, company);

    res.status(201).json({
      id,
      name,
      email,
      company,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== CAMPAIGN ENDPOINTS ====================

app.get("/api/campaigns", authMiddleware, (req, res) => {
  try {
    const campaigns = db
      .prepare(
        `
      SELECT c.*,
        COUNT(DISTINCT i.id) as total_impressions,
        COUNT(DISTINCT cl.id) as total_clicks
      FROM campaigns c
      LEFT JOIN impressions i ON c.id = i.campaign_id
      LEFT JOIN clicks cl ON c.id = cl.campaign_id
      WHERE c.advertiser_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `,
      )
      .all(req.advertiserId);

    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/campaigns/:id", authMiddleware, (req, res) => {
  try {
    const campaign = db
      .prepare(
        `
      SELECT c.*,
        COUNT(DISTINCT i.id) as total_impressions,
        COUNT(DISTINCT cl.id) as total_clicks
      FROM campaigns c
      LEFT JOIN impressions i ON c.id = i.campaign_id
      LEFT JOIN clicks cl ON c.id = cl.campaign_id
      WHERE c.id = ? AND c.advertiser_id = ?
      GROUP BY c.id
    `,
      )
      .get(req.params.id, req.advertiserId);

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/campaigns", authMiddleware, (req, res) => {
  const {
    name,
    description,
    budget,
    daily_budget,
    target_url,
    start_date,
    end_date,
  } = req.body;

  try {
    const id = uuid();
    db.prepare(
      `
      INSERT INTO campaigns
      (id, advertiser_id, name, description, budget, daily_budget, target_url, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      id,
      req.advertiserId,
      name,
      description,
      budget,
      daily_budget,
      target_url,
      start_date,
      end_date,
    );

    res.status(201).json({
      id,
      name,
      description,
      budget,
      daily_budget,
      target_url,
      status: "draft",
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/campaigns/:id", authMiddleware, (req, res) => {
  const { name, description, budget, daily_budget, status, target_url } =
    req.body;

  try {
    db.prepare(
      `
      UPDATE campaigns
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          budget = COALESCE(?, budget),
          daily_budget = COALESCE(?, daily_budget),
          status = COALESCE(?, status),
          target_url = COALESCE(?, target_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND advertiser_id = ?
    `,
    ).run(
      name,
      description,
      budget,
      daily_budget,
      status,
      target_url,
      req.params.id,
      req.advertiserId,
    );

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/campaigns/:id", authMiddleware, (req, res) => {
  try {
    db.prepare("DELETE FROM campaigns WHERE id = ? AND advertiser_id = ?").run(
      req.params.id,
      req.advertiserId,
    );

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== AD ENDPOINTS ====================

app.get("/api/campaigns/:campaignId/ads", authMiddleware, (req, res) => {
  try {
    const ads = db
      .prepare(
        `
      SELECT a.*,
        COUNT(DISTINCT i.id) as impressions,
        COUNT(DISTINCT cl.id) as clicks
      FROM ads a
      LEFT JOIN impressions i ON a.id = i.ad_id
      LEFT JOIN clicks cl ON a.id = cl.ad_id
      WHERE a.campaign_id = ?
      GROUP BY a.id
    `,
      )
      .all(req.params.campaignId);

    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/campaigns/:campaignId/ads", authMiddleware, (req, res) => {
  const {
    title,
    description,
    cta_text,
    cta_url,
    format,
    width,
    height,
    image_url,
  } = req.body;

  try {
    const id = uuid();
    db.prepare(
      `
      INSERT INTO ads
      (id, campaign_id, title, description, cta_text, cta_url, format, width, height, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      id,
      req.params.campaignId,
      title,
      description,
      cta_text,
      cta_url,
      format,
      width,
      height,
      image_url,
    );

    res.status(201).json({
      id,
      title,
      description,
      cta_text,
      cta_url,
      format,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/ads/:id", authMiddleware, (req, res) => {
  const { title, description, cta_text, cta_url, image_url, status } = req.body;

  try {
    db.prepare(
      `
      UPDATE ads
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          cta_text = COALESCE(?, cta_text),
          cta_url = COALESCE(?, cta_url),
          image_url = COALESCE(?, image_url),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    ).run(
      title,
      description,
      cta_text,
      cta_url,
      image_url,
      status,
      req.params.id,
    );

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== AD SERVING ====================

app.get("/api/serve-ad", (req, res) => {
  const { placement_id } = req.query;

  try {
    // Find active campaigns with active ads for this placement
    const ad = db
      .prepare(
        `
      SELECT a.*, c.id as campaign_id, p.id as placement_id, p.cpm
      FROM ads a
      JOIN campaigns c ON a.campaign_id = c.id
      JOIN placements p ON p.format = a.format AND p.id = ?
      WHERE c.status = 'active'
        AND a.status = 'active'
        AND c.spent < c.budget
      ORDER BY RANDOM()
      LIMIT 1
    `,
      )
      .get(placement_id);

    if (!ad) {
      return res.json({ error: "No ads available" });
    }

    // Record impression
    const impressionId = uuid();
    db.prepare(
      `
      INSERT INTO impressions (id, ad_id, campaign_id, placement_id, user_agent, ip_hash, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    ).run(
      impressionId,
      ad.id,
      ad.campaign_id,
      placement_id,
      req.headers["user-agent"] || "unknown",
      "ip_hash_" + Date.now(), // Simplified hash
    );

    // Update ad impression count
    db.prepare("UPDATE ads SET impressions = impressions + 1 WHERE id = ?").run(
      ad.id,
    );

    // Log budget spend (CPM basis: cost per 1000 impressions)
    const costPerImpression = ad.cpm / 1000;
    db.prepare(
      `
      UPDATE campaigns SET spent = spent + ? WHERE id = ?
    `,
    ).run(costPerImpression, ad.campaign_id);

    db.prepare(
      `
      INSERT INTO budget_logs (id, campaign_id, amount, type)
      VALUES (?, ?, ?, 'impression')
    `,
    ).run(uuid(), ad.campaign_id, costPerImpression);

    // Return ad data to display
    res.json({
      ad_id: ad.id,
      impression_id: impressionId,
      campaign_id: ad.campaign_id,
      title: ad.title,
      description: ad.description,
      image_url: ad.image_url,
      cta_text: ad.cta_text,
      cta_url: ad.cta_url,
      format: ad.format,
      width: ad.width,
      height: ad.height,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CLICK TRACKING ====================

app.post("/api/track-click", (req, res) => {
  const { ad_id, campaign_id, impression_id } = req.body;

  try {
    const clickId = uuid();
    db.prepare(
      `
      INSERT INTO clicks (id, ad_id, campaign_id, impression_id, timestamp)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    ).run(clickId, ad_id, campaign_id, impression_id);

    // Update ad click count
    db.prepare("UPDATE ads SET clicks = clicks + 1 WHERE id = ?").run(ad_id);

    // Log budget spend for click (cost per click model would go here)
    db.prepare(
      `
      INSERT INTO budget_logs (id, campaign_id, amount, type)
      VALUES (?, ?, 0, 'click')
    `,
    ).run(uuid(), campaign_id);

    res.json({ success: true, click_id: clickId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ANALYTICS ENDPOINTS ====================

app.get("/api/campaigns/:id/analytics", authMiddleware, (req, res) => {
  const { days = 7 } = req.query;
  const daysNum = parseInt(days);

  try {
    const campaign = db
      .prepare("SELECT * FROM campaigns WHERE id = ? AND advertiser_id = ?")
      .get(req.params.id, req.advertiserId);

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Total stats
    const stats = db
      .prepare(
        `
      SELECT
        COUNT(DISTINCT i.id) as impressions,
        COUNT(DISTINCT cl.id) as clicks,
        c.spent as spent,
        c.budget as budget,
        c.name as campaign_name
      FROM campaigns c
      LEFT JOIN impressions i ON c.id = i.campaign_id
        AND i.timestamp >= datetime('now', '-' || ? || ' days')
      LEFT JOIN clicks cl ON c.id = cl.campaign_id
        AND cl.timestamp >= datetime('now', '-' || ? || ' days')
      WHERE c.id = ?
      GROUP BY c.id
    `,
      )
      .get(daysNum, daysNum, req.params.id);

    // Daily breakdown
    const dailyStats = db
      .prepare(
        `
      SELECT
        DATE(i.timestamp) as date,
        COUNT(DISTINCT i.id) as impressions,
        COUNT(DISTINCT cl.id) as clicks
      FROM impressions i
      LEFT JOIN clicks cl ON i.id = cl.impression_id
      WHERE i.campaign_id = ?
        AND i.timestamp >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(i.timestamp)
      ORDER BY date DESC
    `,
      )
      .all(req.params.id, daysNum);

    // Ad performance
    const adPerformance = db
      .prepare(
        `
      SELECT
        a.id,
        a.title,
        COUNT(DISTINCT i.id) as impressions,
        COUNT(DISTINCT cl.id) as clicks
      FROM ads a
      LEFT JOIN impressions i ON a.id = i.ad_id
        AND i.timestamp >= datetime('now', '-' || ? || ' days')
      LEFT JOIN clicks cl ON a.id = cl.ad_id
        AND cl.timestamp >= datetime('now', '-' || ? || ' days')
      WHERE a.campaign_id = ?
      GROUP BY a.id
      ORDER BY impressions DESC
    `,
      )
      .all(daysNum, daysNum, req.params.id);

    // Calculate metrics
    const impressions = stats.impressions || 0;
    const clicks = stats.clicks || 0;
    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : 0;
    const cpc = clicks > 0 ? (stats.spent / clicks).toFixed(2) : 0;

    res.json({
      ...stats,
      impressions,
      clicks,
      ctr: parseFloat(ctr),
      cpc: parseFloat(cpc),
      daily_stats: dailyStats,
      ad_performance: adPerformance,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/placements", (req, res) => {
  try {
    const placements = db
      .prepare("SELECT * FROM placements ORDER BY name")
      .all();
    res.json(placements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/advertisers/:id", (req, res) => {
  try {
    const advertiser = db
      .prepare(
        "SELECT id, name, email, company, daily_budget FROM advertisers WHERE id = ?",
      )
      .get(req.params.id);

    if (!advertiser) {
      return res.status(404).json({ error: "Advertiser not found" });
    }

    res.json(advertiser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "DSP Backend API is running", version: "1.0.0" });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 DSP Backend running on http://localhost:${PORT}`);
  console.log(`📊 Initialize database: npm run init-db`);
});
export default app;
