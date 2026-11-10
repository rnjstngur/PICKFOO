from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from django.db.models import Sum
from .models import PointEntry

# PICKFOO_STEP256_PHOTO_REVIEW_POINTS
PHOTO_REVIEW_REWARD = 10


def _award_once(user_id, event_key, label):
    """DB-backed +10P once per user+combo. Serializes same-user writes on PostgreSQL.

    The unique event key remains even after a review is deleted or re-created.
    """
    get_user_model().objects.select_for_update().get(pk=user_id)
    _, created = PointEntry.objects.get_or_create(
        event_key=event_key,
        defaults={
            'user_id': user_id,
            'kind': 'earn',
            'amount': PHOTO_REVIEW_REWARD,
            'label': label[:160],
        },
    )
    return PHOTO_REVIEW_REWARD if created else 0


@transaction.atomic
def reward_photo_review(review):
    """User-submitted recipe photo review: first valid photo for this combo gets 10P."""
    if not review.photo:
        return 0
    # Keep existing keys so formerly rewarded reviews cannot receive points again.
    return _award_once(
        review.user_id,
        f'photo:{review.user_id}:{review.recipe_id}',
        f'사진 리뷰 적립: {review.recipe.name}',
    )


@transaction.atomic
def reward_curated_photo_review(review):
    """Editorial/exhibition combo photo review: first valid photo for this combo gets 10P."""
    if not review.photo:
        return 0
    return _award_once(
        review.user_id,
        f'photo:curated:{review.user_id}:{review.combo_id}',
        f'전시 조합 사진 리뷰 적립: {review.combo.name}',
    )


def get_balance(user):
    return PointEntry.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0
