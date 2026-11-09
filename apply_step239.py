# -*- coding: utf-8 -*-
"""STEP239: link a user-supplied 우리동네GS share URL from selected PICKFOO cards.

    py apply_step239.py --check
    py apply_step239.py

Adds www/gs25-product-links.js and one script tag to www/index.html.
Never edits STEP238, Django, or user data. Performs a backup and is idempotent.
"""
from __future__ import annotations
from datetime import datetime
from pathlib import Path
import argparse
import shutil

ROOT = Path(__file__).resolve().parent
INDEX = ROOT / 'www' / 'index.html'
SRC = ROOT / 'patch_files' / 'www' / 'gs25-product-links.js'
DEST = ROOT / 'www' / 'gs25-product-links.js'
TAG = '<script src="gs25-product-links.js?v=239"></script>'
MARKER = 'PICKFOO_STEP239_GS_PRODUCT_LINK'


def plan_changes():
    if not INDEX.is_file():
        raise RuntimeError('www/index.html을 찾을 수 없습니다.')
    if not SRC.is_file():
        raise RuntimeError('patch_files/www/gs25-product-links.js가 없습니다.')
    if not (ROOT / 'www' / 'pocketcu-product-links.js').is_file():
        raise RuntimeError('STEP238 포켓CU 패치 파일을 찾을 수 없습니다. 기존 버전을 확인해 주세요.')

    html = INDEX.read_text(encoding='utf-8')
    if 'pocketcu-product-links.js' not in html or 'curated-trending.js' not in html:
        raise RuntimeError('STEP238/STEP236 스크립트가 연결된 최신 index.html이 아닙니다.')
    if html.count('</body>') != 1 or 'detailContent' not in html:
        raise RuntimeError('index.html의 정상적인 본문 구조를 찾을 수 없습니다.')

    src = SRC.read_bytes()
    if MARKER not in src.decode('utf-8') or 'https://abr.ge/d5an5bd' not in src.decode('utf-8'):
        raise RuntimeError('GS 상품 패치 파일의 내용이 올바르지 않습니다.')

    plan = {}
    if DEST.exists():
        if DEST.read_bytes() != src:
            raise RuntimeError('기존 gs25-product-links.js와 내용이 달라 자동 덮어쓰기를 중단했습니다.')
    else:
        plan[DEST] = src

    if 'gs25-product-links.js' not in html:
        new_html = html.replace('</body>', TAG + '\n</body>')
        plan[INDEX] = new_html.encode('utf-8')
    elif TAG not in html or html.count('gs25-product-links.js') != 1:
        raise RuntimeError('다른 형식의 GS 스크립트 태그가 이미 있어서 덮어쓰지 않습니다.')
    return plan


def main():
    parser = argparse.ArgumentParser(description='PICKFOO STEP239 우리동네GS 공유 URL 연결')
    parser.add_argument('--check', action='store_true', help='실제 수정 없이 안전 검사')
    args = parser.parse_args()
    changes = plan_changes()
    if not changes:
        print('STEP239가 이미 적용되어 수정할 내용이 없습니다.')
        return

    print(f'안전 검사 성공: 적용 예정 파일 {len(changes)}개')
    for path in changes:
        print(' -', path.relative_to(ROOT))
    if args.check:
        return

    backup_dir = ROOT / '_step239_backup' / datetime.now().strftime('%Y%m%d_%H%M%S')
    for path in changes:
        if path.exists():
            backup_path = backup_dir / path.relative_to(ROOT)
            backup_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, backup_path)
    for path, payload in changes.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(payload)
    print('STEP239 패치 적용 완료.')
    print('백업 위치:', backup_dir)
    print('다음: railway up --service pickfoo-web --environment production')
    print('DB 마이그레이션이나 APK 재빌드는 필요하지 않습니다 (Railway 원격 웹 로드 기준).')


if __name__ == '__main__':
    try:
        main()
    except (OSError, UnicodeError, RuntimeError) as e:
        raise SystemExit('안전 중단: ' + str(e))
