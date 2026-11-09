# -*- coding: utf-8 -*-
"""PICKFOO STEP240 — DB-managed ingredient product links (safe installer).

Run in C:\\devpickfoo\\PICKFOO_CLOUD:
    py apply_step240.py --check
    py apply_step240.py

Makes timestamped backups. Does not delete user data or modify DB until Django
migration is run. Requires STEP239 (and preceding STEP233) installed.
"""
from __future__ import annotations
import argparse
import re
import shutil
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'patch_files'
MARK = 'PICKFOO_STEP240_PRODUCT_LINK_DB'

NEW_FILES = (
    'backend/catalog/product_link_models.py',
    'backend/catalog/product_link_views.py',
    'backend/catalog/product_link_admin.py',
    'backend/catalog/product_link_import.py',
    'backend/catalog/migrations/0008_product_links.py',
    'backend/catalog/templates/admin/catalog/ingredientproductlink/change_list.html',
    'backend/catalog/templates/admin/catalog/ingredientproductlink/import_csv.html',
    'www/product-links-db.js',
)


def patch_models(src):
    if MARK in src: return src
    if 'PICKFOO_STEP233_VERIFICATION' not in src or 'CuratedComboReview' not in src:
        raise RuntimeError('STEP233 검증 모델을 찾지 못했습니다. models.py 변경을 중단했습니다.')
    return src.rstrip() + f'\n\n# {MARK}\nfrom .product_link_models import IngredientProductLink\n'


def patch_admin(src):
    if MARK in src: return src
    if 'PICKFOO_STEP233_VERIFICATION' not in src or 'curated_admin' not in src:
        raise RuntimeError('현재 admin.py의 STEP233 관리자 연결을 찾지 못했습니다.')
    return src.rstrip() + f'\n\n# {MARK}\nfrom .product_link_admin import IngredientProductLinkAdmin\n'


def patch_urls(src):
    if MARK in src: return src
    if 'PICKFOO_STEP239' in src:  # URL does not need STEP239; left as an intentional no-op.
        pass
    if 'PICKFOO_STEP233_VERIFICATION' not in src or 'urlpatterns' not in src:
        raise RuntimeError('현재 catalog/urls.py의 STEP233 URL 설정을 찾지 못했습니다.')
    return src.rstrip() + f'''

# {MARK}
from .product_link_views import links_for_ingredients
urlpatterns += [
    path('product-links/', links_for_ingredients, name='pickfoo-product-links'),
]
'''


def patch_index(src):
    if MARK in src:
        if 'product-links-db.js' not in src:
            raise RuntimeError('STEP240 마커는 있으나 새 스크립트가 연결되지 않았습니다.')
        return src
    if src.count('</body>') != 1 or 'curated-trending.js' not in src:
        raise RuntimeError('최신 STEP236 이후 index.html인지 확인해 주세요.')
    # Previously added one-off buttons are replaced by DB-backed links. The original
    # JS files are preserved as a recoverable backup (and never deleted).
    for filename in ('pocketcu-product-links.js', 'gs25-product-links.js'):
        pattern = re.compile(r'(?m)^[ \t]*<script\s+src=(["\'])' + re.escape(filename) +
                             r'(?:\?v=[\w.-]+)?\1\s*>\s*</script>[ \t]*\n?')
        src, n = pattern.subn('', src)
        if n != 1:
            raise RuntimeError(f'{filename}: 기존 스크립트 태그가 정확히 1개가 아닙니다. 검색 {n}건.')
    return src.replace('</body>',
                       f'<!-- {MARK} -->\n<script src="product-links-db.js?v=240"></script>\n</body>')


def make_plan():
    if not (ROOT / 'backend/catalog/migrations/0007_curatedcombo_verification.py').is_file():
        raise RuntimeError('STEP233 마이그레이션 파일이 없습니다. 프로젝트 경로를 확인해 주세요.')
    transformations = {
        'backend/catalog/models.py': patch_models,
        'backend/catalog/admin.py': patch_admin,
        'backend/catalog/urls.py': patch_urls,
        'www/index.html': patch_index,
    }
    plan = {}
    # Complete validation before modifying any file.
    for rel, fn in transformations.items():
        target = ROOT / rel
        if not target.is_file(): raise RuntimeError(f'기존 파일 없음: {rel}')
        old = target.read_text(encoding='utf-8')
        changed = fn(old)
        if old != changed: plan[target] = changed.encode('utf-8')
    for rel in NEW_FILES:
        source = SRC / rel
        target = ROOT / rel
        if not source.is_file(): raise RuntimeError(f'패치 내부 파일 없음: {rel}')
        data = source.read_bytes()
        if target.exists() and target.read_bytes() != data:
            raise RuntimeError(f'이름이 같은 기존 파일의 내용이 다릅니다. 덮어쓰기를 중단했습니다: {rel}')
        if not target.exists(): plan[target] = data
    return plan


def main():
    parser = argparse.ArgumentParser(description='PICKFOO STEP240 상품 공유 링크 DB 자동 매칭 패치')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    plan = make_plan()
    if not plan:
        print('STEP240이 이미 적용되어 있습니다. 변경 사항 없음.')
        return
    print(f'STEP240 안전 검사 성공: 변경/추가 파일 {len(plan)}개')
    for path in plan: print(' -', path.relative_to(ROOT))
    if args.check: return
    backup = ROOT / '_step240_backup' / datetime.now().strftime('%Y%m%d_%H%M%S')
    for path in plan:
        if path.is_file():
            dest = backup / path.relative_to(ROOT)
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, dest)
    for path, payload in plan.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(payload)
    print('STEP240 패치 적용 완료.')
    print('백업 위치:', backup)
    print('배포: railway up --service pickfoo-web --environment production')
    print('DB 적용: railway ssh --service pickfoo-web --environment production -- python manage.py migrate --noinput')
    print('이제 Django admin의 [재료별 상품 링크]에서 직접 수정하거나 CSV 업로드가 가능합니다.')


if __name__ == '__main__':
    try:
        main()
    except (OSError, UnicodeError, RuntimeError) as exc:
        raise SystemExit('안전 중단: ' + str(exc))
