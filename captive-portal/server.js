const express = require('express');
const axios = require('axios');
const app = express();

const SERVER_IP = '192.168.1.67'; // Company server
const TENDA_MAC = '8C:44:BB:04:0B:C8'; // Tenda router MAC
const LAPTOP_IP = '192.168.1.102'; // This laptop

app.use(express.json());
app.use(express.static('public'));

// Get client IP from request
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}

// Check Tenda subscription status on server
async function checkSubscriptionStatus() {
  try {
    const response = await axios.get(`http://${SERVER_IP}:3000/api/subscription-status`, {
      params: { mac: TENDA_MAC }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking subscription:', error.message);
    return { active: false, message: 'Server unreachable' };
  }
}

// Renew subscription after ad completion
async function renewSubscription(days = 7) {
  try {
    const response = await axios.post(`http://${SERVER_IP}:3000/api/renew-subscription`, {
      mac: TENDA_MAC,
      days: days
    });
    return response.data;
  } catch (error) {
    console.error('Error renewing subscription:', error.message);
    return { success: false, message: 'Failed to renew' };
  }
}

// Middleware: Check subscription status for all requests
app.use(async (req, res, next) => {
  // Allow landing page, API calls, and static files
  if (
    req.path === '/' ||
    req.path.startsWith('/api/') ||
    req.path.startsWith('/static/') ||
    req.path.endsWith('.css') ||
    req.path.endsWith('.js') ||
    req.path.endsWith('.png')
  ) {
    return next();
  }

  // For all other requests, check subscription
  const subscription = await checkSubscriptionStatus();
  
  if (!subscription.active) {
    // Redirect to landing page
    return res.redirect('/');
  }

  next();
});

// Landing page (captive portal)
app.get('/', async (req, res) => {
  const subscription = await checkSubscriptionStatus();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WiFi Portal</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 40px;
          max-width: 500px;
          text-align: center;
        }
        h1 {
          color: #333;
          margin-bottom: 20px;
          font-size: 28px;
        }
        .status {
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
          font-size: 16px;
        }
        .status.active {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .status.expired {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        .days-remaining {
          font-size: 24px;
          font-weight: bold;
          color: #667eea;
          margin: 15px 0;
        }
        .ad-section {
          margin: 30px 0;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
        }
        .ad-section h2 {
          color: #333;
          margin-bottom: 15px;
          font-size: 18px;
        }
        button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 15px 40px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          margin-top: 20px;
        }
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        button:active {
          transform: translateY(0);
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .ad-iframe {
          width: 100%;
          height: 400px;
          border: none;
          border-radius: 8px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📶 WiFi Portal</h1>
        
        ${subscription.active ? `
          <div class="status active">
            ✓ Your connection is active
          </div>
          <div class="days-remaining">${subscription.days_remaining || 7} days remaining</div>
          <p style="color: #666; margin-top: 20px;">Your WiFi subscription is active. You can browse freely.</p>
          <button onclick="window.location.href='http://google.com'">Continue Browsing</button>
        ` : `
          <div class="status expired">
            ⚠ Your subscription has expired
          </div>
          <p style="color: #666; margin: 20px 0;">Watch an ad to renew your internet access for 7 more days.</p>
          
          <div class="ad-section" id="ad-container">
            <h2>Watch this ad to continue</h2>
            <div id="ad-loading">
              <div class="spinner"></div>
              <p>Loading ad...</p>
            </div>
            <div id="ad-player" style="display: none;">
              <iframe 
                class="ad-iframe"
                src="https://ryanadsportal.vercel.app/ad-player?placement_id=wifi-portal&return_url=http://${LAPTOP_IP}:80/api/renew"
              ></iframe>
            </div>
          </div>
        `}
      </div>

      <script>
        // If subscription expired, load ad player after 2 seconds
        if (!${JSON.stringify(subscription.active)}) {
          setTimeout(() => {
            document.getElementById('ad-loading').style.display = 'none';
            document.getElementById('ad-player').style.display = 'block';
          }, 2000);
        }
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

// API: Check subscription status
app.get('/api/subscription-status', async (req, res) => {
  const subscription = await checkSubscriptionStatus();
  res.json(subscription);
});

// API: Renew subscription (called after ad completion)
app.post('/api/renew', async (req, res) => {
  const result = await renewSubscription(7);
  
  if (result.success) {
    return res.json({
      success: true,
      message: 'Subscription renewed! Redirecting...',
      redirect: '/'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Failed to renew subscription'
  });
});

// Catch-all: Redirect to landing page
app.use((req, res) => {
  res.redirect('/');
});

const PORT = 80;
app.listen(PORT, () => {
  console.log(`🌐 Captive Portal running on http://${LAPTOP_IP}:${PORT}`);
  console.log(`📡 Tenda MAC: ${TENDA_MAC}`);
  console.log(`🖥️ Server: ${SERVER_IP}`);
});
