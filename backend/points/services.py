from django.db import transaction
from django.db.models import Sum
from .models import PointEntry

PHOTO_REVIEW_REWARD = 10

@transaction.atomic
def reward_photo_review(review):
    """Award only once per user/recipe, even after photo replacement or review deletion."""
    entry, created = PointEntry.objects.get_or_create(
        event_key=f'photo:{review.user_id}:{review.recipe_id}',
        defaults={
            'user_id': review.user_id, 'kind':'earn', 'amount':PHOTO_REVIEW_REWARD,
            'label': f'사진 리뷰 적립: {review.recipe.name[:120]}',
        },
    )
    return PHOTO_REVIEW_REWARD if created else 0

def get_balance(user):
    return PointEntry.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0
