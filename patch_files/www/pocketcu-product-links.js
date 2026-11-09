/* PICKFOO_STEP238_POCKETCU_PRODUCT — only one user-provided product share link. */
(() => {
  'use strict';
  // The URL was copied from the actual PocketCU app share sheet by the user.
  // This is one specific cup product, NOT a universal search URL.
  const PRODUCT = Object.freeze({
    name: '삼양)불닭볶음면컵',
    url: 'https://www.pocketcu.co.kr/deepLink/checkAppInstall?viewType=1&viewUrl=/product/detail/2022030013574'
  });
  // These curated recipes include the generic ingredient "불닭볶음면".
  // "까르보 불닭볶음면" is a different product; do not silently link it.
  const RECIPE_KEYS = new Set(['pf-curated-02', 'pf-curated-03', 'pf-curated-05']);
  const detail = document.getElementById('detailContent');
  if (!detail) return;

  function attachProduct() {
    const key = detail.dataset.curatedKey || '';
    const shoppingSection = detail.querySelector('.shopping-grid')?.closest('.detail-section');
    const existing = detail.querySelector('#pickfoo-pocketcu-product');
    if (!RECIPE_KEYS.has(key) || !shoppingSection) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    const box = document.createElement('div');
    box.id = 'pickfoo-pocketcu-product';
    box.style.cssText = 'margin-top:14px;padding:14px 15px;border:1px solid #cde8d3;border-radius:12px;background:#f6fff8;';

    const heading = document.createElement('div');
    heading.textContent = '🏪 포켓CU 실제 상품 페이지';
    heading.style.cssText = 'font-weight:800;color:#186936;margin-bottom:8px;';

    const desc = document.createElement('p');
    desc.textContent = '앱에서 공유한 상품: ' + PRODUCT.name + '. 선택한 조합의 재료와 포장·용량이 다를 수 있어요.';
    desc.style.cssText = 'font-size:13px;color:#53685a;line-height:1.55;margin:0 0 12px;';

    const link = document.createElement('a');
    // A new browsing context gives Android's URL resolver an opportunity to
    // open PocketCU; direct in-app navigation is not guaranteed by Android.
    link.href = PRODUCT.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = '🛒 삼양 불닭볶음면컵 상품 페이지 열기 ↗';
    link.style.cssText = 'display:inline-block;box-sizing:border-box;max-width:100%;padding:12px 14px;border:0;border-radius:10px;background:#178b4a;color:white;text-decoration:none;font-size:14px;font-weight:750;';

    const note = document.createElement('p');
    note.textContent = '포켓CU가 허용하면 앱 내 해당 상품으로 이동해요. 휴대전화 설정에 따라 웹페이지나 설치 안내가 열릴 수도 있어요. 구매·재고·가격은 앱에서 확인하세요.';
    note.style.cssText = 'font-size:12px;color:#62766a;line-height:1.55;margin:10px 0 0;';

    box.append(heading, desc, link, note);
    shoppingSection.appendChild(box);
  }
  // The existing app dynamically rewrites detailContent when a recipe opens.
  const observer = new MutationObserver(attachProduct);
  observer.observe(detail, {childList: true, subtree: true});
  attachProduct();
})();
