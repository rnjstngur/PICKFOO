"""Idempotently seed/update curated combo labels; never overwrite reviews or delete combos."""
import json
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from catalog.curated_models import CuratedCombo


class Command(BaseCommand):
    help = 'Create/update PICKFOO exhibition curated combos (does not create fake reviews).'

    def handle(self, *args, **kwargs):
        path = Path(__file__).resolve().parents[3] / 'catalog_data' / 'curated_combos.json'
        if not path.is_file():
            raise CommandError(f'조합 목록 JSON 파일을 찾을 수 없습니다: {path}')
        try:
            rows = json.loads(path.read_text(encoding='utf-8'))
        except (json.JSONDecodeError, UnicodeError) as e:
            raise CommandError(f'조합 JSON을 읽을 수 없습니다: {e}')
        if not isinstance(rows, list) or len(rows) != 20:
            raise CommandError('전시 조합은 정확히 20개여야 합니다.')
        seen = set()
        for row in rows:
            if not isinstance(row, dict) or not isinstance(row.get('key'), str) or not isinstance(row.get('name'), str):
                raise CommandError('key/name 형식이 올바르지 않습니다.')
            key, name = row['key'], row['name'].strip()
            if not key.startswith('pf-curated-') or len(name) == 0 or len(name) > 150 or key in seen:
                raise CommandError(f'중복되거나 유효하지 않은 조합: {key}')
            seen.add(key)
        owner = get_user_model().objects.filter(is_superuser=True, is_active=True).order_by('id').first()
        if owner is None:
            raise CommandError('활성 관리자 계정이 없습니다. 먼저 createsuperuser로 관리자를 만들어 주세요.')
        created_count = updated_count = 0
        with transaction.atomic():
            for row in rows:
                combo, created = CuratedCombo.objects.get_or_create(
                    key=row['key'], defaults={'name': row['name'].strip(), 'created_by': owner})
                if created:
                    created_count += 1
                elif combo.name != row['name'].strip():
                    combo.name = row['name'].strip()
                    combo.save(update_fields=['name'])
                    updated_count += 1
        self.stdout.write(self.style.SUCCESS(
            f'전시 조합 등록 완료: 신규 {created_count}, 이름 변경 {updated_count}, 전체 {len(rows)}. 기존 리뷰 보존.'))
