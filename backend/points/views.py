import json
from uuid import uuid4
from django.contrib.auth import get_user_model
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from .models import PointEntry
from .services import get_balance

# Simulated products ONLY; no real vouchers, shipments, or payments.
PRODUCTS = {
    'p1': {'name':'편의점 상품권 (시연)', 'price':100},
    'p2': {'name':'커피 교환권 (시연)', 'price':250},
    'p3': {'name':'간식 박스 (시연)', 'price':400},
    'p4': {'name':'PICKFOO 굿즈 (시연)', 'price':600},
}

@require_GET
def point_summary(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error':'로그인이 필요합니다.'}, status=401)
    rows = list(PointEntry.objects.filter(user=request.user).values(
        'id','kind','amount','label','created_at')[:100])
    return JsonResponse({'balance':get_balance(request.user), 'history':[
        {'id':r['id'],'type':r['kind'],'amount':abs(r['amount']),
         'label':r['label'],'date':r['created_at'].isoformat()}
        for r in rows
    ], 'products':[{'id':k, **v} for k,v in PRODUCTS.items()],
    'demo_only':True})

@require_POST
@transaction.atomic
def redeem(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error':'로그인이 필요합니다.'}, status=401)
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({'error':'올바른 JSON을 전달해 주세요.'}, status=400)
    if not isinstance(data, dict) or data.get('product_id') not in PRODUCTS:
        return JsonResponse({'error':'존재하지 않는 시연 상품입니다.'}, status=400)
    product = PRODUCTS[data['product_id']]
    # Lock the user row to serialize concurrent redemptions on PostgreSQL.
    get_user_model().objects.select_for_update().get(pk=request.user.pk)
    balance = get_balance(request.user)
    if balance < product['price']:
        return JsonResponse({'error':'포인트가 부족합니다.', 'balance':balance}, status=409)
    PointEntry.objects.create(user=request.user, kind='spend', amount=-product['price'],
                              label=f"시연용 교환: {product['name']}",
                              event_key=f"redeem:{request.user.pk}:{uuid4().hex}")
    return JsonResponse({'message':'시연용 교환이 기록되었습니다. 실제 상품은 지급되지 않습니다.',
                         'balance':balance-product['price'], 'demo_only':True})
