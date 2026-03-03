/**
 * VerifyAE — UAE Trusted Sources Whitelist
 *
 * Three tiers:
 *   OFFICIAL  — Federal/emirate government, ministries, regulatory bodies (.gov.ae + known portals)
 *   VERIFIED  — State-backed news agencies, licensed broadcasters with editorial standards
 *   CREDIBLE  — Established private UAE-licensed news outlets with track records
 *
 * Each entry includes:
 *   domains   — all known domains + subdomains for that source
 *   nameEn    — English display name
 *   nameAr    — Arabic display name
 *   category  — source category
 *   tier      — OFFICIAL | VERIFIED | CREDIBLE
 */

export const TRUSTED_SOURCES = [

  // ════════════════════════════════════════════════════════
  // TIER 1 — OFFICIAL GOVERNMENT & FEDERAL BODIES
  // ════════════════════════════════════════════════════════

  {
    domains: ["u.ae", "government.ae"],
    nameEn: "UAE Federal Government Portal",
    nameAr: "البوابة الرسمية لحكومة الإمارات",
    category: "Federal Government",
    tier: "OFFICIAL",
  },
  {
    domains: ["mofaic.gov.ae"],
    nameEn: "Ministry of Foreign Affairs & International Cooperation",
    nameAr: "وزارة الخارجية والتعاون الدولي",
    category: "Federal Ministry",
    tier: "OFFICIAL",
  },
  {
    domains: ["moi.gov.ae"],
    nameEn: "Ministry of Interior",
    nameAr: "وزارة الداخلية",
    category: "Federal Ministry",
    tier: "OFFICIAL",
  },
  {
    domains: ["mod.gov.ae"],
    nameEn: "Ministry of Defence",
    nameAr: "وزارة الدفاع",
    category: "Federal Ministry",
    tier: "OFFICIAL",
  },
  {
    domains: ["moh.gov.ae"],
    nameEn: "Ministry of Health & Prevention",
    nameAr: "وزارة الصحة ووقاية المجتمع",
    category: "Federal Ministry",
    tier: "OFFICIAL",
  },
  {
    domains: ["moec.gov.ae"],
    nameEn: "Ministry of Economy",
    nameAr: "وزارة الاقتصاد",
    category: "Federal Ministry",
    tier: "OFFICIAL",
  },
  {
    domains: ["moe.gov.ae"],
    nameEn: "Ministry of Education",
    nameAr: "وزارة التربية والتعليم",
    category: "Federal Ministry",
    tier: "OFFICIAL",
  },
  {
    domains: ["mocd.gov.ae"],
    nameEn: "Ministry of Community Development",
    nameAr: "وزارة تنمية المجتمع",
    category: "Federal Ministry",
    tier: "OFFICIAL",
  },
  {
    domains: ["moenr.gov.ae"],
    nameEn: "Ministry of Energy & Infrastructure",
    nameAr: "وزارة الطاقة والبنية التحتية",
    category: "Federal Ministry",
    tier: "OFFICIAL",
  },
  {
    domains: ["uaecabinet.ae"],
    nameEn: "UAE Cabinet",
    nameAr: "مجلس الوزراء الإماراتي",
    category: "Federal Government",
    tier: "OFFICIAL",
  },
  {
    domains: ["ncema.gov.ae"],
    nameEn: "National Emergency Crisis & Disaster Management Authority",
    nameAr: "الهيئة الوطنية لإدارة الطوارئ والأزمات والكوارث",
    category: "Crisis Management",
    tier: "OFFICIAL",
  },
  {
    domains: ["tdra.gov.ae", "tra.gov.ae"],
    nameEn: "Telecom & Digital Government Regulatory Authority (TDRA)",
    nameAr: "هيئة تنظيم الاتصالات والحكومة الرقمية",
    category: "Regulatory Authority",
    tier: "OFFICIAL",
  },
  {
    domains: ["uaespace.gov.ae", "mbrsc.ae"],
    nameEn: "UAE Space Agency / Mohammed Bin Rashid Space Centre",
    nameAr: "وكالة الإمارات للفضاء / مركز محمد بن راشد للفضاء",
    category: "Federal Agency",
    tier: "OFFICIAL",
  },
  {
    domains: ["cbuae.gov.ae"],
    nameEn: "Central Bank of the UAE",
    nameAr: "المصرف المركزي لدولة الإمارات",
    category: "Federal Authority",
    tier: "OFFICIAL",
  },
  {
    domains: ["haad.ae", "doh.gov.ae"],
    nameEn: "Department of Health – Abu Dhabi",
    nameAr: "دائرة الصحة – أبوظبي",
    category: "Emirate Authority",
    tier: "OFFICIAL",
  },
  {
    domains: ["dha.gov.ae"],
    nameEn: "Dubai Health Authority",
    nameAr: "هيئة الصحة بدبي",
    category: "Emirate Authority",
    tier: "OFFICIAL",
  },
  {
    domains: ["abudhabi.ae", "adda.gov.ae"],
    nameEn: "Abu Dhabi Government",
    nameAr: "حكومة أبوظبي",
    category: "Emirate Government",
    tier: "OFFICIAL",
  },
  {
    domains: ["dubai.ae", "dubaipolice.gov.ae"],
    nameEn: "Dubai Government / Dubai Police",
    nameAr: "حكومة دبي / شرطة دبي",
    category: "Emirate Government",
    tier: "OFFICIAL",
  },
  {
    domains: ["sharjah.ae", "sharjahmedia.ae"],
    nameEn: "Sharjah Government",
    nameAr: "حكومة الشارقة",
    category: "Emirate Government",
    tier: "OFFICIAL",
  },
  {
    domains: ["rak.ae", "rakmedia.ae"],
    nameEn: "Ras Al Khaimah Government",
    nameAr: "حكومة رأس الخيمة",
    category: "Emirate Government",
    tier: "OFFICIAL",
  },
  {
    domains: ["ajman.ae"],
    nameEn: "Ajman Government",
    nameAr: "حكومة عجمان",
    category: "Emirate Government",
    tier: "OFFICIAL",
  },
  {
    domains: ["uaq.ae"],
    nameEn: "Umm Al Quwain Government",
    nameAr: "حكومة أم القيوين",
    category: "Emirate Government",
    tier: "OFFICIAL",
  },
  {
    domains: ["fujairah.ae"],
    nameEn: "Fujairah Government",
    nameAr: "حكومة الفجيرة",
    category: "Emirate Government",
    tier: "OFFICIAL",
  },
  {
    domains: ["tamm.abudhabi"],
    nameEn: "Abu Dhabi Digital Government (TAMM)",
    nameAr: "الحكومة الرقمية لأبوظبي (تمّ)",
    category: "Emirate Digital Government",
    tier: "OFFICIAL",
  },
  {
    domains: ["digitaldubai.ae", "smartdubai.ae"],
    nameEn: "Digital Dubai",
    nameAr: "دبي الرقمية",
    category: "Emirate Digital Government",
    tier: "OFFICIAL",
  },
  {
    domains: ["uaepmc.gov.ae", "mediaoffice.ae"],
    nameEn: "UAE Media Office",
    nameAr: "المكتب الإعلامي لحكومة الإمارات",
    category: "Federal Media",
    tier: "OFFICIAL",
  },

  // ════════════════════════════════════════════════════════
  // TIER 2 — VERIFIED STATE-BACKED & LICENSED NEWS AGENCIES
  // ════════════════════════════════════════════════════════

  {
    domains: ["wam.ae"],
    nameEn: "WAM — Emirates News Agency",
    nameAr: "وكالة أنباء الإمارات (وام)",
    category: "State News Agency",
    tier: "VERIFIED",
  },
  {
    domains: ["emannews.ae"],
    nameEn: "Emirates News",
    nameAr: "أخبار الإمارات",
    category: "State News",
    tier: "VERIFIED",
  },
  {
    domains: ["adtv.ae", "abudhabi.tv"],
    nameEn: "Abu Dhabi Media / Abu Dhabi TV",
    nameAr: "أبوظبي للإعلام / تلفزيون أبوظبي",
    category: "State Broadcaster",
    tier: "VERIFIED",
  },
  {
    domains: ["thenational.ae"],
    nameEn: "The National",
    nameAr: "ذا ناشيونال",
    category: "State-backed English Daily",
    tier: "VERIFIED",
  },
  {
    domains: ["alkhaleej.ae"],
    nameEn: "Al Khaleej",
    nameAr: "الخليج",
    category: "Licensed Arabic Daily",
    tier: "VERIFIED",
  },
  {
    domains: ["alittihad.ae"],
    nameEn: "Al Ittihad",
    nameAr: "الاتحاد",
    category: "Licensed Arabic Daily",
    tier: "VERIFIED",
  },
  {
    domains: ["emaratalyoum.com"],
    nameEn: "Emarat Al Youm",
    nameAr: "إمارات اليوم",
    category: "Licensed Arabic Daily",
    tier: "VERIFIED",
  },
  {
    domains: ["dubaitv.gov.ae", "dubai.tv"],
    nameEn: "Dubai Media Inc. / Dubai TV",
    nameAr: "مؤسسة دبي للإعلام / دبي تي في",
    category: "State Broadcaster",
    tier: "VERIFIED",
  },
  {
    domains: ["sharjahmedia.ae", "sharjah24.ae"],
    nameEn: "Sharjah Media Corporation / Sharjah 24",
    nameAr: "مؤسسة الشارقة للإعلام / الشارقة 24",
    category: "State Broadcaster",
    tier: "VERIFIED",
  },

  // ════════════════════════════════════════════════════════
  // TIER 3 — CREDIBLE LICENSED PRIVATE UAE NEWS OUTLETS
  // ════════════════════════════════════════════════════════

  {
    domains: ["gulfnews.com"],
    nameEn: "Gulf News",
    nameAr: "غلف نيوز",
    category: "Licensed English Daily",
    tier: "CREDIBLE",
  },
  {
    domains: ["khaleejtimes.com"],
    nameEn: "Khaleej Times",
    nameAr: "خليج تايمز",
    category: "Licensed English Daily",
    tier: "CREDIBLE",
  },
  {
    domains: ["arabianbusiness.com"],
    nameEn: "Arabian Business",
    nameAr: "أريبيان بيزنس",
    category: "Licensed Business News",
    tier: "CREDIBLE",
  },
  {
    domains: ["zawya.com"],
    nameEn: "Zawya (Refinitiv)",
    nameAr: "زاوية",
    category: "Licensed Financial News",
    tier: "CREDIBLE",
  },
  {
    domains: ["arabnews.com"],
    nameEn: "Arab News",
    nameAr: "عرب نيوز",
    category: "Regional English Daily",
    tier: "CREDIBLE",
  },
  {
    domains: ["albayan.ae"],
    nameEn: "Al Bayan",
    nameAr: "البيان",
    category: "Licensed Arabic Daily",
    tier: "CREDIBLE",
  },
  {
    domains: ["business24-7.ae"],
    nameEn: "Business 24/7",
    nameAr: "بيزنس 24/7",
    category: "Licensed Business News",
    tier: "CREDIBLE",
  },
  {
    domains: ["timeoutdubai.com", "timeoutabudhabi.com"],
    nameEn: "Time Out UAE",
    nameAr: "تايم أوت الإمارات",
    category: "Licensed Lifestyle News",
    tier: "CREDIBLE",
  },
];

// ─── Lookup helpers ──────────────────────────────────────────────────────────

/**
 * Normalise a hostname: strip www. and lowercases
 */
function normaliseHost(hostname) {
  return hostname.replace(/^www\./, "").toLowerCase();
}

/**
 * Check if a hostname matches a whitelist domain entry.
 * Handles exact matches and subdomains (e.g. news.wam.ae → wam.ae).
 */
function hostMatchesDomain(hostname, whitelistDomain) {
  const h = normaliseHost(hostname);
  const d = whitelistDomain.toLowerCase();
  return h === d || h.endsWith("." + d);
}

/**
 * Look up a URL's hostname in the whitelist.
 * Returns the matching source entry or null.
 *
 * @param {string} urlString  Full URL string
 * @returns {{ source: object, tier: string, trusted: boolean } | null}
 */
export function checkDomain(urlString) {
  let hostname;
  try {
    hostname = new URL(urlString).hostname;
  } catch {
    return null;
  }

  for (const source of TRUSTED_SOURCES) {
    for (const domain of source.domains) {
      if (hostMatchesDomain(hostname, domain)) {
        return {
          trusted: true,
          tier: source.tier,
          nameEn: source.nameEn,
          nameAr: source.nameAr,
          category: source.category,
          matchedDomain: domain,
        };
      }
    }
  }

  // Catch-all: any .gov.* second-level domain globally (gov.ae, gov.in, gov.uk, gov.au, etc.)
  // Also covers plain .gov (USA federal)
  const h = normaliseHost(hostname);

  const isGovDomain = (
    h === "gov"                          ||  // bare .gov (unlikely but safe)
    h.endsWith(".gov")                   ||  // US federal: whitehouse.gov, fbi.gov
    /\.gov\.[a-z]{2,}$/.test(h)         ||  // country gov: gov.ae, gov.uk, gov.in, gov.au
    /^gov\.[a-z]{2,}$/.test(h)              // root: gov.ae itself
  );

  if (isGovDomain) {
    // Try to identify the country from the TLD
    const tldMatch = h.match(/\.([a-z]{2})$/);
    const countryTld = tldMatch ? tldMatch[1].toUpperCase() : "";
    const countryName = countryTld ? ` (${countryTld})` : "";
    return {
      trusted: true,
      tier: "OFFICIAL",
      nameEn: `Official Government Entity${countryName}`,
      nameAr: `جهة حكومية رسمية${countryName ? " " + countryName : ""}`,
      category: "Government",
      matchedDomain: h,
    };
  }

  // .ae TLD but not whitelisted — flag as unverified, not dangerous
  if (h.endsWith(".ae")) {
    return {
      trusted: false,
      tier: "UNVERIFIED_AE",
      nameEn: "Unverified UAE Domain",
      nameAr: "نطاق إماراتي غير موثق",
      category: "Unknown",
      matchedDomain: h,
    };
  }

  return {
    trusted: false,
    tier: "UNKNOWN",
    nameEn: "Unknown / Foreign Domain",
    nameAr: "نطاق غير معروف أو أجنبي",
    category: "Unknown",
    matchedDomain: h,
  };
}

/**
 * Lookalike / impersonation detection.
 * Checks if a domain suspiciously resembles a trusted source name
 * without being on the whitelist.
 *
 * @param {string} urlString
 * @returns {{ suspicious: boolean, resembles?: string }}
 */
export function detectLookalike(urlString) {
  let hostname;
  try {
    hostname = normaliseHost(new URL(urlString).hostname);
  } catch {
    return { suspicious: false };
  }

  // Already whitelisted — not a lookalike
  const check = checkDomain(urlString);
  if (check?.trusted) return { suspicious: false };

  // Keywords that appear in trusted UAE source names
  const triggerKeywords = [
    "wam", "gulfnews", "khaleej", "thenational", "alittihad",
    "ittihad", "alkhaleej", "bayan", "emaratalyoum", "zawya",
    "arabianbusiness", "uae", "dubai", "abudhabi", "sharjah",
    "government", "ministry", "ncema", "tdra", "mediaoffice",
  ];

  for (const kw of triggerKeywords) {
    if (hostname.includes(kw)) {
      return {
        suspicious: true,
        resembles: kw,
        message: `Domain "${hostname}" contains "${kw}" but is not a verified UAE source. It may be impersonating an official outlet.`,
        messageAr: `النطاق "${hostname}" يحتوي على "${kw}" لكنه ليس مصدراً إماراتياً موثقاً. قد يكون يُقلّد منفذاً رسمياً.`,
      };
    }
  }

  return { suspicious: false };
}

/**
 * Generate a human-readable domain verdict object to include in API responses.
 */
export function getDomainVerdict(urlString) {
  const domainCheck = checkDomain(urlString);
  const lookalike   = detectLookalike(urlString);

  const tierLabels = {
    OFFICIAL:      { en: "Official UAE Government Source", ar: "مصدر حكومي إماراتي رسمي",    color: "green"  },
    VERIFIED:      { en: "Verified Licensed News Outlet",  ar: "منفذ إخباري مرخّص موثق",     color: "green"  },
    CREDIBLE:      { en: "Credible Licensed UAE Outlet",   ar: "منفذ إماراتي مرخّص موثوق",    color: "blue"   },
    UNVERIFIED_AE: { en: "Unverified UAE Domain (.ae)",    ar: "نطاق إماراتي غير موثق",       color: "orange" },
    UNKNOWN:       { en: "Unknown or Foreign Domain",      ar: "نطاق غير معروف أو أجنبي",     color: "red"    },
  };

  const tier   = domainCheck?.tier || "UNKNOWN";
  const labels = tierLabels[tier] || tierLabels["UNKNOWN"];

  return {
    url:           urlString,
    trusted:       domainCheck?.trusted ?? false,
    tier,
    labelEn:       labels.en,
    labelAr:       labels.ar,
    color:         labels.color,
    sourceName:    domainCheck?.nameEn || "Unknown",
    sourceNameAr:  domainCheck?.nameAr || "غير معروف",
    category:      domainCheck?.category || "Unknown",
    lookalike:     lookalike.suspicious,
    lookalikeMsg:  lookalike.message  || null,
    lookalikeMsgAr:lookalike.messageAr || null,
  };
}
