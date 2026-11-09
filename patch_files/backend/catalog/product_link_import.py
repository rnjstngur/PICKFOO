"""Validate and atomically import Excel-saved UTF-8 CSV of public product links."""
import csv
import io
from django.core.exceptions import ValidationError
from django.db import transaction

from .product_link_models import IngredientProductLink, ingredient_key

EXPECTED = ('ingredient_name', 'provider', 'product_name', 'url', 'aliases', 'note', 'is_active')


def import_csv_bytes(raw):
    if len(raw) > 512_000:
        raise ValueError('CSV 파일은 500KB 이하만 지원합니다.')
    try:
        content = raw.decode('utf-8-sig')
    except UnicodeDecodeError:
        raise ValueError('엑셀에서 CSV UTF-8 형식으로 저장해 주세요.')
    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames or any(key not in reader.fieldnames for key in EXPECTED[:4]):
        raise ValueError('필수 열: ingredient_name, provider, product_name, url')
    if len(set(reader.fieldnames)) != len(reader.fieldnames):
        raise ValueError('CSV 열 이름이 중복됩니다.')
    new = changed = 0
    with transaction.atomic():
        for lineno, row in enumerate(reader, start=2):
            if lineno > 302:
                raise ValueError('한 번에 최대 300개의 링크만 등록할 수 있습니다.')
            if not row or not any(str(x or '').strip() for x in row.values()):
                continue
            if None in row:
                raise ValueError(f'{lineno}행: 값이 너무 많습니다. CSV 쉼표를 확인해 주세요.')
            required = [str(row.get(name) or '').strip() for name in EXPECTED[:4]]
            if not all(required):
                raise ValueError(f'{lineno}행: 필수 항목을 모두 입력해 주세요.')
            name, provider, product_name, url = required
            key = ingredient_key(name)
            record = IngredientProductLink.objects.filter(ingredient_key=key, provider=provider).first()
            if record is None:
                record = IngredientProductLink(ingredient_name=name, provider=provider)
                creating = True
            else:
                creating = False
            record.ingredient_name = name
            record.product_name = product_name
            record.url = url
            record.aliases = str(row.get('aliases') or '').strip()
            record.note = str(row.get('note') or '').strip()
            raw_active = str(row.get('is_active') or '1').strip().lower()
            if raw_active not in ('1', '0', 'true', 'false', 'yes', 'no', 'y', 'n'):
                raise ValueError(f'{lineno}행: is_active는 1 또는 0이어야 합니다.')
            record.is_active = raw_active in ('1', 'true', 'yes', 'y')
            try:
                record.full_clean()
            except ValidationError as exc:
                raise ValueError(f'{lineno}행: {"; ".join(exc.messages)}')
            record.save()
            if creating:
                new += 1
            else:
                changed += 1
    return new, changed
