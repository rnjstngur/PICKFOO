/* PICKFOO_STEP250_PRICES */
/* PICKFOO_STEP240_PRODUCT_LINK_DB — read-only server links for each recipe ingredient. */
(() => {
  'use strict';
  const detail = document.getElementById('detailContent');
  if (!detail) return;
  const PROVIDERS = new Set(['pocketcu', 'gs25']);
  let lastIdentity = '';
  let requestNumber = 0;

  function element(name, content, styles) {
    const el = document.createElement(name);
    if (content != null) el.textContent = content;
    if (styles) el.style.cssText = styles;
    return el;
  }

  function safeProductLink(row) {
    if (!row || !PROVIDERS.has(row.provider)) return false;
    try {
      const u = new URL(row.url);
      if (u.protocol !== 'https:' || u.username || u.password) return false;
      const host = u.hostname.toLowerCase();
      return row.provider === 'pocketcu'
        ? (host === 'pocketcu.co.kr' || host.endsWith('.pocketcu.co.kr'))
        : (host === 'abr.ge' || host === 'ourgs.abr.ge' || host === 'gsretail.com' || host.endsWith('.gsretail.com'));
    } catch (_) { return false; }
  }

  // 우리동네GS 앱(com.gsr.gs25)은 https://ourgs.abr.ge 를 검증된 앱 링크로 등록해 두어
  // 이 주소는 브라우저를 거치지 않고 앱이 바로 열린다(2026-11-10 Android 에뮬레이터 확인).
  // 공유 단축주소 https://abr.ge/코드 는 크롬을 거쳐 이동하므로 같은 코드로 ourgs.abr.ge 주소를 만든다.
  function appOpenUrl(row) {
    try {
      const u = new URL(row.url);
      if (row.provider !== 'pocketcu' && u.hostname.toLowerCase() === 'abr.ge') {
        u.hostname = 'ourgs.abr.ge';
        return u.toString();
      }
    } catch (_) { /* 원래 주소 사용 */ }
    return row.url;
  }

  // 등록된 상품 링크가 없는 재료도 편의점 앱까지는 바로 연결한다.
  // Android 앱(MainActivity)은 www.gsretail.com → 우리동네GS(com.gsr.gs25),
  // cu.bgfretail.com → 포켓CU(com.bgfcu.membership) 앱 실행으로 바꾸고, 앱이 없으면 웹사이트를 연다.
  // 두 앱 모두 외부에서 검색어를 넘기는 공개 주소가 없어 재료명을 복사해 두고 앱 검색창에 붙여넣게 한다.
  const STORE_APPS = {
    gs25: { label: '우리동네GS', url: 'https://www.gsretail.com/', color: '#1c68b5' },
    pocketcu: { label: '포켓CU', url: 'https://cu.bgfretail.com/', color: '#178b4a' }
  };

  function providersForRecipe() {
    const app = window.PICKFOO_APP;
    const id = app && app.selected && app.selected();
    const r = id && app.recipe ? app.recipe(id) : null;
    const brand = String((r && r.brand) || '');
    if (brand === 'GS25') return ['gs25'];
    if (brand === 'CU') return ['pocketcu'];
    return ['gs25', 'pocketcu'];
  }

  function isNativeApp() {
    return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
  }

  async function openStoreSearch(name, provider, button) {
    const app = STORE_APPS[provider];
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(name); copied = true; }
    } catch (_) { copied = false; }
    button.textContent = copied ? `✅ "${name}" 복사됨 · ${app.label} 여는 중…` : `${app.label}에서 "${name}" 검색하세요`;
    if (isNativeApp()) window.location.href = app.url;
    else window.open(app.url, '_blank', 'noopener');
  }

  function storeButton(name, provider) {
    const app = STORE_APPS[provider];
    const b = element('button', `🔎 ${app.label} 검색`,
        'flex:1 1 130px;padding:10px 8px;border:1.5px solid ' + app.color + ';border-radius:9px;background:#fff;color:' + app.color + ';font-size:13px;font-weight:700;cursor:pointer;');
    b.type = 'button';
    b.addEventListener('click', () => openStoreSearch(name, provider, b));
    return b;
  }

  function oneIngredientRow(name, matches) {
    const row = element('div', null, 'border-top:1px solid #ece9e2;padding:13px 0;');
    row.appendChild(element('div', '🧺 ' + name, 'font-weight:750;font-size:14px;margin-bottom:8px;'));
    const valid = Array.isArray(matches) ? matches.filter(safeProductLink) : [];
    for (const p of valid) {
      const link = element('a', `🛒 ${p.provider === 'pocketcu' ? '포켓CU' : '우리동네GS'} · ${p.product_name} 바로가기 ↗`,
          'display:block;box-sizing:border-box;width:100%;padding:10px 12px;margin:7px 0;border-radius:9px;color:white;text-decoration:none;word-break:break-word;font-size:13px;font-weight:650;background:' + (p.provider === 'pocketcu' ? '#178b4a' : '#1c68b5') + ';');
      link.href = appOpenUrl(p);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      row.appendChild(link);
      if (Number.isSafeInteger(p.price_krw) && p.price_krw >= 0) {
        const confirmed = p.price_checked_at ? ' · 확인일 ' + p.price_checked_at : '';
        row.appendChild(element('div', '💰 확인된 상품 가격 ' + p.price_krw.toLocaleString('ko-KR') + '원' + confirmed,
          'font-size:12px;font-weight:650;color:#2b6d43;margin:2px 0 6px;'));
      }
      if (p.note) row.appendChild(element('div', p.note, 'font-size:11px;color:#796b61;line-height:1.45;'));
    }
    // 상품 페이지 링크가 없는 앱은 "앱 열기 + 재료명 복사" 버튼을 둔다.
    const linked = new Set(valid.map(p => p.provider));
    const missing = providersForRecipe().filter(p => !linked.has(p));
    if (missing.length) {
      const wrap = element('div', null, 'display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;');
      missing.forEach(p => wrap.appendChild(storeButton(name, p)));
      row.appendChild(wrap);
    }
    return row;
  }


  function providerTotal(ingredients, items, provider) {
    let sum = 0;
    let known = 0;
    for (const name of ingredients) {
      const matches = Array.isArray(items[name]) ? items[name] : [];
      const row = matches.find(p => p.provider === provider && safeProductLink(p) &&
        Number.isSafeInteger(p.price_krw) && p.price_krw >= 0);
      if (row) { sum += row.price_krw; known += 1; }
    }
    return {sum, known, count: ingredients.length};
  }
  function render(container, ingredients, items) {
    container.replaceChildren();
    container.appendChild(element('h4', '🏪 편의점 앱에서 재료 사기', 'margin:0 0 8px;font-size:17px;color:#513c2d;'));
    container.appendChild(element('p', '파란·초록 버튼은 그 상품 화면으로 바로 가요. "검색" 버튼은 재료 이름을 복사하고 편의점 앱을 열어요. 앱 검색창을 길게 눌러 붙여넣으면 돼요. 앱에서 픽업·배달 주문도 할 수 있어요.',
                                  'margin:0 0 8px;color:#6a625a;font-size:12px;line-height:1.6;'));
    for (const name of ingredients) {
      container.appendChild(oneIngredientRow(name, items[name]));
    }

    const totals = element('div', null, 'background:#f4fbf5;border:1px solid #cde7d3;border-radius:10px;padding:12px;margin-top:12px;');
    totals.appendChild(element('b', '💰 재료 가격 확인 · 예상 합계', 'display:block;color:#196b37;font-size:14px;margin-bottom:6px;'));
    let hasPrice = false;
    for (const [provider, label] of [['pocketcu', 'CU'], ['gs25', 'GS25']]) {
      const info = providerTotal(ingredients, items, provider);
      if (!info.known) continue;
      hasPrice = true;
      const full = info.known === info.count;
      const caption = full ? '전체 재료 합계' : `가격 확인된 ${info.known}/${info.count}개만 합산 · 전체 가격 아님`;
      totals.appendChild(element('div', `${label} · ${caption}: ${info.sum.toLocaleString('ko-KR')}원`,
        'font-size:13px;line-height:1.65;color:#245637;'));
    }
    if (hasPrice) {
      totals.appendChild(element('small', '상품 1개씩 기준 · 행사 조건, 옵션, 배송비 미포함 · 매장별 가격/재고 확인 필요',
        'display:block;color:#617369;font-size:11px;line-height:1.5;margin-top:6px;'));
      container.appendChild(totals);
    }
    container.appendChild(element('p', '상품의 정확한 규격, 가격, 재고와 알레르기 정보는 실제 판매처에서 확인하세요. 앱 열림은 Android 환경에 따라 달라질 수 있어요.',
                                  'font-size:11px;color:#8a7769;line-height:1.6;margin:8px 0 0;'));
  }

  async function refresh() {
    const section = detail.querySelector('.shopping-grid')?.closest('.detail-section');
    const ingredientEls = detail.querySelectorAll('.ingredient-list .ingredient');
    if (!section || !ingredientEls.length) return;
    const names = [...new Set([...ingredientEls].map(el => el.textContent.trim()).filter(Boolean))].slice(0, 30);
    const identity = (detail.dataset.curatedKey || '') + '\u0000' +
                     (detail.querySelector('.detail-title')?.textContent || '') + '\u0000' + names.join('\u0000');
    if (lastIdentity === identity && section.querySelector('#pickfoo-product-links-db')) return;
    lastIdentity = identity;
    const turn = ++requestNumber;
    const existing = detail.querySelector('#pickfoo-product-links-db');
    if (existing) existing.remove();
    const block = element('div', '재료별 상품 링크를 불러오는 중…',
        'margin-top:15px;padding:14px 16px;border:1px solid #e6d7bd;background:#fffdf7;border-radius:12px;');
    block.id = 'pickfoo-product-links-db';
    section.appendChild(block);
    try {
      const params = new URLSearchParams();
      for (const name of names) params.append('ingredient', name);
      const base = String(window.PICKFOO_API_BASE || window.location.origin).replace(/\/$/, '');
      const response = await fetch(base + '/api/catalog/product-links/?' + params.toString(),
        {method: 'GET', credentials: 'include', cache: 'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const payload = await response.json();
      if (turn !== requestNumber || !block.isConnected) return;
      if (!payload || typeof payload.items !== 'object' || payload.items === null) throw new Error('잘못된 응답');
      render(block, names, payload.items);
    } catch (error) {
      if (turn !== requestNumber || !block.isConnected) return;
      console.warn('PICKFOO 재료별 상품 링크 조회 실패:', error);
      render(block, names, {});
      block.insertBefore(element('p', '⚠️ DB 링크를 불러오지 못했어요. 새로고침하거나 상품명을 복사해 검색해 주세요.',
                                      'color:#b64630;font-size:12px;'), block.firstChild.nextSibling);
    }
  }

  // app.js recreates the detail content when a new recipe is selected.
  // Observe all detail changes, but only fetch once per unique recipe/ingredient set.
  new MutationObserver(refresh).observe(detail, {subtree: true, childList: true});
  refresh();
})();
