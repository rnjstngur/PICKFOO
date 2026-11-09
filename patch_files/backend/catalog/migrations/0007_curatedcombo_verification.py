# PICKFOO STEP 233 — public curated combos and authenticated per-user reviews
import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0006_recipereview'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CuratedCombo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.SlugField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=150)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,
                                                 related_name='pickfoo_curated_combos', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='CuratedComboReview',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1),
                                                                        django.core.validators.MaxValueValidator(5)])),
                ('content', models.TextField(max_length=2000)),
                ('photo', models.ImageField(blank=True, upload_to='curated_review_photos/%Y/%m/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('combo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                            related_name='reviews', to='catalog.curatedcombo')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                           related_name='pickfoo_curated_reviews', to=settings.AUTH_USER_MODEL)),
            ],
            options={'constraints': [models.UniqueConstraint(fields=('user','combo'),
                                                             name='unique_user_curated_combo_review')]},
        ),
    ]
