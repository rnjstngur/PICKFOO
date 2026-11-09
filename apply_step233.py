# -*- coding: utf-8 -*-
"""PICKFOO STEP 233: safely apply curated verification feature to local cloud project.

Usage from C:\\devpickfoo\\PICKFOO_CLOUD:
    py apply_step233.py --check
    py apply_step233.py

Backs up changed files and refuses to patch unknown/outdated app.js layouts.
Does not connect to Railway and does not modify the database locally.
"""
from __future__ import annotations
import argparse
import ast
import shutil
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'patch_files'
MARK = '# PICKFOO_STEP233_VERIFICATION'


def replace_one(s, old, new, label):
    if old == new:
        return s
    count = s.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: 원본 코드가 예상한 형태가 아닙니다. 검색 {count}건. 파일을 덮어쓰지 않았습니다.')
    return s.replace(old, new, 1)


def build_app(src):
    original = src
    if '/* PICKFOO_STEP233_VERIFICATION */' in src:
        return src
    src = replace_one(src,
        'const verifiedOk=!state.verified||r.curated===true||(r.demoPicked??r.verified);',
        'const verifiedOk=!state.verified||(r.curated===true ? r.verification?.verified===true : r.dbVerified===true);',
        '검증 배지 필터')
    src = replace_one(src,
        "r.curated?'<span class=\"badge\">전시 추천</span>'",
        "r.curated?(r.verification?.verified?'<span class=\"badge\">✓ 내부 검증</span>':'<span class=\"badge\">전시 추천</span>')",
        '목록 배지')
    src = replace_one(src,
        'r.curated?"PICKFOO 선정"',
        'r.curated?(r.verification?.verified?"✓ 검증 · 보정 ★ "+Number(r.verification.adjusted_rating).toFixed(2):r.verification?"평가 "+r.verification.review_count+"건 · 검증 대기":"검증 점수 조회 중…")',
        '목록 평가')
    src = replace_one(src,
        "r.curated?'<span class=\"verified-badge\">팀 선정 · 전시 추천 (검증 배지 아님)</span>'",
        "r.curated?(r.verification?.verified?'<span class=\"verified-badge\">✓ PICKFOO 내부 검증</span>':'<span class=\"verified-badge\">팀 선정 · 검증 대기</span>')",
        '상세 배지')
    src = replace_one(src,
        'r.curated?"실제 평점 미집계"',
        'r.curated?(r.verification?.adjusted_rating!=null?"보정 평점 ⭐ "+r.verification.adjusted_rating:"보정 평점 미집계")',
        '상세 평점')
    src = replace_one(src,
        '전시용 선정 조합입니다. 기획 예상가격이며 매장별 실제 메뉴·옵션·판매 여부·원재료·알레르기 정보는 확인이 필요합니다. 검증 배지가 아닙니다.',
        '전시용 선정 조합입니다. 가격은 예상치이며 판매 여부·원재료·알레르기 정보는 직접 확인해야 합니다. 내부 검증 배지는 실제 DB 리뷰 10명 이상, 보정 평점 3.8 이상, 사진 리뷰 3건 이상인 경우에만 부여되며 식품 안전을 보증하지 않습니다.',
        '검증 안내')
    src = replace_one(src,
        'r.dbSaved?"💬 PostgreSQL 리뷰":"💬 이 기기에 저장된 후기"',
        '(r.dbSaved||r.curated)?"💬 PostgreSQL 리뷰":"💬 이 기기에 저장된 후기"',
        '상세 리뷰 제목')
    src = replace_one(src,
        'r.dbSaved?"DB 리뷰·사진 첨부":"사진 리뷰 +10P"',
        'r.curated?"검증 평가·사진 후기":r.dbSaved?"DB 리뷰·사진 첨부":"사진 리뷰 +10P"',
        '리뷰 작성 버튼')
    src = replace_one(src,
        'r.dbSaved?"DB 리뷰 작성 / 사진 추가":"사진 리뷰 작성하고 10P 받기"',
        'r.curated?"검증 평가 작성 / 수정":r.dbSaved?"DB 리뷰 작성 / 사진 추가":"사진 리뷰 작성하고 10P 받기"',
        '리뷰 작성 하단 버튼')
    src = replace_one(src,
        "function openDetail(id){const r=data.recipes.find(x=>x.id===id);if(!r)return;state.selected=id;",
        "function openDetail(id){const r=data.recipes.find(x=>x.id===id);if(!r)return;state.selected=id;document.getElementById('detailContent').dataset.curatedKey = r.curated ? r.id : '';",
        '현재 상세 조합 식별')
    src = replace_one(src,
        '\n})();',
        '''
// PICKFOO_STEP233_VERIFICATION: only real server reviews can award a badge.
window.addEventListener('pickfoo:curated-verification', event => {
  const values = event.detail || {};
  for (const item of data.recipes) {
    if (item.curated === true && Object.prototype.hasOwnProperty.call(values, item.id)) {
      item.verification = values[item.id];
    }
  }
  renderRecipes();
});
})();''',
        '검증 요약 연결')
    src = src.replace('})();\n', '})();\n', 1)
    return '/* PICKFOO_STEP233_VERIFICATION */\n' + src


def make_plan():
    models = ROOT / 'backend/catalog/models.py'
    urls = ROOT / 'backend/catalog/urls.py'
    admin = ROOT / 'backend/catalog/admin.py'
    app = ROOT / 'www/app.js'
    index = ROOT / 'www/index.html'
    for path in (models, urls, admin, app, index):
        if not path.is_file():
            raise RuntimeError(f'기존 프로젝트 파일을 찾지 못했습니다: {path}')
    result = {}
    model_text = models.read_text(encoding='utf-8')
    if 'PICKFOO_STEP233_VERIFICATION' not in model_text:
        model_text = model_text.rstrip() + '\n\n# PICKFOO_STEP233_VERIFICATION\nfrom .curated_models import CuratedCombo, CuratedComboReview\n'
    result[models] = model_text
    urls_text = urls.read_text(encoding='utf-8')
    if 'PICKFOO_STEP233_VERIFICATION' not in urls_text:
        urls_text = urls_text.rstrip() + '''

# PICKFOO_STEP233_VERIFICATION
from . import curated_views
urlpatterns += [
    path('curated/verification/', curated_views.curated_summary, name='curated-verification'),
    path('curated/reviews/<int:review_id>/photo/view/', curated_views.curated_photo_view, name='curated-photo-view'),
    path('curated/reviews/<int:review_id>/photo/', curated_views.curated_photo_upload, name='curated-photo-upload'),
    path('curated/reviews/<int:review_id>/', curated_views.curated_review_manage, name='curated-review-manage'),
    path('curated/<slug:key>/reviews/', curated_views.curated_reviews, name='curated-review-list-create'),
]
'''
    result[urls] = urls_text
    admin_text = admin.read_text(encoding='utf-8')
    if 'PICKFOO_STEP233_VERIFICATION' not in admin_text:
        admin_text = admin_text.rstrip() + '\n\n# PICKFOO_STEP233_VERIFICATION\nfrom . import curated_admin  # noqa: F401\n'
    result[admin] = admin_text
    result[app] = build_app(app.read_text(encoding='utf-8'))
    index_text = index.read_text(encoding='utf-8')
    if 'curated-verification.js' not in index_text:
        index_text = replace_one(index_text, '</body>', '<script src="curated-verification.js?v=233"></script>\n</body>', '검증 스크립트 추가')
        index_text = index_text.replace('app.js?v=231', 'app.js?v=233')
    result[index] = index_text
    for filename in [
        'backend/catalog/curated_models.py', 'backend/catalog/curated_views.py', 'backend/catalog/curated_admin.py',
        'backend/catalog/migrations/0007_curatedcombo_verification.py',
        'backend/catalog/management/__init__.py', 'backend/catalog/management/commands/__init__.py',
        'backend/catalog/management/commands/seed_curated_combos.py',
        'backend/catalog_data/curated_combos.json', 'www/curated-verification.js']:
        target = ROOT / filename
        source = SRC / filename
        if not source.is_file():
            raise RuntimeError(f'패치 파일이 없습니다: {source}')
        if target.is_file() and target.read_bytes() != source.read_bytes():
            raise RuntimeError(f'같은 이름의 다른 파일이 이미 있습니다. 덮어쓰지 않습니다: {target}')
        result[target] = source.read_bytes()
    return result


def main():
    p = argparse.ArgumentParser(description='PICKFOO 20개 전시 조합 실제 리뷰 검증 배지 패치')
    p.add_argument('--check', action='store_true', help='수정 가능 여부만 검사 (변경 없음)')
    args = p.parse_args()
    plan = make_plan()  # fail closed before touching anything
    changed = [(path, payload) for path,payload in plan.items()
               if not path.is_file() or path.read_bytes() != (payload.encode('utf-8') if isinstance(payload,str) else payload)]
    print(f'검사 성공! 추가/변경 파일 {len(changed)}개')
    if args.check:
        for path,_ in changed: print(' -',path.relative_to(ROOT))
        return
    if not changed:
        print('이미 적용되어 있습니다. 추가 변경 없음.')
        return
    backup = ROOT / '_step233_backup' / datetime.now().strftime('%Y%m%d_%H%M%S')
    for path,_ in changed:
        if path.is_file():
            dst = backup / path.relative_to(ROOT)
            dst.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(path,dst)
    for path,payload in changed:
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_bytes(payload.encode('utf-8') if isinstance(payload,str) else payload)
    print(f'패치 적용 완료. 기존 파일 백업 위치: {backup}')
    print('다음: railway up -> migrate -> seed_curated_combos -> 앱에서 테스트')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, OSError) as e:
        raise SystemExit(f'안전 중단: {e}')
