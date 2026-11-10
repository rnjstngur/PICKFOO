from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from django.db.models import Sum
from .models import PointEntry

PHOTO_REVIEW_REWARD = 10
# 보상 남용 방지: 사진 리뷰 적립은 사용자당 하루 최대 1회(10P).
# 개인 조합을 계속 만들고 본인 사진 리뷰를 달아 포인트를 반복해서 받는 것을 막는다.
DAILY_PHOTO_REWARD_LIMIT = 1

@transaction.atomic
def reward_photo_review(review):
    """Award only once per user/recipe, at most DAILY_PHOTO_REWARD_LIMIT times per user per local day."""
    # 같은 사용자의 동시 요청이 한도를 넘지 않도록 사용자 행을 잠근다.
    get_user_model().objects.select_for_update().filter(pk=review.user_id).first()
    start = timezone.localtime().replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = PointEntry.objects.filter(
        user_id=review.user_id, kind='earn', event_key__startswith='photo:', created_at__gte=start,
    ).count()
    if today_count >= DAILY_PHOTO_REWARD_LIMIT:
        return 0
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
