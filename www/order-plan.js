/* PICKFOO_ORDER_PLAN — 조합 주문 계획: 주문 채널 연결 · 담을 목록 · 배달비 포함 결제 금액 · 예산 경고 · 주문 소요시간 기록
   - 외부 배달앱의 장바구니 담기·결제는 하지 않는다(공개 API 없음). 사용자가 앱에서 직접 담고 결제한다.
   - 지점은 배달앱이 사용자 주소로 자동 선택하므로 PICKFOO는 브랜드·메뉴·옵션까지만 전달한다.
   - 가격·배달비·최소주문금액은 지점마다 다르므로 사용자가 배달앱에서 확인한 값을 입력하면 다시 계산한다.
*/
(() => {
  'use strict';
  const detail = document.getElementById('detailContent');
  if (!detail) return;

  // 앱 검색 화면으로 바로 가는 링크. 2026-11-09 Android 에뮬레이터(배민 설치)에서
  // baemin://search 가 배민 검색 화면을 여는 것을 확인했다. 검색어 자동 입력은 되지 않아 복사 후 붙여넣는다.
  // 확인되지 않은 형식은 넣지 않는다. null이면 앱 열기(https 주소) + 검색어 복사로 동작한다.
  const DEEPLINKS = Object.assign({ baemin: 'baemin://search', coupangeats: null, yogiyo: null },
                                  window.PICKFOO_ORDER_DEEPLINKS || {});

  // 실제 기기·에뮬레이터에서 동작을 확인한 주문 경로만 둔다(2026-11-09 확인).
  // 쿠팡이츠·요기요·포켓CU·우리동네GS는 검색 화면으로 가지 않거나 앱 대신 웹사이트가 열려 제외했다.
  const CH = {
    baemin: { name: '배민', icon: '🛵', url: 'https://www.baemin.com/' }
  };

  // 브랜드별 배민 검색어. 지점은 배민이 사용자 주소로 자동 선택한다. 메뉴가 늘어나도 링크를 추가할 필요 없다.
  function channelsFor(recipe) {
    const brand = String(recipe.brand || '');
    if (brand.startsWith('편의점') || ['CU', 'GS25', '세븐일레븐'].includes(brand)) {
      return { keyword: brand === 'GS25' ? 'GS25' : 'CU', convenience: true,
               intro: '재료를 집까지 한 번에 배달받고 싶다면 배민에서 근처 편의점을 찾아 주문하세요. 직접 사러 가거나 편의점 앱으로 사려면 맨 아래 "편의점 앱에서 재료 사기"를 이용하세요.',
               list: ['baemin'] };
    }
    if (brand === '스타벅스') {
      return { keyword: '스타벅스', intro: '배민에서 가까운 스타벅스를 찾아 음료를 고른 뒤, 옵션(샷·시럽·드리즐·휘핑)을 아래 체크리스트대로 고르세요. 지역에 따라 배달이 안 될 수 있어요.', list: ['baemin'] };
    }
    if (brand === '써브웨이' || brand === '서브웨이') {
      return { keyword: '써브웨이', intro: '배민에서 가까운 써브웨이를 찾아 메뉴를 고른 뒤, 빵·소스·토핑을 아래 체크리스트대로 고르세요.', list: ['baemin'] };
    }
    return { keyword: brand, intro: `배민에서 가까운 ${brand} 매장을 찾아 메뉴를 고른 뒤, 아래 체크리스트대로 담으세요.`, list: ['baemin'] };
  }

  const STORE_KEY = 'pickfoo_order_plan_v1';
  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch (_) { return {}; } }
  function save(all) { try { localStorage.setItem(STORE_KEY, JSON.stringify(all)); } catch (_) { /* 저장 불가 환경 */ } }
  function won(n) { return Number(n || 0).toLocaleString('ko-KR') + '원'; }
  function num(v) { const n = Number(String(v ?? '').replace(/[^\d]/g, '')); return Number.isFinite(n) ? n : 0; }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function injectStyle() {
    if (document.getElementById('pf-order-style')) return;
    const s = document.createElement('style');
    s.id = 'pf-order-style';
    s.textContent = `
.pf-order{margin-top:4px}
.pf-order .pf-sub{font-size:15px;margin:16px 0 2px;color:#3d3027}
.pf-order .pf-hint{font-size:12px;color:#5a4332;background:#f6f1ea;border-radius:8px;padding:8px 10px;margin:8px 0 0;line-height:1.55}
.pf-order .pf-note{font-size:12px;color:#6f6157;line-height:1.6;margin:6px 0 10px}
.pf-order .pf-channels{display:grid;grid-template-columns:1fr;gap:8px}
.pf-order .pf-ch{display:flex;gap:8px;align-items:center;justify-content:center;padding:14px 12px;font-size:15px !important;border-radius:10px;border:1px solid #e7d9c9;background:#fff;color:#3d3027;font-weight:700;font-size:13px;cursor:pointer;text-align:left}
.pf-order .pf-ch.primary{background:#2ac1bc;border-color:#2ac1bc;color:#fff}
.pf-order .pf-list{list-style:none;padding:0;margin:8px 0 0;display:flex;flex-direction:column;gap:6px}
.pf-order .pf-list label{display:flex;gap:10px;align-items:center;padding:9px 11px;border:1px solid #eee3d6;border-radius:9px;background:#fffdf9;font-size:13px}
.pf-order .pf-list input:checked + span{text-decoration:line-through;color:#9a8b80}
.pf-order .pf-cost{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:10px}
.pf-order .pf-cost label{display:flex;flex-direction:column;gap:4px;font-size:11px;color:#6f6157;min-width:0}
.pf-order .pf-cost input{width:100%;box-sizing:border-box;padding:9px;border:1px solid #ddd;border-radius:8px;font-size:14px;font-variant-numeric:tabular-nums}
.pf-order .pf-sum{margin-top:10px;padding:12px;border-radius:10px;background:#f6f1ea;font-size:13px;line-height:1.7;font-variant-numeric:tabular-nums}
.pf-order .pf-sum b{font-size:16px}
.pf-order .pf-warn{color:#b64630;font-weight:700}
.pf-order .pf-ok{color:#1f7a45;font-weight:700}
.pf-order .pf-done{margin-top:10px;width:100%;padding:12px;border-radius:10px;border:0;background:#3d3027;color:#fff;font-weight:700;font-size:14px;cursor:pointer}
.pf-order .pf-log{font-size:11px;color:#8a7769;margin-top:8px;line-height:1.6}
@media (max-width:380px){.pf-order .pf-cost{grid-template-columns:1fr 1fr}}`;
    document.head.appendChild(s);
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) { return false; }
  }

  function openChannel(id, keyword) {
    const ch = CH[id];
    const tpl = DEEPLINKS[id];
    // Capacitor 앱에서는 https 주소가 MainActivity에서 설치된 앱 실행으로 바뀌고,
    // 사용자 정의 scheme 주소는 Android에 그대로 전달된다. 브라우저에서는 웹사이트가 열린다.
    // 사용자 정의 scheme은 Android 앱(Capacitor) 안에서만 사용한다. 일반 브라우저에서는 웹사이트로 이동한다.
    const nativeApp = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
    const target = (tpl && nativeApp) ? tpl.replace('{q}', encodeURIComponent(keyword)) : ch.url;
    window.location.href = target;
  }

  function render(recipe) {
    injectStyle();
    const all = load();
    const P = window.PICKFOO_PRICES;
    const pinfo = P ? P.info(recipe) : { kind: 'user', total: recipe.price || null };
    const st = all[recipe.id] || { checked: {}, items: pinfo.total || '', fee: '', min: '' };
    const plan = channelsFor(recipe);
    const prefs = (window.PICKFOO_APP && window.PICKFOO_APP.prefs && window.PICKFOO_APP.prefs()) || null;
    const budget = prefs && prefs.budget && prefs.budget !== 'all' ? num(prefs.budget) : 0;

    const sec = el('div', 'pf-order');
    sec.id = 'pf-order-plan';
    sec.dataset.recipe = recipe.id;
    sec.appendChild(el('h3', null, '🛒 이 조합 구매하기'));
    sec.appendChild(el('p', 'pf-note', plan.intro));

    const chWrap = el('div', 'pf-channels');
    plan.list.forEach((id, i) => {
      const b = el('button', 'pf-ch' + (i === 0 ? ' primary' : ''), `${CH[id].icon} ${CH[id].name}에서 근처 ${plan.keyword} 찾기`);
      b.type = 'button';
      b.addEventListener('click', async () => {
        const ok = await copy(plan.keyword);
        const a = load(); const cur = a[recipe.id] || st;
        cur.startedAt = cur.startedAt || Date.now(); cur.channel = id;
        a[recipe.id] = cur; save(a);
        b.textContent = ok ? `✅ "${plan.keyword}" 복사됨 · 배민 여는 중…` : `${CH[id].icon} 배민에서 "${plan.keyword}"를 검색하세요`;
        openChannel(id, plan.keyword);
      });
      chWrap.appendChild(b);
    });
    sec.appendChild(chWrap);
    sec.appendChild(el('p', 'pf-hint', `💡 배민이 열리면 검색창을 길게 눌러 "붙여넣기"를 누르세요. "${plan.keyword}"가 입력돼 내 주소 근처 매장이 나와요.`));

    sec.appendChild(el('h4', 'pf-sub', '✅ 담을 것 체크리스트'));
    sec.appendChild(el('p', 'pf-note', '장바구니에 담은 것을 하나씩 체크하면 빠뜨리지 않아요.'));
    const ul = el('ul', 'pf-list');
    (recipe.ingredients || []).forEach(name => {
      const li = el('li'); const lb = el('label'); const cb = el('input');
      cb.type = 'checkbox'; cb.checked = !!st.checked[name];
      cb.addEventListener('change', () => { const a = load(); const cur = a[recipe.id] || st; cur.checked = cur.checked || {}; cur.checked[name] = cb.checked; a[recipe.id] = cur; save(a); });
      const row = P && P.INGREDIENTS[name];
      const priceTxt = row && row.price != null ? ` · ${row.product} ${P.won(row.price)}` : '';
      lb.append(cb, el('span', null, name + priceTxt)); li.appendChild(lb); ul.appendChild(li);
    });
    sec.appendChild(ul);

    sec.appendChild(el('h4', 'pf-sub', '💰 결제 금액 확인 (선택)'));
    sec.appendChild(el('p', 'pf-note', pinfo.kind === 'sum'
      ? '처음 값은 연결 상품 판매가 합계예요. 배민에 나온 금액으로 바꾸고 배달비를 넣으면 결제 금액과 예산 초과 여부를 알려줘요.'
      : '배민에 나온 상품 금액과 배달비를 넣으면 결제 금액과 예산 초과 여부를 알려줘요.'));
    const cost = el('div', 'pf-cost');
    function field(label, key, value) {
      const l = el('label', null, label); const inp = el('input');
      inp.inputMode = 'numeric'; inp.id = `pf-${key}-${recipe.id}`; inp.value = value === '' ? '' : String(value);
      inp.placeholder = '0'; inp.addEventListener('input', () => { const a = load(); const cur = a[recipe.id] || st; cur[key] = inp.value; a[recipe.id] = cur; save(a); calc(); });
      l.appendChild(inp); cost.appendChild(l); return inp;
    }
    const fItems = field('상품 합계', 'items', st.items);
    const fFee = field('배달비', 'fee', st.fee);
    const fMin = field('최소주문금액', 'min', st.min);
    sec.appendChild(cost);
    const sum = el('div', 'pf-sum'); sec.appendChild(sum);

    function calc() {
      const items = num(fItems.value), fee = num(fFee.value), min = num(fMin.value);
      const total = items + fee;
      sum.replaceChildren();
      const line1 = el('div'); line1.append('결제 금액 ', el('b', null, won(total)), ` (상품 ${won(items)} + 배달비 ${won(fee)})`);
      sum.appendChild(line1);
      if (min > 0) {
        sum.appendChild(min > items
          ? el('div', 'pf-warn', `최소주문금액까지 ${won(min - items)} 더 담아야 주문할 수 있어요.`)
          : el('div', 'pf-ok', '최소주문금액을 충족했어요.'));
      }
      if (budget > 0) {
        sum.appendChild(total > budget
          ? el('div', 'pf-warn', `내 예산 ${won(budget)}보다 ${won(total - budget)} 많아요. 포장·픽업(배달비 0원)이나 다른 앱의 배달비를 비교해 보세요.`)
          : el('div', 'pf-ok', `내 예산 ${won(budget)} 안이에요.`));
      } else {
        sum.appendChild(el('div', null, '마이페이지에서 예산을 저장하면 예산 초과 여부도 알려드려요.'));
      }
      if (!fFee.value) sum.appendChild(el('div', null, '배달비는 지점·거리·시간대마다 달라서 배달앱에서 확인한 값을 넣어 주세요.'));
    }
    calc();

    const done = el('button', 'pf-done', '주문 완료했어요');
    done.type = 'button';
    const log = el('div', 'pf-log');
    function renderLog() {
      let rows = [];
      try { rows = JSON.parse(localStorage.getItem('pickfoo_order_log_v1') || '[]'); } catch (_) { rows = []; }
      const mine = rows.filter(r => r.recipe === recipe.id);
      log.textContent = mine.length
        ? `이 기기 주문 기록 ${mine.length}건 · 마지막: ${CH[mine[mine.length - 1].channel]?.name || '-'}, 앱 열기부터 주문 완료까지 ${Math.max(1, Math.round(mine[mine.length - 1].seconds / 60))}분`
        : '주문 기록은 이 기기에만 저장되며, 조합 선택부터 주문 완료까지 걸린 시간 측정에 사용해요.';
    }
    done.addEventListener('click', () => {
      const a = load(); const cur = a[recipe.id] || st;
      const started = cur.startedAt || Date.now();
      let rows = [];
      try { rows = JSON.parse(localStorage.getItem('pickfoo_order_log_v1') || '[]'); } catch (_) { rows = []; }
      rows.push({ recipe: recipe.id, channel: cur.channel || null, seconds: Math.round((Date.now() - started) / 1000),
                  items: num(fItems.value), fee: num(fFee.value), at: new Date().toISOString() });
      try { localStorage.setItem('pickfoo_order_log_v1', JSON.stringify(rows.slice(-200))); } catch (_) { }
      delete cur.startedAt; a[recipe.id] = cur; save(a);
      done.textContent = '✅ 주문 기록 완료 · 후기를 남겨 주세요';
      renderLog();
    });
    sec.append(done, log);
    renderLog();
    sec.appendChild(el('p', 'pf-note', '담기와 결제는 배민 앱에서 직접 해요. 배민은 다른 앱이 장바구니에 대신 담는 기능을 열어 두지 않았어요.'));
    return sec;
  }

  // 기존 "구매하러 가기" 섹션 안에 넣고, 동작이 확인되지 않은 앱 열기 버튼은 숨긴다.
  // 재료별 상품 링크(product-links-db.js)는 같은 섹션 아래에 그대로 표시된다.
  function attach() {
    const app = window.PICKFOO_APP;
    if (!app) return;
    const id = app.selected();
    const recipe = id ? app.recipe(id) : null;
    const grid = detail.querySelector('.shopping-grid');
    const shopSection = grid?.closest('.detail-section');
    if (!recipe || !shopSection) return;
    shopSection.classList.add('pf-merged');
    // 원래 섹션의 앱 열기 버튼·검색어 복사 안내는 숨기고, 이 구매 칸과 재료별 상품 링크만 남긴다.
    const convenience = /편의점|CU|GS25|세븐일레븐|이마트24/.test(String(recipe.brand || ''));
    [...shopSection.children].forEach(c => {
      if (c.id === 'pf-order-plan') return;
      if (c.id === 'pickfoo-product-links-db') {
        // 스타벅스·써브웨이 재료는 매장 메뉴 옵션이라 편의점 상품 링크 안내를 보여주지 않는다.
        c.style.display = convenience ? '' : 'none';
        return;
      }
      c.style.display = 'none';
    });
    const existing = detail.querySelector('#pf-order-plan');
    if (existing && existing.dataset.recipe === recipe.id) return;
    if (existing) existing.remove();
    shopSection.prepend(render(recipe));
  }
  new MutationObserver(attach).observe(detail, { childList: true, subtree: true });
  attach();
})();
