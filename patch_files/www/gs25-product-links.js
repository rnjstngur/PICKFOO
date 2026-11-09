/* PICKFOO_STEP239_GS_PRODUCT_LINK — shared-link test, product identity not verified. */
(() => {
  'use strict';
  // User-provided official-app share link. A shortened link can resolve differently
  // by device/app installation. Do not claim it identifies a specific SKU until tested.
  const GS_SHARED_URL = 'https://abr.ge/d5an5bd';
  const RECIPE_KEYS = new Set(['pf-curated-02', 'pf-curated-03', 'pf-curated-05']);
  const detail = document.getElementById('detailContent');
  if (!detail) return;

  function attachGsShare() {
    const currentKey = detail.dataset.curatedKey || '';
    const shoppingSection = detail.querySelector('.shopping-grid')?.closest('.detail-section');
    const existing = detail.querySelector('#pickfoo-gs25-product-share');
    if (!RECIPE_KEYS.has(currentKey) || !shoppingSection) {
      existing?.remove();
      return;
    }
    if (existing) return;

    const section = document.createElement('div');
    section.id = 'pickfoo-gs25-product-share';
    section.style.cssText = 'margin-top:14px;padding:14px 15px;border:1px solid #b8cee9;border-radius:12px;background:#f5faff;';

    const title = document.createElement('div');
    title.textContent = '🏪 우리동네GS 상품 공유 링크 (테스트)';
    title.style.cssText = 'font-weight:800;color:#235da8;margin-bottom:8px;';

    const info = document.createElement('p');
    info.textContent = '우리동네GS 앱에서 공유한 링크를 연결했어요. 링크가 가리키는 정확한 상품과 화면은 아직 기기에서 확인이 필요해요.';
    info.style.cssText = 'font-size:13px;line-height:1.55;color:#3e5d7d;margin:0 0 12px;';

    const open = document.createElement('a');
    open.href = GS_SHARED_URL;
    open.target = '_blank';
    open.rel = 'noopener noreferrer';
    open.textContent = '🛒 우리동네GS 공유 페이지 열기 ↗';
    open.style.cssText = 'display:inline-block;box-sizing:border-box;max-width:100%;padding:12px 14px;border-radius:10px;background:#1c68b5;color:white;text-decoration:none;font-size:14px;font-weight:750;';

    const caution = document.createElement('p');
    caution.textContent = '우리동네GS 앱에서 실제 불닭볶음면컵 상품 상세가 열리는지 확인해 주세요. 앱 홈이나 설치 화면으로 이동할 수도 있어요. 재고·가격·상품 일치 여부는 GS에서 확인하세요.';
    caution.style.cssText = 'font-size:12px;color:#55708b;line-height:1.55;margin:10px 0 0;';

    section.append(title, info, open, caution);
    shoppingSection.appendChild(section);
  }

  // The recipe detail is replaced by app.js each time a recipe opens.
  new MutationObserver(attachGsShare).observe(detail, {childList: true, subtree: true});
  attachGsShare();
})();
