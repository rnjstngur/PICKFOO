"""Import PICKFOO brand/menu/ingredient XLSX into the production catalog.

Examples:
  python manage.py import_catalog_excel           # read-only preflight
  python manage.py import_catalog_excel --apply   # add missing records only
  python manage.py import_catalog_excel --apply --update-existing

Requires no new Python packages. No deletions are performed.
"""

from __future__ import annotations

from pathlib import Path
from urllib.parse import urlsplit

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from catalog.models import Brand, Ingredient, Menu, MenuIngredient
from ._pickfoo_xlsx import ExcelImportError, parse_excel_date, read_pickfoo_xlsx

VALID_BRAND_CATEGORIES = {"convenience", "cafe", "restaurant", "other"}
VALID_AVAILABILITY = {"unknown", "available", "unavailable"}


def _url(value, where, errors):
    if not value:
        return
    parsed = urlsplit(value)
    if (parsed.scheme not in {"https", "http"} or not parsed.hostname or
            len(value) > 200):
        errors.append(f"{where}: URL은 http:// 또는 https://로 시작하고 200자 이하여야 합니다.")


def _max_length(value, count, where, errors):
    if len(value) > count:
        errors.append(f"{where}: {count}자 이하여야 합니다.")


def _validate_workbook(sheets):
    errors = []
    brands, ingredients, menus, relations = {}, {}, {}, {}

    for row, (name, category, website) in sheets["브랜드"]:
        where = f"브랜드 {row}행"
        if not name or not category:
            errors.append(f"{where}: 브랜드명과 브랜드 종류가 필요합니다.")
            continue
        if name in brands:
            errors.append(f"{where}: 중복 브랜드명 '{name}' (이미 {brands[name]['row']}행에 존재)")
        if category not in VALID_BRAND_CATEGORIES:
            errors.append(f"{where}: 브랜드 종류는 {', '.join(sorted(VALID_BRAND_CATEGORIES))} 중 하나여야 합니다.")
        _max_length(name, 100, where + ' 브랜드명', errors)
        _url(website, where + ' 홈페이지', errors)
        brands[name] = {'row': row, 'category': category, 'official_website': website}

    for row, (name, description) in sheets["재료"]:
        where = f"재료 {row}행"
        if not name:
            errors.append(f"{where}: 재료명은 필수입니다.")
            continue
        if name in ingredients:
            errors.append(f"{where}: 중복 재료명 '{name}'")
        _max_length(name, 100, where + ' 재료명', errors)
        ingredients[name] = {'row': row, 'description': description}

    for row, (brand, name, category, description, raw_price, source, status, raw_date) in sheets["메뉴"]:
        where = f"메뉴 {row}행"
        if not brand or not name:
            errors.append(f"{where}: 브랜드명과 메뉴명은 필수입니다.")
            continue
        key = (brand, name)
        if key in menus:
            errors.append(f"{where}: 중복 메뉴 '{brand} / {name}'")
        _max_length(brand, 100, where + ' 브랜드명', errors)
        _max_length(name, 150, where + ' 메뉴명', errors)
        _max_length(category, 50, where + ' 음식 종류', errors)
        _url(source, where + ' 정보 출처', errors)
        if status and status not in VALID_AVAILABILITY:
            errors.append(f"{where}: 판매 상태는 unknown, available, unavailable 중 하나여야 합니다.")
        price = None
        if raw_price:
            try:
                price_number = float(raw_price)
                if not price_number.is_integer() or not 0 <= price_number <= 2_147_483_647:
                    raise ValueError
                price = int(price_number)
            except (ValueError, OverflowError):
                errors.append(f"{where}: 가격은 0 이상의 정수 원 단위로 입력해 주세요.")
        try:
            verified = parse_excel_date(raw_date, '메뉴', row, '정보 확인 날짜')
        except ExcelImportError as error:
            errors.append(str(error))
            verified = None
        menus[key] = {
            'row': row, 'category': category, 'description': description,
            'price': price, 'source_url': source,
            'availability_status': status, 'last_verified_at': verified,
        }

    for row, (brand, menu, ingredient, source, raw_date) in sheets["메뉴_재료"]:
        where = f"메뉴_재료 {row}행"
        if not brand or not menu or not ingredient:
            errors.append(f"{where}: 브랜드명, 메뉴명, 재료명 모두 필수입니다.")
            continue
        key = (brand, menu, ingredient)
        if key in relations:
            errors.append(f"{where}: 중복 재료 연결 '{brand} / {menu} / {ingredient}'")
        _url(source, where + ' 재료 출처', errors)
        try:
            verified = parse_excel_date(raw_date, '메뉴_재료', row, '재료 정보 확인 날짜')
        except ExcelImportError as error:
            errors.append(str(error))
            verified = None
        relations[key] = {'row': row, 'source_url': source, 'last_verified_at': verified}

    # Both workbook rows and already registered PostgreSQL rows can be referenced.
    ref_brands = {brand for brand, name in menus} | {brand for brand, name, ingredient in relations}
    ref_menus = {(brand, name) for brand, name, ingredient in relations}
    ref_ingredients = {ingredient for brand, name, ingredient in relations}
    existing_brands = {b.name: b for b in Brand.objects.filter(name__in=(set(brands) | ref_brands))}
    existing_ingredients = {
        i.name: i for i in Ingredient.objects.filter(name__in=(set(ingredients) | ref_ingredients))
    }
    existing_menus = {
        (m.brand.name, m.name): m
        for m in Menu.objects.select_related('brand').filter(brand__name__in=ref_brands)
    }

    for (brand, menu_name), values in menus.items():
        if brand not in brands and brand not in existing_brands:
            errors.append(f"메뉴 {values['row']}행: 브랜드 '{brand}'가 브랜드 시트와 DB 모두에 없습니다.")

    for (brand, menu_name, ingredient_name), values in relations.items():
        if (brand, menu_name) not in menus and (brand, menu_name) not in existing_menus:
            errors.append(f"메뉴_재료 {values['row']}행: '{brand} / {menu_name}' 메뉴가 없습니다.")
        if ingredient_name not in ingredients and ingredient_name not in existing_ingredients:
            errors.append(f"메뉴_재료 {values['row']}행: '{ingredient_name}' 재료가 없습니다.")

    if errors:
        displayed = '\n'.join(' - ' + item for item in errors[:30])
        more = f"\n...외 {len(errors) - 30}개 오류" if len(errors) > 30 else ''
        raise CommandError(f"엑셀 검증 오류 {len(errors)}개가 있어 적용을 중단했습니다:\n{displayed}{more}")

    return brands, ingredients, menus, relations, existing_brands, existing_ingredients, existing_menus


def _fill_nonempty(obj, fields):
    """Update only explicitly present values. Never clear fields from blank cells."""
    changed = []
    for key, value in fields.items():
        if value is None or value == '':
            continue
        if getattr(obj, key) != value:
            setattr(obj, key, value)
            changed.append(key)
    if changed:
        obj.full_clean()
        obj.save(update_fields=changed + ['updated_at'])
    return bool(changed)


class Command(BaseCommand):
    help = 'PICKFOO Excel 4개 시트의 실제 브랜드·메뉴·재료를 안전하게 일괄 등록합니다.'

    def add_arguments(self, parser):
        parser.add_argument(
            'xlsx_path', nargs='?', default='catalog_data/PICKFOO_import.xlsx',
            help='Django backend 폴더 기준 엑셀 경로 (기본: catalog_data/PICKFOO_import.xlsx)',
        )
        parser.add_argument('--apply', action='store_true', help='검증 후 DB에 추가합니다 (없으면 조회/검증만 수행)')
        parser.add_argument('--update-existing', action='store_true', help='기존 항목의 비어 있지 않은 셀 값도 갱신합니다')

    def handle(self, *args, **opts):
        if opts['update_existing'] and not opts['apply']:
            raise CommandError('--update-existing은 --apply와 함께 사용해 주세요.')
        path = Path(opts['xlsx_path'])
        if not path.is_absolute():
            path = Path(settings.BASE_DIR) / path
        try:
            sheets = read_pickfoo_xlsx(path)
        except ExcelImportError as error:
            raise CommandError(str(error)) from error
        self.stdout.write('PICKFOO 엑셀 파일: ' + path.name)
        self.stdout.write('엑셀 입력: ' + ', '.join(f'{sheet} {len(sheets[sheet])}건' for sheet in sheets))
        try:
            with transaction.atomic():
                (brands, ingredients, menus, relations,
                 existing_brands, existing_ingredients, existing_menus) = _validate_workbook(sheets)

                if not opts['apply']:
                    # No writes. DB read operations only.
                    link_keys = {
                        (r.menu.brand.name, r.menu.name, r.ingredient.name)
                        for r in MenuIngredient.objects.select_related(
                            'menu__brand', 'ingredient'
                        ).filter(menu__brand__name__in={k[0] for k in relations})
                    }
                    summary = [
                        ('브랜드', len(brands), sum(name not in existing_brands for name in brands)),
                        ('재료', len(ingredients), sum(name not in existing_ingredients for name in ingredients)),
                        ('메뉴', len(menus), sum(key not in existing_menus for key in menus)),
                        ('메뉴_재료', len(relations), sum(key not in link_keys for key in relations)),
                    ]
                    for name, total, missing in summary:
                        self.stdout.write(f'  {name}: 전체 {total}건 / 새로 추가 예정 {missing}건 / 기존 {total - missing}건')
                    self.stdout.write(self.style.SUCCESS('검증 완료: DB에는 아무것도 저장하지 않았습니다.'))
                    self.stdout.write('실제 등록: python manage.py import_catalog_excel --apply')
                    return

                counts = {key: {'new': 0, 'skip': 0, 'updated': 0} for key in sheets}
                brand_objects = dict(existing_brands)
                ingredient_objects = dict(existing_ingredients)
                menu_objects = dict(existing_menus)

                for name, row in brands.items():
                    defaults = {'category': row['category'], 'official_website': row['official_website']}
                    item, created = Brand.objects.get_or_create(name=name, defaults=defaults)
                    brand_objects[name] = item
                    if created:
                        item.full_clean()
                        counts['브랜드']['new'] += 1
                    elif opts['update_existing'] and _fill_nonempty(item, defaults):
                        counts['브랜드']['updated'] += 1
                    else:
                        counts['브랜드']['skip'] += 1

                for name, row in ingredients.items():
                    defaults = {'description': row['description']}
                    item, created = Ingredient.objects.get_or_create(name=name, defaults=defaults)
                    ingredient_objects[name] = item
                    if created:
                        item.full_clean()
                        counts['재료']['new'] += 1
                    elif opts['update_existing'] and _fill_nonempty(item, defaults):
                        counts['재료']['updated'] += 1
                    else:
                        counts['재료']['skip'] += 1

                for (brand, name), row in menus.items():
                    brand_obj = brand_objects[brand]
                    defaults = {
                        'category': row['category'], 'description': row['description'],
                        'price': row['price'], 'source_url': row['source_url'],
                        'availability_status': row['availability_status'] or 'unknown',
                        'last_verified_at': row['last_verified_at'],
                    }
                    item, created = Menu.objects.get_or_create(brand=brand_obj, name=name, defaults=defaults)
                    menu_objects[(brand, name)] = item
                    if created:
                        item.full_clean()
                        counts['메뉴']['new'] += 1
                    elif opts['update_existing'] and _fill_nonempty(
                            item, {**defaults, 'availability_status': row['availability_status']}):
                        counts['메뉴']['updated'] += 1
                    else:
                        counts['메뉴']['skip'] += 1

                for (brand, name, ingredient), row in relations.items():
                    menu = menu_objects[(brand, name)]
                    ingredient_obj = ingredient_objects[ingredient]
                    defaults = {'source_url': row['source_url'], 'last_verified_at': row['last_verified_at']}
                    item, created = MenuIngredient.objects.get_or_create(
                        menu=menu, ingredient=ingredient_obj, defaults=defaults,
                    )
                    if created:
                        item.full_clean()
                        counts['메뉴_재료']['new'] += 1
                    elif opts['update_existing'] and _fill_nonempty(item, defaults):
                        counts['메뉴_재료']['updated'] += 1
                    else:
                        counts['메뉴_재료']['skip'] += 1

        except CommandError:
            raise
        except Exception as error:
            raise CommandError(
                f'DB 적용이 취소되었습니다. 트랜잭션은 롤백됩니다. 오류: {type(error).__name__}: {error}'
            ) from error

        for name, result in counts.items():
            self.stdout.write(
                f"  {name}: 신규 {result['new']}건 / 유지 {result['skip']}건 / 갱신 {result['updated']}건"
            )
        self.stdout.write(self.style.SUCCESS('✅ PostgreSQL 일괄 등록 완료 (기존 데이터 삭제 없음)'))
