from io import BytesIO
from uuid import uuid4

from PIL import Image, ImageOps, UnidentifiedImageError
from django.core.files.base import ContentFile
import json
from django.http import JsonResponse, FileResponse, Http404
from django.views.decorators.http import (
    require_GET,
    require_POST,
    require_http_methods,
)

from accounts.models import UserPreference
from .models import Menu, Recipe, RecipeReview
from django.db.models import Avg
from django.urls import reverse
from points.services import reward_photo_review, get_balance


# PICKFOO 사용자별 메뉴 및 제외 재료 조회 API
@require_GET
def menu_list(request):

    # 1. 로그인 확인
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "로그인이 필요합니다."},
            status=401
        )

    # 2. 현재 로그인한 사용자의 제외 재료 조회
    preference = UserPreference.objects.filter(
        user=request.user
    ).first()

    excluded = []

    if preference:
        excluded = preference.excluded_ingredients or []

    # 비교를 위한 문자열 정리
    excluded_set = {
        item.strip().casefold()
        for item in excluded
        if isinstance(item, str) and item.strip()
    }

    # 3. 메뉴, 브랜드, 재료 정보 조회
    menus = (
        Menu.objects
        .select_related("brand")
        .prefetch_related("menu_ingredients__ingredient")
        .order_by("brand__name", "name")
    )

    results = []

    # 4. 메뉴별 제외 재료 비교
    for menu in menus:

        ingredient_names = [
            relation.ingredient.name
            for relation in menu.menu_ingredients.all()
        ]

        matched = [
            name
            for name in ingredient_names
            if name.strip().casefold() in excluded_set
        ]

        is_excluded = len(matched) > 0

        # 5. 화면에서 사용할 데이터 생성
        results.append({
            "id": menu.id,
            "brand": menu.brand.name,
            "name": menu.name,
            "category": menu.category,
            "price": menu.price,
            "ingredients": ingredient_names,
            "excluded": is_excluded,
            "matched_ingredients": matched,
            "filter_result": (
                "제외 대상"
                if is_excluded
                else "등록된 제외 재료 미발견"
            ),
            "ingredient_verification": "전체 원재료 미검증",
            "source_url": menu.source_url,
        })

    # 6. JSON으로 반환
    return JsonResponse({
        "excluded_ingredients": excluded,
        "menus": results
    })


# PICKFOO 음식 조합 등록 API
@require_POST
def recipe_create(request):

    # 1. 로그인 여부 확인
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "로그인이 필요합니다."},
            status=401
        )

    # 2. 전달받은 JSON 읽기
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"error": "올바른 JSON 데이터가 아닙니다."},
            status=400
        )

    if not isinstance(data, dict):
        return JsonResponse(
            {"error": "JSON 객체를 전달해야 합니다."},
            status=400
        )

    # 3. 음식 조합 정보 가져오기
    name = data.get("name")
    brand_name = data.get("brand_name", "")
    category = data.get("category")
    estimated_price = data.get("estimated_price")
    spicy = data.get("spicy", 0)
    description = data.get("description", "")
    ingredients = data.get("ingredients")
    steps = data.get("steps")

    # 4. 필수 정보 검사
    if not isinstance(name, str) or not (1 <= len(name.strip()) <= 150):
        return JsonResponse(
            {"error": "음식 조합 이름을 확인해 주세요."},
            status=400
        )

    if not isinstance(category, str) or not (1 <= len(category.strip()) <= 50):
        return JsonResponse(
            {"error": "음식 종류를 확인해 주세요."},
            status=400
        )

    if not isinstance(brand_name, str) or len(brand_name) > 100:
        return JsonResponse(
            {"error": "브랜드 이름이 올바르지 않습니다."},
            status=400
        )

    if not isinstance(description, str) or len(description) > 2000:
        return JsonResponse(
            {"error": "음식 설명이 올바르지 않습니다."},
            status=400
        )

    # 5. 가격 검사
    if estimated_price is not None:
        if (
            type(estimated_price) is not int
            or not (0 < estimated_price <= 10000000)
        ):
            return JsonResponse(
                {"error": "예상 가격이 올바르지 않습니다."},
                status=400
            )

    # 6. 매운맛 단계 검사
    if type(spicy) is not int or spicy not in (0, 1, 2):
        return JsonResponse(
            {"error": "매운맛 단계가 올바르지 않습니다."},
            status=400
        )

    # 7. 재료와 만드는 방법 검사
    def valid_list(items, max_count, max_length):
        return (
            isinstance(items, list)
            and 1 <= len(items) <= max_count
            and all(
                isinstance(item, str)
                and 1 <= len(item.strip()) <= max_length
                for item in items
            )
        )

    if not valid_list(ingredients, 30, 100):
        return JsonResponse(
            {"error": "재료 목록을 확인해 주세요."},
            status=400
        )

    if not valid_list(steps, 20, 500):
        return JsonResponse(
            {"error": "만드는 방법을 확인해 주세요."},
            status=400
        )

    # 8. PostgreSQL에 음식 조합 저장
    recipe = Recipe.objects.create(
        created_by=request.user,
        name=name.strip(),
        brand_name=brand_name.strip(),
        category=category.strip(),
        estimated_price=estimated_price,
        spicy=spicy,
        description=description.strip(),
        ingredients=[item.strip() for item in ingredients],
        steps=[item.strip() for item in steps]
    )

    # 9. 등록 결과 반환
    return JsonResponse(
        {
            "message": "음식 조합 등록 성공",
            "recipe": {
                "id": recipe.id,
                "name": recipe.name,
                "brand_name": recipe.brand_name,
                "category": recipe.category,
                "estimated_price": recipe.estimated_price,
                "spicy": recipe.spicy,
                "ingredients": recipe.ingredients,
                "steps": recipe.steps
            }
        },
        status=201
    )

# PICKFOO 내가 등록한 음식 조합 조회 API
@require_GET
def my_recipe_list(request):

    # 1. 로그인 확인
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "로그인이 필요합니다."},
            status=401
        )

    # 2. 현재 로그인한 사용자가 등록한 조합만 조회
    recipes = Recipe.objects.filter(
        created_by=request.user
    ).order_by("-created_at")

    # 3. PostgreSQL 데이터를 JSON 형태로 변환
    results = []

    for recipe in recipes:

        results.append({
            "id": recipe.id,
            "name": recipe.name,
            "brand_name": recipe.brand_name,
            "category": recipe.category,
            "estimated_price": recipe.estimated_price,
            "spicy": recipe.spicy,
            "description": recipe.description,
            "ingredients": recipe.ingredients,
            "steps": recipe.steps,
            "created_at": recipe.created_at.isoformat()
        })

    # 4. 조회 결과 반환
    return JsonResponse({
        "count": len(results),
        "recipes": results
    })

# PICKFOO 음식 조합 삭제 API
@require_http_methods(["DELETE"])
def recipe_delete(request, recipe_id):

    # 1. 로그인 여부 확인
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "로그인이 필요합니다."},
            status=401
        )

    # 2. 현재 사용자가 등록한 조합인지 확인
    recipe = Recipe.objects.filter(
        id=recipe_id,
        created_by=request.user
    ).first()

    # 3. 조합이 없거나 다른 사용자의 조합인 경우
    if recipe is None:
        return JsonResponse(
            {
                "error": "음식 조합을 찾을 수 없거나 삭제 권한이 없습니다."
            },
            status=404
        )

    # 4. 삭제할 조합 이름 저장
    recipe_name = recipe.name

    # 5. 조합 삭제 시 함께 사라지는 리뷰의 사진 파일도 정리한다.
    photo_names = [
        (rev.photo.storage, rev.photo.name)
        for rev in RecipeReview.objects.filter(recipe=recipe)
        if rev.photo and rev.photo.name
    ]
    recipe.delete()
    import logging
    for storage, name in photo_names:
        try:
            storage.delete(name)
        except Exception:
            logging.getLogger(__name__).exception("조합 삭제 후 리뷰 사진 정리 실패: %s", name)

    # 6. 삭제 결과 반환
    return JsonResponse({
        "message": "음식 조합이 삭제되었습니다.",
        "deleted_recipe_id": recipe_id,
        "deleted_recipe_name": recipe_name
    })

# PICKFOO 음식 조합 수정 API
@require_http_methods(["PATCH"])
def recipe_update(request, recipe_id):

    # 1. 로그인 확인
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "로그인이 필요합니다."},
            status=401
        )

    # 2. 현재 사용자가 등록한 조합인지 확인
    recipe = Recipe.objects.filter(
        id=recipe_id,
        created_by=request.user
    ).first()

    if recipe is None:
        return JsonResponse(
            {"error": "수정할 조합이 없거나 권한이 없습니다."},
            status=404
        )

    # 3. JSON 데이터 읽기
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"error": "JSON 형식이 올바르지 않습니다."},
            status=400
        )

    if not isinstance(data, dict):
        return JsonResponse(
            {"error": "JSON 객체를 전달해야 합니다."},
            status=400
        )

    # 수정 가능한 항목만 허용
    allowed_fields = {
        "name",
        "brand_name",
        "category",
        "estimated_price",
        "spicy",
        "description",
        "ingredients",
        "steps",
    }

    fields = {
        key: value
        for key, value in data.items()
        if key in allowed_fields
    }

    if not fields:
        return JsonResponse(
            {"error": "수정할 항목이 없습니다."},
            status=400
        )

    # 4. 문자열 항목 검사
    string_limits = {
        "name": (1, 150),
        "brand_name": (0, 100),
        "category": (1, 50),
        "description": (0, 2000),
    }

    for field, (min_length, max_length) in string_limits.items():

        if field not in fields:
            continue

        value = fields[field]

        if not isinstance(value, str):
            return JsonResponse(
                {"error": f"{field} 값이 올바르지 않습니다."},
                status=400
            )

        value = value.strip()

        if not (min_length <= len(value) <= max_length):
            return JsonResponse(
                {"error": f"{field} 길이를 확인해 주세요."},
                status=400
            )

        fields[field] = value

    # 5. 가격 검사
    if "estimated_price" in fields:

        price = fields["estimated_price"]

        if price is not None:
            if type(price) is not int or not (0 < price <= 10000000):
                return JsonResponse(
                    {"error": "예상 가격이 올바르지 않습니다."},
                    status=400
                )

    # 6. 매운맛 검사
    if "spicy" in fields:

        spicy = fields["spicy"]

        if type(spicy) is not int or spicy not in (0, 1, 2):
            return JsonResponse(
                {"error": "매운맛 단계가 올바르지 않습니다."},
                status=400
            )

    # 7. 재료와 만드는 방법 검사
    list_limits = {
        "ingredients": (30, 100),
        "steps": (20, 500),
    }

    for field, (max_count, max_length) in list_limits.items():

        if field not in fields:
            continue

        items = fields[field]

        if (
            not isinstance(items, list)
            or not (1 <= len(items) <= max_count)
            or not all(
                isinstance(item, str)
                and 1 <= len(item.strip()) <= max_length
                for item in items
            )
        ):
            return JsonResponse(
                {"error": f"{field} 목록이 올바르지 않습니다."},
                status=400
            )

        fields[field] = [
            item.strip()
            for item in items
        ]

    # 8. 수정 내용 적용
    for field, value in fields.items():
        setattr(recipe, field, value)

    # 9. PostgreSQL에 저장
    recipe.save(
        update_fields=[*fields.keys(), "updated_at"]
    )

    # 10. 수정 결과 반환
    return JsonResponse({
        "message": "음식 조합 수정 성공",
        "recipe": {
            "id": recipe.id,
            "name": recipe.name,
            "brand_name": recipe.brand_name,
            "category": recipe.category,
            "estimated_price": recipe.estimated_price,
            "spicy": recipe.spicy,
            "description": recipe.description,
            "ingredients": recipe.ingredients,
            "steps": recipe.steps,
        }
    })

# PICKFOO 음식 조합 리뷰 등록 API
@require_POST
def recipe_review_create(request, recipe_id):

    # 1. 로그인 확인
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "로그인이 필요합니다."},
            status=401
        )

    # 2. 리뷰 대상 음식 조합 확인
    recipe = Recipe.objects.filter(
        id=recipe_id, created_by=request.user
    ).first()

    if recipe is None:
        return JsonResponse(
            {"error": "음식 조합을 찾을 수 없습니다."},
            status=404
        )

    # 3. JSON 데이터 읽기
    try:
        data = json.loads(request.body)

    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"error": "올바른 JSON 데이터가 아닙니다."},
            status=400
        )

    if not isinstance(data, dict):
        return JsonResponse(
            {"error": "JSON 객체를 전달해야 합니다."},
            status=400
        )

    # 4. 별점과 리뷰 내용 가져오기
    rating = data.get("rating")
    content = data.get("content")

    # 5. 별점 검사 (1~5점)
    if type(rating) is not int or rating not in (1, 2, 3, 4, 5):
        return JsonResponse(
            {"error": "별점은 1~5점 사이여야 합니다."},
            status=400
        )

    # 6. 리뷰 내용 검사
    if not isinstance(content, str):
        return JsonResponse(
            {"error": "리뷰 내용을 입력해 주세요."},
            status=400
        )

    content = content.strip()

    if not (1 <= len(content) <= 2000):
        return JsonResponse(
            {"error": "리뷰 내용은 1~2000자여야 합니다."},
            status=400
        )

    # 7. PostgreSQL에 리뷰 저장
    # 동일한 사용자가 같은 조합에 리뷰를 중복 등록하지 않음
    review, created = RecipeReview.objects.get_or_create(
        user=request.user,
        recipe=recipe,
        defaults={
            "rating": rating,
            "content": content
        }
    )

    if not created:
        return JsonResponse(
            {
                "error": "이미 이 음식 조합에 리뷰를 작성했습니다."
            },
            status=409
        )

    # 8. 등록 결과 반환
    return JsonResponse(
        {
            "message": "리뷰 등록 성공",
            "review": {
                "id": review.id,
                "recipe_id": recipe.id,
                "recipe_name": recipe.name,
                "rating": review.rating,
                "content": review.content,
                "created_at": review.created_at.isoformat()
            }
        },
        status=201
    )


# PICKFOO 음식 조합 리뷰 조회 API
@require_GET
def recipe_review_list(request, recipe_id):

    # 1. 로그인 확인
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "로그인이 필요합니다."},
            status=401
        )

    # 2. 내가 등록한 음식 조합인지 확인
    recipe = Recipe.objects.filter(
        id=recipe_id,
        created_by=request.user
    ).first()

    if recipe is None:
        return JsonResponse(
            {"error": "음식 조합을 찾을 수 없거나 조회 권한이 없습니다."},
            status=404
        )

    # 3. 해당 음식 조합에 등록된 리뷰 조회
    reviews = (
        RecipeReview.objects
        .filter(recipe=recipe)
        .select_related("user")
        .order_by("-created_at")
    )

    # 4. 평균 별점 계산
    average = reviews.aggregate(
        average_rating=Avg("rating")
    )["average_rating"]

    # 5. 리뷰 목록 만들기
    results = []

    for review in reviews:

        results.append({
    "id": review.id,
    "is_mine": review.user_id == request.user.id,
    "nickname": review.user.first_name or "사용자",
    "rating": review.rating,
    "content": review.content,

    # STEP 192: 리뷰 사진 주소
    "photo_url": (
        request.build_absolute_uri(reverse("recipe-review-photo-view", args=[review.id]))
        if review.photo
        else None
    ),

    "created_at": review.created_at.isoformat()
})

    # 6. 결과 반환
    return JsonResponse({
        "recipe_id": recipe.id,
        "recipe_name": recipe.name,
        "review_count": len(results),
        "average_rating": (
            round(float(average), 1)
            if average is not None
            else None
        ),
        "reviews": results
    })

# PICKFOO 리뷰 사진 업로드 API
@require_POST
def recipe_review_photo_upload(request, review_id):

    # 1. 로그인 확인
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "로그인이 필요합니다."},
            status=401
        )

    # 2. 내가 작성한 리뷰인지 확인
    review = RecipeReview.objects.filter(
        id=review_id,
        user=request.user
    ).first()

    if review is None:
        return JsonResponse(
            {"error": "리뷰가 없거나 사진 업로드 권한이 없습니다."},
            status=404
        )

    # 3. 업로드한 사진 가져오기
    uploaded_file = request.FILES.get("photo")

    if uploaded_file is None:
        return JsonResponse(
            {"error": "사진 파일을 선택해 주세요."},
            status=400
        )

    # 4. 파일 크기 검사 (최대 3MB)
    max_size = 3 * 1024 * 1024

    if uploaded_file.size == 0 or uploaded_file.size > max_size:
        return JsonResponse(
            {"error": "사진은 3MB 이하의 파일만 업로드할 수 있습니다."},
            status=400
        )

    # 5. 실제 이미지 파일인지 검사
    try:
        with Image.open(uploaded_file) as image:

            image_format = image.format

            # 허용하는 이미지 형식
            if image_format not in ("JPEG", "PNG", "WEBP"):
                return JsonResponse(
                    {"error": "JPG, PNG, WebP 사진만 업로드할 수 있습니다."},
                    status=400
                )

            # 이미지 해상도 제한
            if image.width * image.height > 12_000_000:
                return JsonResponse(
                    {"error": "이미지 해상도가 너무 큽니다."},
                    status=400
                )

            image.load()

            # 사진 회전 정보 적용
            # 저장 시 불필요한 메타데이터는 제외
            image = ImageOps.exif_transpose(image)

            # 파일 형식별 처리
            if image_format == "JPEG":
                extension = "jpg"
                image = image.convert("RGB")

            elif image_format == "PNG":
                extension = "png"

                if image.mode not in ("RGB", "RGBA"):
                    image = image.convert("RGBA")

            else:
                extension = "webp"

                if image.mode not in ("RGB", "RGBA"):
                    image = image.convert("RGBA")

            # 6. 이미지를 새 파일로 변환
            output = BytesIO()

            if image_format == "JPEG":
                image.save(
                    output,
                    format="JPEG",
                    quality=85
                )

            elif image_format == "PNG":
                image.save(
                    output,
                    format="PNG",
                    optimize=True
                )

            else:
                image.save(
                    output,
                    format="WEBP",
                    quality=85
                )

    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        Image.DecompressionBombError
    ):
        return JsonResponse(
            {"error": "올바른 이미지 파일이 아닙니다."},
            status=400
        )

    # 변환한 이미지도 3MB 이하인지 확인
    image_bytes = output.getvalue()

    if len(image_bytes) > max_size:
        return JsonResponse(
            {"error": "변환된 이미지가 3MB를 초과합니다."},
            status=400
        )

    # 7. 기존 사진 경로 기억
    old_photo_name = (
        review.photo.name
        if review.photo
        else None
    )

    # 8. 무작위 파일명 생성
    filename = f"{uuid4().hex}.{extension}"

    # 9. Django 서버에 이미지 저장
    # PostgreSQL에는 저장된 파일 경로가 기록됨
    review.photo.save(
        filename,
        ContentFile(image_bytes),
        save=True
    )

    # 10. 사진 교체 시 기존 사진 삭제 (정리 실패는 업로드 성공과 구분)
    if old_photo_name:
        import logging
        try:
            review.photo.storage.delete(old_photo_name)
        except Exception:
            logging.getLogger(__name__).exception("이전 리뷰 사진 정리 실패: %s", old_photo_name)

    # 11. 한 사용자/조합에 사진 리뷰 포인트는 최초 1회만 지급
    points_awarded = reward_photo_review(review)

    # 12. 업로드 성공 결과 반환
    return JsonResponse(
        {
            "message": "리뷰 사진 업로드 성공",
            "review_id": review.id,
            "points_awarded": points_awarded,
            "points_balance": get_balance(request.user),
            "photo_url": request.build_absolute_uri(reverse("recipe-review-photo-view", args=[review.id]))
        },
        status=200
    )

# STEP 195: PostgreSQL 리뷰 수정 API
@require_http_methods(["PATCH"])
def recipe_review_update(request, review_id):

    # 1. 로그인 확인
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "로그인이 필요합니다."},
            status=401
        )

    # 2. 내가 작성한 리뷰인지 확인
    review = RecipeReview.objects.filter(
        id=review_id,
        user=request.user
    ).first()

    if review is None:
        return JsonResponse(
            {"error": "리뷰가 없거나 수정 권한이 없습니다."},
            status=404
        )

    # 3. JSON 데이터 읽기
    try:
        data = json.loads(request.body)

    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"error": "올바른 JSON 데이터가 아닙니다."},
            status=400
        )

    if not isinstance(data, dict):
        return JsonResponse(
            {"error": "JSON 객체를 전달해야 합니다."},
            status=400
        )

    # 4. 수정 가능한 항목 확인
    allowed_fields = {"rating", "content"}

    if not data or not set(data).issubset(allowed_fields):
        return JsonResponse(
            {"error": "별점 또는 리뷰 내용만 수정할 수 있습니다."},
            status=400
        )

    # 5. 새로운 별점 검사
    rating = data.get("rating", review.rating)

    if type(rating) is not int or rating not in (1, 2, 3, 4, 5):
        return JsonResponse(
            {"error": "별점은 1~5점 사이여야 합니다."},
            status=400
        )

    # 6. 새로운 리뷰 내용 검사
    content = data.get("content", review.content)

    if not isinstance(content, str):
        return JsonResponse(
            {"error": "리뷰 내용은 문자열이어야 합니다."},
            status=400
        )

    content = content.strip()

    if not (1 <= len(content) <= 2000):
        return JsonResponse(
            {"error": "리뷰 내용은 1~2000자여야 합니다."},
            status=400
        )

    # 7. PostgreSQL 데이터 수정
    review.rating = rating
    review.content = content

    review.save(
        update_fields=[
            "rating",
            "content",
            "updated_at"
        ]
    )

    # 8. 수정 결과 반환
    return JsonResponse({
        "message": "리뷰 수정 성공",
        "review": {
            "id": review.id,
            "recipe_id": review.recipe_id,
            "rating": review.rating,
            "content": review.content,
            "updated_at": review.updated_at.isoformat()
        }
    })

# STEP 196: PostgreSQL 리뷰 삭제 API
@require_http_methods(["DELETE"])
def recipe_review_delete(request, review_id):

    # 1. 로그인 확인
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "로그인이 필요합니다."},
            status=401
        )

    # 2. 본인이 작성한 리뷰인지 확인
    review = RecipeReview.objects.filter(
        id=review_id,
        user=request.user
    ).first()

    if review is None:
        return JsonResponse(
            {"error": "리뷰가 없거나 삭제 권한이 없습니다."},
            status=404
        )

    # 3. 첨부 사진 정보 보관
    photo_name = review.photo.name if review.photo else None
    photo_storage = review.photo.storage

    # 4. PostgreSQL에서 리뷰 삭제
    deleted_review_id = review.id

    review.delete()

    # 5. 서버에 저장된 사진도 삭제
    if photo_name:
        import logging
        try:
            photo_storage.delete(photo_name)
        except Exception:
            logging.getLogger(__name__).exception("리뷰 삭제 후 사진 정리 실패: %s", photo_name)

    # 6. 삭제 완료 응답
    return JsonResponse({
        "message": "리뷰 삭제 성공",
        "deleted_review_id": deleted_review_id
    })
# Protected photo endpoint - never expose MEDIA_ROOT as a public directory.
@require_GET
def recipe_review_photo_view(request, review_id):
    if not request.user.is_authenticated:
        return JsonResponse({'error':'로그인이 필요합니다.'}, status=401)
    review = RecipeReview.objects.select_related('recipe').filter(pk=review_id).first()
    if (review is None or not review.photo or
            (request.user.pk not in (review.user_id, review.recipe.created_by_id))):
        raise Http404('사진을 찾을 수 없습니다.')
    from pathlib import Path
    import mimetypes
    try:
        review.photo.open('rb')
    except (FileNotFoundError, OSError):
        raise Http404('사진 파일을 찾을 수 없습니다.')
    mime = mimetypes.guess_type(review.photo.name)[0] or 'application/octet-stream'
    if mime not in ('image/jpeg', 'image/png', 'image/webp'):
        raise Http404('지원하지 않는 파일입니다.')
    response = FileResponse(review.photo.file, content_type=mime)
    response['Cache-Control'] = 'private, no-store'
    response['X-Content-Type-Options'] = 'nosniff'
    response['Content-Disposition'] = 'inline; filename="review-image"'
    return response
