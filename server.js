/**
 * VerifyAE — Backend Server
 * Node.js + Express + Groq Compound (native web search, no extra APIs)
 *
 * Features:
 *  - Groq AI — Llama 3.3 70B (free, 14,400 req/day)
 *  - groq/compound — agentic web search with domain filtering (wam.ae, u.ae, moi.gov.ae etc.)
 *  - Domain whitelist — 40+ UAE gov/news sources + global .gov.* catch-all
 *  - URL scraping with lookalike detection
 *  - Rate limiting, CORS, Helmet
 */

import express           from "express";
import cors              from "cors";
import helmet            from "helmet";
import rateLimit         from "express-rate-limit";
import dotenv            from "dotenv";
import Groq              from "groq-sdk";
import fetch             from "node-fetch";
import * as cheerio      from "cheerio";
import fs                from "fs/promises";
import path              from "path";
import { fileURLToPath } from "url";
import { getDomainVerdict, detectLookalike } from "./sources.js";
import { searchForClaim, formatEvidenceForPrompt } from "./search.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app       = express();
const PORT      = process.env.PORT || 3001;

// ─── Groq client ──────────────────────────────────────────────────────────
if (!process.env.GROQ_API_KEY) {
  console.error("❌  GROQ_API_KEY is missing from your .env file.");
  process.exit(1);
}
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


// ─── Middleware ───────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*", methods: ["GET", "POST"] }));
app.use(express.json({ limit: "50kb" }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} — IP: ${req.ip}`);
  next();
});

// ─── Rate limiters ────────────────────────────────────────────────────────
app.use("/api", rateLimit({
  windowMs: 60 * 60 * 1000, max: 60,
  standardHeaders: true, legacyHeaders: false,
  message: { error: "Too many requests. Please try again in an hour." },
}));

const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000, max: 10,
  message: { error: "Please wait before submitting another analysis." },
});

// ─── Static frontend ──────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ─── Health check ─────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status:      "ok",
    service:     "VerifyAE",
    ai:          "groq/llama-3.3-70b-versatile",
    liveSearch:  !!process.env.TAVILY_API_KEY, // Tavily search
    timestamp:   new Date().toISOString(),
  });
});

// ─── Domain check ─────────────────────────────────────────────────────────
app.post("/api/check-domain", (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== "string") return res.status(400).json({ error: "A valid URL is required." });
  try { new URL(url); } catch { return res.status(400).json({ error: "Invalid URL format." }); }
  res.json(getDomainVerdict(url));
});

// ─── Scrape + domain verify ───────────────────────────────────────────────
app.post("/api/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== "string") return res.status(400).json({ error: "A valid URL is required." });

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error();
  } catch { return res.status(400).json({ error: "Invalid URL. Must start with http:// or https://" }); }

  const blocked = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "10.", "192.168.", "172."];
  if (blocked.some(b => parsedUrl.hostname.startsWith(b))) return res.status(403).json({ error: "That URL is not allowed." });

  const domainVerdict = getDomainVerdict(url);
  const lookalike     = detectLookalike(url);
  console.log(`[SCRAPE] domain=${parsedUrl.hostname} tier=${domainVerdict.tier} trusted=${domainVerdict.trusted}`);

  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 8000);
    const response   = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "VerifyAE-Bot/1.0 (misinformation detection; UAE)",
        "Accept":     "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    const html = await response.text();
    const $    = cheerio.load(html);
    $("script, style, nav, footer, header, aside, iframe, noscript, [class*='ad'], [id*='ad']").remove();

    const candidates = [
      $("article").text(), $("main").text(), $("[role='main']").text(),
      $(".article-body, .post-content, .story-body, .entry-content").text(), $("body").text(),
    ];
    const text  = candidates.map(t => t.replace(/\s+/g, " ").trim()).find(t => t.length > 100) || "";
    const title = $("title").text().trim() || $("h1").first().text().trim() || "";

    if (!text) return res.status(422).json({ error: "Could not extract readable text from that URL." });

    res.json({
      title, text: text.substring(0, 3000), url,
      domain: parsedUrl.hostname, domainVerdict,
      lookalike: lookalike.suspicious ? lookalike : null,
    });
  } catch (err) {
    if (err.name === "AbortError") return res.status(504).json({ error: "The URL took too long to respond." });
    console.error("Scrape error:", err.message);
    res.status(500).json({ error: "Failed to fetch the URL. It may be blocked or unavailable." });
  }
});

// ─── Analyze ──────────────────────────────────────────────────────────────
app.post("/api/analyze", analyzeLimiter, async (req, res) => {
  const { content, lang = "en", source = "text", url } = req.body;

  if (!content || typeof content !== "string" || content.trim().length < 10) {
    return res.status(400).json({ error: "Content must be at least 10 characters." });
  }

  // ── 1. Domain verdict ────────────────────────────────────────────────────
  let domainVerdict = null;
  let lookalike     = null;
  if (url && typeof url === "string") {
    try {
      new URL(url);
      domainVerdict = getDomainVerdict(url);
      const lk = detectLookalike(url);
      lookalike = lk.suspicious ? lk : null;
      console.log(`[ANALYZE] domain=${new URL(url).hostname} tier=${domainVerdict.tier}`);
    } catch { /* skip */ }
  }

  // ── 2. Live search — runs in parallel with domain check ──────────────────
  console.log(`[SEARCH] Searching for claim: "${content.substring(0, 80)}..."`);
  const evidence = await searchForClaim(content, groq);
  console.log(`[SEARCH] Results: ${evidence.totalResults ?? 0} total, ${evidence.govResults ?? 0} gov, confirmed: ${evidence.govConfirmed ?? false}`);

  // ── 3. Build prompt context ───────────────────────────────────────────────
  let domainContext = "";
  if (domainVerdict) {
    if (domainVerdict.trusted) {
      domainContext = `\nDOMAIN: Content from "${domainVerdict.sourceName}" — TRUSTED ${domainVerdict.tier} UAE source. Set sourceCredibility 70–100.`;
    } else if (domainVerdict.tier === "UNVERIFIED_AE") {
      domainContext = `\nDOMAIN: .ae domain not on UAE trusted whitelist. sourceCredibility 20–50. Add warning flag.`;
    } else {
      domainContext = `\nDOMAIN: Unknown/foreign domain. sourceCredibility 0–30. Add warning flag.`;
    }
    if (lookalike) domainContext += `\nLOOKALIKE: Domain impersonates "${lookalike.resembles}". Add DANGER flag.`;
  }

  const searchContext = formatEvidenceForPrompt(evidence);

  const isArabic     = lang === "ar";
  const responseLang = isArabic ? "Arabic" : "English";

  const systemPrompt = `You are VerifyAE, a crisis misinformation detection AI for the UAE general public. Your job is to determine if content is credible, unconfirmed, or misinformation — using live search results, content tone, and stated source. You must distinguish between: (a) confirmed misinformation, (b) unconfirmed but plausible breaking news, and (c) verified official information. Respond ONLY with raw JSON — no markdown, no explanation. All text fields in ${responseLang}.`;

  const userPrompt = `Analyze this content. Live search results and domain context are provided below.

Source type: ${source}${domainContext}${searchContext}

Content to verify: "${content.substring(0, 2500)}"

ANALYSIS RULES — follow in priority order:

1. OFFICIAL EMERGENCY LANGUAGE TEST:
   Does the content use formal official language? Indicators: "air defense", "missile threat", "civil defense", "citizens and residents are requested", "specialized authorities", "stay in safe places", "do not go out until instructions". If YES and the user says it came from an official media house or government channel → this is likely a real breaking alert. Verdict: WARN (unconfirmed live event) with sourceCredibility 60–75. Do NOT mark as misinformation just because search has no results yet.

2. LOCATION MISMATCH TEST:
   If search results clearly show the event happened in a DIFFERENT location than claimed → DANGER, name both locations explicitly in summary and flags.

3. SEARCH CONFIRMATION:
   If gov sources (wam.ae, u.ae, moi.gov.ae, ncema.gov.ae, mediaoffice.ae) confirm the claim → SAFE, sourceCredibility 80–100.
   If no results found and content has rumour/panic hallmarks (share before deleted, urgent forward this) → DANGER, sourceCredibility 0–25.
   If no results found but content has official tone → WARN, sourceCredibility 50–70.

4. CONTRADICTION:
   If search results directly contradict the claim → DANGER, state the contradiction explicitly.

Return ONLY this JSON:
{
  "verdict": "SAFE" | "WARN" | "DANGER",
  "confidence": <0-100>,
  "summary": "<2-3 sentences on what the content claims and what the evidence shows>",
  "flags": [{ "type": "warn|danger|info", "emoji": "<emoji>", "text": "<specific finding with source if available>" }],
  "scores": {
    "fearAmplification": <0-100>,
    "unverifiedClaims": <0-100>,
    "sourceCredibility": <0-100>,
    "emotionalManipulation": <0-100>
  },
  "recommendation": "<1-2 sentence action for the reader>",
  "reportWorthy": <true|false>,
  "searchedSources": <number of sources checked>,
  "govSourcesFound": <number of gov sources found>
}`;

  // ── 4. Call Groq ──────────────────────────────────────────────────────────
  try {
    const completion = await groq.chat.completions.create({
      model:           "llama-3.3-70b-versatile",
      temperature:     0.2,
      max_tokens:      1400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
    });

    const raw   = completion.choices[0]?.message?.content || "";
    const clean = raw.replace(/```json|```/g, "").trim();

    let result;
    try {
      result = JSON.parse(clean);
    } catch {
      console.error("JSON parse failed. Raw:", raw.substring(0, 400));
      return res.status(500).json({ error: "AI returned unexpected format. Please try again." });
    }

    console.log(`[ANALYSIS] verdict=${result.verdict} confidence=${result.confidence} lang=${lang} searchHits=${evidence.totalResults ?? 0}`);

    res.json({
      ...result,
      domainVerdict,
      lookalike,
      liveSearch: {
        enabled:    evidence.searched,
        query:      evidence.query      || null,
        totalHits:  evidence.totalResults  || 0,
        govHits:    evidence.govResults    || 0,
        govConfirmed: evidence.govConfirmed || false,
        snippets:   evidence.snippets      || [],
      },
      analyzedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("─── Groq Error ─────────────────────────────");
    console.error("Status  :", err.status ?? "unknown");
    console.error("Message :", err.message);
    console.error("────────────────────────────────────────────");

    if (err.status === 429) return res.status(429).json({ error: "Rate limit reached. Please wait a moment and try again." });
    if (err.status === 401) return res.status(500).json({ error: "Invalid Groq API key. Check GROQ_API_KEY in .env" });
    if (err.status === 503) return res.status(503).json({ error: "Groq is temporarily unavailable. Try again shortly." });
    res.status(500).json({ error: `Analysis failed: ${err.message}` });
  }
});

// ─── Report ───────────────────────────────────────────────────────────────
const REPORTS_FILE = path.join(__dirname, "data", "reports.json");

app.post("/api/report", async (req, res) => {
  const { content, url, verdict, reason, lang = "en" } = req.body;
  if (!content && !url) return res.status(400).json({ error: "No content to report." });

  const report = {
    id:             `RPT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    submittedAt:    new Date().toISOString(),
    lang, verdict: verdict || "UNKNOWN",
    reason:         reason?.substring(0, 500) || "",
    contentSnippet: (content || url || "").substring(0, 200),
    domain:         url ? (() => { try { return new URL(url).hostname; } catch { return null; } })() : null,
    ip:             req.ip,
  };

  try {
    await fs.mkdir(path.join(__dirname, "data"), { recursive: true });
    let reports = [];
    try { reports = JSON.parse(await fs.readFile(REPORTS_FILE, "utf8")); } catch { /* first run */ }
    reports.push(report);
    await fs.writeFile(REPORTS_FILE, JSON.stringify(reports, null, 2));
    console.log(`[REPORT] ${report.id} submitted`);
    res.json({ success: true, reportId: report.id });
  } catch (err) {
    console.error("Report save error:", err);
    res.status(500).json({ error: "Failed to save report." });
  }
});

// ─── Stats (admin) ────────────────────────────────────────────────────────
app.get("/api/stats", async (req, res) => {
  if (req.headers["x-admin-key"] !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });
  try {
    const reports = JSON.parse(await fs.readFile(REPORTS_FILE, "utf8"));
    res.json({
      totalReports: reports.length,
      byVerdict:    reports.reduce((acc, r) => { acc[r.verdict] = (acc[r.verdict] || 0) + 1; return acc; }, {}),
      last10:       reports.slice(-10),
    });
  } catch { res.json({ totalReports: 0, byVerdict: {}, last10: [] }); }
});

// ─── 404 ──────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// ─── Start ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🛡️  VerifyAE backend running on http://localhost:${PORT}`);
  console.log(`   AI engine  : Groq — Llama 3.3 70B`);
  console.log(`   Live search : ${process.env.TAVILY_API_KEY ? "✅ Tavily (1,000 searches/month free)" : "⚠️  Disabled — add TAVILY_API_KEY to .env (app.tavily.com)"}`);
  console.log(`   Quota note  : Tavily is separate from Groq — no shared rate limits`);
  console.log(`   Health     : http://localhost:${PORT}/api/health\n`);
});
