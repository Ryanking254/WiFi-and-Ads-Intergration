# AdFlow DSP - Full-Stack Advertising Platform

A complete **Demand-Side Platform (DSP)** built from scratch to learn modern ad tech. Create campaigns, manage ads, serve creatives, track impressions, and analyze performance.

![Architecture](https://img.shields.io/badge/Architecture-Full%20Stack-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js%2FExpress-green)
![Frontend](https://img.shields.io/badge/Frontend-React%2FVite-61DAFB)
![Database](https://img.shields.io/badge/Database-SQLite-003B57)

## 🎯 What You'll Build

```
┌─────────────────────────────────────────────────────────────┐
│                    ADVERTISER DASHBOARD                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Campaign Manager → Create / Edit / Launch Campaigns  │   │
│  │ Ad Manager       → Add / Edit Creative Assets        │   │
│  │ Analytics        → View Performance Metrics & Charts  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                    │
├─────────────────────────────────────────────────────────────┤
│              EXPRESS.JS BACKEND (REST API)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • Campaign CRUD Operations                           │   │
│  │ • Ad Serving Engine (finds & returns ads)            │   │
│  │ • Impression Tracking (CPM cost model)               │   │
│  │ • Click Tracking & Attribution                       │   │
│  │ • Analytics & Reporting                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                    │
├─────────────────────────────────────────────────────────────┤
│              SQLITE DATABASE (Learning Setup)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Campaigns | Ads | Impressions | Clicks | Budget      │   │
│  │ Tracking | Placements | Budget Logs                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## ⚡ 5-Minute Quick Start

### 1️⃣ Backend (Terminal 1)
```bash
cd dsp-backend
npm install
npm run init-db
npm start
# → Running on http://localhost:5000
```

### 2️⃣ Frontend (Terminal 2)
```bash
cd dsp-frontend
npm install
npm run dev
# → Running on http://localhost:3000
```

### 3️⃣ Login & Test
```
URL: http://localhost:3000
Email: demo@example.com
Password: password123
```

✅ Done! Dashboard loads with sample campaign.

## 🗂️ Project Layout

```
AdFlow-DSP/
│
├── dsp-backend/                    # Node.js/Express Server
│   ├── server.js                   # 🔑 All API endpoints (500 lines)
│   ├── scripts/init-db.js          # Database schema & seed data
│   ├── data/dsp.db                 # SQLite database (auto-created)
│   ├── package.json
│   └── README.md
│
├── dsp-frontend/                   # React/Vite Dashboard
│   ├── src/
│   │   ├── App.jsx                 # Router setup
│   │   ├── index.css               # Tailwind directives
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Auth UI
│   │   │   ├── Dashboard.jsx       # Campaign list & stats
│   │   │   ├── NewCampaign.jsx     # Campaign creation
│   │   │   └── CampaignDetail.jsx  # Campaign detail + analytics
│   │   ├── components/
│   │   │   └── Navbar.jsx          # Navigation
│   │   └── services/
│   │       └── api.js              # API client (Axios)
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── README.md
│
└── README.md (this file)
```

## 🚀 Core Features

### 1. **Campaign Management**
- Create campaigns with budget and timeline
- Set daily spending limits
- Launch, pause, or complete campaigns
- Real-time budget tracking

### 2. **Ad Management**
- Create multiple ad creatives per campaign
- Choose ad formats (banner, native, video thumbnail)
- Set Call-to-Action (CTA) text and URLs
- Track impressions and clicks per ad

### 3. **Ad Serving**
- Smart ad selection algorithm
- Only serves ads from active campaigns
- Respects budget constraints
- Automatic cost deduction (CPM model)

### 4. **Analytics Dashboard**
- Real-time metrics (impressions, clicks, CTR)
- Daily performance charts (line graphs)
- Ad performance comparison (bar charts)
- Budget vs. spend visualization
- Click-through rate (CTR) calculations

### 5. **Tracking**
- Impression tracking when ad is served
- Click tracking with impression attribution
- Budget ledger (all transactions logged)
- Cost-per-thousand calculation

## 📊 DSP Flow Example

### Step 1: Create Campaign
```javascript
// Frontend: Click "New Campaign"
POST /api/campaigns
{
  name: "Summer Sale",
  budget: 1000,
  daily_budget: 100,
  target_url: "https://example.com/sale"
}
// → Campaign stored with status: "draft"
```

### Step 2: Add Ads
```javascript
// Frontend: In campaign, click "+ Add Ad"
POST /api/campaigns/{campaignId}/ads
{
  title: "Summer Sale!",
  description: "50% off everything",
  format: "banner",
  cta_text: "Shop Now",
  cta_url: "https://example.com/sale"
}
```

### Step 3: Launch Campaign
```javascript
// Frontend: Click "Launch"
PATCH /api/campaigns/{campaignId}
{ status: "active" }
```

### Step 4: Serve Ads (happens in the wild)
```javascript
// Publisher site requests ad
GET /api/serve-ad?placement_id=tech_blog_banner
// ↓
// Backend finds active campaign with ads matching format
// Records impression in database
// Deducts $0.0025 from budget (CPM model)
// Returns ad creative
{
  ad_id: "uuid",
  title: "Summer Sale!",
  cta_text: "Shop Now",
  cta_url: "https://example.com/sale"
}
```

### Step 5: Track Click
```javascript
// Advertiser's tracking pixel fires
POST /api/track-click
{
  ad_id: "uuid",
  campaign_id: "uuid",
  impression_id: "uuid"
}
// → Click recorded, metrics updated
```

### Step 6: View Analytics
```javascript
// Frontend: Open campaign detail
GET /api/campaigns/{id}/analytics?days=7
// → Returns impressions, clicks, CTR, daily breakdown
// → Charts render on dashboard
```

## 🔌 API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **Auth** |
| POST | `/api/auth/login` | Login advertiser |
| POST | `/api/auth/register` | Create advertiser account |
| **Campaigns** |
| GET | `/api/campaigns` | List all campaigns |
| GET | `/api/campaigns/:id` | Get campaign details |
| POST | `/api/campaigns` | Create new campaign |
| PATCH | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign |
| **Ads** |
| GET | `/api/campaigns/:id/ads` | List ads for campaign |
| POST | `/api/campaigns/:id/ads` | Create ad |
| PATCH | `/api/ads/:id` | Update ad |
| **Serving & Tracking** |
| GET | `/api/serve-ad?placement_id=X` | Serve ad + record impression |
| POST | `/api/track-click` | Record click |
| **Analytics** |
| GET | `/api/campaigns/:id/analytics?days=7` | Get performance metrics |
| GET | `/api/placements` | List available placements |

## 💾 Database Schema

### Core Tables

**campaigns**
```sql
id, advertiser_id, name, budget, daily_budget, spent, 
status (draft|active|paused|completed), start_date, end_date
```

**ads**
```sql
id, campaign_id, title, description, format, 
impressions, clicks, cta_text, cta_url
```

**impressions**
```sql
id, ad_id, campaign_id, placement_id, timestamp, 
user_agent, ip_hash
```

**clicks**
```sql
id, ad_id, campaign_id, impression_id, timestamp
```

**budget_logs**
```sql
id, campaign_id, amount, type (impression|click), timestamp
```

See `dsp-frontend/README.md` for complete schema documentation.

## 🎓 Learning Objectives

After building this DSP, you'll understand:

✅ **Ad Tech Architecture**
- How DSPs work under the hood
- Campaign lifecycle and states
- Budget tracking and cost models
- Impression and click attribution

✅ **Full-Stack Development**
- Backend API design (Express.js)
- Frontend state management (React)
- Database schema design (SQLite)
- Real-time analytics

✅ **Core Concepts**
- CPM (Cost Per Mille): $X per 1000 impressions
- CTR (Click-Through Rate): (Clicks / Impressions) × 100
- Budget management and spend tracking
- Ad serving algorithms

## 🔧 Configuration

### Backend (.env)
```bash
PORT=5000
NODE_ENV=development
```

### Frontend (src/)
Proxy configured in `vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000'
  }
}
```

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check port 5000 free: `lsof -i :5000` |
| Database errors | Reinit: `npm run init-db` |
| CORS errors | Backend running? Check http://localhost:5000/health |
| Ads not serving | Campaign active? Has budget? Ads created? |
| Frontend blank | Check browser console for errors |

## 📈 Next Steps

### Easy Additions
- [ ] Add advertiser account management page
- [ ] Export campaign data to CSV
- [ ] Add campaign duplication
- [ ] Show spend projections

### Medium Additions
- [ ] Add audience segments/targeting
- [ ] Implement real bidding logic
- [ ] Add A/B testing for ads
- [ ] Cost-per-click (CPC) model instead of CPM

### Advanced Additions
- [ ] Real-time bidding (RTB) simulation
- [ ] Machine learning bid optimization
- [ ] Integration with real ad exchanges
- [ ] Multi-advertiser auction system

## 📚 Further Reading

- **DSP Basics**: [What is a DSP?](https://www.programmatic-iq.com/what-is-a-demand-side-platform/)
- **Programmatic Ad Tech**: [IAB Glossary](https://www.iab.com/insights/)
- **Cost Models**: CPM vs CPC vs CPA explained

## 🤝 Contributing

This is a learning project. Feel free to:
- Extend with new features
- Optimize database queries
- Add more sophisticated algorithms
- Deploy to production

## 📝 License

MIT - Use for learning and commercial projects

---

## Quick Commands

```bash
# Setup everything
cd dsp-backend && npm install && npm run init-db && npm start &
cd dsp-frontend && npm install && npm run dev

# Database
npm run init-db          # Reset database
npm run init-db          # View database: sqlite3 data/dsp.db

# Frontend
npm run dev              # Start dev server
npm run build            # Build for production

# API Testing (with curl)
curl http://localhost:5000/health
```

---

**Built with ❤️ by Ryan for learning. Start small, scale up.**

Questions? Check the detailed README in each folder.
