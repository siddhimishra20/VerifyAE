/**
 * VerifyAE — Live Search via Tavily API
 *
 * Tavily is purpose-built for AI search. Free tier: 1,000 req/month.
 * Get key at: https://app.tavily.com
 *
 * Why Tavily over compound-beta:
 * - compound-beta shares rate limits with your analysis calls (138/day used up fast)
 * - Tavily is a dedicated search API — separate quota, no interference
 * - Returns full article content, not just snippets
 * - Explicitly supports include_domains for UAE gov targeting
 */

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

export const UAE_GOV_DOMAINS = [
  "wam.ae","u.ae","moi.gov.ae","ncema.gov.ae","mediaoffice.ae",
  "uaecabinet.ae","mofaic.gov.ae","mod.gov.ae","moh.gov.ae",
  "dha.gov.ae","dubai.ae","abudhabi.ae","sharjah.ae","rak.ae","fujairah.ae",
];

export const UAE_NEWS_DOMAINS = [
  "gulfnews.com","thenational.ae","khaleejtimes.com","alkhaleej.ae",
  "alittihad.ae","emaratalyoum.com","arabianbusiness.com","zawya.com","emirates247.com",
];

export const INTL_NEWS_DOMAINS = [
  "aljazeera.com","reuters.com","bbc.com","apnews.com","theguardian.com","france24.com",
];

export const SOCIAL_DOMAINS = ["x.com","twitter.com","instagram.com","facebook.com","t.me"];

const ALL_PRIORITY_DOMAINS = [...UAE_GOV_DOMAINS, ...UAE_NEWS_DOMAINS, ...INTL_NEWS_DOMAINS];

// ─── Main export ──────────────────────────────────────────────────────────────

export async function searchForClaim(claim, _groq) {
  const apiKey = process.env.TAVILY_API_KEY;
  const query  = buildQuery(claim);

  if (!apiKey) {
    console.warn("[SEARCH] No TAVILY_API_KEY set — live search disabled.");
    return { searched: false, reason: "No TAVILY_API_KEY configured.", foundEvidence: false, rawFindings: "" };
  }

  console.log(`[SEARCH] Tavily searching: "${query}"`);

  try {
    // Run two searches in parallel:
    // 1. Restricted to UAE gov + trusted news only
    // 2. Open web for social media and any other sources
    const [govResult, generalResult] = await Promise.allSettled([
      tavilySearch(query, apiKey, {
        include_domains: ALL_PRIORITY_DOMAINS,
        max_results: 7,
        search_depth: "advanced",   // deep crawl, reads full article content
        topic: "news",
      }),
      tavilySearch(query, apiKey, {
        exclude_domains: ALL_PRIORITY_DOMAINS, // catch things NOT in our official list
        max_results: 4,
        search_depth: "basic",
        topic: "news",
      }),
    ]);

    const govResults     = govResult.status     === "fulfilled" ? govResult.value     : { results: [], error: govResult.reason?.message };
    const generalResults = generalResult.status === "fulfilled" ? generalResult.value : { results: [], error: generalResult.reason?.message };

    if (govResult.status     === "rejected") console.error("[SEARCH] Gov search failed:",     govResult.reason?.message);
    if (generalResult.status === "rejected") console.error("[SEARCH] General search failed:", generalResult.reason?.message);

    // Merge and deduplicate
    const allResults = dedup([...govResults.results, ...generalResults.results]);
    const classified = allResults.map(classifyResult);

    const govHits    = classified.filter(r => r.isGov);
    const newsHits   = classified.filter(r => r.isNews && !r.isGov);
    const socialHits = classified.filter(r => r.isSocial);

    console.log(`[SEARCH] Results: ${classified.length} total | ${govHits.length} gov | ${newsHits.length} news | ${socialHits.length} social`);

    // Format results as readable text for the AI prompt
    const rawFindings = formatResults(classified);

    // Check if gov sources actually confirm (vs just being mentioned)
    const govConfirmed = govHits.length > 0 && !rawFindings.toLowerCase().includes("no results");

    return {
      searched:      true,
      query,
      rawFindings,
      totalResults:  classified.length,
      govResults:    govHits.length,
      newsResults:   newsHits.length,
      socialResults: socialHits.length,
      govConfirmed,
      foundEvidence: classified.length > 0,
      sources:       classified.slice(0, 8).map(r => ({ title: r.title, url: r.url, domain: r.domain, isGov: r.isGov, score: r.score })),
    };

  } catch (err) {
    console.error("[SEARCH] Tavily error:", err.message);
    return { searched: false, reason: err.message, foundEvidence: false, rawFindings: "" };
  }
}

// ─── Tavily API call ──────────────────────────────────────────────────────────

async function tavilySearch(query, apiKey, options = {}) {
  const body = {
    api_key:      apiKey,
    query,
    max_results:  options.max_results  ?? 5,
    search_depth: options.search_depth ?? "basic",
    topic:        options.topic        ?? "news",
    include_answer:         false,
    include_raw_content:    false,
    include_image_descriptions: false,
    ...(options.include_domains && { include_domains: options.include_domains }),
    ...(options.exclude_domains && { exclude_domains: options.exclude_domains }),
  };

  const res = await fetch(TAVILY_ENDPOINT, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tavily ${res.status}: ${text.substring(0, 200)}`);
  }

  return res.json();
}

// ─── Result classification ────────────────────────────────────────────────────

function classifyResult(r) {
  let domain = "";
  try { domain = new URL(r.url).hostname.replace(/^www\./, "").toLowerCase(); } catch { /* skip */ }

  const isGov = (
    UAE_GOV_DOMAINS.some(d => domain === d || domain.endsWith("." + d)) ||
    domain.endsWith(".gov")                                              ||
    /\.gov\.[a-z]{2,}$/.test(domain)
  );

  const isNews   = UAE_NEWS_DOMAINS.some(d    => domain === d || domain.endsWith("." + d)) ||
                   INTL_NEWS_DOMAINS.some(d   => domain === d || domain.endsWith("." + d));
  const isSocial = SOCIAL_DOMAINS.some(d      => domain === d || domain.endsWith("." + d));

  return { ...r, domain, isGov, isNews, isSocial };
}

function dedup(results) {
  const seen = new Set();
  return results.filter(r => {
    if (!r.url || seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

function formatResults(results) {
  if (!results.length) return "No results found.";
  return results.map((r, i) => {
    const tag = r.isGov ? "🏛 GOV" : r.isSocial ? "📱 SOCIAL" : r.isNews ? "📰 NEWS" : "🌐 WEB";
    return [
      `${i + 1}. ${tag} — ${r.domain}`,
      `   Title  : ${r.title || "(no title)"}`,
      `   URL    : ${r.url}`,
      r.content ? `   Content: ${r.content.substring(0, 400)}` : "",
    ].filter(Boolean).join("\n");
  }).join("\n\n");
}

// ─── Prompt formatter ─────────────────────────────────────────────────────────

export function formatEvidenceForPrompt(evidence) {

  if (!evidence.searched) {
    return `\nLIVE SEARCH: Unavailable — ${evidence.reason}. Analyse on content tone only.`;
  }

  if (!evidence.foundEvidence) {
    return `
LIVE SEARCH (Tavily searched wam.ae, u.ae, moi.gov.ae, ncema.gov.ae, Gulf News, The National, Khaleej Times, Reuters, BBC and general web): ZERO results found for "${evidence.query}".

INTERPRET AS:
A) BREAKING EVENT — official emergency language ("air defense", "missile alert", "civil defense", "citizens requested to stay indoors", "specialized authorities", "do not go out until instructions issued") → real alerts precede search indexing → WARN, sourceCredibility 60–75.
B) RUMOUR — panic-sharing language ("forward this", "share before deleted", no official tone) → DANGER, sourceCredibility 0–25.
Base verdict on language and tone, not search results alone.`;
  }

  let block = `
LIVE SEARCH RESULTS (Tavily — searched wam.ae, u.ae, moi.gov.ae, ncema.gov.ae, Gulf News, The National, Khaleej Times, Reuters, BBC, Al Jazeera + general web):
- Query          : "${evidence.query}"
- Gov sources    : ${evidence.govResults}
- News sources   : ${evidence.newsResults}
- Social / other : ${evidence.socialResults}
- Total results  : ${evidence.totalResults}
- Gov confirmed  : ${evidence.govConfirmed ? "YES — official UAE source found" : "NO — not confirmed by any official UAE gov source"}

--- SEARCH RESULTS (use as ground truth) ---
${evidence.rawFindings}
--- END ---

ANALYSIS INSTRUCTIONS (strict priority):

1. LOCATION MISMATCH — TOP PRIORITY:
   Claim says location X, sources show location Y → DANGER. Name both explicitly.

2. DETAIL MISMATCH:
   Wrong numbers, names, dates, or facts vs. what sources say → WARN or DANGER, quote the discrepancy.

3. GOV CONFIRMS → SAFE:
   wam.ae / u.ae / moi.gov.ae / ncema.gov.ae confirms → SAFE, sourceCredibility 80–100.

4. NEWS CONFIRMS (Gulf News, The National, Reuters, BBC) → SAFE or WARN:
   Multiple reputable outlets confirm → SAFE, sourceCredibility 70–90.
   Single outlet confirms → WARN, sourceCredibility 60–75.

5. OFFICIAL EMERGENCY LANGUAGE → WARN (NOT misinformation):
   "air defense", "missile threat", "civil defense", "citizens requested to stay", "specialized authorities" from official channel → WARN, sourceCredibility 60–75.

6. CONTRADICTED → DANGER:
   Sources contradict claim → DANGER, quote specific contradiction in flags.

7. SOCIAL ONLY → WARN:
   Only social media, no gov/news → WARN, sourceCredibility 20–45.

8. RUMOUR → DANGER:
   No sources + panic language → DANGER, sourceCredibility 0–25.`;

  return block;
}

function buildQuery(claim) {
  return claim
    .replace(/["""''«»]/g, "")
    .replace(/\b(i heard|someone said|my friend said|my friend typed|apparently|allegedly|breaking|urgent|share this|forward this|please share)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 150);
}
