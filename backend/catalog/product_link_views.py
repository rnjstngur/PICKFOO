# PICKFOO_STEP250_PRICES
"""Read-only public product-link endpoint. Only administrators may write records."""
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .product_link_models import IngredientProductLink, ingredient_key, split_aliases


@require_GET
def links_for_ingredients(request):
    names = request.GET.getlist('ingredient')
    if not 1 <= len(names) <= 30 or any(not isinstance(n, str) or not 1 <= len(n) <= 100 for n in names):
        return JsonResponse({'error': '재료명 1~30개를 각각 100자 이하로 전달해 주세요.'}, status=400)
    # Normalize user-supplied strings, but only return links matching the requested ingredients.
    requested = {}
    for name in names:
        key = ingredient_key(name)
        if key:
            requested.setdefault(key, []).append(name)
    items = {name: [] for name in names}
    if not requested:
        return JsonResponse({'items': items}, json_dumps_params={'ensure_ascii': False})
    # The catalog begins with 20 editorial combos and a small admin-only link registry.
    for link in IngredientProductLink.objects.filter(is_active=True).order_by('provider', 'id'):
        keys = {link.ingredient_key}
        keys.update(ingredient_key(alias) for alias in split_aliases(link.aliases))
        matched = keys & requested.keys()
        if not matched:
            continue
        record = {
            'provider': link.provider,
            'provider_label': link.get_provider_display(),
            'product_name': link.product_name,
            'url': link.url,
            'note': link.note,
            'price_krw': link.price_krw,
            'price_checked_at': link.price_checked_at.isoformat() if link.price_checked_at else None,
        }
        for key in matched:
            for original in requested[key]:
                items[original].append(record)
    response = JsonResponse({'items': items}, json_dumps_params={'ensure_ascii': False})
    response['Cache-Control'] = 'no-store'
    return response
