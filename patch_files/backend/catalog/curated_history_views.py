"""STEP 235: only the authenticated user's own curated ratings feed recommendations.

No public user IDs, third-party ratings, photos, or review content are returned.
"""
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.decorators.vary import vary_on_cookie
from .curated_models import CuratedComboReview


@require_GET
@vary_on_cookie
def my_rating_history(request):
    if not request.user.is_authenticated:
        response = JsonResponse({'error': '로그인이 필요합니다.'}, status=401)
        response['Cache-Control'] = 'private, no-store'
        return response
    rows = (
        CuratedComboReview.objects.filter(user=request.user)
        .order_by('combo__key')
        .values('combo__key', 'rating')
    )
    response = JsonResponse({
        'history': [
            {'combo_key': row['combo__key'], 'rating': row['rating']}
            for row in rows
        ]
    })
    response['Cache-Control'] = 'private, no-store'
    return response
