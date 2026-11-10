"""STEP250: optional screenshot-verified product prices per store."""
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('catalog', '0008_product_links')]
    operations = [
        migrations.AddField(
            model_name='ingredientproductlink', name='price_krw',
            field=models.PositiveIntegerField(blank=True, null=True,
                  help_text='판매처 화면에서 확인한 상품 1개 가격. 행사/배달비는 별도입니다.', verbose_name='상품 표시 가격(원)'),
        ),
        migrations.AddField(
            model_name='ingredientproductlink', name='price_checked_at',
            field=models.DateField(blank=True, null=True, verbose_name='가격 확인일'),
        ),
    ]
