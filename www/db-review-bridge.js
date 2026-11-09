/*
 * PICKFOO STEP 188 — PostgreSQL 리뷰 + 사진 연결
 * 기존 DB 리뷰가 있으면 사진을 추가/교체하고, 신규 리뷰라면 글·별점 저장 후 사진을 업로드합니다.
 * 시연용 조합의 기존 로컬 리뷰·포인트 로직은 수정하지 않습니다.
 *
 * 서버 사전 조건: 리뷰 목록 GET 응답에 is_mine 필드 추가 (설치방법.txt 참고)
 */
(() => {
  'use strict';

  const API = window.PICKFOO_API_BASE;
  const view = document.getElementById('reviewView');
  const form = document.getElementById('reviewForm');
  const detail = document.getElementById('detailContent');
  const title = view?.querySelector('.page-title');
  const description = view?.querySelector('.page-desc');
  const nickname = document.getElementById('reviewNickname');
  const photo = document.getElementById('reviewPhoto');
  const preview = document.getElementById('photoPreview');
  const textField = document.getElementById('reviewText');
  const ratingField = document.getElementById('reviewRating');
  const submit = form?.querySelector('button[type="submit"]');
  if (!view || !form || !detail || !photo || !textField || !ratingField || !submit) {
    console.warn('PICKFOO STEP 188: 리뷰 화면 요소가 없습니다.');
    return;
  }

  const nicknameLabel = nickname?.closest('label');
  const photoLabel = photo.closest('label');
  const originals = {
    title: title?.textContent || '',
    description: description?.textContent || '',
    submit: submit.textContent,
    nicknameRequired: nickname?.required || false,
    nicknameHidden: nicknameLabel?.hidden || false,
    photoRequired: photo.required,
    photoHidden: photoLabel?.hidden || false,
    photoAccept: photo.accept,
    previewHidden: preview?.hidden || false,
    textReadOnly: textField.readOnly,
    ratingDisabled: ratingField.disabled
  };

  let existingReview = null; // { recipeId, reviewId }
  let viewVersion = 0; // 비동기 조회 후 다른 화면에 잘못 반영되는 문제 방지

  function dbRecipeId() {
    const value = document.getElementById('reviewRecipeId')?.value || '';
    const match = /^db([1-9]\d*)$/.exec(value);
    if (!match) return null;
    const id = Number(match[1]);
    return Number.isSafeInteger(id) ? id : null;
  }

  function status(message, error = false) {
    let node = document.getElementById('dbReviewStatus');
    if (!node) {
      node = document.createElement('p');
      node.id = 'dbReviewStatus';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      node.style.cssText = 'padding:12px 14px;border-radius:10px;line-height:1.6;font-size:14px;';
      form.before(node);
    }
    node.textContent = message;
    node.hidden = !message;
    node.style.background = error ? '#fff0ee' : '#e9f7ed';
    node.style.color = error ? '#a92727' : '#176b37';
  }

  function showExisting(recipeId, review) {
    existingReview = { recipeId, reviewId: review.id };
    ratingField.value = String(review.rating);
    textField.value = String(review.content || '');
    textField.readOnly = true;
    ratingField.disabled = true;
    submit.textContent = '📷 기존 리뷰 사진 추가/교체하기';
    if (description) {
      description.textContent = '이 조합에는 이미 작성한 DB 리뷰가 있습니다. 별점·글은 유지하고 사진만 추가하거나 교체합니다. 사진 리뷰가 최초 등록되면 DB에서 10P를 한 번만 지급합니다.';
    }
    status('기존 리뷰를 찾았어요. 사진을 선택한 뒤 아래 버튼을 누르세요.');
  }

  async function getMine(recipeId) {
    const response = await fetch(`${API}/api/catalog/recipes/${recipeId}/reviews/list/`, {
      credentials: 'include', cache: 'no-store'
    });
    if (!response.ok) throw new Error(`내 리뷰 조회 실패 (HTTP ${response.status})`);
    const payload = await response.json();
    if (!Array.isArray(payload.reviews)) throw new Error('리뷰 목록 응답이 올바르지 않습니다.');
    return payload.reviews.find(x => x.is_mine === true) || null;
  }

  async function preloadMine(recipeId, version) {
    try {
      const mine = await getMine(recipeId);
      if (version !== viewVersion || dbRecipeId() !== recipeId || !view.classList.contains('active')) return;
      if (mine) showExisting(recipeId, mine);
      else status('새 DB 리뷰를 작성할 수 있어요. 사진은 선택 사항입니다.');
    } catch (err) {
      if (version !== viewVersion || !view.classList.contains('active')) return;
      status(`기존 리뷰 확인에 실패했습니다: ${err.message}. 서버와 로그인 상태를 확인해 주세요.`, true);
    }
  }

  function updateForm() {
    if (!view.classList.contains('active')) {
      ++viewVersion;
      return;
    }
    const recipeId = dbRecipeId();
    const isDb = recipeId !== null;
    ++viewVersion;
    existingReview = null;

    if (title) title.textContent = isDb ? 'PostgreSQL 음식 조합 리뷰' : originals.title;
    if (description) description.textContent = isDb
      ? '별점·글을 DB에 저장한 뒤 선택한 사진을 Django 서버에 업로드합니다. 사진 리뷰가 최초 등록되면 DB에서 10P를 한 번만 지급합니다.'
      : originals.description;
    if (nickname) nickname.required = isDb ? false : originals.nicknameRequired;
    if (nicknameLabel) nicknameLabel.hidden = isDb ? true : originals.nicknameHidden;
    photo.required = isDb ? false : originals.photoRequired;
    photo.accept = isDb ? 'image/jpeg,image/png,image/webp' : originals.photoAccept;
    if (photoLabel) photoLabel.hidden = isDb ? false : originals.photoHidden;
    if (preview) preview.hidden = isDb ? false : originals.previewHidden;
    textField.readOnly = isDb ? false : originals.textReadOnly;
    ratingField.disabled = isDb ? false : originals.ratingDisabled;
    submit.textContent = isDb ? '💾 DB 리뷰 저장하기 (사진 선택 가능)' : originals.submit;
    status('');
    if (isDb) void preloadMine(recipeId, viewVersion);
  }

  new MutationObserver(updateForm).observe(view, {
    attributes: true, attributeFilter: ['class']
  });
  updateForm();

  function updateDetailButtons() {
    if (!detail.querySelector('.verified-badge')?.textContent.includes('DB 저장')) return;
    const a = detail.querySelector('#writeReviewBtn');
    const b = detail.querySelector('#detailReviewBtn');
    if (a && a.textContent !== 'DB 리뷰 · 사진 첨부') a.textContent = 'DB 리뷰 · 사진 첨부';
    if (b && b.textContent !== 'DB 리뷰 작성 / 사진 추가') b.textContent = 'DB 리뷰 작성 / 사진 추가';
  }
  new MutationObserver(updateDetailButtons).observe(detail, { childList: true });
  updateDetailButtons();

  async function csrfToken() {
    const response = await fetch(`${API}/api/accounts/csrf/`, { credentials: 'include' });
    if (!response.ok) throw new Error('CSRF 인증 쿠키 발급에 실패했습니다.');
    const row = document.cookie.split('; ').find(x => x.startsWith('csrftoken='));
    if (!row) throw new Error('CSRF 쿠키가 없습니다. 페이지를 새로고침해 주세요.');
    return decodeURIComponent(row.slice('csrftoken='.length));
  }

  async function uploadPhoto(reviewId, file, token) {
    const multipart = new FormData();
    multipart.append('photo', file);
    const response = await fetch(`${API}/api/catalog/reviews/${reviewId}/photo/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRFToken': token }, // FormData의 Content-Type은 브라우저가 설정해야 함
      body: multipart
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `사진 업로드 실패 (HTTP ${response.status})`);
    return payload;
  }

  // 기존 app.js의 localStorage 리뷰 +10P 제출 핸들러보다 앞에서 DB 제출을 가로챈다.
  form.addEventListener('submit', async (event) => {
    const recipeId = dbRecipeId();
    if (recipeId === null) return; // 시연용 조합은 기존 app.js 코드 그대로 실행
    event.preventDefault();
    event.stopImmediatePropagation();
    if (submit.disabled) return;

    const file = photo.files?.[0] || null;
    if (file && (file.size < 1 || file.size > 3 * 1024 * 1024)) {
      status('사진은 3MB 이하의 파일만 선택할 수 있어요.', true);
      return;
    }
    if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      status('JPG, PNG, WebP 사진을 선택해 주세요.', true);
      return;
    }

    const alreadyExists = existingReview?.recipeId === recipeId ? existingReview.reviewId : null;
    if (alreadyExists && !file) {
      status('이 조합에 이미 리뷰가 있어요. 사진을 추가하려면 사진을 선택해 주세요.', true);
      return;
    }

    const rating = Number(ratingField.value);
    const content = textField.value.trim();
    if (!alreadyExists && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      status('별점을 1~5점 중에서 선택해 주세요.', true);
      return;
    }
    if (!alreadyExists && (content.length < 1 || content.length > 2000)) {
      status('리뷰 내용을 1~2000자로 입력해 주세요.', true);
      return;
    }

    submit.disabled = true;
    status('Django 서버에 저장하는 중입니다...');
    let reviewId = alreadyExists;
    let isExisting = Boolean(alreadyExists);
    let createdNow = false;
    let awardedPoints = null;

    try {
      const token = await csrfToken();
      if (!reviewId) {
        const response = await fetch(`${API}/api/catalog/recipes/${recipeId}/reviews/`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': token },
          body: JSON.stringify({ rating, content })
        });
        const payload = await response.json().catch(() => ({}));
        if (response.status === 409) {
          if (!file) throw new Error('이미 리뷰를 작성한 조합입니다. 사진을 추가하려면 사진을 선택해 주세요.');
          const mine = await getMine(recipeId);
          if (!mine) throw new Error('기존 리뷰 ID를 확인할 수 없습니다. views.py에 is_mine 필드를 추가했는지 확인해 주세요.');
          reviewId = mine.id;
          isExisting = true;
          showExisting(recipeId, mine);
        } else if (!response.ok) {
          if (response.status === 401) throw new Error('로그인이 필요합니다.');
          if (response.status === 403) throw new Error('CSRF 인증 오류입니다. 새로고침해 주세요.');
          throw new Error(payload.error || `리뷰 저장 실패 (HTTP ${response.status})`);
        } else {
          reviewId = payload.review?.id;
          createdNow = true;
        }
      }

      if (!Number.isSafeInteger(reviewId) || reviewId < 1) {
        throw new Error('서버에서 올바른 리뷰 ID를 받지 못했습니다.');
      }

      if (file) {
        const result = await uploadPhoto(reviewId, file, token);
        awardedPoints = Number(result.points_awarded ?? 0);
        status(`✅ ${isExisting ? '기존 리뷰 사진 추가/교체' : '리뷰·사진 저장'} 성공! (리뷰 ID: ${reviewId}) DB 포인트 +${awardedPoints}P 적립되었습니다.`);
        console.log('✅ PICKFOO DB 리뷰 사진 업로드', result);
        window.PICKFOO_DB_POINTS?.refresh();
      } else {
        status(`✅ PostgreSQL 리뷰 저장 성공! (리뷰 ID: ${reviewId}) 사진이 없어 DB 포인트는 적립되지 않았습니다.`);
      }

      // 신규 작성 직후에도 동일 조합에서 새 리뷰를 중복 등록하지 않도록 상태 갱신
      if (!isExisting) {
        showExisting(recipeId, { id: reviewId, rating, content });
        status(`✅ ${file ? '리뷰·사진' : '리뷰'} 저장 완료! (리뷰 ID: ${reviewId}) ${file ? `DB 포인트 +${awardedPoints}P` : '사진 미첨부: DB 포인트 없음'}`);
      }
    } catch (error) {
      console.error('PICKFOO STEP 188 DB 리뷰 오류:', error);
      const partial = createdNow
        ? '⚠️ 리뷰 글은 DB에 저장됐지만 이후 사진 처리에 문제가 생겼어요. 같은 조합에서 다시 사진을 선택하면 사진 업로드를 재시도할 수 있습니다. '
        : '❌ ';
      status(partial + error.message, true);
      // 성공적으로 생성한 리뷰의 ID를 확보했으면 다음 제출 때 본문을 중복 등록하지 않는다.
      if (createdNow && Number.isSafeInteger(reviewId) && reviewId > 0) {
        showExisting(recipeId, { id: reviewId, rating, content });
        status(partial + error.message, true);
      }
    } finally {
      submit.disabled = false;
    }
  }, true);

  console.log('✅ PICKFOO STEP 188 DB 리뷰 사진 업로드 연결 준비 완료');
})();
