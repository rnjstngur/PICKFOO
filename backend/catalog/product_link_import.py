# PICKFOO_STEP250_PRICES
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
    if not reader.fieldnames or (
        not {'ingredient_name', 'provider', 'price_krw'}.issubset(reader.fieldnames)
        and any(key not in reader.fieldnames for key in EXPECTED[:4])
    ):
        raise ValueError('필수 열: ingredient_name, provider, product_name, url (가격 CSV는 ingredient_name, provider, price_krw)')
    if len(set(reader.fieldnames)) != len(reader.fieldnames):
        raise ValueError('CSV 열 이름이 중복됩니다.')
    if 'price_krw' in reader.fieldnames and 'product_name' not in reader.fieldnames:
        return import_price_only_rows(reader)
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


def import_price_only_rows(reader):
    """Update prices of existing links only; never create or overwrite a URL."""
    from datetime import date
    required = {'ingredient_name', 'provider', 'price_krw', 'price_checked_at', 'url'}
    if not required.issubset(set(reader.fieldnames or [])):
        raise ValueError('가격 CSV 필수 열: ingredient_name,provider,price_krw,price_checked_at,url')
    updated = 0
    seen = set()
    with transaction.atomic():
        for lineno, row in enumerate(reader, start=2):
            if lineno > 302:
                raise ValueError('가격은 한 번에 최대 300개 등록할 수 있습니다.')
            if not row or not any(str(x or '').strip() for x in row.values()):
                continue
            if None in row:
                raise ValueError(f'{lineno}행: CSV 쉼표 구분을 확인해 주세요.')
            name = str(row.get('ingredient_name') or '').strip()
            provider = str(row.get('provider') or '').strip()
            url = str(row.get('url') or '').strip()
            price_text = str(row.get('price_krw') or '').strip()
            date_text = str(row.get('price_checked_at') or '').strip()
            if not name or not provider or not url or not price_text or not date_text:
                raise ValueError(f'{lineno}행: 가격/확인일/링크 항목이 비어 있습니다.')
            identity = (ingredient_key(name), provider)
            if identity in seen:
                raise ValueError(f'{lineno}행: 동일 재료/판매처가 중복되어 있습니다.')
            seen.add(identity)
            if not price_text.isdecimal() or not 0 <= int(price_text) <= 10_000_000:
                raise ValueError(f'{lineno}행: 가격은 0~10,000,000원의 정수여야 합니다.')
            try:
                checked_at = date.fromisoformat(date_text)
            except ValueError:
                raise ValueError(f'{lineno}행: 가격 확인일은 YYYY-MM-DD 형식이어야 합니다.')
            record = IngredientProductLink.objects.filter(
                ingredient_key=identity[0], provider=identity[1]
            ).first()
            if record is None:
                raise ValueError(f'{lineno}행: 기존 상품 링크가 없습니다: {name}/{provider}. 먼저 상품 링크를 등록해 주세요.')
            if record.url.strip() != url:
                raise ValueError(f'{lineno}행: 기존 상품의 URL이 다릅니다: {name}/{provider}. 다른 상품 가격일 수 있어 등록을 중단합니다.')
            record.price_krw = int(price_text)
            record.price_checked_at = checked_at
            record.full_clean()
            record.save(update_fields=['price_krw', 'price_checked_at', 'updated_at'])
            updated += 1
    return 0, updated
