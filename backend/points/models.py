from django.conf import settings
from django.db import models

class PointEntry(models.Model):
    KIND_CHOICES = [('earn', '적립'), ('spend', '사용')]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name='pickfoo_point_entries')
    kind = models.CharField(max_length=8, choices=KIND_CHOICES)
    amount = models.IntegerField()  # +10 for a unique photo review; negative for demo redemption
    label = models.CharField(max_length=160)
    # Globally unique idempotency key, e.g. 'photo:<user_id>:<recipe_id>'.
    event_key = models.CharField(max_length=180, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self):
        return f'{self.user_id} {self.amount:+d}P - {self.label}'
