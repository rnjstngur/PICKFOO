/* PICKFOO_SAVED — 조합 저장(이 기기에 저장).
   - 조합 상세 화면에 "☆ 저장" 버튼을 붙이고, 마이 탭에 "저장한 조합" 목록을 보여준다.
   - 저장 위치는 이 기기 브라우저(localStorage)라 다른 기기와 동기화되지 않는다(화면에 명시).
   - 예전 단독 마이페이지(mypage.html)에서 넘어오면 index.html#my로 마이 탭을 연다. */
(() => {
  'use strict';
  const KEY = 'pickfoo_saved_combos';
  const detail = document.getElementById('detailContent');
  const myView = document.getElementById('myPageView');

  function load() {
    try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (_) { return []; }
  }
  function store(ids) {
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch (_) { /* 저장소를 못 쓰는 환경 */ }
  }
  function el(tag, text, css) {
    const e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (css) e.style.cssText = css;
    return e;
  }
  const app = () => window.PICKFOO_APP;

  // ── 상세 화면 저장 버튼 ──
  function paintButton(btn, on) {
    btn.textContent = on ? '★ 저장됨' : '☆ 이 조합 저장';
    btn.style.background = on ? '#fff3d6' : '#fff';
  }
  function attachButton() {
    const a = app();
    if (!detail || !a) return;
    const id = a.selected();
    const anchor = detail.querySelector('.detail-stats');
    if (!id || !anchor) return;
    const old = detail.querySelector('#pf-save-btn');
    if (old && old.dataset.recipe === id) return;
    if (old) old.remove();
    const btn = el('button', null, 'display:block;margin:10px 0 0;padding:9px 14px;border:1.5px solid #e0b45a;border-radius:999px;color:#7a4a12;font-weight:800;font-size:13px;cursor:pointer;');
    btn.type = 'button'; btn.id = 'pf-save-btn'; btn.dataset.recipe = id;
    paintButton(btn, load().includes(id));
    btn.addEventListener('click', () => {
      const ids = load();
      const on = !ids.includes(id);
      store(on ? [id, ...ids] : ids.filter(x => x !== id));
      paintButton(btn, on);
      renderList();
    });
    anchor.after(btn);
  }

  // ── 마이 탭 목록 ──
  function renderList() {
    if (!myView) return;
    let box = myView.querySelector('#pf-saved-list');
    if (!box) {
      box = el('div', null, 'margin:14px 0;padding:14px;border:1px solid #e6dccf;border-radius:14px;background:#fffdf9;');
      box.id = 'pf-saved-list';
      const card = myView.querySelector('.profile-card');
      if (card) card.after(box); else myView.appendChild(box);
    }
    box.replaceChildren();
    box.appendChild(el('h3', '⭐ 저장한 조합', 'margin:0 0 4px;font-size:16px;color:#3d3027;'));
    box.appendChild(el('p', '이 기기에 저장돼요. 조합 상세 화면에서 "☆ 이 조합 저장"을 누르세요.', 'margin:0 0 8px;font-size:12px;color:#8a7769;'));
    const a = app();
    const items = load().map(id => (a && a.recipe(id)) || null).filter(Boolean);
    if (!items.length) {
      box.appendChild(el('p', '아직 저장한 조합이 없어요.', 'margin:4px 0 0;font-size:13px;color:#6f6157;'));
      return;
    }
    items.forEach(r => {
      const row = el('button', null, 'display:flex;justify-content:space-between;align-items:center;width:100%;margin:6px 0 0;padding:10px 12px;border:1px solid #ece3d6;border-radius:10px;background:#fff;cursor:pointer;text-align:left;font-size:14px;');
      row.type = 'button';
      const price = window.PICKFOO_PRICES ? window.PICKFOO_PRICES.info(r).label : '';
      row.append(el('span', r.name, 'font-weight:750;color:#3d3027;'), el('span', `${r.brand || ''}${price ? ' · ' + price : ''} ›`, 'font-size:12px;color:#8a7769;'));
      row.addEventListener('click', () => { if (typeof window.openDetail === 'function') window.openDetail(r.id); });
      box.appendChild(row);
    });
  }

  if (detail) new MutationObserver(attachButton).observe(detail, { childList: true, subtree: true });
  if (myView) new MutationObserver(() => { if (myView.classList.contains('active')) renderList(); })
    .observe(myView, { attributes: true, attributeFilter: ['class'] });
  attachButton();
  renderList();

  // 예전 단독 마이페이지에서 넘어온 경우 마이 탭 열기
  if (location.hash === '#my') {
    const nav = document.getElementById('navMy');
    setTimeout(() => { if (nav) nav.click(); else if (typeof window.showView === 'function') window.showView('myPageView'); }, 300);
  }
})();
