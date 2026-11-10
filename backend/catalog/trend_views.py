"""공개 트렌드 신호 API: 자동 수집된 네이버 블로그·유튜브 게시물 요약을 돌려준다."""
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from . import trend_collector


@require_GET
def trend_signals(request):
    result = trend_collector.load()
    conf = trend_collector.configured()
    refreshing = False
    if trend_collector.is_stale(result):
        # 24시간이 지났으면 응답은 기존 결과로 바로 하고, 수집은 뒤에서 진행한다.
        refreshing = trend_collector.refresh_in_background()
    payload = {
        'configured': conf,
        'refreshing': refreshing,
        'collectedAt': (result or {}).get('collectedAt'),
        'sources': (result or {}).get('sources', []),
        'windowDays': trend_collector.WINDOW_DAYS,
        'spreadDays': trend_collector.SPREAD_DAYS,
        'items': (result or {}).get('items', {}),
    }
    response = JsonResponse(payload, json_dumps_params={'ensure_ascii': False})
    response['Cache-Control'] = 'public, max-age=300'
    return response
