# -*- coding: utf-8 -*-
"""PICKFOO STEP236 seven-day real review ranking install tool (non-destructive).

Use: py apply_step236.py --check   then   py apply_step236.py
"""
from pathlib import Path
from datetime import datetime
import argparse
import re
import shutil

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'patch_files'
MARK = 'PICKFOO_STEP236_TRENDING'


def patch_urls(src):
    if MARK in src:
        return src
    if 'PICKFOO_STEP233_VERIFICATION' not in src or 'urlpatterns' not in src:
        raise RuntimeError('STEP233 URL 연결을 찾지 못했습니다. urls.py 수정 중단')
    return src.rstrip() + """

# PICKFOO_STEP236_TRENDING
from .curated_trending_views import curated_trending
urlpatterns += [
    path('curated/trending/', curated_trending, name='curated-trending'),
]
"""


def patch_app(src):
    if MARK in src:
        return src
    if 'PICKFOO_STEP235_PERSONAL_HISTORY' not in src or 'function openDetail(id)' not in src:
        raise RuntimeError('STEP235 최신 app.js를 확인하지 못했습니다. 덮어쓰지 않습니다.')
    trimmed = src.rstrip()
    if not trimmed.endswith('})();'):
        raise RuntimeError('app.js 마지막 구문이 예상과 달라 수정 중단')
    suffix = r"""
// PICKFOO_STEP236_TRENDING: 메인 추천 상태와 무관하게 전시 조합 상세를 엽니다.
window.addEventListener('pickfoo:open-curated-recipe', event => {
  const key = event.detail?.key;
  if (typeof key !== 'string' || !/^pf-curated-(0[1-9]|1\d|20)$/.test(key)) return;
  if (data.recipes.some(r => r.curated === true && r.id === key)) openDetail(key);
});
"""
    return trimmed[:-len('})();')] + suffix + '})();\n'


def patch_index(src):
    if 'curated-trending.js' in src:
        return src
    if 'curated-verification.js' not in src:
        raise RuntimeError('STEP233 검증 스크립트를 index.html에서 찾지 못했습니다.')
    if src.count('</body>') != 1:
        raise RuntimeError('index.html의 </body>가 1개가 아닙니다.')
    src = src.replace('</body>', '<script src="curated-trending.js?v=236"></script>\n</body>')
    pattern = re.compile(r'(?P<quote>[\'\"])app\.js(?:\?v=[\w.-]+)?(?P=quote)')
    # Keep app.js cache version consistent after changing its click handler.
    src, n = pattern.subn(lambda m: m.group('quote') + 'app.js?v=236' + m.group('quote'), src)
    if n != 1: raise RuntimeError(f'app.js 로딩 태그를 정확히 하나 찾지 못했습니다 ({n}개).')
    return src


def plan():
    targets = {
        'backend/catalog/urls.py': patch_urls,
        'www/app.js': patch_app,
        'www/index.html': patch_index,
    }
    out = {}
    for name, func in targets.items():
        path = ROOT/name
        if not path.is_file(): raise RuntimeError(f'기존 파일 없음: {name}')
        old = path.read_text(encoding='utf-8')
        new = func(old)
        if new != old: out[path] = new.encode('utf-8')
    for name in ['backend/catalog/curated_trending_views.py','www/curated-trending.js']:
        path = ROOT/name
        source = SRC/name
        if not source.is_file(): raise RuntimeError(f'패치 파일 없음: {source}')
        data = source.read_bytes()
        if path.exists() and path.read_bytes() != data:
            raise RuntimeError(f'다른 파일이 존재하여 덮어쓰기 중단: {name}')
        if not path.exists(): out[path] = data
    return out


def main():
    parser = argparse.ArgumentParser(description='PICKFOO 최근 7일 실제 평가 인기')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    changes = plan()
    if not changes:
        print('이미 STEP 236이 적용되어 있어 변경 사항이 없습니다.')
        return
    print('적용 검사 성공. 추가/수정 예정 파일:',len(changes),'개')
    for path in changes: print(' -',path.relative_to(ROOT))
    if args.check: return
    backup = ROOT/'_step236_backup'/datetime.now().strftime('%Y%m%d_%H%M%S')
    for path in changes:
        if path.exists():
            dest = backup/path.relative_to(ROOT)
            dest.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(path,dest)
    for path,data in changes.items():
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_bytes(data)
    print('패치 적용 완료. 기존 파일 백업:',backup)
    print('다음: railway up --service pickfoo-web --environment production')
    print('마이그레이션 불필요 (기존 평가 데이터 조회만 수행)')

if __name__ == '__main__':
    try: main()
    except (RuntimeError, OSError, UnicodeError) as exc:
        raise SystemExit('안전 중단: '+str(exc))
