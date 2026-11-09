# -*- coding: utf-8 -*-
"""STEP238: Add one actual PocketCU product share link to the PICKFOO recipe detail UI.

Run in the project root:
    py apply_step238.py --check
    py apply_step238.py

Changes only www/index.html and adds www/pocketcu-product-links.js.
No DB changes, no native Android changes, no unrelated scripts touched.
"""
from __future__ import annotations
from datetime import datetime
from pathlib import Path
import argparse
import shutil

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'patch_files' / 'www' / 'pocketcu-product-links.js'
DEST = ROOT / 'www' / 'pocketcu-product-links.js'
INDEX = ROOT / 'www' / 'index.html'
MARK = 'PICKFOO_STEP238_POCKETCU_PRODUCT'
TAG = '<script src="pocketcu-product-links.js?v=238"></script>'


def make_plan():
    if not INDEX.is_file() or not SRC.is_file():
        raise RuntimeError('www/index.html 또는 patch_files/www/pocketcu-product-links.js를 찾지 못했습니다.')
    content = INDEX.read_text(encoding='utf-8')
    if 'curated-trending.js' not in content:
        raise RuntimeError('STEP236 최신 index.html을 확인하지 못했습니다. 기존 파일은 수정하지 않습니다.')
    if 'detailContent' not in content or content.count('</body>') != 1:
        raise RuntimeError('STEP238을 삽입할 index.html 구조를 확인하지 못했습니다.')
    payload = SRC.read_bytes()
    if MARK not in payload.decode('utf-8'):
        raise RuntimeError('패치 JS 내용이 올바르지 않습니다.')
    plan = {}
    if DEST.exists():
        if DEST.read_bytes() != payload:
            raise RuntimeError('pocketcu-product-links.js에 다른 내용이 있어 덮어쓰지 않습니다.')
    else:
        plan[DEST] = payload
    if 'pocketcu-product-links.js' not in content:
        result = content.replace('</body>', TAG + '\n</body>')
        plan[INDEX] = result.encode('utf-8')
    elif TAG not in content:
        raise RuntimeError('이미 다른 형식의 포켓CU 상품 링크 스크립트가 연결되어 있습니다.')
    return plan


def main():
    parser = argparse.ArgumentParser(description='PICKFOO STEP238 포켓CU 상품 링크 테스트')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    changes = make_plan()
    if not changes:
        print('STEP238이 이미 적용되어 있어 수정할 파일이 없습니다.')
        return
    print('안전 검사 성공: 적용 예정', len(changes), '개')
    for path in changes:
        print(' -', path.relative_to(ROOT))
    if args.check:
        return
    backup = ROOT / '_step238_backup' / datetime.now().strftime('%Y%m%d_%H%M%S')
    for path in changes:
        if path.exists():
            target = backup / path.relative_to(ROOT)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, target)
    for path, data in changes.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    print('패치 적용 완료. 기존 파일 백업 위치:', backup)
    print('다음: railway up --service pickfoo-web --environment production')
    print('새로운 DB 마이그레이션·APK 재빌드 불필요(웹 UI 테스트).')


if __name__ == '__main__':
    try:
        main()
    except (OSError, UnicodeError, RuntimeError) as exc:
        raise SystemExit('안전 중단: ' + str(exc))
