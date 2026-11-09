// PICKFOO STEP 227 - PostgreSQL 실제 메뉴 데이터 로더
// 메뉴 조회만 수행하며 회원, 리뷰, 레시피 저장 기능은 수정하지 않습니다.
(() => {
  'use strict';

  window.PICKFOO_DB_MENUS = [];
  window.PICKFOO_RECIPE_MENU_CANDIDATES = [];
  window.PICKFOO_CATALOG_STATE = 'loading';

  // 시연용 예시 조합과 실제 메뉴는 동일 상품이라는 뜻이 아닙니다.
  // 연결 후보는 참고 자료로만 사용하고, 신뢰할 수 있는 상품 일치를 주장하지 않습니다.
  const recipeMenuCandidates = [
    { recipeId: 'r2', recipeName: '아이스 바닐라 라떼 조합', brand: '스타벅스', menuName: '카페라떼' }
  ];
  const normalized = value => String(value ?? '').replace(/\s+/g, '').toLocaleLowerCase('ko-KR');

  function updateReferenceCandidates() {
    window.PICKFOO_RECIPE_MENU_CANDIDATES = recipeMenuCandidates.map(link => {
      const menu = window.PICKFOO_DB_MENUS.find(item =>
        normalized(item.brand) === normalized(link.brand) &&
        normalized(item.name) === normalized(link.menuName)
      );
      return {
        recipeId: link.recipeId,
        recipeName: link.recipeName,
        dbMenuId: menu ? menu.id : null,
        dbMenuName: menu ? menu.name : null,
        relation: '참고 메뉴 후보',
        matchingConfirmed: false
      };
    });
  }

  async function loadCatalogMenus() {
    window.PICKFOO_CATALOG_STATE = 'loading';
    try {
      const response = await fetch(`${window.PICKFOO_API_BASE}/api/catalog/menus/`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });
      if (response.status === 401) {
        window.PICKFOO_DB_MENUS = [];
        window.PICKFOO_CATALOG_STATE = 'login';
        console.info('PICKFOO 실제 메뉴는 로그인 후 조회할 수 있습니다.');
        return;
      }
      if (!response.ok) throw new Error(`DB 메뉴 조회 실패 (HTTP ${response.status})`);
      const payload = await response.json();
      if (!Array.isArray(payload.menus)) throw new Error('DB 메뉴 데이터 형식이 올바르지 않습니다.');

      window.PICKFOO_DB_MENUS = payload.menus.filter(item => item && Number.isSafeInteger(item.id) && item.id > 0);
      window.PICKFOO_CATALOG_STATE = 'ready';
      console.log(`✅ PICKFOO 실제 메뉴 ${window.PICKFOO_DB_MENUS.length}개 불러오기 성공`);
    } catch (error) {
      window.PICKFOO_DB_MENUS = [];
      window.PICKFOO_CATALOG_STATE = 'error';
      console.error('❌ PICKFOO 실제 메뉴 DB 조회 실패:', error);
    } finally {
      updateReferenceCandidates();
      document.dispatchEvent(new Event('pickfoo:catalog-ready'));
    }
  }

  document.addEventListener('pickfoo:catalog-reload', loadCatalogMenus);
  loadCatalogMenus();
})();
