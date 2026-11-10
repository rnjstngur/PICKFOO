"""2026-11-10: 팀원이 우리동네GS·포켓CU 앱에서 직접 복사한 공유 링크 17개(data/product_links_2026-11-10.csv).
관리자 화면 CSV 가져오기와 같은 내용. 이미 같은 재료+판매처가 있으면 덮어쓰지 않는다(관리자 수정 보존)."""
from django.db import migrations

ROWS = [
    {
        "ingredient_name": "얼음컵",
        "ingredient_key": "얼음컵",
        "provider": "gs25",
        "product_name": "우리동네GS 얼음컵",
        "url": "https://abr.ge/7t27eok",
        "aliases": "얼음,컵얼음",
        "note": "2026-11-10 팀원이 우리동네GS 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "얼음컵",
        "ingredient_key": "얼음컵",
        "provider": "pocketcu",
        "product_name": "포켓CU 얼음컵",
        "url": "https://www.pocketcu.co.kr/deepLink/checkAppInstall?viewType=1&viewUrl=/product/detail/2022030014198",
        "aliases": "얼음,컵얼음",
        "note": "2026-11-10 팀원이 포켓CU 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "복숭아 아이스티",
        "ingredient_key": "복숭아아이스티",
        "provider": "gs25",
        "product_name": "복숭아 아이스티 230ml",
        "url": "https://abr.ge/vg8pdkc",
        "aliases": "복숭아아이스티",
        "note": "2026-11-10 팀원이 우리동네GS 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "복숭아 아이스티",
        "ingredient_key": "복숭아아이스티",
        "provider": "pocketcu",
        "product_name": "복숭아 아이스티 230ml",
        "url": "https://www.pocketcu.co.kr/deepLink/checkAppInstall?viewType=1&viewUrl=/product/detail/2026030063325",
        "aliases": "복숭아아이스티",
        "note": "2026-11-10 팀원이 포켓CU 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "스파게티 컵라면",
        "ingredient_key": "스파게티컵라면",
        "provider": "gs25",
        "product_name": "스파게티 컵라면",
        "url": "https://abr.ge/zarxhlr",
        "aliases": "스파게티컵라면",
        "note": "2026-11-10 팀원이 우리동네GS 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "스파게티 컵라면",
        "ingredient_key": "스파게티컵라면",
        "provider": "pocketcu",
        "product_name": "스파게티 컵라면",
        "url": "https://www.pocketcu.co.kr/deepLink/checkAppInstall?viewType=1&viewUrl=/product/detail/2022030013196",
        "aliases": "스파게티컵라면",
        "note": "2026-11-10 팀원이 포켓CU 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "소시지",
        "ingredient_key": "소시지",
        "provider": "gs25",
        "product_name": "소시지",
        "url": "https://abr.ge/6n1kr0x",
        "aliases": "소세지",
        "note": "2026-11-10 팀원이 우리동네GS 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "소시지",
        "ingredient_key": "소시지",
        "provider": "pocketcu",
        "product_name": "소시지",
        "url": "https://www.pocketcu.co.kr/deepLink/checkAppInstall?viewType=1&viewUrl=/product/detail/2026030063891",
        "aliases": "소세지",
        "note": "2026-11-10 팀원이 포켓CU 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "스트링치즈",
        "ingredient_key": "스트링치즈",
        "provider": "gs25",
        "product_name": "스트링 치즈",
        "url": "https://abr.ge/9z5ntiz",
        "aliases": "스트링 치즈",
        "note": "2026-11-10 팀원이 우리동네GS 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "스트링치즈",
        "ingredient_key": "스트링치즈",
        "provider": "pocketcu",
        "product_name": "스트링 치즈",
        "url": "https://www.pocketcu.co.kr/deepLink/checkAppInstall?viewType=1&viewUrl=/product/detail/2022030013657",
        "aliases": "스트링 치즈",
        "note": "2026-11-10 팀원이 포켓CU 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "스위트콘",
        "ingredient_key": "스위트콘",
        "provider": "gs25",
        "product_name": "스위트콘",
        "url": "https://abr.ge/irqmjus",
        "aliases": "옥수수콘",
        "note": "2026-11-10 팀원이 우리동네GS 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "스위트콘",
        "ingredient_key": "스위트콘",
        "provider": "pocketcu",
        "product_name": "스위트콘",
        "url": "https://www.pocketcu.co.kr/deepLink/checkAppInstall?viewType=1&viewUrl=/product/detail/2024070041479",
        "aliases": "옥수수콘",
        "note": "2026-11-10 팀원이 포켓CU 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "모차렐라 치즈",
        "ingredient_key": "모차렐라치즈",
        "provider": "gs25",
        "product_name": "모짜렐라 치즈",
        "url": "https://abr.ge/fjgulz1",
        "aliases": "모짜렐라 치즈,모짜렐라치즈",
        "note": "2026-11-10 팀원이 우리동네GS 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "모차렐라 치즈",
        "ingredient_key": "모차렐라치즈",
        "provider": "pocketcu",
        "product_name": "모짜렐라 치즈",
        "url": "https://www.pocketcu.co.kr/deepLink/checkAppInstall?viewType=1&viewUrl=/product/detail/2026090068321",
        "aliases": "모짜렐라 치즈,모짜렐라치즈",
        "note": "2026-11-10 팀원이 포켓CU 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "육개장 컵라면",
        "ingredient_key": "육개장컵라면",
        "provider": "pocketcu",
        "product_name": "농심)육개장사발면",
        "url": "https://www.pocketcu.co.kr/deepLink/checkAppInstall?viewType=1&viewUrl=/product/detail/2022030013129",
        "aliases": "육개장사발면",
        "note": "2026-11-10 팀원이 포켓CU 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "참치마요 삼각김밥",
        "ingredient_key": "참치마요삼각김밥",
        "provider": "gs25",
        "product_name": "참치마요 삼각김밥",
        "url": "https://abr.ge/o4ra4bv",
        "aliases": "참치마요삼각김밥",
        "note": "2026-11-10 팀원이 우리동네GS 앱에서 복사한 공유 링크. 가격·재고는 앱에서 확인하세요."
    },
    {
        "ingredient_name": "참치마요 삼각김밥",
        "ingredient_key": "참치마요삼각김밥",
        "provider": "pocketcu",
        "product_name": "주)리치참치마요삼각",
        "url": "https://www.pocketcu.co.kr/deepLink/checkAppInstall?viewType=1&viewUrl=/product/detail/2026010060891",
        "aliases": "참치마요삼각김밥",
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
    dependencies = [('catalog', '0008_product_links')]
    operations = [migrations.RunPython(seed_links, unseed_links)]
