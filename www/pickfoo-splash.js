/* PICKFOO STEP 204 — 초기 화면을 표시하고 준비되면 부드럽게 닫습니다. */
(() => {
  'use strict';
  const splash = document.getElementById('pfSplash');
  if (!splash) return;

  const startedAt = window.PICKFOO_SPLASH_STARTED || performance.now();
  const MIN_VISIBLE_MS = 1700; // 로고가 너무 빨리 사라지지 않도록 최소 표시 시간
  const MAX_VISIBLE_MS = 5500; // 네트워크/이미지 오류가 나도 화면이 막히지 않도록 안전 장치
  let closing = false;

  function closeSplash() {
    if (closing) return;
    closing = true;
    splash.classList.add('pf-splash--exit');
    splash.setAttribute('aria-busy', 'false');
    // CSS 전환이 비활성화된 환경에서도 확실히 DOM을 정리합니다.
    window.setTimeout(() => splash.remove(), 800);
  }

  function onPageReady() {
    window.setTimeout(closeSplash, Math.max(0, MIN_VISIBLE_MS - (performance.now() - startedAt)));
  }

  if (document.readyState === 'complete') {
    onPageReady();
  } else {
    window.addEventListener('load', onPageReady, { once: true });
  }
  window.setTimeout(closeSplash, MAX_VISIBLE_MS);
})();
