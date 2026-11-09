# -*- coding: utf-8 -*-
"""PICKFOO STEP 235: safely install personal rating-history recommendations.

From C:\\devpickfoo\\PICKFOO_CLOUD:
    py apply_step235.py --check
    py apply_step235.py

Only changes www/app.js, www/recommendation.js, www/index.html,
backend/catalog/urls.py; adds backend/catalog/curated_history_views.py.
No database or Railway access is performed by this script.
"""
from __future__ import annotations
import argparse
import hashlib
import re
import shutil
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'patch_files'
MARK = 'PICKFOO_STEP235_PERSONAL_HISTORY'
EXPECTED = {
    'www/app.js': '229e492408a34decce3be53a63ae30ca111b89793de2523ebde534e450ce95a7',
    'www/recommendation.js': 'eb84273a377fe9ccf4530e28d6e398081ea939f1fe3302598e47973850d6da6a',
}


def checked_web_file(filename):
    path = ROOT / filename
    source = SRC / filename
    if not path.is_file() or not source.is_file():
        raise RuntimeError(f'파일을 찾지 못했습니다: {filename}')
    before = path.read_bytes()
    after = source.read_bytes()
    if before == after:
        return None
    if MARK in before.decode('utf-8', errors='replace'):
        raise RuntimeError(f'{filename}: 이미 다른 버전의 STEP 235 패치가 있습니다. 덮어쓰지 않습니다.')
    digest = hashlib.sha256(before).hexdigest()
    if digest != EXPECTED[filename]:
        raise RuntimeError(f'{filename}: 보내주신 최신 파일과 PC 파일이 다릅니다. 덮어쓰기 전에 현재 파일을 다시 확인해 주세요.')
    return after


def patch_index(text):
    for name in ('app.js', 'recommendation.js'):
        pattern = re.compile(r'(?P<q>[\'\"])'+re.escape(name)+r'(?:\?v=[\w.-]+)?(?P=q)')
        matches = list(pattern.finditer(text))
        if len(matches) != 1:
            raise RuntimeError(f'www/index.html: {name} 스크립트를 정확히 1개 찾지 못했습니다 ({len(matches)}개).')
        text = pattern.sub(lambda m: m.group('q') + name + '?v=235' + m.group('q'), text, count=1)
    return text


def make_plan():
    for filename in ('backend/catalog/curated_models.py','www/curated-verification.js'):
        if not (ROOT / filename).is_file():
            raise RuntimeError(f'STEP 233 검증 배지 파일이 없습니다: {filename}')
    plan = {}
    for name in EXPECTED:
        payload = checked_web_file(name)
        if payload is not None: plan[ROOT/name] = payload

    index = ROOT/'www/index.html'
    if not index.is_file(): raise RuntimeError('www/index.html 파일이 없습니다.')
    old = index.read_text(encoding='utf-8')
    new = patch_index(old)
    if old != new: plan[index] = new.encode('utf-8')

    urls = ROOT/'backend/catalog/urls.py'
    if not urls.is_file(): raise RuntimeError('backend/catalog/urls.py 파일이 없습니다.')
    old = urls.read_text(encoding='utf-8')
    if MARK not in old:
        if 'urlpatterns' not in old or 'curated/' not in old:
            raise RuntimeError('STEP 233 URL 등록 상태가 예상과 다릅니다. 기존 URL을 수정하지 않았습니다.')
        new = old.rstrip() + '''\n\n# PICKFOO_STEP235_PERSONAL_HISTORY\nfrom .curated_history_views import my_rating_history\nurlpatterns += [\n    path('curated/my-rating-history/', my_rating_history, name='curated-my-rating-history'),\n]\n'''
        plan[urls] = new.encode('utf-8')

    target = ROOT/'backend/catalog/curated_history_views.py'
    source = SRC/'backend/catalog/curated_history_views.py'
    payload = source.read_bytes()
    if target.exists() and target.read_bytes() != payload:
        raise RuntimeError('curated_history_views.py 이름의 다른 파일이 이미 있어 덮어쓰지 않습니다.')
    if not target.exists(): plan[target] = payload
    return plan


def main():
    parser = argparse.ArgumentParser(description='PICKFOO STEP 235 개인 평가 이력 추천 패치')
    parser.add_argument('--check', action='store_true', help='적용 가능 여부와 수정 예정 파일만 확인')
    args = parser.parse_args()
    plan = make_plan()
    if not plan:
        print('이미 STEP 235가 적용되어 있어 변경할 파일이 없습니다.')
        return
    print(f'안전 검사 성공: 추가/수정 파일 {len(plan)}개')
    for path in plan:
        print(' -', path.relative_to(ROOT))
    if args.check: return
    backup = ROOT / '_step235_backup' / datetime.now().strftime('%Y%m%d_%H%M%S')
    for path in plan:
        if path.exists():
            dest = backup / path.relative_to(ROOT)
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, dest)
    for path, content in plan.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    print('패치 적용 완료. 백업 폴더:', backup)
    print('다음: railway up --service pickfoo-web --environment production')
    print('이번 패치에는 DB 마이그레이션이 없습니다.')


if __name__ == '__main__':
    try:
        main()
    except (OSError, RuntimeError, UnicodeError) as exc:
        raise SystemExit('안전 중단: ' + str(exc))
