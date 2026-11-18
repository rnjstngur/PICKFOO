import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('catalog', '0011_merge_product_link_prices_seed'),
    ]

    operations = [
        migrations.CreateModel(
            name='DiscoveredCombo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dedupe_key', models.CharField(max_length=300, unique=True, verbose_name='중복 확인 키')),
                ('name', models.CharField(max_length=150, verbose_name='조합 이름')),
                ('brand', models.CharField(default='편의점(CU·GS25 등)', max_length=50, verbose_name='브랜드')),
                ('category', models.CharField(blank=True, default='', max_length=50, verbose_name='카테고리')),
                ('ingredients', models.JSONField(default=list, verbose_name='재료')),
                ('steps', models.JSONField(blank=True, default=list, verbose_name='만드는 방법')),
                ('description', models.CharField(blank=True, default='', max_length=200, verbose_name='한 줄 소개')),
                ('price', models.PositiveIntegerField(blank=True, null=True, verbose_name='판매가 합계(원)')),
                ('spicy', models.PositiveSmallIntegerField(blank=True, null=True, validators=[django.core.validators.MaxValueValidator(2)], verbose_name='맵기(0~2)')),
                ('authors', models.JSONField(blank=True, default=list, verbose_name='언급한 블로그')),
                ('mention_count', models.PositiveIntegerField(default=0, verbose_name='서로 다른 블로그 수')),
                ('samples', models.JSONField(blank=True, default=list, verbose_name='원문 예시')),
                ('queries', models.JSONField(blank=True, default=list, verbose_name='발견한 검색어')),
                ('first_seen_date', models.DateField(blank=True, null=True, verbose_name='처음 본 게시일')),
                ('last_seen_date', models.DateField(blank=True, null=True, verbose_name='최근 게시일')),
                ('status', models.CharField(choices=[('pending', '검토 대기'), ('approved', '승인(앱 공개)'), ('rejected', '제외')], db_index=True, default='pending', max_length=10, verbose_name='상태')),
                ('reviewed_at', models.DateTimeField(blank=True, null=True, verbose_name='검토 시각')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='발견 시각')),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='pickfoo_reviewed_discoveries', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': '신규 조합 후보',
                'verbose_name_plural': '신규 조합 후보(자동 발견)',
                'ordering': ['-mention_count', '-last_seen_date'],
            },
        ),
    ]
