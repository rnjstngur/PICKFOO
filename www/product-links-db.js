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

  async function copyIngredient(name, button) {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(name);
      button.textContent = '✅ 재료명 복사 완료';
    } catch (error) {
      // Some Android WebViews do not expose Clipboard API: allow manual copying.
      window.prompt('재료명을 길게 눌러 복사하세요.', name);
    }
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

  function oneIngredientRow(name, matches) {
    const row = element('div', null, 'border-top:1px solid #ece9e2;padding:13px 0;');
    const title = element('div', '🧺 ' + name, 'font-weight:750;font-size:14px;margin-bottom:8px;');
    row.appendChild(title);
    const valid = Array.isArray(matches) ? matches.filter(safeProductLink) : [];
    if (!valid.length) {
      row.appendChild(element('div', '등록된 상품 공유 링크가 없어요. 아래 버튼으로 재료명을 복사한 뒤 편의점 앱에서 검색하세요.',
                             'font-size:12px;line-height:1.5;color:#78675d;margin-bottom:7px;'));
      const copy = element('button', '🔎 재료명 복사 · 앱에서 검색',
          'padding:8px 12px;border:1px solid #d9d0c4;border-radius:9px;background:#fff;color:#584c3c;font-size:12px;cursor:pointer;');
      copy.type = 'button';
      copy.addEventListener('click', () => copyIngredient(name, copy));
      row.appendChild(copy);
      return row;
    }
    for (const p of valid) {
      const link = element('a', `🛒 ${p.provider === 'pocketcu' ? '포켓CU' : '우리동네GS'} · ${p.product_name} ↗`,
          'display:block;box-sizing:border-box;width:100%;padding:10px 12px;margin:7px 0;border-radius:9px;color:white;text-decoration:none;word-break:break-word;font-size:13px;font-weight:650;background:' + (p.provider === 'pocketcu' ? '#178b4a' : '#1c68b5') + ';');
      link.href = appOpenUrl(p);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      row.appendChild(link);
      if (p.note) row.appendChild(element('div', p.note, 'font-size:11px;color:#796b61;line-height:1.45;'));
    }
    return row;
  }

  function render(container, ingredients, items) {
    container.replaceChildren();
    container.appendChild(element('h4', '🛒 재료별 실제 상품 링크', 'margin:0 0 8px;font-size:17px;color:#513c2d;'));
    container.appendChild(element('p', '상품 링크는 관리자가 확인해 등록한 공유 주소만 표시해요. 같은 재료는 다른 조합에서도 자동으로 연결됩니다.',
                                  'margin:0 0 8px;color:#6a625a;font-size:12px;line-height:1.6;'));
    for (const name of ingredients) {
      container.appendChild(oneIngredientRow(name, items[name]));
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
