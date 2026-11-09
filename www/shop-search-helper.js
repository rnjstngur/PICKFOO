/* PICKFOO shop search helper — copies a query for manual search in external apps.
   Does not claim to auto-search inside proprietary apps or add items to cart.
 */
(() => {
  'use strict';
  const detail = document.getElementById('detailContent');
  if (!detail) return;
  function attach() {
    const target = detail.querySelector('.shopping-grid');
    if (!target || target.parentElement.querySelector('.shop-search-helper')) return;
    const box = document.createElement('div');
    box.className = 'shop-search-helper';
    box.style.cssText = 'margin:15px 0;padding:14px;background:#fff;border:1px solid #f0d9c8;border-radius:12px;';
    const label = document.createElement('label');
    label.style.cssText = 'display:block;font-size:13px;font-weight:700;margin-bottom:8px';
    label.textContent = '🔎 배달·편의점 앱에서 직접 검색할 단어';
    const field = document.createElement('input');
    field.type = 'text';
    field.maxLength = 120;
    field.value = detail.querySelector('.detail-title')?.textContent?.trim() || '';
    field.setAttribute('aria-label', '복사할 메뉴 검색어');
    field.style.cssText = 'width:100%;box-sizing:border-box;padding:11px;border:1px solid #ddd;border-radius:8px;';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary-btn';
    button.style.cssText = 'margin-top:9px;padding:10px;';
    button.textContent = '📋 검색어 복사';
    const note = document.createElement('p');
    note.style.cssText = 'font-size:12px;color:#806a60;margin:8px 0 0;';
    note.textContent = '복사 후 위에서 원하는 앱을 열고 검색창에 붙여넣으세요. 외부 앱 자동 검색·구매 기능은 제공되지 않습니다.';
    button.addEventListener('click', async () => {
      const value = field.value.trim();
      if (!value) { window.alert('복사할 검색어를 입력해 주세요.'); return; }
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = '✅ 복사됨! 앱 검색창에 붙여넣으세요.';
        setTimeout(() => { button.textContent = '📋 검색어 복사'; }, 2200);
      } catch {
        // Fallback for non-secure WebView/browser contexts.
        window.prompt('자동 복사가 안 되면 아래 텍스트를 선택해 복사해 주세요.', value);
      }
    });
    box.append(label, field, button, note);
    target.after(box);
  }
  new MutationObserver(attach).observe(detail, {childList:true,subtree:true});
  attach();
})();
