/* PICKFOO_PRICES — 조합 가격 표시 규칙(2026-11-10)
   - 편의점 조합: 재료마다 연결한 실제 상품의 판매가(정가)를 더한 값. 출처는 CU 공식 홈페이지 상품 목록(cu.bgfretail.com)
     또는 팀원이 앱의 상품 링크를 열어 확인한 가격. 행사가(1+1 등)는 반영하지 않는다.
   - 재료 하나라도 가격이 없으면 합계를 보여주지 않는다(확인된 재료 가격만 표시).
   - 스타벅스·써브웨이 등 매장 메뉴: 공식 가격표를 온라인에서 확인할 수 없어 숫자를 표시하지 않는다.
   - 사용자가 등록한 조합: 등록자가 입력한 가격.
   "약", "예상" 같은 추정 표현은 쓰지 않는다. */
(function (root) {
  'use strict';
  const CHECKED = '2026-11-10';
  const CU_SITE = 'CU 공식 홈페이지';
  const APP_LINK = '앱 상품 링크';

  // 재료명 → 연결한 상품과 판매가. price가 null이면 아직 확인 전.
  const INGREDIENTS = {
    '컵떡볶이':           { product: '오뚜기)컵떡볶이오리지널', price: 3900, source: CU_SITE },
    '스파게티 컵라면':     { product: '오뚜기)스파게티컵', price: 2200, source: CU_SITE },
    '불닭볶음면':         { product: '삼양)불닭볶음면컵', price: 1800, source: CU_SITE },
    '짜파게티':           { product: '농심)짜파게티큰사발컵', price: 1600, source: CU_SITE },
    '육개장 컵라면':       { product: '농심)육개장사발면', price: 1200, source: CU_SITE },
    '복숭아 아이스티':     { product: '26del)복숭아아이스티230', price: 900, source: CU_SITE },
    '블루레몬 에이드 음료': { product: '26del)블루레몬에이드230', price: 900, source: CU_SITE },
    '사이다':             { product: '롯데)칠성사이다제로P500', price: 2500, source: CU_SITE },
    // 아래는 링크 상품명을 확인하는 중(확인되면 price를 채운다)
    '소시지':             { product: '', price: null, source: APP_LINK },
    '스트링치즈':         { product: '', price: null, source: APP_LINK },
    '스위트콘':           { product: '', price: null, source: APP_LINK },
    '모차렐라 치즈':       { product: '', price: null, source: APP_LINK },
    '참치마요 삼각김밥':   { product: '주)리치참치마요삼각', price: null, source: APP_LINK },
    '슬라이스 치즈':       { product: '', price: null, source: APP_LINK },
    '까르보 불닭볶음면':   { product: '', price: null, source: APP_LINK },
    '우유':               { product: '', price: null, source: APP_LINK },
    '얼음컵':             { product: '', price: null, source: APP_LINK }
  };
  // 편의점에서 따로 파는 상품이 없는 재료(합계에서 빼고 안내만 한다)
  const NOT_SOLD = { '에스프레소 샷': '편의점 픽업 상품이 없어 합계에서 제외(매장 커피 머신 이용)' };

  function won(n) { return Number(n).toLocaleString('ko-KR') + '원'; }
  function isConvenience(r) { return /^편의점\(|^(CU|GS25|세븐일레븐|이마트24)$/.test(String((r && r.brand) || '')); }

  // { kind: 'sum'|'pending'|'store'|'user', total, label, items:[{name, product, price}], excluded:[...], missing:[...] }
  function info(r) {
    if (!r) return { kind: 'store', total: null, label: '매장 가격 확인' };
    if (!r.curated) {
      const p = Number(r.price) || 0;
      return { kind: 'user', total: p || null, label: p ? won(p) : '가격 미입력' };
    }
    if (!isConvenience(r)) return { kind: 'store', total: null, label: '매장 가격 확인' };
    const items = [], missing = [], excluded = [];
    (r.ingredients || []).forEach(name => {
      if (NOT_SOLD[name]) { excluded.push({ name, reason: NOT_SOLD[name] }); return; }
      const row = INGREDIENTS[name];
      if (row && row.price != null) items.push({ name, product: row.product, price: row.price, source: row.source });
      else missing.push(name);
    });
    const total = items.reduce((s, x) => s + x.price, 0);
    if (missing.length) return { kind: 'pending', total: null, label: '가격 확인 중', items, missing, excluded };
    return { kind: 'sum', total, label: won(total), items, missing, excluded };
  }

  // 상세 화면 안내 문구
  function note(r) {
    const i = info(r);
    if (i.kind === 'sum' || i.kind === 'pending') {
      const parts = i.items.map(x => `${x.name} ${won(x.price)}`);
      let s = `가격은 연결한 상품의 판매가 합계예요(${CU_SITE} 등, ${CHECKED} 확인 · 행사가 미반영).`;
      if (parts.length) s += ' ' + parts.join(' + ') + '.';
      if (i.excluded && i.excluded.length) s += ' ' + i.excluded.map(x => `${x.name}: ${x.reason}`).join(' ');
      if (i.kind === 'pending') s += ` 확인 중: ${i.missing.join(', ')}.`;
      return s;
    }
    if (i.kind === 'store') return '매장 메뉴는 공식 가격표가 온라인에 없어 가격을 표시하지 않아요. 배민이나 매장 앱에서 확인하세요.';
    return '가격은 조합을 등록한 사람이 입력한 값이에요.';
  }

  // 앱 데이터의 price를 확인된 합계로 맞춘다(예산 필터·정렬이 같은 값을 쓰도록).
  function applyTo(recipes) {
    (recipes || []).forEach(r => {
      const i = info(r);
      if (i.kind === 'sum') r.price = i.total;
      // 화면에 숫자를 보여주지 않는 조합(매장 메뉴·가격 확인 중)은 예산 필터에서 빼지 않는다.
      r.priceUnknown = i.kind === 'store' || i.kind === 'pending';
    });
    return recipes;
  }

  const api = { CHECKED, INGREDIENTS, NOT_SOLD, info, note, applyTo, won };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PICKFOO_PRICES = api;
})(typeof window !== 'undefined' ? window : globalThis);
