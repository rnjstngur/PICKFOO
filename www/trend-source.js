/* PICKFOO_TREND_SOURCE — 조합 상세에 외부 출처와 트렌드 신호 구분을 표시한다.
   외부 신호: 기사·블로그·브랜드 공식 자료 등 수동 큐레이션 출처(자동 수집 아님).
   내부 신호: PICKFOO 앱 안 최근 7일 평가(curated-trending.js).
*/
(() => {
  'use strict';
  const detail = document.getElementById('detailContent');
  if (!detail) return;

  const POLICY = '갱신 정책: 팀이 주 1회 외부 출처(기사·SNS·브랜드 공식 메뉴)를 확인해 조합과 소개일을 추가·수정하고, ' +
                 '판매 종료나 옵션 변경이 확인되면 조합을 숨겨요. 트렌드 점수 = 0.6×외부 최신성(반감기 45일, 120일 후 스테디) + 0.4×최근 7일 앱 평가.';

  function el(tag, text, css) {
    const e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (css) e.style.cssText = css;
    return e;
  }

  function parts(note) {
    return String(note || '').split('|').map(s => s.trim()).filter(Boolean).map(s => {
      try {
        const u = new URL(s);
        if (u.protocol === 'https:' || u.protocol === 'http:') return { url: u.href, host: u.hostname.replace(/^www\./, '') };
      } catch (_) { /* 일반 메모 */ }
      return { text: s };
    });
  }

  function attach() {
    const app = window.PICKFOO_APP;
    if (!app) return;
    const id = app.selected();
    const r = id ? app.recipe(id) : null;
    const anchor = detail.querySelector('.detail-stats');
    if (!r || !anchor) return;
    const old = detail.querySelector('#pf-trend-source');
    if (old && old.dataset.recipe === r.id) return;
    if (old) old.remove();

    const box = el('div', null, 'margin:14px 0 4px;padding:13px 14px;border:1px solid #e6dccf;border-radius:12px;background:#fffdf9;');
    box.id = 'pf-trend-source';
    box.dataset.recipe = r.id;
    const items = parts(r.sourceNote);
    const links = items.filter(x => x.url);
    const datedSource = !!(window.PICKFOO_TREND && window.PICKFOO_TREND.CURATED_SOURCES[r.id]);
    const tag = (links.length || datedSource) ? '🔗 외부 출처 확인' : (r.curated ? '🧪 응용 조합 · 외부 출처 없음' : '👤 사용자 등록 조합');
    box.appendChild(el('div', tag, 'font-weight:800;font-size:13px;color:#4a3a2e;margin-bottom:6px;'));
    const T = window.PICKFOO_TREND;
    if (T && r.curated) {
      const src = T.CURATED_SOURCES[r.id];
      if (src) {
        const a = el('a', `📰 ${src.title} (${src.date}) ↗`, 'display:block;margin:0 0 6px;color:#5a4332;font-size:12px;');
        a.href = src.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        box.appendChild(a);
      }
      const t = T.trendScore({ sourceDate: src ? src.date : null });
      box.appendChild(el('div', `트렌드 분류: ${t.label}${t.age != null ? ` · ${t.age}일 전 소개` : ''} · 외부 최신성 ${t.external.toFixed(1)}/10`,
                         'font-size:12px;font-weight:700;color:#7a4a2a;margin-bottom:6px;'));
    }
    links.forEach(x => {
      const a = el('a', `${x.host} ↗`, 'display:inline-block;margin:0 8px 6px 0;padding:5px 10px;border-radius:999px;background:#f1e8dc;color:#5a4332;font-size:12px;text-decoration:none;');
      a.href = x.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      box.appendChild(a);
    });
    items.filter(x => x.text).forEach(x => box.appendChild(el('div', '· ' + x.text, 'font-size:12px;color:#6f6157;line-height:1.55;')));
    anchor.after(box);
  }
  new MutationObserver(attach).observe(detail, { childList: true, subtree: true });
  attach();
})();
