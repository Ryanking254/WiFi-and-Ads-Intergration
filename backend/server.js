
 import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Root
app.get("/", (req, res) => {
  res.json({ message: "DSP Backend API is running", version: "1.0.0" });
});

// Auth middleware - verify JWT from Supabase
const authMiddleware = async (req, res, next) => {
  if (req.method === "OPTIONS") return next();

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ===== AUTH ENDPOINTS =====

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Get advertiser info
    const { data: advertiser, error: advError } = await supabase
      .from("advertisers")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (advError) {
      return res.status(401).json({ error: "Advertiser not found" });
    }

    res.json({
      id: data.user.id,
      email: data.user.email,
      name: advertiser.name,
      company: advertiser.company,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    // Create auth user
    const { data, error } = await supabase.auth.signUpWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Create advertiser record
    const { error: insertError } = await supabase.from("advertisers").insert([
      {
        id: data.user.id,
        name,
        email,
        company,
      },
    ]);

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    res.status(201).json({
      id: data.user.id,
      name,
      email,
      company,
      message: "Please check your email to confirm your account",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CAMPAIGNS =====

app.get("/api/campaigns", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select(
        `
        *,
        impressions(count),
        clicks(count)
      `
      )
      .eq("advertiser_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Format response
    const campaigns = data.map((c) => ({
      ...c,
      total_impressions: c.impressions?.[0]?.count || 0,
      total_clicks: c.clicks?.[0]?.count || 0,
    }));

    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/campaigns/:id", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select(
        `
        *,
        impressions(count),
        clicks(count)
      `
      )
      .eq("id", req.params.id)
      .eq("advertiser_id", req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json({
      ...data,
      total_impressions: data.impressions?.[0]?.count || 0,
      total_clicks: data.clicks?.[0]?.count || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/campaigns", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      budget,
      daily_budget,
      target_url,
      start_date,
      end_date,
    } = req.body;

    const { data, error } = await supabase
      .from("campaigns")
      .insert([
        {
          id: uuid(),
          advertiser_id: req.user.id,
          name,
          description,
          budget,
          daily_budget,
          target_url,
          start_date,
          end_date,
          status: "draft",
          spent: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/campaigns/:id", authMiddleware, async (req, res) => {
  try {
    const { name, description, budget, daily_budget, status, target_url } =
      req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (budget !== undefined) updateData.budget = budget;
    if (daily_budget !== undefined) updateData.daily_budget = daily_budget;
    if (status !== undefined) updateData.status = status;
    if (target_url !== undefined) updateData.target_url = target_url;
    updateData.updated_at = new Date();

    const { error } = await supabase
      .from("campaigns")
      .update(updateData)
      .eq("id", req.params.id)
      .eq("advertiser_id", req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/campaigns/:id", authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", req.params.id)
      .eq("advertiser_id", req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===== ADS =====

app.get("/api/campaigns/:campaignId/ads", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("ads")
      .select(
        `
        *,
        impressions(count),
        clicks(count)
      `
      )
      .eq("campaign_id", req.params.campaignId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const ads = data.map((a) => ({
      ...a,
      impressions: a.impressions?.[0]?.count || 0,
      clicks: a.clicks?.[0]?.count || 0,
    }));

    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/campaigns/:campaignId/ads", authMiddleware, async (req, res) => {
  try {
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

    const { data, error } = await supabase
      .from("ads")
      .insert([
        {
          id: uuid(),
          campaign_id: req.params.campaignId,
          title,
          description,
          cta_text,
          cta_url,
          format,
          width,
          height,
          image_url,
          status: "active",
          impressions: 0,
          clicks: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/ads/:id", authMiddleware, async (req, res) => {
  try {
    const { title, description, cta_text, cta_url, image_url, status } =
      req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (cta_text !== undefined) updateData.cta_text = cta_text;
    if (cta_url !== undefined) updateData.cta_url = cta_url;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (status !== undefined) updateData.status = status;
    updateData.updated_at = new Date();

    const { error } = await supabase
      .from("ads")
      .update(updateData)
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===== AD SERVING =====

app.get("/api/serve-ad", async (req, res) => {
  try {
    const { placement_id } = req.query;

    const { data: ad, error } = await supabase
      .from("ads")
      .select(
        `
        *,
        campaigns(id, cpm, spent, budget, status)
      `
      )
      .eq("status", "active")
      .eq("campaigns.status", "active")
      .limit(1)
      .single();

    if (error || !ad) {
      return res.json({ error: "No ads available" });
    }

    // Record impression
    const impressionId = uuid();
    await supabase.from("impressions").insert([
      {
        id: impressionId,
        ad_id: ad.id,
        campaign_id: ad.campaign_id,
        placement_id,
        user_agent: req.headers["user-agent"] || "unknown",
      },
    ]);

    // Update ad impression count
    await supabase
      .from("ads")
      .update({ impressions: (ad.impressions || 0) + 1 })
      .eq("id", ad.id);

    // Deduct budget
    const costPerImpression = (ad.campaigns.cpm || 5) / 1000;
    await supabase
      .from("campaigns")
      .update({ spent: ad.campaigns.spent + costPerImpression })
      .eq("id", ad.campaign_id);

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

// ===== CLICK TRACKING =====

app.post("/api/track-click", async (req, res) => {
  try {
    const { ad_id, campaign_id, impression_id } = req.body;

    const clickId = uuid();
    await supabase.from("clicks").insert([
      {
        id: clickId,
        ad_id,
        campaign_id,
        impression_id,
      },
    ]);

    // Update ad click count
    const { data: ad } = await supabase
      .from("ads")
      .select("clicks")
      .eq("id", ad_id)
      .single();

    await supabase
      .from("ads")
      .update({ clicks: (ad?.clicks || 0) + 1 })
      .eq("id", ad_id);

    res.json({ success: true, click_id: clickId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ANALYTICS =====

app.get("/api/campaigns/:id/analytics", authMiddleware, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = parseInt(days);
    const sinceDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", req.params.id)
      .eq("advertiser_id", req.user.id)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Get impressions and clicks
    const { data: impressions } = await supabase
      .from("impressions")
      .select("*")
      .eq("campaign_id", req.params.id)
      .gte("created_at", sinceDate.toISOString());

    const { data: clicks } = await supabase
      .from("clicks")
      .select("*")
      .eq("campaign_id", req.params.id)
      .gte("created_at", sinceDate.toISOString());

    const impressionsCount = impressions?.length || 0;
    const clicksCount = clicks?.length || 0;
    const ctr =
      impressionsCount > 0
        ? ((clicksCount / impressionsCount) * 100).toFixed(2)
        : 0;

    res.json({
      campaign_name: campaign.name,
      budget: campaign.budget,
      spent: campaign.spent,
      impressions: impressionsCount,
      clicks: clicksCount,
      ctr: parseFloat(ctr),
      daily_stats: [],
      ad_performance: [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== OTHER =====

app.get("/api/placements", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("placements")
      .select("*")
      .order("name");

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/advertisers/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("advertisers")
      .select("id, name, email, company")
      .eq("id", req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Advertiser not found" });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 DSP Backend running on port ${PORT}`);
  console.log(`📊 Using Supabase PostgreSQL`);
});

export default app;
