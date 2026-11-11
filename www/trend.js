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
 *
 * SNS 후보 채택 기준 (인스타그램·유튜브 쇼츠·틱톡·블로그 공개 게시물, 팀이 직접 찾아 입력 → 아래 규칙으로 자동 판정)
 *  ① 원문 확인: 공개 게시물 주소와 게시일이 있어야 한다
 *  ② 확산: 서로 다른 계정 3곳 이상이 같은 조합을 올렸거나, 한 게시물 반응(좋아요+댓글) 1,000 이상(확인일 기록)
 *  ③ 재현성: 게시물에서 재료·옵션이 2개 이상 확인돼야 한다
 *  ④ 제외: 주류가 들어간 조합
 *  - 하나라도 못 맞추면 트렌드 목록에 넣지 않는다. 판매 확인 여부와 광고·협찬 표기는 배지로 표시한다.
 *  - SNS 외부 최신성 E에 확산 가중치를 곱한다: 3개 계정 이상 1.0, 단일 게시물 반응 기준만 충족 0.8
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
  const SNS_PLATFORMS = { instagram: '📸 인스타그램', youtube: '▶️ 유튜브', tiktok: '🎵 틱톡', blog: '📝 블로그' };
  const MIN_ACCOUNTS = 3;
  const MIN_REACTIONS = 1000;
  const MIN_INGREDIENTS = 2;
  const ALCOHOL = ['소주', '맥주', '와인', '하이볼', '막걸리', '위스키', '보드카', '사케', '칵테일'];

  function isSns(item) { return !!SNS_PLATFORMS[String(item && item.platform || '')]; }

  // SNS 후보가 채택 기준을 모두 맞추는지 판정한다. 기사·공식 자료는 이 판정을 거치지 않는다.
  function snsCheck(item) {
    const url = String(item.sourceUrl || '');
    const accounts = Number(item.accounts) || 0;
    const reactions = Number(item.reactions) || 0;
    const ingredients = (item.ingredients || []).filter(x => String(x || '').trim());
    const text = [item.name, ...ingredients].join(' ');
    const checks = [
      { key: 'source', label: '원문·게시일 확인', pass: /^https:\/\//.test(url) && daysBetween(item.sourceDate, new Date()) != null },
      { key: 'spread', label: `확산(${MIN_ACCOUNTS}개 계정 이상 또는 반응 ${MIN_REACTIONS.toLocaleString()} 이상)`, pass: accounts >= MIN_ACCOUNTS || reactions >= MIN_REACTIONS },
      { key: 'recipe', label: `재료·옵션 ${MIN_INGREDIENTS}개 이상 확인`, pass: ingredients.length >= MIN_INGREDIENTS },
      { key: 'safe', label: '주류 미포함', pass: !ALCOHOL.some(w => text.includes(w)) }
    ];
    const spreadWeight = accounts >= MIN_ACCOUNTS ? 1 : (reactions >= MIN_REACTIONS ? 0.8 : 0);
    return { ok: checks.every(c => c.pass), checks, spreadWeight };
  }

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
    const sns = isSns(item);
    if (sns) e.value *= snsCheck(item).spreadWeight;
    const i = inAppScore(item.reviewers7d, item.avg7d);
    const total = W_EXTERNAL * e.value + W_INAPP * i;
    let label = '소개일 미확인';
    if (e.kind === 'recent' && i > 0) label = '🔥 외부 화제 + 앱 반응';
    else if (e.kind === 'recent' && sns) label = '📸 SNS 화제';
    else if (e.kind === 'recent') label = '📰 최근 외부 소개';
    else if (i > 0) label = '👥 PICKFOO 반응';
    else if (e.kind === 'steady') label = '📚 스테디(과거 소개)';
    return { total, external: e.value, inApp: i, age: e.age, kind: e.kind, label };
  }

  // 자동 수집 신호(네이버 블로그·유튜브)를 항목에 덧씌운다. 채택 기준을 통과할 때만 SNS 항목으로 바꾸고,
  // 통과하지 못하면 원래 출처(기사 등)를 유지한 채 수집 결과만 메모로 남긴다.
  const SIGNAL_SOURCES = { kakao_blog: { platform: 'blog', label: '다음 블로그 검색' }, naver_blog: { platform: 'blog', label: '네이버 블로그' }, youtube: { platform: 'youtube', label: '유튜브' } };
  function applySignal(item, signal, collectedAt) {
    if (!signal) return item;
    let best = null;
    Object.keys(SIGNAL_SOURCES).forEach(src => {
      const s = signal[src];
      if (!s) return;
      if (!best || s.authors30 > best.s.authors30 || (s.authors30 === best.s.authors30 && s.latest > best.s.latest)) best = { src, s };
    });
    if (!best) return item;
    const meta = SIGNAL_SOURCES[best.src];
    const sample = (best.s.samples || [])[0] || {};
    const overlay = Object.assign({}, item, {
      platform: meta.platform, sourceDate: best.s.latest, accounts: best.s.authors30, reactions: 0,
      sourceUrl: sample.url || '', sourceTitle: `${meta.label} 최근 30일 ${best.s.authors30}명 · 120일 ${best.s.authors120}명`,
      observedAt: String(collectedAt || '').slice(0, 10), autoCollected: true
    });
    // 원문 링크가 실제로 그 조합 글(제목에 조합 이름)일 때만 SNS 화제로 채택한다. titleMatch가 없는 예전 수집분은 그대로 둔다.
    if (sample.titleMatch === false) {
      return Object.assign({}, item, { signalNote: `${meta.label} 최근 30일 ${best.s.authors30}명 언급(제목 일치 원문 없음)` });
    }
    if (snsCheck(overlay).ok) return overlay;
    return Object.assign({}, item, { signalNote: `${meta.label} 최근 30일 ${best.s.authors30}명(기준 ${MIN_ACCOUNTS}명 미만)` });
  }

  // SNS 후보 중 채택 기준을 못 맞춘 것은 순위에서 뺀다.
  function rankTrends(items, now = new Date()) {
    return items.filter(it => !isSns(it) || snsCheck(it).ok).map((it, index) => ({ it, index, s: trendScore(it, now) }))
      .sort((a, b) => b.s.total - a.s.total || (a.s.age ?? 1e9) - (b.s.age ?? 1e9) || a.index - b.index)
      .map(x => Object.assign({}, x.it, { trend: x.s }));
  }

  return { HALF_LIFE_DAYS, RECENT_DAYS, W_EXTERNAL, W_INAPP, CURATED_SOURCES, SNS_PLATFORMS,
           MIN_ACCOUNTS, MIN_REACTIONS, applySignal, daysBetween, externalScore, inAppScore, isSns, snsCheck, trendScore, rankTrends };
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
<p class="pt-desc">최근 블로그·기사 언급과 PICKFOO 평가로 매긴 순위예요.</p>
<div class="pt-tabs" role="group" aria-label="트렌드 분류">
  <button type="button" class="pt-tab" data-k="recent" aria-pressed="true">지금 트렌드</button>
  <button type="button" class="pt-tab" data-k="sns" aria-pressed="false">SNS 화제</button>
  <button type="button" class="pt-tab" data-k="steady" aria-pressed="false">스테디</button>
</div>
<div class="pt-list" aria-live="polite"></div>
<p class="pt-policy pt-excluded"></p>
<p class="pt-policy pt-collect"></p>`;
  const anchor = document.getElementById('pickfooTrending7d') || results;
  anchor.before(sec);

  const list = sec.querySelector('.pt-list');
  let mode = 'recent';
  let candidates = [];
  let reviews = {};
  let signals = null;

  function fmtAge(age) { return age == null ? '소개일 미확인' : (age === 0 ? '오늘 소개' : `${age}일 전 소개`); }

  // 시연 모드(마이 탭 스위치): 화면에 '샘플'로 표시되는 샘플 평가를 앱 반응에 더한다. 서버·DB에는 저장하지 않는다.
  const DEMO_KEY = 'pickfoo_demo_reviews';
  const DEMO_REVIEWS = {
    'pf-curated-05': { n: 4, avg: 4.5 }, // 불닭 짜파게티
    'pf-curated-07': { n: 3, avg: 4.3 }, // 아샷추 편의점 버전
    'pf-curated-10': { n: 3, avg: 4.0 }, // 슈렉 프라푸치노
    'pf-curated-02': { n: 2, avg: 4.5 }, // 불닭 콘치즈
    'pf-curated-15': { n: 2, avg: 4.0 }  // 이탈리안 비엠티
  };
  function demoOn() { try { return localStorage.getItem(DEMO_KEY) === '1'; } catch (_) { return false; } }
  function withDemo(id, rv) {
    const d = demoOn() && DEMO_REVIEWS[id];
    if (!d) return { n: rv.n || 0, avg: rv.avg || 0, demo: false };
    const n = (rv.n || 0) + d.n;
    const avg = ((rv.avg || 0) * (rv.n || 0) + d.avg * d.n) / n;
    return { n, avg: Math.round(avg * 10) / 10, demo: true };
  }
  window.addEventListener('pickfoo-demo-change', () => render());

  function items() {
    const app = window.PICKFOO_APP;
    const recipes = (app && app.recipes) ? app.recipes().filter(r => r.curated) : [];
    const fromApp = recipes.map(r => {
      const src = T.CURATED_SOURCES[r.id] || {};
      const rv = withDemo(r.id, reviews[r.id] || {});
      return { key: r.id, name: r.name, brand: r.brand, inApp: true, sourceDate: src.date || null, demo: rv.demo,
               sourceTitle: src.title || '', sourceUrl: src.url || '', reviewers7d: rv.n, avg7d: rv.avg,
               ingredients: r.ingredients || [] };
    });
    const fromSources = candidates.map(c => ({ key: c.id, name: c.name, brand: c.brand, inApp: false,
      sourceDate: c.sourceDate, sourceTitle: c.sourceTitle, sourceUrl: c.sourceUrl, reviewers7d: 0, avg7d: 0,
      platform: c.platform || 'article', ingredients: c.ingredients || [], accounts: c.accounts || 0,
      reactions: c.reactions || 0, observedAt: c.observedAt || null, sponsored: !!c.sponsored,
      availability: c.availability || 'unverified' }));
    const sig = (signals && signals.items) || {};
    return fromApp.concat(fromSources).map(it => T.applySignal(it, sig[it.key], signals && signals.collectedAt));
  }

  function render() {
    const all = items();
    const ranked = T.rankTrends(all);
    const excluded = all.filter(x => T.isSns(x) && !T.snsCheck(x).ok).length;
    const exEl = sec.querySelector('.pt-excluded');
    exEl.textContent = excluded ? `SNS 후보 중 채택 기준을 못 맞춘 ${excluded}개는 제외했어요.` : '';
    const col = sec.querySelector('.pt-collect');
    if (signals && signals.collectedAt) {
      const names = (signals.sources || []).map(s => ({ kakao_blog: '다음(카카오) 블로그', naver_blog: '네이버 블로그', youtube: '유튜브' })[s] || s).join('·');
      col.textContent = `자동 수집: ${names} 공식 검색 API, 마지막 수집 ${signals.collectedAt.slice(0, 16).replace('T', ' ')} (24시간마다 갱신)`;
    } else if (signals && signals.configured && !Object.values(signals.configured).some(Boolean)) {
      col.textContent = '자동 수집: 검색 API 키가 설정되지 않아 아직 수집하지 않았어요.';
    } else if (signals && signals.refreshing) {
      col.textContent = '자동 수집: 지금 수집 중이에요. 잠시 후 새로고침하세요.';
    } else col.textContent = '';
    const shown = ranked.filter(x => mode === 'recent'
      ? (x.trend.kind === 'recent' || x.trend.inApp > 0)
      : mode === 'sns' ? T.isSns(x)
      : (x.trend.kind === 'steady' && x.trend.inApp === 0)).slice(0, mode === 'sns' ? 10 : 5);
    list.replaceChildren();
    if (!shown.length) {
      const p = document.createElement('p');
      p.style.cssText = 'margin:0;padding:10px 2px;font-size:13px;color:#685d55';
      p.textContent = mode === 'recent' ? '최근 120일 안에 소개됐거나 이번 주 평가가 있는 조합이 아직 없어요.'
        : mode === 'sns' ? '채택 기준을 통과한 SNS 조합이 아직 없어요.' : '스테디 조합이 없어요.';
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
      if (T.isSns(x)) {
        const pc = document.createElement('span'); pc.className = 'pt-chip'; pc.textContent = T.SNS_PLATFORMS[x.platform];
        meta.appendChild(pc);
      }
      meta.append(` ${x.brand} · ${fmtAge(x.trend.age)} · 외부 ${x.trend.external.toFixed(1)} / 앱 반응 ${x.trend.inApp.toFixed(1)} `);
      if (x.signalNote) meta.append(x.signalNote + ' ');
      if (x.demo) { const dm = document.createElement('span'); dm.className = 'pt-chip'; dm.style.cssText = 'background:#eee;color:#777;font-size:10px'; dm.textContent = '샘플'; meta.appendChild(dm); }
      if (x.autoCollected) { const ac = document.createElement('span'); ac.className = 'pt-chip'; ac.textContent = '자동 수집'; meta.appendChild(ac); }
      if (T.isSns(x)) {
        const spread = [];
        if (x.accounts && !x.autoCollected) spread.push(`${x.accounts}개 계정`);
        if (x.reactions) spread.push(`반응 ${Number(x.reactions).toLocaleString()}${x.observedAt ? ` (${x.observedAt} 확인)` : ''}`);
        if (spread.length) meta.append(spread.join(' · ') + ' ');
        if (x.sponsored) { const ad = document.createElement('span'); ad.className = 'pt-chip'; ad.textContent = '광고·협찬 표기'; meta.appendChild(ad); }
      }
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
        c2.textContent = x.availability === 'confirmed' ? '재료 판매 확인됨' : '가격·판매 확인 전 후보'; meta.appendChild(c2);
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
    try {
      const base = String(window.PICKFOO_API_BASE || window.location.origin).replace(/\/$/, '');
      const r = await fetch(base + '/api/catalog/trend-signals/', { cache: 'no-store' });
      if (r.ok) signals = await r.json();
    } catch (_) { signals = null; }
    render();
  }
  render();
  load();
})();
