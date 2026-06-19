import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/dsp.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

// Create tables
db.exec(`
  -- Advertisers/Users
  CREATE TABLE IF NOT EXISTS advertisers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    company TEXT,
    daily_budget REAL DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Campaigns
  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    advertiser_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft', -- draft, active, paused, completed
    budget REAL NOT NULL,
    daily_budget REAL NOT NULL,
    spent REAL DEFAULT 0,
    start_date DATETIME,
    end_date DATETIME,
    target_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (advertiser_id) REFERENCES advertisers(id)
  );

  -- Creative Ads
  CREATE TABLE IF NOT EXISTS ads (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    cta_text TEXT DEFAULT 'Learn More',
    cta_url TEXT NOT NULL,
    format TEXT DEFAULT 'banner', -- banner, native, video_thumbnail
    width INT,
    height INT,
    status TEXT DEFAULT 'active',
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  );

  -- Placements (where ads can be served)
  CREATE TABLE IF NOT EXISTS placements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    format TEXT NOT NULL, -- banner, native, video_thumbnail
    width INT,
    height INT,
    daily_impressions INT DEFAULT 1000,
    cpm REAL DEFAULT 2.5, -- Cost per mille (1000 impressions)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Impressions (when an ad is served)
  CREATE TABLE IF NOT EXISTS impressions (
    id TEXT PRIMARY KEY,
    ad_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    placement_id TEXT NOT NULL,
    user_agent TEXT,
    ip_hash TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ad_id) REFERENCES ads(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (placement_id) REFERENCES placements(id)
  );

  -- Clicks (when user clicks on an ad)
  CREATE TABLE IF NOT EXISTS clicks (
    id TEXT PRIMARY KEY,
    ad_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    impression_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ad_id) REFERENCES ads(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (impression_id) REFERENCES impressions(id)
  );

  -- Campaign budgets tracking
  CREATE TABLE IF NOT EXISTS budget_logs (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL, -- impression, click
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  );

  -- Create indexes for common queries
  CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser ON campaigns(advertiser_id);
  CREATE INDEX IF NOT EXISTS idx_ads_campaign ON ads(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_impressions_campaign ON impressions(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_impressions_timestamp ON impressions(timestamp);
  CREATE INDEX IF NOT EXISTS idx_clicks_campaign ON clicks(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON clicks(timestamp);
`);

console.log('✅ Database initialized at', dbPath);

// Insert sample data for testing
const { v4: uuid } = await import('uuid');

try {
  const advertiserId = uuid();
  
  // Create test advertiser
  db.prepare(`
    INSERT INTO advertisers (id, name, email, password, company, daily_budget)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    advertiserId,
    'Demo Advertiser',
    'demo@example.com',
    'hashed_password_here',
    'Demo Company',
    500
  );

  // Create test campaign
  const campaignId = uuid();
  db.prepare(`
    INSERT INTO campaigns (id, advertiser_id, name, description, budget, daily_budget, target_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    campaignId,
    advertiserId,
    'First Campaign',
    'Test campaign to learn DSP flow',
    1000,
    100,
    'https://example.com'
  );

  // Create test ad
  const adId = uuid();
  db.prepare(`
    INSERT INTO ads (id, campaign_id, title, description, cta_text, cta_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    adId,
    campaignId,
    'Amazing Product',
    'Check out our incredible offer',
    'Shop Now',
    'https://example.com/product'
  );

  // Create test placements
  const placements = [
    { name: 'Tech Blog Banner', domain: 'techblog.com', format: 'banner', width: 728, height: 90 },
    { name: 'News Site Rectangle', domain: 'newsite.com', format: 'banner', width: 300, height: 250 },
    { name: 'Social Feed Native', domain: 'socialapp.com', format: 'native', width: 320, height: 480 }
  ];

  placements.forEach(p => {
    db.prepare(`
      INSERT INTO placements (id, name, domain, format, width, height, cpm)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuid(),
      p.name,
      p.domain,
      p.format,
      p.width,
      p.height,
      2.5 + Math.random() * 3 // Random CPM between 2.5-5.5
    );
  });

  console.log('✅ Sample data inserted');
} catch (err) {
  if (!err.message.includes('UNIQUE constraint failed')) {
    console.error('Error inserting sample data:', err.message);
  } else {
    console.log('⚠️  Sample data already exists, skipping');
  }
}

db.close();
