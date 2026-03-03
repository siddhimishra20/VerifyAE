# 🛡️ VerifyAE - Anti-Misinformation Tool

> AI-powered crisis misinformation detection for the UAE general public.
> Bilingual (English + Arabic)

VerifyAE is an AI-powered misinformation detection platform built in response to the rising spread of unverified information during ongoing regional tensions involving Iran, Israel, the United States, and reported security incidents affecting Gulf countries, including the UAE. In times of conflict, social media and messaging platforms often amplify rumors, false claims, and emotionally charged content that can create unnecessary panic. VerifyAE was developed to help users avoid blindly trusting everything they see online.

The platform allows users to submit news snippets, forwarded messages, or social media claims. It then analyzes the content, extracts key entities, and cross-checks the information against trusted UAE government sources and official channels. Based on this verification process, VerifyAE generates a credibility assessment, flags potential red signals, and provides a clear explanation of its findings.

The goal of VerifyAE is to promote calm, informed decision-making and support responsible information sharing during sensitive and uncertain times.

---

## Project Structure

```
verifyae/
├── backend/              
│   ├── server.js       
│   ├── package.json
│   ├── .env.example     
│   └── data/
│       └── reports.json  
│
└── frontend/
    └── uae-verify.html 
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
GROQ_API_KEY=enter-your-key-here
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

## Roadmap / Next Steps

- [ ] Admin dashboard (view all reports, trends)
- [ ] User accounts + history
- [ ] Push to eCrime portal API (official UAE reporting)
- [ ] Mobile app (React Native)
- [ ] Telegram/WhatsApp bot integration
- [ ] Real-time news monitoring feed, adding an interactive globe map
- [ ] Multi-language (Urdu, Hindi, Tagalog - common in UAE)

---

## Important Notes

- This tool is for **public awareness only** and is **not an official government service**
- Analysis is AI-generated and should not be treated as legal determination
- Content is not stored, only anonymized report metadata is saved
- Complies with UAE cybercrime laws regarding data handling
