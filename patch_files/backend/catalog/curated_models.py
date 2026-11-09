"""Server-side review and verification records for PICKFOO's 20 editorial combos."""
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class CuratedCombo(models.Model):
    key = models.SlugField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
                                   related_name='pickfoo_curated_combos')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.key} — {self.name}'


class CuratedComboReview(models.Model):
    combo = models.ForeignKey(CuratedCombo, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name='pickfoo_curated_reviews')
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    content = models.TextField(max_length=2000)
    photo = models.ImageField(upload_to='curated_review_photos/%Y/%m/', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['user', 'combo'],
                                              name='unique_user_curated_combo_review')]

    def __str__(self):
        return f'{self.combo.key} / {self.user_id} / {self.rating}'
