/* PICKFOO STEP 236: seven-day real review activity chart (no fabricated counts). */
(() => {
  'use strict';
  const home = document.getElementById('homeView');
  const results = home?.querySelector('.results-section');
  if (!home || !results || document.getElementById('pickfooTrending7d')) return;

  const section = document.createElement('section');
  section.id = 'pickfooTrending7d';
  section.setAttribute('aria-label', '최근 7일 평가 인기 조합');
  section.style.cssText = 'margin:22px 0 20px;padding:16px 14px;border-radius:16px;border:1px solid #e9dfd2;background:#fffdf9;';
  const head = document.createElement('div');
  head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;';
  const title = document.createElement('h2');
  title.textContent = '🔥 최근 7일 평가 인기';
  title.style.cssText = 'margin:0;font-size:18px;color:#332f2b;';
  const hint = document.createElement('small');
  hint.textContent = '실제 평가 수 기준 · 최대 5개';
  hint.style.cssText = 'color:#685d55;font-size:12px;';
  head.append(title, hint);
  const desc = document.createElement('p');
  desc.textContent = '최근 7일간 새로 작성된 평가가 많은 전시 조합 순서예요. 조회수나 판매량 순위는 아니에요.';
  desc.style.cssText = 'margin:8px 0 12px;line-height:1.5;font-size:13px;color:#685d55;';
  const list = document.createElement('div');
  list.setAttribute('aria-live','polite');
  list.style.cssText = 'display:grid;gap:8px;';
  section.append(head, desc, list);
  results.before(section);

  const apiBase = window.PICKFOO_API_BASE || window.location.origin;
  let timer = 0;
  let generation = 0;

  function status(message) {
    list.replaceChildren();
    const p = document.createElement('p');
    p.style.cssText = 'margin:0;padding:12px 4px;color:#655950;font-size:13px;';
    p.textContent = message;
    list.appendChild(p);
  }

  function show(items) {
    list.replaceChildren();
    if (!Array.isArray(items) || items.length === 0) {
      status('아직 최근 7일 동안 작성된 평가가 없어요. 실제 평가가 등록되면 순위가 표시돼요.');
      return;
    }
    for (const [index, item] of items.slice(0,5).entries()) {
      if (!/^pf-curated-(0[1-9]|1\d|20)$/.test(String(item.key)) ||
          !Number.isInteger(item.review_count) || item.review_count < 1) continue;
      const row = document.createElement('button');
      row.type = 'button';
      row.setAttribute('aria-label', `${index+1}위 ${item.name} 자세히 보기`);
      row.style.cssText = 'display:flex;gap:12px;align-items:center;text-align:left;width:100%;padding:12px;border:1px solid #eee5d9;border-radius:12px;background:#fff;cursor:pointer;';
      const rank = document.createElement('strong');
      rank.textContent = String(index+1);
      rank.style.cssText = 'min-width:24px;color:#cc5a31;font-size:19px;';
      const copy = document.createElement('span');
      copy.style.cssText = 'display:grid;gap:3px;min-width:0;';
      const name = document.createElement('strong');
      name.textContent = String(item.name || item.key);
      name.style.cssText = 'font-size:14px;color:#292522;overflow-wrap:anywhere;';
      const detail = document.createElement('small');
      const mean = Number(item.average_rating);
      detail.textContent = `최근 평가 ${item.review_count}건` +
        (Number.isFinite(mean) && mean >= 1 && mean <= 5 ? ` · 평균 ★ ${mean.toFixed(1)}` : '');
      detail.style.cssText = 'color:#75695f;font-size:12px;';
      copy.append(name,detail);
      row.append(rank,copy);
      row.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('pickfoo:open-curated-recipe', {detail:{key:item.key}}));
      });
      list.appendChild(row);
    }
    if (!list.children.length) status('표시 가능한 평가 데이터가 없어요.');
  }

  async function load() {
    const current = ++generation;
    try {
      const url = new URL('/api/catalog/curated/trending/', apiBase);
      const response = await fetch(url.href, {credentials:'include', cache:'no-store'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (current !== generation) return;
      if (data.basis !== 'reviews_created' || !Array.isArray(data.items)) throw new Error('응답 형식 오류');
      show(data.items);
    } catch (e) {
      if (current !== generation) return;
      console.warn('최근 7일 인기 조합 조회 실패:',e);
      status('최근 7일 평가 순위를 불러오지 못했어요. 새로고침 후 다시 확인해 주세요.');
    }
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(() => void load(), 250); }
  window.addEventListener('pickfoo:curated-verification', schedule);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') schedule();
  });
  status('최근 7일 평가 현황을 불러오는 중…');
  void load();
})();
