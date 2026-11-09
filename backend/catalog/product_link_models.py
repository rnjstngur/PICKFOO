"""PICKFOO STEP240: administrator-owned links to actual product-share pages.

Matching is normalized *exactly*, including aliases. We intentionally do not do
substring matching, so '불닭볶음면' is not confused with '까르보 불닭볶음면'.
"""
import re
import unicodedata
from urllib.parse import urlsplit

from django.core.exceptions import ValidationError
from django.db import models


def ingredient_key(value):
    value = unicodedata.normalize('NFKC', str(value or '')).casefold()
    return re.sub(r'\s+', '', value).strip()


def split_aliases(value):
    return [piece.strip() for piece in re.split(r'[,;\n]+', value or '') if piece.strip()]


class IngredientProductLink(models.Model):
    PROVIDER_CHOICES = [
        ('pocketcu', '포켓CU'),
        ('gs25', '우리동네GS'),
    ]
    ingredient_name = models.CharField('연결할 재료명', max_length=100,
                                       help_text='예: 불닭볶음면. 해당 재료가 들어가는 모든 조합에 연결됩니다.')
    ingredient_key = models.CharField('정규화 키', max_length=150, editable=False, db_index=True)
    provider = models.CharField('판매처', max_length=20, choices=PROVIDER_CHOICES)
    product_name = models.CharField('상품 표시명', max_length=150)
    url = models.URLField('상품 공유 URL', max_length=1000)
    aliases = models.TextField('추가 재료명(선택)', blank=True,
                               help_text='쉼표 또는 줄바꿈으로 구분해 주세요. 정확히 일치하는 명칭만 추가하세요.')
    note = models.CharField('연결 안내(선택)', max_length=300, blank=True)
    is_active = models.BooleanField('화면에 사용', default=True)
    created_at = models.DateTimeField('등록일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)

    class Meta:
        verbose_name = '재료별 상품 링크'
        verbose_name_plural = '재료별 상품 링크'
        ordering = ('ingredient_name', 'provider')
        constraints = [
            models.UniqueConstraint(fields=['ingredient_key', 'provider'],
                                    name='unique_pickfoo_ingredient_provider_link')
        ]

    def __str__(self):
        return f'{self.ingredient_name} / {self.get_provider_display()} — {self.product_name}'

    def clean(self):
        super().clean()
        self.ingredient_name = (self.ingredient_name or '').strip()
        self.ingredient_key = ingredient_key(self.ingredient_name)
        if not self.ingredient_key or len(self.ingredient_key) > 150:
            raise ValidationError({'ingredient_name': '1~100자의 재료명을 입력해 주세요.'})
        try:
            parts = urlsplit(self.url or '')
            host = (parts.hostname or '').lower().rstrip('.')
            port = parts.port
        except ValueError:
            raise ValidationError({'url': '유효한 HTTPS URL이 아닙니다.'})
        allowed = {
            'pocketcu': ('pocketcu.co.kr',),
            'gs25': ('abr.ge', 'gsretail.com'),
        }
        providers = allowed.get(self.provider, ())
        ok = any(host == domain or (domain != 'abr.ge' and host.endswith('.' + domain))
                 for domain in providers)
        if parts.scheme.lower() != 'https' or not ok or parts.username or parts.password or port not in (None, 443):
            raise ValidationError({'url': '판매처에 맞는 공식 HTTPS 상품 공유 주소만 등록하세요. 포켓CU: pocketcu.co.kr, GS: abr.ge / gsretail.com'})
        aliases = split_aliases(self.aliases)
        if len(aliases) > 30 or any(len(a) > 100 for a in aliases):
            raise ValidationError({'aliases': '별칭은 30개 이하, 각 100자 이하로 입력해 주세요.'})

    def save(self, *args, **kwargs):
        self.ingredient_key = ingredient_key(self.ingredient_name)
        super().save(*args, **kwargs)
