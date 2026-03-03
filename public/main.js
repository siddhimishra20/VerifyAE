/**
 * VerifyAE — Frontend JS
 * All event listeners attached after DOMContentLoaded
 */

const API_BASE = 'http://localhost:3001/api'; // Change to your deployed URL in production

// ─── State ───────────────────────────────────────────────────────────────────
let currentTab  = 'text';
let currentLang = 'en';
let lastResult  = null;
let lastContent = '';
let lastUrl     = '';

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // ── Language buttons ────────────────────────────────────────────────────────
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  // ── Tab buttons ─────────────────────────────────────────────────────────────
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab, btn));
  });

  // ── Textarea character count ─────────────────────────────────────────────────
  const textInput = document.getElementById('textInput');
  if (textInput) {
    textInput.addEventListener('input', updateCharCount);
  }

  // ── Analyze button ───────────────────────────────────────────────────────────
  const analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', analyze);
  }

  // ── Report button ────────────────────────────────────────────────────────────
  const reportBtn = document.getElementById('reportBtn');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => submitReport('user-flagged'));
  }

  // ── Keyboard shortcut: Cmd/Ctrl + Enter to analyze ──────────────────────────
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') analyze();
  });

  console.log('✅ VerifyAE frontend loaded and listeners attached.');
});

// ─── Language ─────────────────────────────────────────────────────────────────
function setLang(lang) {
  currentLang = lang;

  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });

  document.body.classList.toggle('ar', lang === 'ar');

  document.querySelectorAll('[data-en]').forEach(el => {
    el.innerHTML = el.getAttribute('data-' + lang) || el.getAttribute('data-en');
  });

  const textInput = document.getElementById('textInput');
  if (textInput) {
    textInput.placeholder = lang === 'ar'
      ? 'الصق منشوراً من وسائل التواصل الاجتماعي أو مقتطفاً إخبارياً للتحقق منه...'
      : 'Paste a social media post, news excerpt, or any claim you want to verify...';
  }
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function switchTab(tab, btn) {
  currentTab = tab;

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  btn.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
}

// ─── Char count ───────────────────────────────────────────────────────────────
function updateCharCount() {
  const len = document.getElementById('textInput').value.length;
  document.getElementById('charCount').textContent = len + ' / 3000';
}

// ─── Show/Hide helpers ────────────────────────────────────────────────────────
function showLoading(visible, msg) {
  document.getElementById('loadingState').classList.toggle('active', visible);
  document.getElementById('analyzeBtn').disabled = visible;

  if (visible) {
    document.getElementById('resultCard').classList.remove('active');
    if (msg) {
      const loadingText = document.querySelector('.loading-text');
      if (loadingText) loadingText.textContent = msg;
    }
  }
}

function showError(msg) {
  const el = document.getElementById('errorMsg');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 6000);
}

// ─── Score bar color ──────────────────────────────────────────────────────────
function colorForScore(pct) {
  if (pct < 33) return '#00C3A5';
  if (pct < 66) return '#F5A623';
  return '#FF4646';
}

// ─── Analyze ──────────────────────────────────────────────────────────────────
async function analyze() {
  const isArabic = currentLang === 'ar';
  let content = '';
  let source  = currentTab;
  lastUrl     = '';

  if (currentTab === 'text') {
    content = document.getElementById('textInput').value.trim();
  } else {
    const rawUrl = document.getElementById('urlInput').value.trim();
    if (!rawUrl) {
      showError(isArabic ? 'الرجاء إدخال رابط.' : 'Please enter a URL.');
      return;
    }

    showLoading(true, isArabic ? 'جارٍ جلب المقال...' : 'Fetching article…');
    try {
      const scrapeRes = await fetch(`${API_BASE}/scrape`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url: rawUrl }),
      });
      const scrapeData = await scrapeRes.json();
      if (!scrapeRes.ok) throw new Error(scrapeData.error || 'Scrape failed');
      content = `Title: ${scrapeData.title}\n\n${scrapeData.text}`;
      lastUrl = rawUrl;
    } catch (e) {
      showLoading(false);
      showError(e.message || (isArabic ? 'تعذّر جلب الرابط.' : 'Could not fetch URL.'));
      return;
    }
  }

  if (!content) {
    showError(isArabic
      ? 'الرجاء إدخال نص أو رابط للتحليل.'
      : 'Please enter some text or a URL to analyze.');
    return;
  }

  lastContent = content;
  document.getElementById('errorMsg').classList.remove('active');
  showLoading(true, isArabic
    ? 'جارٍ فحص أنماط المعلومات المضللة...'
    : 'Scanning for misinformation patterns…');

  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        content,
        lang:   currentLang,
        source,
        url:    lastUrl || undefined,
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Analysis failed');
    lastResult = result;
    renderResult(result);
  } catch (e) {
    const isNetworkErr = e instanceof TypeError && e.message.toLowerCase().includes('fetch');
    showError(isNetworkErr
      ? (isArabic
          ? 'تعذّر الاتصال بالخادم. تأكد من تشغيل الخادم على المنفذ 3001.'
          : 'Cannot connect to server. Make sure the backend is running on port 3001.')
      : (e.message || (isArabic
          ? 'فشل التحليل. يرجى المحاولة مرة أخرى.'
          : 'Analysis failed. Please try again.')));
    console.error('[VerifyAE] Analyze error:', e);
  } finally {
    showLoading(false);
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────
async function submitReport(reason) {
  if (!lastContent) return;
  const isArabic = currentLang === 'ar';

  try {
    const res = await fetch(`${API_BASE}/report`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        content: lastContent,
        verdict: lastResult?.verdict || 'UNKNOWN',
        reason,
        lang:    currentLang,
      }),
    });
    const data = await res.json();
    if (data.success) {
      const btn = document.getElementById('reportBtn');
      btn.textContent = isArabic
        ? `✓ تم الإبلاغ (${data.reportId})`
        : `✓ Reported (${data.reportId})`;
      btn.disabled      = true;
      btn.style.opacity = '0.6';
    }
  } catch (e) {
    console.error('[VerifyAE] Report error:', e);
  }
}

// ─── Render result ────────────────────────────────────────────────────────────
function renderResult(r) {
  const card  = document.getElementById('resultCard');
  const badge = document.getElementById('verdictBadge');
  const icon  = document.getElementById('verdictIcon');
  const label = document.getElementById('verdictLabel');
  const pill  = document.getElementById('confidencePill');

  badge.className = 'verdict-badge verdict-' + r.verdict;

  const icons  = { SAFE: '✓', WARN: '!', DANGER: '✕' };
  const labels = {
    SAFE:   currentLang === 'ar' ? 'محتوى موثوق'      : 'Likely Credible',
    WARN:   currentLang === 'ar' ? 'تحقق مطلوب'       : 'Verify Before Sharing',
    DANGER: currentLang === 'ar' ? 'معلومات مضللة'    : 'Likely Misinformation',
  };

  icon.textContent  = icons[r.verdict];
  label.textContent = labels[r.verdict];
  pill.textContent  = (currentLang === 'ar' ? 'ثقة: ' : 'Confidence: ') + r.confidence + '%';

  document.getElementById('summaryText').textContent = r.summary;

  // Domain verdict badge
  const domainBadgeWrap = document.getElementById('domainBadgeWrap');
  domainBadgeWrap.innerHTML = '';
  if (r.domainVerdict) {
    const dv        = r.domainVerdict;
    const isAr      = currentLang === 'ar';
    const colorMap  = { green: '#00C3A5', blue: '#0076FF', orange: '#F5A623', red: '#FF4646' };
    const bgMap     = { green: 'rgba(0,195,165,0.08)', blue: 'rgba(0,118,255,0.08)', orange: 'rgba(245,166,35,0.08)', red: 'rgba(255,70,70,0.08)' };
    const borderMap = { green: 'rgba(0,195,165,0.25)', blue: 'rgba(0,118,255,0.25)', orange: 'rgba(245,166,35,0.25)', red: 'rgba(255,70,70,0.25)' };
    const c         = dv.color || 'orange';
    const badgeIcon = dv.trusted ? '✓' : (dv.tier === 'UNVERIFIED_AE' ? '~' : '✕');
    const name      = isAr ? (dv.sourceNameAr || dv.sourceName) : dv.sourceName;
    const badgeLbl  = isAr ? dv.labelAr : dv.labelEn;

    domainBadgeWrap.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px;">
        <div style="display:inline-flex;align-items:center;gap:7px;padding:6px 13px;border-radius:8px;background:${bgMap[c]};border:1px solid ${borderMap[c]};font-size:12px;">
          <span style="color:${colorMap[c]};font-weight:700;font-size:13px;">${badgeIcon}</span>
          <span style="color:${colorMap[c]};font-weight:700;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.08em;">${badgeLbl}</span>
          <span style="color:#6B8399;font-size:11px;">·</span>
          <span style="color:#E8F0F8;font-size:11px;">${name}</span>
        </div>
        ${r.lookalike
          ? `<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;background:rgba(255,70,70,0.1);border:1px solid rgba(255,70,70,0.3);font-size:11px;color:#FF4646;font-weight:600;">
               ⚠ ${isAr ? 'تحذير: نطاق مشبوه' : 'Lookalike Domain Detected'}
             </div>`
          : ''}
      </div>`;
  }

  // Flags
  const flagsList = document.getElementById('flagsList');
  flagsList.innerHTML = '';
  if (r.flags && r.flags.length) {
    r.flags.forEach(f => {
      const div = document.createElement('div');
      div.className = 'flag-item ' + f.type;
      div.innerHTML = `<span class="flag-emoji">${f.emoji}</span><span>${f.text}</span>`;
      flagsList.appendChild(div);
    });
  } else {
    flagsList.innerHTML = `<div class="flag-item info">
      <span class="flag-emoji">✅</span>
      <span>${currentLang === 'ar' ? 'لم يتم اكتشاف علامات تحذيرية.' : 'No significant red flags detected.'}</span>
    </div>`;
  }

  // Score bars
  const scoreBars   = document.getElementById('scoreBars');
  scoreBars.innerHTML = '';
  const scoreLabels = {
    en: {
      fearAmplification:    'Fear Amplification',
      unverifiedClaims:     'Unverified Claims',
      sourceCredibility:    'Source Credibility',
      emotionalManipulation:'Emotional Manipulation',
    },
    ar: {
      fearAmplification:    'تضخيم الخوف',
      unverifiedClaims:     'ادعاءات غير موثقة',
      sourceCredibility:    'مصداقية المصدر',
      emotionalManipulation:'التلاعب العاطفي',
    },
  };

  Object.entries(r.scores || {}).forEach(([key, val]) => {
    const pct       = Math.min(100, Math.max(0, val));
    const isCredib  = key === 'sourceCredibility';
    const fillColor = isCredib
      ? (pct > 66 ? '#00C3A5' : pct > 33 ? '#F5A623' : '#FF4646')
      : colorForScore(pct);

    const row = document.createElement('div');
    row.className = 'score-bar-row';
    row.innerHTML = `
      <span class="score-bar-label">${(scoreLabels[currentLang] || scoreLabels.en)[key] || key}</span>
      <div class="score-bar-track">
        <div class="score-bar-fill" style="width:0%;background:${fillColor}" data-target="${pct}"></div>
      </div>
      <span class="score-val">${pct}%</span>`;
    scoreBars.appendChild(row);
  });

  // Animate bars after paint
  requestAnimationFrame(() => {
    setTimeout(() => {
      scoreBars.querySelectorAll('.score-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.target + '%';
      });
    }, 80);
  });

  // Recommendation
  const recBlock  = document.getElementById('recommendationBlock');
  const recEmojis = { SAFE: '✅', WARN: '⚠️', DANGER: '🚫' };
  recBlock.innerHTML = `<span class="rec-icon">${recEmojis[r.verdict]}</span><span>${r.recommendation}</span>`;

  // Reset report button
  const reportBtn = document.getElementById('reportBtn');
  if (reportBtn) {
    reportBtn.disabled      = false;
    reportBtn.style.opacity = '1';
    reportBtn.innerHTML     = `🚩 <span>${currentLang === 'ar' ? 'أبلغ عن هذا المحتوى للسلطات' : 'Report this content to authorities'}</span>`;
  }

  card.classList.add('active');
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
