# 🎯 AdFlow DSP - Complete Implementation Guide

A complete, production-structured DSP with:
- **Backend**: 500+ line Express.js server with full API
- **Frontend**: 1000+ line React dashboard with charts
- **Database**: SQLite with comprehensive schema
- **Documentation**: Detailed guides for understanding & extending

---

## 🚀 QUICK START (3 Steps)

### Step 1: Start Backend
```bash
cd dsp-backend
npm install
npm run init-db
npm start
```
✅ Runs on http://localhost:5000

### Step 2: Start Frontend (New Terminal)
```bash
cd dsp-frontend
npm install
npm run dev
```
✅ Runs on http://localhost:3000

### Step 3: Login & Test
```
Email: demo@example.com
Password: password123
```

That's it! You now have a working DSP.

---

## 📁 Project Structure

```
dsp/
├── README.md                          # Main overview
├── setup.sh                           # One-command setup
│
├── dsp-backend/
│   ├── server.js                      # 🔑 Complete API (ALL endpoints)
│   ├── scripts/init-db.js             # Schema + seed data
│   ├── data/dsp.db                    # SQLite (auto-created)
│   ├── package.json
│   ├── .gitignore
│   └── .env.example
│
└── dsp-frontend/
    ├── src/
    │   ├── App.jsx                    # Router + app shell
    │   ├── index.css                  # Tailwind CSS
    │   ├── main.jsx                   # Entry point
    │   ├── pages/
    │   │   ├── Login.jsx              # Auth page (100 lines)
    │   │   ├── Dashboard.jsx          # Campaign list (150 lines)
    │   │   ├── NewCampaign.jsx        # Create campaign (120 lines)
    │   │   └── CampaignDetail.jsx     # Analytics & ads (280 lines)
    │   ├── components/
    │   │   └── Navbar.jsx             # Navigation bar
    │   └── services/
    │       └── api.js                 # Axios API client
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── README.md
```

---

## 🔑 Key Features Explained

### 1. Campaign Management
```
User creates campaign with:
- Name & Description
- Total Budget ($)
- Daily Budget ($)
- Target URL
- Start/End Dates

System:
✓ Validates daily_budget ≤ total_budget
✓ Stores in draft status
✓ Ready for ads
```

### 2. Ad Creation
```
Advertiser adds ads with:
- Title & Description
- Format (banner 728x90, rectangle 300x250, native 320x480)
- CTA Text & URL

System:
✓ Links to campaign
✓ Tracks impressions & clicks
✓ Enables per-ad performance analysis
```

### 3. Ad Serving Engine
```
When publisher requests ad:
GET /api/serve-ad?placement_id=X

System:
1. Finds active campaigns (status = "active")
2. Filters ads matching placement format
3. Checks budget available
4. Records impression → deducts cost (CPM)
5. Returns ad creative to display

Cost Model: CPM (Cost Per Mille)
- Placement has CPM rate (e.g., $2.50)
- Cost per impression = CPM / 1000
- Each serve = immediate spend deduction
```

### 4. Click Tracking
```
When user clicks ad:
POST /api/track-click
{
  "ad_id": "uuid",
  "campaign_id": "uuid",
  "impression_id": "uuid"
}

System:
✓ Records click linked to impression
✓ Updates campaign & ad metrics
✓ Enables CTR calculation
✓ Prepares for CPC billing model
```

### 5. Analytics Dashboard
```
Shows per campaign:
- Total impressions (ad views)
- Total clicks (user interactions)
- CTR (Click-Through Rate) = (Clicks/Impressions) × 100
- Budget spent vs allocated
- Daily breakdown chart (line graph)
- Ad performance comparison (bar chart)

Data available:
- Last 7 days (configurable)
- Real-time updates
- Per-ad breakdowns
```

---

## 📊 Database Tables (SQLite)

### advertisers
```sql
id (UUID)
name, email, password
company
daily_budget
created_at, updated_at
```

### campaigns
```sql
id (UUID)
advertiser_id (FK)
name, description
status: 'draft' | 'active' | 'paused' | 'completed'
budget, daily_budget, spent
start_date, end_date
target_url
created_at, updated_at
```

### ads
```sql
id (UUID)
campaign_id (FK)
title, description
cta_text, cta_url
image_url (optional)
format: 'banner' | 'native' | 'video_thumbnail'
width, height
impressions (counter)
clicks (counter)
status: 'active' | 'paused'
created_at, updated_at
```

### impressions
```sql
id (UUID)
ad_id (FK), campaign_id (FK), placement_id (FK)
user_agent, ip_hash
timestamp
```

### clicks
```sql
id (UUID)
ad_id (FK), campaign_id (FK)
impression_id (FK) - Links back to impression for attribution
timestamp
```

### budget_logs
```sql
id (UUID)
campaign_id (FK)
amount (decimal) - Cost deducted
type: 'impression' | 'click'
timestamp
```

### placements
```sql
id (UUID)
name, domain
format, width, height
cpm (cost per 1000 impressions)
daily_impressions (limit)
created_at
```

---

## 🔌 API Endpoints (All Implemented)

### Authentication
```
POST /api/auth/login
  Request: { email, password }
  Response: { id, name, email, company, daily_budget }

POST /api/auth/register
  Request: { name, email, password, company }
  Response: { id, name, email, company }
```

### Campaigns
```
GET /api/campaigns
  Returns: Array of campaigns with impression/click counts

GET /api/campaigns/:id
  Returns: Single campaign with metrics

POST /api/campaigns
  Request: { name, description, budget, daily_budget, target_url, start_date, end_date }
  Returns: { id, name, ... }

PATCH /api/campaigns/:id
  Request: { name?, description?, status?, budget?, daily_budget?, target_url? }
  Returns: { success: true }

DELETE /api/campaigns/:id
  Returns: { success: true }
```

### Ads
```
GET /api/campaigns/:campaignId/ads
  Returns: Array of ads with impression/click counts

POST /api/campaigns/:campaignId/ads
  Request: { title, description, cta_text, cta_url, format, width?, height?, image_url? }
  Returns: { id, title, ... }

PATCH /api/ads/:id
  Request: { title?, description?, cta_text?, cta_url?, image_url?, status? }
  Returns: { success: true }
```

### Ad Serving & Tracking
```
GET /api/serve-ad?placement_id=X
  Returns: { ad_id, impression_id, campaign_id, title, description, cta_text, cta_url, format }
  Side effects: Records impression, deducts budget

POST /api/track-click
  Request: { ad_id, campaign_id, impression_id }
  Returns: { success: true, click_id }
  Side effects: Records click, updates metrics
```

### Analytics
```
GET /api/campaigns/:id/analytics?days=7
  Returns: {
    impressions, clicks, ctr, cpc, spent, budget,
    daily_stats: [ { date, impressions, clicks }, ... ],
    ad_performance: [ { id, title, impressions, clicks }, ... ]
  }
```

### Utility
```
GET /api/placements
  Returns: Array of available placements

GET /api/advertisers/:id
  Returns: { id, name, email, company, daily_budget }

GET /health
  Returns: { status: 'ok' }
```

---

## 💡 How Ad Serving Works (Step-by-Step)

### Scenario: Publisher wants to serve an ad

```
1. PUBLISHER REQUESTS AD
   GET http://localhost:5000/api/serve-ad?placement_id=tech_blog_banner

2. BACKEND SEARCHES
   SELECT a.*, c.id, p.cpm
   FROM ads a
   JOIN campaigns c ON a.campaign_id = c.id
   WHERE c.status = 'active' 
     AND a.status = 'active'
     AND c.spent < c.budget
     AND p.format = a.format
   LIMIT 1 (random)

3. FOUND: Campaign "Summer Sale" with Ad "50% Off"

4. RECORD IMPRESSION
   INSERT impressions (id, ad_id, campaign_id, placement_id, ...)
   VALUES (uuid(), 'ad123', 'campaign456', 'placement789', ...)

5. DEDUCT BUDGET
   CPM = $2.50 (per 1000 impressions)
   Cost per impression = $2.50 / 1000 = $0.0025
   
   UPDATE campaigns SET spent = spent + 0.0025
   UPDATE ads SET impressions = impressions + 1
   
   INSERT budget_logs (campaign_id, amount=0.0025, type='impression')

6. RETURN AD
   {
     ad_id: "ad123",
     impression_id: "imp789",
     campaign_id: "campaign456",
     title: "Summer Sale!",
     description: "50% off everything",
     cta_text: "Shop Now",
     cta_url: "https://example.com/sale"
   }

7. PUBLISHER RENDERS AD
   <div>
     <h3>Summer Sale!</h3>
     <button onclick="trackClick(...)">Shop Now</button>
   </div>

8. USER CLICKS
   POST /api/track-click
   {
     ad_id: "ad123",
     campaign_id: "campaign456",
     impression_id: "imp789"
   }

9. TRACK CLICK
   INSERT clicks (id, ad_id, campaign_id, impression_id, ...)
   UPDATE ads SET clicks = clicks + 1
   INSERT budget_logs (campaign_id, amount=0, type='click')

10. DASHBOARD SHOWS
    Campaign metrics:
    - 100 impressions × $0.0025 = $0.25 spent
    - 5 clicks
    - CTR = 5/100 = 5%
```

---

## 🧪 Testing the DSP

### Test 1: Create Campaign
```
Login → Click "New Campaign"
Fill:
  - Name: "Test Campaign"
  - Budget: $500
  - Daily Budget: $50
  - Target URL: https://example.com
Click: "Create Campaign"
```

### Test 2: Add Ads
```
Click campaign → "+ Add Ad"
Fill:
  - Title: "Amazing Deal"
  - Description: "Limited time offer"
  - CTA Text: "Claim Now"
  - CTA URL: https://example.com/offer
Click: "Create Ad"
```

### Test 3: Launch Campaign
```
In campaign detail → Click "Launch"
Status changes: draft → active
```

### Test 4: Simulate Ad Serving (curl)
```bash
curl "http://localhost:5000/api/serve-ad?placement_id=<placement_id>"
```
Response: Ad creative with impression tracked

### Test 5: Simulate Click (curl)
```bash
curl -X POST http://localhost:5000/api/track-click \
  -H "Content-Type: application/json" \
  -d '{
    "ad_id": "<ad_id>",
    "campaign_id": "<campaign_id>",
    "impression_id": "<impression_id>"
  }'
```

### Test 6: View Analytics
```
In dashboard → Click campaign
See:
- Daily impressions chart
- Ad performance chart
- CTR & CPC calculations
```

---

## 🎯 Cost Models Explained

### Current: CPM (Cost Per Mille)
```
Placement CPM: $2.50
Meaning: $2.50 per 1000 impressions

Cost calculation:
- 1 impression = $2.50 / 1000 = $0.0025
- 100 impressions = 100 × $0.0025 = $0.25
- 1000 impressions = $2.50
- 10,000 impressions = $25.00

Advertiser budget exhaustion:
- Budget: $100
- CPM: $2.50
- Max impressions: 100 / 0.0025 = 40,000

When campaign.spent >= campaign.budget:
- No more ads served
- Status changed to 'completed'
```

### Future: CPC (Cost Per Click)
```
Advertiser only pays when user clicks

Modification needed:
1. Remove CPM from budget deduction
2. Only charge on /api/track-click
3. Record cost_per_click in campaigns table
4. Deduct from budget on click, not impression

Code change:
// OLD: Deduct on impression
UPDATE campaigns SET spent = spent + (cpm/1000)

// NEW: Deduct on click
UPDATE campaigns SET spent = spent + cost_per_click
```

### Future: CPA (Cost Per Action)
```
Advertiser only pays when user completes action
(purchase, signup, etc.)

Requires:
1. Conversion tracking pixel
2. Action validation
3. Post-click landing page integration
4. Conversion window (e.g., 30 days)
```

---

## 🔐 Security Considerations (Not Implemented - Learning Project)

For production, add:

1. **Authentication**
   - JWT tokens instead of x-advertiser-id header
   - Password hashing (bcrypt)
   - Token refresh mechanism

2. **Authorization**
   - Verify advertiser owns campaign before modifying
   - Role-based access (admin, advertiser, analyst)

3. **Rate Limiting**
   - Limit /api/serve-ad calls per second
   - Prevent abuse of tracking endpoints

4. **Data Validation**
   - Input sanitization
   - Budget overflow checks
   - URL validation (prevent XSS in CTA URLs)

5. **Fraud Prevention**
   - Detect bot impressions
   - Click quality scoring
   - IP reputation checks

---

## 📈 Performance Optimizations (Future)

### Database
```javascript
// Add indexes (already done in init-db.js):
CREATE INDEX idx_campaigns_advertiser ON campaigns(advertiser_id);
CREATE INDEX idx_impressions_campaign ON impressions(campaign_id);
CREATE INDEX idx_impressions_timestamp ON impressions(timestamp);

// Cache frequently accessed data
// Use connection pooling (with PostgreSQL)
// Archive old impressions to data warehouse
```

### Backend
```javascript
// Cache campaign data
const campaignCache = new Map();

// Batch impression inserts (batch every 100)
// Use write-ahead logging for budget updates

// Compress API responses
app.use(compression());

// Connection pooling
const pool = new Pool({ max: 20 });
```

### Frontend
```javascript
// Code splitting per route
// Lazy load charts
// Cache API responses
// Virtual scrolling for large campaign lists
```

---

## 📝 Code Highlights

### Impressive Backend Features
✅ Join queries (campaigns with impression/click counts)
✅ Aggregate queries (daily stats, ad performance)
✅ Transaction-like budget tracking
✅ Parameterized queries (prevent SQL injection)
✅ RESTful design with proper HTTP methods
✅ Error handling and validation

### Impressive Frontend Features
✅ Multi-page React SPA with React Router
✅ Complex form handling (NewCampaign, NewAd)
✅ Chart.js integration for analytics
✅ Real-time status updates
✅ Responsive grid layouts (Tailwind CSS)
✅ Loading states and error messages

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Login → Dashboard → Campaign Detail → New Campaign   │  │
│  │ [User creates, views, and manages]                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│                    Axios API Client                          │
│                  (src/services/api.js)                       │
│                          ↓                                   │
├─────────────────────────────────────────────────────────────┤
│                  Express.js Backend                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Authentication                                       │  │
│  │ ↓                                                    │  │
│  │ Campaign CRUD (Create, Read, Update, Delete)        │  │
│  │ ↓                                                    │  │
│  │ Ad Management (Create, List, Update)                │  │
│  │ ↓                                                    │  │
│  │ Ad Serving Engine (Find → Record → Charge)          │  │
│  │ ↓                                                    │  │
│  │ Click Tracking (Record → Update Metrics)            │  │
│  │ ↓                                                    │  │
│  │ Analytics (Aggregate → Summarize)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
├─────────────────────────────────────────────────────────────┤
│                   SQLite Database                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Campaigns | Ads | Impressions | Clicks | BudgetLogs │  │
│  │ Placements | Advertisers                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  [Persistent storage of all campaign and transaction data]  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Next Steps

1. **Understand the Architecture**
   - Read dsp-frontend/README.md
   - Trace through one campaign creation
   - Make a test API call with curl

2. **Extend with New Features**
   - Add audience targeting
   - Implement real bidding
   - Add cost-per-click model
   - Create admin dashboard

3. **Deploy to Production**
   - Use PostgreSQL instead of SQLite
   - Add authentication (JWT)
   - Deploy backend to Railway/Render
   - Deploy frontend to Vercel
   - Add monitoring and logging

4. **Integrate with Real Ad Networks**
   - Connect to Google Ads API
   - Integrate with ad exchanges
   - Real-time bidding (RTB)

---

## 📚 Learning Resources

**Ad Tech Concepts**
- https://www.programmatic-iq.com/
- https://www.iab.com/insights/

**Code Architecture**
- Express.js: https://expressjs.com/
- React: https://react.dev/
- SQLite: https://www.sqlite.org/

**Deployment**
- Render: https://render.com/
- Vercel: https://vercel.com/
- Railway: https://railway.app/

---

## 🎓 Learnings You'll Gain

✅ **Full-stack architecture** - How frontend & backend communicate
✅ **Database design** - Schemas, relationships, indexing
✅ **REST API design** - Endpoints, HTTP methods, status codes
✅ **Ad tech fundamentals** - CPM, CTR, bidding, ad serving
✅ **Real-time metrics** - Aggregations, analytics, reporting
✅ **Cost modeling** - Budget tracking, spend deduction
✅ **Complex queries** - Joins, aggregations, filtering
✅ **Frontend state management** - React hooks, routing
✅ **Data visualization** - Charts, graphs, dashboards

---

## ✅ Checklist for Getting Started

- [ ] Read this document
- [ ] Read dsp-frontend/README.md
- [ ] Run: `cd dsp-backend && npm install && npm run init-db && npm start`
- [ ] Run: `cd dsp-frontend && npm install && npm run dev`
- [ ] Login with demo@example.com / password123
- [ ] Create a test campaign
- [ ] Add ads to campaign
- [ ] Launch campaign
- [ ] View analytics dashboard
- [ ] Test ad serving with curl
- [ ] Explore the codebase
- [ ] Make a code modification

---

## 🎉 You're Ready!

Your complete DSP is ready to run. This is a professional, full-featured system that demonstrates:

- Real ad tech architecture
- Professional backend design
- Modern frontend development
- Database management
- Analytics and reporting


Start with the quick start section above, then explore the detailed READMEs.

---

**Built with ❤️ for learning. Questions? Dig into the code!**
