# 🛡️ VerifyAE — Anti-Misinformation Tool

> AI-powered crisis misinformation detection for the UAE general public.
> Bilingual (English + Arabic)

---

## Project Structure

```
verifyae/
├── backend/              ← Node.js + Express API server
│   ├── server.js         ← Main server (all API routes)
│   ├── package.json
│   ├── .env.example      ← Copy to .env and fill in your keys
│   └── data/
│       └── reports.json  ← Auto-created when users submit reports
│
└── frontend/
    └── uae-verify.html   ← Single-file frontend (drop into backend/public/)
```

---

## Features

| Feature | Description |
|---|---|
| **Text analysis** | Paste any text — social media posts, news excerpts, WhatsApp messages |
| **URL scraping** | Paste a news article URL — backend fetches and analyzes it |
| **AI verdict** | SAFE / WARN / DANGER with confidence score |
| **Risk scores** | Fear Amplification, Unverified Claims, Source Credibility, Emotional Manipulation |
| **Red flags** | Specific issues detected with emoji indicators |
| **Report system** | Users can flag content — saved to reports.json |
| **Bilingual** | Full Arabic + English UI and AI responses |
| **Rate limiting** | 60 requests/hour per IP, 5 analysis requests/minute per IP |
| **Security** | Helmet headers, CORS restriction, no API key exposed to client |

---

## Quick Start (Local)

### 1. Clone and install

```bash
git clone <your-repo>
cd verifyae/backend
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Edit `.env`:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=3001
ALLOWED_ORIGIN=*
ADMIN_KEY=your-secure-random-string
```

### 3. Add the frontend

```bash
mkdir -p public
cp ../frontend/uae-verify.html public/index.html
```

### 4. Run

```bash
npm start
# or for development with auto-reload:
npm run dev
```

Open: **http://localhost:3001**

---

## API Reference

### `POST /api/analyze`
Analyze content for misinformation.

**Request:**
```json
{
  "content": "text to analyze...",
  "lang": "en",          // "en" or "ar"
  "source": "text"       // "text" or "url"
}
```

**Response:**
```json
{
  "verdict": "WARN",
  "confidence": 78,
  "summary": "...",
  "flags": [
    { "type": "warn", "emoji": "⚠️", "text": "..." }
  ],
  "scores": {
    "fearAmplification": 65,
    "unverifiedClaims": 80,
    "sourceCredibility": 20,
    "emotionalManipulation": 55
  },
  "recommendation": "...",
  "reportWorthy": true,
  "analyzedAt": "2025-01-01T00:00:00.000Z"
}
```

### `POST /api/scrape`
Fetch and extract text from a URL.

**Request:**
```json
{ "url": "https://example.com/article" }
```

**Response:**
```json
{
  "title": "Article Title",
  "text": "Extracted article body...",
  "url": "https://example.com/article",
  "domain": "example.com"
}
```

### `POST /api/report`
Submit a content report.

**Request:**
```json
{
  "content": "...",
  "verdict": "DANGER",
  "reason": "user-flagged",
  "lang": "en"
}
```

**Response:**
```json
{ "success": true, "reportId": "RPT-1234567890-AB12" }
```

### `GET /api/stats` *(Admin)*
Get report statistics.

**Headers:** `x-admin-key: your-admin-key`

**Response:**
```json
{
  "totalReports": 42,
  "byVerdict": { "DANGER": 30, "WARN": 10, "SAFE": 2 },
  "last10": [...]
}
```

---

## Production Deployment

### Option A: Railway (Easiest)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add environment variables in Railway dashboard
4. Railway auto-detects Node.js and deploys

### Option B: VPS (DigitalOcean / AWS EC2)

```bash
# On your server
git clone <your-repo>
cd verifyae/backend
npm install --production

# Install PM2 for process management
npm install -g pm2
pm2 start server.js --name verifyae
pm2 startup   # auto-restart on reboot
pm2 save

# Set up Nginx reverse proxy
# Point your domain to localhost:3001
```

**Sample Nginx config:**
```nginx
server {
    listen 80;
    server_name verifyae.ae www.verifyae.ae;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then add SSL with Certbot:
```bash
sudo certbot --nginx -d verifyae.ae
```

### After deployment — update the frontend

In `uae-verify.html`, change:
```js
const API_BASE = 'http://localhost:3001/api';
```
to:
```js
const API_BASE = 'https://your-backend-domain.com/api';
```

And update CORS in `.env`:
```
ALLOWED_ORIGIN=https://verifyae.ae
```

---

## Roadmap / Next Steps

- [ ] Admin dashboard (view all reports, trends)
- [ ] User accounts + history
- [ ] Push to eCrime portal API (official UAE reporting)
- [ ] Mobile app (React Native)
- [ ] Telegram/WhatsApp bot integration
- [ ] Real-time news monitoring feed
- [ ] Multi-language (Urdu, Hindi, Tagalog — common in UAE)

---

## Important Notes

- This tool is for **public awareness only** and is **not an official government service**
- Analysis is AI-generated and should not be treated as legal determination
- Content is not stored — only anonymized report metadata is saved
- Complies with UAE cybercrime laws regarding data handling
