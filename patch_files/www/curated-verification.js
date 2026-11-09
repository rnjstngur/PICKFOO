/* PICKFOO STEP 233 — REAL server-side verified badges for the 20 exhibit combos.
 * Only distinct authenticated DB reviews count; no localStorage reviews / fabricated stars.
 * Existing user-created DB recipes and their review routes are unchanged.
 */
(() => {
  'use strict';
  const BASE = window.PICKFOO_API_BASE || location.origin;
  const detail = document.getElementById('detailContent');
  const view = document.getElementById('reviewView');
  const form = document.getElementById('reviewForm');
  const hiddenId = document.getElementById('reviewRecipeId');
  const photoInput = document.getElementById('reviewPhoto');
  const nameInput = document.getElementById('reviewNickname');
  const ratingInput = document.getElementById('reviewRating');
  const bodyInput = document.getElementById('reviewText');
  const submitBtn = form?.querySelector('button[type="submit"]');
  if (!detail || !view || !form || !hiddenId || !photoInput || !ratingInput || !bodyInput || !submitBtn) return;

  const keyOk = key => /^pf-curated-(?:0[1-9]|1\d|20)$/.test(key || '');
  let currentReview = null;
  let detailSeq = 0;
  let reviewSeq = 0;
  let summary = {};
  const formTitle = view.querySelector('.page-title');
  const formDescription = view.querySelector('.page-desc');
  const initialFormTitle = formTitle?.textContent || '';
  const initialFormDescription = formDescription?.textContent || '';
  const initialSubmit = submitBtn.textContent;

  function status(msg, error = false) {
    let n = document.getElementById('curatedReviewStatus');
    if (!n) {
      n = document.createElement('p');
      n.id = 'curatedReviewStatus';
      n.setAttribute('role', 'status');
      n.style.cssText = 'padding:10px 12px;border-radius:10px;line-height:1.6;font-size:14px;';
      form.before(n);
    }
    n.hidden = !msg;
    n.textContent = msg;
    n.style.color = error ? '#962d23' : '#22563d';
    n.style.background = error ? '#fff0ed' : '#e8f5ec';
  }
  async function requestJson(path, options = {}) {
    const res = await fetch(BASE + path, {credentials:'include', cache:'no-store', ...options});
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `요청 오류 (HTTP ${res.status})`);
    return data;
  }
  async function csrf() {
    await requestJson('/api/accounts/csrf/');
    const part = document.cookie.split('; ').find(s => s.startsWith('csrftoken='));
    if (!part) throw new Error('CSRF 쿠키가 없습니다. 페이지를 새로고침해 주세요.');
    return decodeURIComponent(part.slice(10));
  }
  function sameOriginPhoto(raw) {
    try {
      const u = new URL(raw, BASE);
      if (u.origin !== new URL(BASE, location.href).origin) return null;
      if (!/^\/api\/catalog\/curated\/reviews\/\d+\/photo\/view\/$/.test(u.pathname)) return null;
      return u.href;
    } catch (_) { return null; }
  }
  function textEl(tag, cls, value) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    el.textContent = value;
    return el;
  }
  function showMetrics(root, v) {
    if (!root || !v) return;
    root.replaceChildren();
    const headline = textEl('strong', '', v.verified ? '✅ PICKFOO 내부 검증 통과' : '⏳ 검증 기준 달성 전');
    const n = Number(v.review_count || 0);
    const p = Number(v.photo_review_count || 0);
    const rating = v.adjusted_rating == null ? '미집계' : Number(v.adjusted_rating).toFixed(2);
    const msg = textEl('div', '', `평가 ${n}/10명 · 사진 후기 ${p}/3건 · 베이즈 보정 평점 ${rating}/3.80`);
    const disclaimer = textEl('small', '', '평가자는 계정별 1명으로 계산하고 조합 등록자는 제외합니다. 앱 내부 기준이며 음식 안전·실제 구매를 보증하지 않습니다.');
    disclaimer.style.display = 'block';
    disclaimer.style.marginTop = '6px';
    root.append(headline, msg, disclaimer);
    root.style.cssText = 'margin:10px 0;padding:11px;border-radius:10px;border:1px solid #e9ddce;background:#fff9ed;line-height:1.6;font-size:13px;';
  }
  async function refreshSummary() {
    try {
      const data = await requestJson('/api/catalog/curated/verification/');
      summary = Object.fromEntries((data.combos || []).map(x => [x.key, x.verification]));
      window.dispatchEvent(new CustomEvent('pickfoo:curated-verification', {detail: summary}));
      const key = detail.dataset.curatedKey;
      if (keyOk(key) && summary[key]) {
        const badge = detail.querySelector('.detail-hero .verified-badge');
        if (badge) badge.textContent = summary[key].verified ? '✅ PICKFOO 내부 검증' : '팀 선정 · 검증 대기';
        showMetrics(detail.querySelector('.curated-verification-summary'), summary[key]);
      }
    } catch (e) { console.warn('PICKFOO 검증 요약 조회 실패:', e); }
  }
  function buildReview(review) {
    const card = textEl('div', 'review-card', '');
    const head = textEl('div', 'review-head', '');
    head.append(textEl('span', '', review.nickname || '사용자'),
                textEl('span', '', '★'.repeat(Math.max(0, Math.min(5, Number(review.rating) || 0)))));
    card.append(head, textEl('div', '', review.content || ''));
    if (review.photo_url) {
      const href = sameOriginPhoto(review.photo_url);
      if (href) {
        const img = document.createElement('img');
        img.src = href;
        img.loading = 'lazy';
        img.alt = '음식 조합에 첨부된 후기 사진';
        img.style.cssText = 'display:block;width:100%;max-width:360px;max-height:320px;object-fit:contain;border-radius:12px;margin-top:12px;';
        img.addEventListener('error', () => { img.replaceWith(textEl('small', '', '사진을 불러오지 못했습니다.')); });
        card.appendChild(img);
      }
    }
    if (review.created_at) {
      const dt = new Date(review.created_at);
      if (!isNaN(dt.getTime())) card.append(textEl('small', '', dt.toLocaleDateString('ko-KR')));
    }
    if (review.is_mine && Number.isSafeInteger(Number(review.id))) {
      const actions = textEl('div', '', '');
      actions.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;';
      const edit = textEl('button', 'text-btn', '✏️ 내 평가 수정');
      edit.type = 'button';
      edit.addEventListener('click', () => {
        document.getElementById('writeReviewBtn')?.click();
      });
      const remove = textEl('button', 'text-btn', '🗑️ 내 평가 삭제');
      remove.type = 'button';
      remove.addEventListener('click', async () => {
        if (!confirm('내 평가와 첨부 사진을 삭제할까요? 검증 점수도 다시 계산됩니다.')) return;
        remove.disabled = true;
        try {
          const token = await csrf();
          await requestJson(`/api/catalog/curated/reviews/${review.id}/`, {
            method:'DELETE', headers:{'X-CSRFToken':token}
          });
          await Promise.all([loadDetail(detail.dataset.curatedKey), refreshSummary()]);
        } catch (err) { alert(err.message); }
        finally { remove.disabled = false; }
      });
      actions.append(edit, remove);
      card.appendChild(actions);
    }
    return card;
  }
  async function loadDetail(key) {
    if (!keyOk(key)) return;
    const seq = ++detailSeq;
    const list = detail.querySelector('.review-list');
    if (!list) return;
    let summaryNode = detail.querySelector('.curated-verification-summary');
    if (!summaryNode) {
      summaryNode = textEl('div', 'curated-verification-summary', '');
      list.before(summaryNode);
    }
    if (summary[key]) showMetrics(summaryNode, summary[key]);
    list.textContent = '실제 PostgreSQL 리뷰를 불러오는 중…';
    try {
      const data = await requestJson(`/api/catalog/curated/${encodeURIComponent(key)}/reviews/`);
      if (seq !== detailSeq || detail.dataset.curatedKey !== key) return;
      summary[key] = data.verification;
      showMetrics(summaryNode, data.verification);
      const stats = detail.querySelectorAll('.detail-stats span');
      if (stats[1]) stats[1].textContent = data.verification.adjusted_rating == null ?
        '보정 평점: 평가 없음' : `보정 평점 ★ ${data.verification.adjusted_rating}/5.0`;
      if (stats[2]) stats[2].textContent = `DB 평가 ${data.verification.review_count}건`;
      const badge = detail.querySelector('.detail-hero .verified-badge');
      if (badge) badge.textContent = data.verification.verified ? '✅ PICKFOO 내부 검증' : '팀 선정 · 검증 대기';
      list.replaceChildren();
      if (!data.reviews.length) list.append(textEl('div','empty-state','아직 등록된 DB 평가가 없습니다. 첫 평가를 남겨 주세요.'));
      for (const row of data.reviews || []) list.append(buildReview(row));
    } catch (e) {
      if (seq !== detailSeq) return;
      list.textContent = 'DB 평가를 불러오지 못했습니다. ' + e.message;
    }
  }
  function onDetailChanged() {
    const key = detail.dataset.curatedKey;
    if (keyOk(key)) void loadDetail(key);
  }
  new MutationObserver(onDetailChanged).observe(detail, {childList:true});

  async function onReviewChanged() {
    if (!view.classList.contains('active')) return;
    const key = hiddenId.value;
    const active = keyOk(key);
    ++reviewSeq;
    currentReview = null;
    if (!active) { status(''); return; }
    photoInput.required = false;
    if (nameInput) { nameInput.required = false; const label = nameInput.closest('label'); if (label) label.hidden = true; }
    if (formTitle) formTitle.textContent = '전시 조합 검증 평가';
    if (formDescription) formDescription.textContent = '실제 로그인 계정으로 별점과 후기를 PostgreSQL에 저장합니다. 사진은 선택 사항입니다. 이 평가에는 포인트를 지급하지 않습니다.';
    submitBtn.textContent = '💾 검증 평가 저장하기';
    status('기존 로컬 시연 후기는 검증 점수에 반영되지 않습니다.');
    const seq = reviewSeq;
    try {
      const data = await requestJson(`/api/catalog/curated/${encodeURIComponent(key)}/reviews/`);
      if (seq !== reviewSeq || hiddenId.value !== key || !view.classList.contains('active')) return;
      currentReview = (data.reviews || []).find(r => r.is_mine) || null;
      if (currentReview) {
        ratingInput.value = String(currentReview.rating);
        bodyInput.value = currentReview.content || '';
        submitBtn.textContent = '💾 내 평가 수정 / 사진 교체';
        status('이미 등록한 평가가 있습니다. 별점·후기를 수정하거나 사진을 추가할 수 있습니다.');
      }
    } catch (e) { if (seq === reviewSeq) status(e.message, true); }
  }
  new MutationObserver(() => { void onReviewChanged(); }).observe(view, {attributes:true,attributeFilter:['class']});

  // Capture at the DOCUMENT level so the pre-existing localStorage handler never runs
  // for the 20 curated combos, and points cannot be falsely counted locally.
  document.addEventListener('submit', async event => {
    if (event.target !== form || !keyOk(hiddenId.value)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (submitBtn.disabled) return;
    const key = hiddenId.value;
    const rating = Number(ratingInput.value);
    const content = bodyInput.value.trim();
    const file = photoInput.files?.[0] || null;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !content || content.length > 2000) {
      status('별점 1~5점, 후기 1~2000자를 입력해 주세요.', true); return;
    }
    if (file && (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size < 1 || file.size > 3*1024*1024)) {
      status('3MB 이하 JPG/PNG/WebP 사진만 올려 주세요.', true); return;
    }
    submitBtn.disabled = true;
    status('DB에 평가를 저장하는 중…');
    let reviewId = currentReview?.id || null;
    try {
      const token = await csrf();
      const headers = {'Content-Type':'application/json', 'X-CSRFToken':token};
      if (reviewId) {
        await requestJson(`/api/catalog/curated/reviews/${reviewId}/`, {
          method:'PATCH', headers, body:JSON.stringify({rating,content})
        });
      } else {
        const data = await requestJson(`/api/catalog/curated/${encodeURIComponent(key)}/reviews/`, {
          method:'POST', headers, body:JSON.stringify({rating,content})
        });
        reviewId = data.review.id;
        currentReview = {id:reviewId,rating,content,is_mine:true};
      }
      if (file) {
        try {
          const multi = new FormData(); multi.append('photo',file);
          await requestJson(`/api/catalog/curated/reviews/${reviewId}/photo/`, {
            method:'POST', headers:{'X-CSRFToken':token}, body:multi
          });
        } catch (err) {
          status('별점과 후기는 저장됐지만 사진 업로드는 실패했습니다: '+err.message+' 사진만 다시 선택해 재시도할 수 있어요.', true);
          await Promise.all([refreshSummary(), loadDetail(key)]);
          return;
        }
      }
      status('✅ 실제 DB 평가가 저장됐습니다. 검증 조건은 서버에서 자동 계산합니다.');
      await Promise.all([refreshSummary(), loadDetail(key)]);
      // Navigate back to refreshed detail screen using the app's normal link.
      view.querySelector('[data-view="detailView"]')?.click();
    } catch (e) { status(e.message, true); }
    finally { submitBtn.disabled = false; }
  }, true);

  void refreshSummary();
  if (keyOk(detail.dataset.curatedKey)) void loadDetail(detail.dataset.curatedKey);
})();
