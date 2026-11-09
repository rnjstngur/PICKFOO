"""Rolling seven-day curated-combo ranking based on real DB reviews only.

This is *review activity* popularity, not page views, sales or food safety.
"""
from datetime import timedelta
from django.db.models import Avg, Count, F
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_GET
from .curated_models import CuratedComboReview


@require_GET
def curated_trending(request):
    since = timezone.now() - timedelta(days=7)
    # One review per user/combo is enforced by the existing DB unique constraint.
    # As with the verification badge, exclude the team curator's own evaluations.
    rows = (
        CuratedComboReview.objects
        .filter(created_at__gte=since)
        .exclude(user_id=F('combo__created_by_id'))
        .values('combo__key', 'combo__name')
        .annotate(review_count=Count('user_id', distinct=True), average_rating=Avg('rating'))
        .order_by('-review_count', '-average_rating', 'combo__key')[:5]
    )
    items = [
        {
            'key': row['combo__key'],
            'name': row['combo__name'],
            'review_count': row['review_count'],
            'average_rating': round(float(row['average_rating']), 2),
        }
        for row in rows
    ]
    response = JsonResponse({
        'window_days': 7,
        'basis': 'reviews_created',
        'items': items,
    }, json_dumps_params={'ensure_ascii': False})
    response['Cache-Control'] = 'no-store'
    return response
