/* PICKFOO STEP 231: 실제 개별 메뉴 DB 추천 및 '선택 메뉴로 조합 만들기' 화면은
 * 학교 전시 시연에서 일시적으로 비활성화합니다.
 * Django 실제 메뉴/재료 DB 및 관리자 등록 데이터는 삭제하지 않습니다.
 * 20개 전시 추천 조합과 앱 내 '+ 나만의 조합 등록' 기능은 유지됩니다.
 */
(() => {
  'use strict';
  // 이전 세션의 화면 요소가 남는 경우만 정리 (현재는 새로고침 시 생성되지 않음).
  document.getElementById('pfDbRealMenuSection')?.remove();
  console.info('PICKFOO STEP 231: 하단 실제 메뉴 추천 / 메뉴 선택 조합 화면 비활성화');
})();
