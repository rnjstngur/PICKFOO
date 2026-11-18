"""공개 API: 관리자가 승인한 신규 조합만 돌려준다(검토 대기·제외 후보는 노출하지 않는다)."""
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from . import trend_discovery
from .discovery_models import DiscoveredCombo


def serialize(obj: DiscoveredCombo) -> dict:
    sample = (obj.samples or [{}])[0] if obj.samples else {}
    return {
        'id': obj.id,
        'key': f'disc-{obj.id}',
        'name': obj.name,
        'brand': obj.brand,
        'category': obj.category,
        'ingredients': [str(x) for x in (obj.ingredients or []) if str(x).strip()],
        'steps': [str(x) for x in (obj.steps or []) if str(x).strip()],
        'description': obj.description,
        'price': obj.price,          # null이면 앱에서 '가격 확인 중'
        'spicy': obj.spicy,
        'mentions': obj.mention_count,
        'firstSeen': obj.first_seen_date.isoformat() if obj.first_seen_date else None,
        'lastSeen': obj.last_seen_date.isoformat() if obj.last_seen_date else None,
        'source': {'title': sample.get('title', ''), 'url': sample.get('url', ''), 'date': sample.get('date', '')},
        'approvedAt': obj.reviewed_at.isoformat() if obj.reviewed_at else None,
    }


@require_GET
def discovered_list(request):
    rows = DiscoveredCombo.objects.filter(status=DiscoveredCombo.STATUS_APPROVED).order_by('-last_seen_date', '-mention_count')[:50]
    run = trend_discovery.last_run() or {}
    payload = {
        'items': [serialize(r) for r in rows],
        'lastRun': {k: run.get(k) for k in ('ranAt', 'posts', 'candidates', 'new')} if run else None,
        'pending': DiscoveredCombo.objects.filter(status=DiscoveredCombo.STATUS_PENDING).count(),
    }
    response = JsonResponse(payload, json_dumps_params={'ensure_ascii': False})
    response['Cache-Control'] = 'public, max-age=120'
    return response
