"""2026-11-10: 블루레몬 에이드 음료·사이다 공유 링크 4개(팀원이 앱에서 직접 복사). 기존 행은 덮어쓰지 않는다."""
from django.db import migrations

ROWS = [
    {
        "ingredient_name": "블루레몬 에이드 음료",
        "ingredient_key": "블루레몬에이드음료",
        "provider": "gs25",
        "product_name": "블루레몬에이드",
        "url": "https://abr.ge/nlks69d",
        "aliases": "블루레몬에이드,블루레몬 에이드",
        "note": "2026-11-10 팀원이 우리동네GS 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "블루레몬 에이드 음료",
        "ingredient_key": "블루레몬에이드음료",
        "provider": "pocketcu",
        "product_name": "블루레몬에이드",
        "url": "https://www.pocketcu.co.kr/deepLink/checkAppInstall?viewType=1&viewUrl=/product/detail/2026030063370",
        "aliases": "블루레몬에이드,블루레몬 에이드",
        "note": "2026-11-10 팀원이 포켓CU 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "사이다",
        "ingredient_key": "사이다",
        "provider": "gs25",
        "product_name": "롯데)칠성사이다제로P500",
        "url": "https://abr.ge/bftqgjf",
        "aliases": "칠성사이다",
        "note": "2026-11-10 팀원이 우리동네GS 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "사이다",
        "ingredient_key": "사이다",
        "provider": "pocketcu",
        "product_name": "롯데)칠성사이다제로P500",
        "url": "https://www.pocketcu.co.kr/deepLink/checkAppInstall?viewType=1&viewUrl=/product/detail/2022030013368",
        "aliases": "칠성사이다",
        "note": "2026-11-10 팀원이 포켓CU 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    }
]


def seed_links(apps, schema_editor):
    Link = apps.get_model('catalog', 'IngredientProductLink')
    db = schema_editor.connection.alias
    for row in ROWS:
        Link.objects.using(db).get_or_create(
            ingredient_key=row['ingredient_key'], provider=row['provider'],
            defaults={**row, 'is_active': True},
        )


def unseed_links(apps, schema_editor):
    Link = apps.get_model('catalog', 'IngredientProductLink')
    db = schema_editor.connection.alias
    for row in ROWS:
        Link.objects.using(db).filter(ingredient_key=row['ingredient_key'], provider=row['provider'], url=row['url']).delete()


class Migration(migrations.Migration):
    dependencies = [('catalog', '0009_seed_product_links_1110')]
    operations = [migrations.RunPython(seed_links, unseed_links)]
