/* PICKFOO_TREND_SCORE — 외부 소개일(최신성)과 앱 안 최근 7일 평가(사용자 반응)를 합친 트렌드 점수.
 *
 * 정책 (판넬·발표와 동일하게 유지)
 *  E 외부 최신성 = 10 × 0.5^(소개 후 경과일 / 45)   · 반감기 45일
 *     소개 후 120일이 지나면 E = 0, '스테디(과거 소개)'로 분류해 최근 트렌드와 구분
 *     소개일을 모르면 E = 0, '소개일 미확인'
 *  I 앱 반응     = min(10, 2 × 최근 7일 서로 다른 평가자 수) × (최근 7일 평균 별점 / 5)
 *  T 트렌드 점수 = 0.6 × E + 0.4 × I
 *  갱신: 팀이 주 1회 외부 출처를 추가·확인(수동 큐레이션, 자동 수집 아님), 앱 반응은 요청 시마다 다시 계산
 *  누적 좋아요·누적 리뷰 수는 쓰지 않는다(과거 인기와 현재 유행을 섞지 않기 위해).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PICKFOO_TREND = api;
})(typeof window !== 'undefined' ? window : null, function () {
  const HALF_LIFE_DAYS = 45;
  const RECENT_DAYS = 120;
  const W_EXTERNAL = 0.6;
  const W_INAPP = 0.4;

  // 앱 전시 조합 중 출처 자료(보도일 확인)와 같은 조합인 항목. 출처: PICKFOO_실제조합_초기데이터/sources.csv
  const CURATED_SOURCES = {
    'pf-curated-07': { date: '2023-05-29', title: '더팩트 불그리·메론소다·아샷추 등 소개', url: 'https://news.tf.co.kr/read/livingculture/2020696.htm' },
    'pf-curated-09': { date: '2020-06-28', title: '뉴시스 스타벅스 커스텀 레시피 소개', url: 'https://www.newsis.com/view/NISX20200626_0001074512' },
    'pf-curated-10': { date: '2020-06-28', title: '뉴시스 스타벅스 커스텀 레시피 소개', url: 'https://www.newsis.com/view/NISX20200626_0001074512' },
    'pf-curated-12': { date: '2020-06-28', title: '뉴시스 스타벅스 커스텀 레시피 소개', url: 'https://www.newsis.com/view/NISX20200626_0001074512' }
  };

  function daysBetween(dateText, now) {
    if (!dateText) return null;
    const d = new Date(String(dateText) + 'T00:00:00+09:00');
    if (Number.isNaN(d.getTime())) return null;
    return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86400000));
  }

  function externalScore(dateText, now = new Date()) {
    const age = daysBetween(dateText, now);
    if (age == null) return { value: 0, age: null, kind: 'unknown' };
    if (age > RECENT_DAYS) return { value: 0, age, kind: 'steady' };
    return { value: 10 * Math.pow(0.5, age / HALF_LIFE_DAYS), age, kind: 'recent' };
  }

  function inAppScore(reviewers7d, avg7d) {
    const n = Number(reviewers7d) || 0;
    const avg = Number(avg7d) || 0;
    if (n <= 0 || avg <= 0) return 0;
    return Math.min(10, 2 * n) * Math.min(1, avg / 5);
  }

  function trendScore(item, now = new Date()) {
    const e = externalScore(item.sourceDate, now);
    const i = inAppScore(item.reviewers7d, item.avg7d);
    const total = W_EXTERNAL * e.value + W_INAPP * i;
    let label = '소개일 미확인';
    if (e.kind === 'recent' && i > 0) label = '🔥 외부 화제 + 앱 반응';
    else if (e.kind === 'recent') label = '📰 최근 외부 소개';
    else if (i > 0) label = '👥 PICKFOO 반응';
    else if (e.kind === 'steady') label = '📚 스테디(과거 소개)';
    return { total, external: e.value, inApp: i, age: e.age, kind: e.kind, label };
  }

  function rankTrends(items, now = new Date()) {
    return items.map((it, index) => ({ it, index, s: trendScore(it, now) }))
      .sort((a, b) => b.s.total - a.s.total || (a.s.age ?? 1e9) - (b.s.age ?? 1e9) || a.index - b.index)
      .map(x => Object.assign({}, x.it, { trend: x.s }));
  }

  return { HALF_LIFE_DAYS, RECENT_DAYS, W_EXTERNAL, W_INAPP, CURATED_SOURCES,
           daysBetween, externalScore, inAppScore, trendScore, rankTrends };
});

/* ---------- 화면: 홈 '트렌드 조합' 패널 ---------- */
(() => {
  'use strict';
  if (typeof document === 'undefined') return;
  const T = window.PICKFOO_TREND;
  const home = document.getElementById('homeView');
  const results = home && home.querySelector('.results-section');
  if (!home || !results || document.getElementById('pfTrendPanel')) return;

  const css = document.createElement('style');
  css.textContent = `
#pfTrendPanel{margin:22px 0 20px;padding:16px 14px;border-radius:16px;border:1px solid #e9dfd2;background:#fffdf9}
#pfTrendPanel h2{margin:0;font-size:18px;color:#332f2b}
#pfTrendPanel .pt-desc{margin:8px 0 10px;font-size:12.5px;line-height:1.55;color:#685d55}
#pfTrendPanel .pt-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
#pfTrendPanel .pt-tab{border:1px solid #e3d6c6;background:#fff;border-radius:999px;padding:6px 11px;font-size:12px;font-weight:700;color:#5b4b3e;cursor:pointer}
#pfTrendPanel .pt-tab[aria-pressed="true"]{background:#332f2b;color:#fff;border-color:#332f2b}
#pfTrendPanel .pt-list{display:grid;gap:8px}
#pfTrendPanel .pt-item{border:1px solid #eee3d6;border-radius:12px;padding:10px 12px;background:#fff;display:grid;grid-template-columns:auto 1fr auto;gap:4px 10px;align-items:center}
#pfTrendPanel .pt-rank{font-weight:800;color:#e3572b;font-variant-numeric:tabular-nums}
#pfTrendPanel .pt-name{font-weight:750;font-size:14px;color:#332f2b;min-width:0}
#pfTrendPanel .pt-score{font-weight:800;font-size:15px;font-variant-numeric:tabular-nums;color:#332f2b;text-align:right}
#pfTrendPanel .pt-meta{grid-column:2 / 4;font-size:11.5px;color:#7a6c61;line-height:1.5}
#pfTrendPanel .pt-meta a{color:#7a5236}
#pfTrendPanel .pt-chip{display:inline-block;font-size:11px;padding:2px 7px;border-radius:999px;background:#f3ebe1;color:#5b4b3e;margin-right:4px}
#pfTrendPanel .pt-open{border:0;background:none;color:#c2552c;font-weight:700;font-size:12px;padding:0;cursor:pointer}
#pfTrendPanel .pt-policy{margin-top:10px;font-size:11px;line-height:1.6;color:#8a7769}`;
  document.head.appendChild(css);

  const sec = document.createElement('section');
  sec.id = 'pfTrendPanel';
  sec.setAttribute('aria-label', '트렌드 조합');
  sec.innerHTML = `<h2>📈 트렌드 조합</h2>
<p class="pt-desc">외부 기사·출처의 소개 날짜가 최근일수록, PICKFOO 안에서 최근 7일 평가가 많을수록 점수가 높아요. 오래전에 유명했던 조합은 '스테디'로 따로 보여줘요.</p>
<div class="pt-tabs" role="group" aria-label="트렌드 분류">
  <button type="button" class="pt-tab" data-k="recent" aria-pressed="true">지금 트렌드</button>
  <button type="button" class="pt-tab" data-k="steady" aria-pressed="false">스테디</button>
</div>
<div class="pt-list" aria-live="polite"></div>
<p class="pt-policy">점수 = 0.6 × 외부 최신성(반감기 ${T.HALF_LIFE_DAYS}일, 소개 후 ${T.RECENT_DAYS}일 지나면 스테디로 이동) + 0.4 × 앱 반응(최근 7일 서로 다른 평가자 수·평균 별점). 외부 출처는 팀이 주 1회 확인해 추가하는 수동 큐레이션이며, 조회수·판매량·누적 좋아요는 쓰지 않아요.</p>`;
  const anchor = document.getElementById('pickfooTrending7d') || results;
  anchor.before(sec);

  const list = sec.querySelector('.pt-list');
  let mode = 'recent';
  let candidates = [];
  let reviews = {};

  function fmtAge(age) { return age == null ? '소개일 미확인' : (age === 0 ? '오늘 소개' : `${age}일 전 소개`); }

  function items() {
    const app = window.PICKFOO_APP;
    const recipes = (app && app.recipes) ? app.recipes().filter(r => r.curated) : [];
    const fromApp = recipes.map(r => {
      const src = T.CURATED_SOURCES[r.id] || {};
      const rv = reviews[r.id] || {};
      return { key: r.id, name: r.name, brand: r.brand, inApp: true, sourceDate: src.date || null,
               sourceTitle: src.title || '', sourceUrl: src.url || '', reviewers7d: rv.n || 0, avg7d: rv.avg || 0 };
    });
    const fromSources = candidates.map(c => ({ key: c.id, name: c.name, brand: c.brand, inApp: false,
      sourceDate: c.sourceDate, sourceTitle: c.sourceTitle, sourceUrl: c.sourceUrl, reviewers7d: 0, avg7d: 0 }));
    return fromApp.concat(fromSources);
  }

  function render() {
    const ranked = T.rankTrends(items());
    const shown = ranked.filter(x => mode === 'recent'
      ? (x.trend.kind === 'recent' || x.trend.inApp > 0)
      : (x.trend.kind === 'steady' && x.trend.inApp === 0)).slice(0, 5);
    list.replaceChildren();
    if (!shown.length) {
      const p = document.createElement('p');
      p.style.cssText = 'margin:0;padding:10px 2px;font-size:13px;color:#685d55';
      p.textContent = mode === 'recent' ? '최근 120일 안에 소개됐거나 이번 주 평가가 있는 조합이 아직 없어요.' : '스테디 조합이 없어요.';
      list.appendChild(p);
      return;
    }
    shown.forEach((x, i) => {
      const row = document.createElement('div'); row.className = 'pt-item';
      const rank = document.createElement('span'); rank.className = 'pt-rank'; rank.textContent = i + 1;
      const name = document.createElement('span'); name.className = 'pt-name'; name.textContent = x.name;
      const score = document.createElement('span'); score.className = 'pt-score';
      score.textContent = x.trend.total.toFixed(1);
      score.title = '트렌드 점수(0~10)';
      const meta = document.createElement('div'); meta.className = 'pt-meta';
      const chip = document.createElement('span'); chip.className = 'pt-chip'; chip.textContent = x.trend.label;
      meta.appendChild(chip);
      meta.append(` ${x.brand} · ${fmtAge(x.trend.age)} · 외부 ${x.trend.external.toFixed(1)} / 앱 반응 ${x.trend.inApp.toFixed(1)} `);
      if (x.sourceUrl) {
        const a = document.createElement('a'); a.href = x.sourceUrl; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.textContent = (x.sourceTitle || '출처') + ' ↗'; meta.appendChild(a);
      }
      if (x.inApp) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'pt-open'; b.textContent = ' · 조합 보기';
        b.addEventListener('click', () => {
          const card = [...document.querySelectorAll('.recipe-card')].find(c => c.textContent.includes(x.name));
          if (card) card.click();
        });
        meta.appendChild(b);
      } else {
        const c2 = document.createElement('span'); c2.className = 'pt-chip'; c2.style.marginLeft = '4px';
        c2.textContent = '가격·판매 확인 전 후보'; meta.appendChild(c2);
      }
      row.append(rank, name, score, meta);
      list.appendChild(row);
    });
  }

  sec.querySelectorAll('.pt-tab').forEach(btn => btn.addEventListener('click', () => {
    mode = btn.dataset.k;
    sec.querySelectorAll('.pt-tab').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    render();
  }));

  async function load() {
    try {
      const r = await fetch('trend-candidates.json', { cache: 'no-store' });
      if (r.ok) candidates = await r.json();
    } catch (_) { candidates = []; }
    try {
      const base = String(window.PICKFOO_API_BASE || window.location.origin).replace(/\/$/, '');
      const r = await fetch(base + '/api/catalog/curated/trending/', { credentials: 'include', cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        (data.items || []).forEach(it => { reviews[it.key] = { n: it.review_count, avg: it.average_rating }; });
      }
    } catch (_) { reviews = {}; }
    render();
  }
  render();
  load();
})();
