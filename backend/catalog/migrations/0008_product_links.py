"""STEP240: one verified-user-provided link per ingredient and provider; zero fake links."""
from django.db import migrations, models


def seed_known_shared_urls(apps, schema_editor):
    Link = apps.get_model('catalog', 'IngredientProductLink')
    rows = [
        {
            'ingredient_name': '불닭볶음면', 'ingredient_key': '불닭볶음면',
            'provider': 'pocketcu', 'product_name': '삼양)불닭볶음면컵',
            'url': 'https://www.pocketcu.co.kr/deepLink/checkAppInstall?viewType=1&viewUrl=/product/detail/2022030013574',
            'note': '상품 크기·재고·가격은 포켓CU에서 직접 확인하세요.',
        },
        {
            'ingredient_name': '불닭볶음면', 'ingredient_key': '불닭볶음면',
            'provider': 'gs25', 'product_name': '우리동네GS 공유 상품',
            'url': 'https://abr.ge/d5an5bd',
            'note': '사용자가 제공한 GS 공유 링크입니다. 상품명과 규격을 앱에서 확인하세요.',
        },
    ]
    for row in rows:
        # Do not overwrite administrator edits or create duplicate keys.
        Link.objects.using(schema_editor.connection.alias).get_or_create(
            ingredient_key=row['ingredient_key'], provider=row['provider'],
            defaults=row,
        )


class Migration(migrations.Migration):
    dependencies = [('catalog', '0007_curatedcombo_verification')]
    operations = [
        migrations.CreateModel(
            name='IngredientProductLink',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ingredient_name', models.CharField(help_text='예: 불닭볶음면. 해당 재료가 들어가는 모든 조합에 연결됩니다.', max_length=100, verbose_name='연결할 재료명')),
                ('ingredient_key', models.CharField(db_index=True, editable=False, max_length=150, verbose_name='정규화 키')),
                ('provider', models.CharField(choices=[('pocketcu', '포켓CU'), ('gs25', '우리동네GS')], max_length=20, verbose_name='판매처')),
                ('product_name', models.CharField(max_length=150, verbose_name='상품 표시명')),
                ('url', models.URLField(max_length=1000, verbose_name='상품 공유 URL')),
                ('aliases', models.TextField(blank=True, help_text='쉼표 또는 줄바꿈으로 구분해 주세요. 정확히 일치하는 명칭만 추가하세요.', verbose_name='추가 재료명(선택)')),
                ('note', models.CharField(blank=True, max_length=300, verbose_name='연결 안내(선택)')),
                ('is_active', models.BooleanField(default=True, verbose_name='화면에 사용')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='등록일')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='수정일')),
            ],
            options={'verbose_name':'재료별 상품 링크', 'verbose_name_plural':'재료별 상품 링크', 'ordering':('ingredient_name', 'provider')},
        ),
        migrations.AddConstraint(
            model_name='ingredientproductlink',
            constraint=models.UniqueConstraint(fields=('ingredient_key', 'provider'), name='unique_pickfoo_ingredient_provider_link'),
        ),
        migrations.RunPython(seed_known_shared_urls, migrations.RunPython.noop),
    ]
