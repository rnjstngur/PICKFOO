"""PICKFOO exhibition verification: reviews are real, authenticated, and server-scored.

Badge means the project's own social-review threshold, NOT third-party vetting,
food safety, product authenticity, or proof of purchase.
"""
import json
import logging
import mimetypes
from io import BytesIO
from uuid import uuid4

from PIL import Image, ImageOps, UnidentifiedImageError
from django.core.files.base import ContentFile
from django.db.models import Avg, Count, Sum
from django.http import FileResponse, Http404, JsonResponse
from django.urls import reverse
from django.views.decorators.http import require_GET, require_POST, require_http_methods

from .curated_models import CuratedCombo, CuratedComboReview

logger = logging.getLogger(__name__)

# Explicit, auditable project rules displayed in the school panel.
MIN_REVIEWERS = 10
MIN_PHOTO_REVIEWS = 3
MIN_BAYES_RATING = 3.8
PRIOR_RATING = 3.0
PRIOR_WEIGHT = 5


def verification_for(combo):
    # A single account contributes at most one review by DB unique constraint.
    # The curator/author's own review never contributes to the badge.
    q = CuratedComboReview.objects.filter(combo=combo).exclude(user_id=combo.created_by_id)
    agg = q.aggregate(review_count=Count('user', distinct=True),
                      total=Sum('rating'), average=Avg('rating'))
    n = agg['review_count'] or 0
    # Count excludes blank ImageField values. No untrusted client-supplied count.
    photo_count = q.exclude(photo='').exclude(photo__isnull=True).count()
    mean = float(agg['average']) if agg['average'] is not None else None
    adjusted = (float(agg['total'] or 0) + PRIOR_WEIGHT * PRIOR_RATING) / (n + PRIOR_WEIGHT)
    return {
        'verified': n >= MIN_REVIEWERS and photo_count >= MIN_PHOTO_REVIEWS
                    and adjusted >= MIN_BAYES_RATING,
        'review_count': n, 'photo_review_count': photo_count,
        'average_rating': round(mean, 2) if mean is not None else None,
        'adjusted_rating': round(adjusted, 2) if n else None,
        'requirements': {'reviewers': MIN_REVIEWERS, 'photos': MIN_PHOTO_REVIEWS,
                         'adjusted_rating': MIN_BAYES_RATING},
        'note': 'PICKFOO 내부 리뷰 기준입니다. 실제 구매·식품 안전·판매 상태 보증이 아닙니다.',
    }


@require_GET
def curated_summary(request):
    # The count and badge can be viewed without revealing reviewer identities.
    combos = list(CuratedCombo.objects.order_by('key'))
    return JsonResponse({'combos': [dict(key=c.key, name=c.name, verification=verification_for(c))
                                    for c in combos]}, json_dumps_params={'ensure_ascii': False})


def ensure_login(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': '로그인이 필요합니다.'}, status=401)
    return None


@require_http_methods(['GET', 'POST'])
def curated_reviews(request, key):
    denied = ensure_login(request)
    if denied is not None:
        return denied
    combo = CuratedCombo.objects.filter(key=key).first()
    if combo is None:
        raise Http404('추천 조합을 찾을 수 없습니다.')

    if request.method == 'GET':
        rows = CuratedComboReview.objects.filter(combo=combo).select_related('user').order_by('-created_at')
        result = []
        for rev in rows:
            result.append({
                'id': rev.id, 'is_mine': rev.user_id == request.user.id,
                'nickname': (rev.user.first_name or '사용자')[:24],
                'rating': rev.rating, 'content': rev.content,
                'photo_url': request.build_absolute_uri(reverse('curated-photo-view', args=[rev.id]))
                             if rev.photo else None,
                'created_at': rev.created_at.isoformat(),
            })
        return JsonResponse({'combo_key': combo.key, 'reviews': result,
                             'verification': verification_for(combo)})

    if request.user.pk == combo.created_by_id:
        return JsonResponse({'error': '조합 등록자 본인의 평가는 검증에 반영할 수 없습니다.'}, status=403)
    try:
        payload = json.loads(request.body)
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({'error': '올바른 JSON을 전달해 주세요.'}, status=400)
    if not isinstance(payload, dict):
        return JsonResponse({'error': 'JSON 객체를 전달해 주세요.'}, status=400)
    rating = payload.get('rating')
    content = payload.get('content')
    if type(rating) is not int or rating not in (1, 2, 3, 4, 5):
        return JsonResponse({'error': '별점은 1~5점이어야 합니다.'}, status=400)
    if not isinstance(content, str) or not 1 <= len(content.strip()) <= 2000:
        return JsonResponse({'error': '후기는 1~2000자로 입력해 주세요.'}, status=400)
    if CuratedComboReview.objects.filter(combo=combo, user=request.user).exists():
        return JsonResponse({'error': '이 조합에 이미 평가를 남겼습니다.'}, status=409)
    # DB unique constraint defends against concurrent duplicate requests.
    from django.db import IntegrityError
    try:
        review = CuratedComboReview.objects.create(combo=combo, user=request.user,
                                                   rating=rating, content=content.strip())
    except IntegrityError:
        return JsonResponse({'error': '이 조합에 이미 평가를 남겼습니다.'}, status=409)
    return JsonResponse({'review': {'id': review.id},
                         'verification': verification_for(combo)}, status=201)


@require_http_methods(['PATCH', 'DELETE'])
def curated_review_manage(request, review_id):
    denied = ensure_login(request)
    if denied is not None:
        return denied
    rev = CuratedComboReview.objects.filter(pk=review_id, user=request.user).first()
    if rev is None:
        raise Http404('내 평가를 찾을 수 없습니다.')
    combo = rev.combo
    if request.method == 'PATCH':
        try:
            payload = json.loads(request.body)
        except (UnicodeDecodeError, json.JSONDecodeError):
            return JsonResponse({'error': '올바른 JSON을 전달해 주세요.'}, status=400)
        if not isinstance(payload, dict) or not payload or set(payload) - {'rating','content'}:
            return JsonResponse({'error': '별점·본문만 수정할 수 있습니다.'}, status=400)
        rating = payload.get('rating', rev.rating)
        content = payload.get('content', rev.content)
        if type(rating) is not int or rating not in (1,2,3,4,5):
            return JsonResponse({'error': '별점은 1~5점이어야 합니다.'}, status=400)
        if not isinstance(content, str) or not 1 <= len(content.strip()) <= 2000:
            return JsonResponse({'error': '후기는 1~2000자로 입력해 주세요.'}, status=400)
        rev.rating = rating
        rev.content = content.strip()
        rev.save(update_fields=['rating','content','updated_at'])
        return JsonResponse({'message': '평가를 수정했습니다.', 'verification': verification_for(combo)})
    photo_name = rev.photo.name if rev.photo else None
    storage = rev.photo.storage
    rev.delete()
    if photo_name:
        try:
            storage.delete(photo_name)
        except Exception:
            logger.exception('평가 삭제 후 사진 파일 정리 실패')
    return JsonResponse({'message': '평가를 삭제했습니다.', 'verification': verification_for(combo)})


@require_POST
def curated_photo_upload(request, review_id):
    denied = ensure_login(request)
    if denied is not None:
        return denied
    rev = CuratedComboReview.objects.filter(pk=review_id, user=request.user).first()
    if rev is None:
        raise Http404('평가를 찾을 수 없습니다.')
    upload = request.FILES.get('photo')
    if upload is None or not (0 < upload.size <= 3 * 1024 * 1024):
        return JsonResponse({'error': '3MB 이하 JPG/PNG/WebP 사진을 선택해 주세요.'}, status=400)
    try:
        with Image.open(upload) as raw:
            file_format = raw.format
            if file_format not in ('JPEG', 'PNG', 'WEBP') or raw.width * raw.height > 12_000_000:
                return JsonResponse({'error': 'JPG/PNG/WebP 형식, 1200만 화소 이하만 지원합니다.'}, status=400)
            raw.load()
            img = ImageOps.exif_transpose(raw)
            ext = {'JPEG': 'jpg', 'PNG': 'png', 'WEBP': 'webp'}[file_format]
            img = img.convert('RGB' if file_format == 'JPEG' else 'RGBA' if 'A' in img.getbands() else 'RGB')
            out = BytesIO()
            if file_format == 'JPEG':
                img.save(out, format='JPEG', quality=85)
            elif file_format == 'PNG':
                img.save(out, format='PNG', optimize=True)
            else:
                img.save(out, format='WEBP', quality=85)
            data = out.getvalue()
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        return JsonResponse({'error': '유효한 이미지가 아닙니다.'}, status=400)
    if len(data) > 3 * 1024 * 1024:
        return JsonResponse({'error': '변환된 사진이 3MB를 초과합니다.'}, status=400)
    old_name = rev.photo.name if rev.photo else None
    rev.photo.save(f'{uuid4().hex}.{ext}', ContentFile(data), save=True)
    if old_name:
        try:
            rev.photo.storage.delete(old_name)
        except Exception:
            logger.exception('이전 평가 사진 정리 실패')
    return JsonResponse({'message': '사진 업로드 성공',
                         'photo_url': request.build_absolute_uri(reverse('curated-photo-view', args=[rev.id])),
                         'verification': verification_for(rev.combo)})


@require_GET
def curated_photo_view(request, review_id):
    denied = ensure_login(request)
    if denied is not None:
        return denied
    rev = CuratedComboReview.objects.filter(pk=review_id).first()
    if rev is None or not rev.photo:
        raise Http404('사진을 찾을 수 없습니다.')
    try:
        rev.photo.open('rb')
    except (FileNotFoundError, OSError):
        raise Http404('사진을 찾을 수 없습니다.')
    mime = mimetypes.guess_type(rev.photo.name)[0] or 'application/octet-stream'
    if mime not in ('image/jpeg', 'image/png', 'image/webp'):
        raise Http404('지원되지 않는 이미지입니다.')
    response = FileResponse(rev.photo.file, content_type=mime)
    response['Cache-Control'] = 'private, no-store'
    response['X-Content-Type-Options'] = 'nosniff'
    response['Content-Disposition'] = 'inline; filename="pickfoo-review-image"'
    return response
