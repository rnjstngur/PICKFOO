from .models import UserPreference
from django.views.decorators.http import require_http_methods
from django.contrib.auth import (
    authenticate,
    login as auth_login,
    logout as auth_logout
)
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.http import require_POST


@require_POST
def signup(request):

    # 1. 회원가입 정보 받기
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({
            "success": False,
            "message": "올바른 요청 형식이 아닙니다."
        }, status=400)

    if not isinstance(data, dict):
        return JsonResponse({
            "success": False,
            "message": "회원가입 정보를 확인해 주세요."
        }, status=400)

    email = str(data.get("email") or "").strip().lower()
    nickname = str(data.get("nickname") or "").strip()
    password = data.get("password")

    # 2. 필수 입력 확인
    if not email or not nickname or not isinstance(password, str) or not password:
        return JsonResponse({
            "success": False,
            "message": "모든 항목을 입력해 주세요."
        }, status=400)

    # 3. 이메일과 닉네임 검사
    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({
            "success": False,
            "message": "올바른 이메일을 입력해 주세요."
        }, status=400)

    if len(email) > 150 or len(nickname) > 24:
        return JsonResponse({
            "success": False,
            "message": "이메일 또는 닉네임이 너무 깁니다."
        }, status=400)

    User = get_user_model()

    # 4. 이메일 중복 확인
    if User.objects.filter(username=email).exists():
        return JsonResponse({
            "success": False,
            "message": "이미 가입된 이메일입니다."
        }, status=409)

    # 5. 비밀번호 안전성 검사
    user = User(
        username=email,
        email=email,
        first_name=nickname
    )

    try:
        validate_password(password, user=user)
    except ValidationError as error:
        return JsonResponse({
            "success": False,
            "message": " ".join(error.messages)
        }, status=400)

    # 6. 데이터베이스에 회원 저장
    try:
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=nickname
        )
    except IntegrityError:
        return JsonResponse({
            "success": False,
            "message": "이미 가입된 이메일입니다."
        }, status=409)

    # 7. 회원가입 성공 응답
    return JsonResponse({
        "success": True,
        "message": "회원가입이 완료되었습니다.",
        "user": {
            "id": user.id,
            "email": user.email,
            "nickname": user.first_name
        }
    }, status=201)

# PICKFOO CSRF 토큰 발급
@require_GET
@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({
        "success": True,
        "message": "CSRF 토큰 준비 완료",
        "csrf_token": get_token(request)
    })

# PICKFOO 로그인 API
@require_POST
def login_api(request):

    # 1. 로그인 정보 받기
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({
            "success": False,
            "message": "올바른 요청 형식이 아닙니다."
        }, status=400)

    if not isinstance(data, dict):
        return JsonResponse({
            "success": False,
            "message": "로그인 정보를 확인해 주세요."
        }, status=400)

    email = data.get("email")
    password = data.get("password")

    # 2. 입력값 확인
    if not isinstance(email, str) or not isinstance(password, str):
        return JsonResponse({
            "success": False,
            "message": "이메일과 비밀번호를 입력해 주세요."
        }, status=400)

    email = email.strip().lower()

    if not email or not password:
        return JsonResponse({
            "success": False,
            "message": "이메일과 비밀번호를 입력해 주세요."
        }, status=400)

    # 3. 데이터베이스 회원 인증
    user = authenticate(
        request,
        username=email,
        password=password
    )

    # 4. 로그인 실패
    if user is None:
        return JsonResponse({
            "success": False,
            "message": "이메일 또는 비밀번호가 올바르지 않습니다."
        }, status=401)

    # 5. 로그인 성공 및 세션 생성
    auth_login(request, user)

    # 6. 로그인 성공 응답
    return JsonResponse({
        "success": True,
        "message": "로그인에 성공했습니다.",
        "user": {
            "id": user.id,
            "email": user.email,
            "nickname": user.first_name
        }
    }, status=200)

# PICKFOO 현재 로그인 상태 확인 API
@require_GET
def me(request):

    # 로그인하지 않은 사용자
    if not request.user.is_authenticated:
        return JsonResponse({
            "success": False,
            "is_authenticated": False,
            "message": "로그인이 필요합니다."
        }, status=401)

    # 로그인한 사용자 정보
    user = request.user

    return JsonResponse({
        "success": True,
        "is_authenticated": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "nickname": user.first_name
        }
    }, status=200)

# PICKFOO 로그아웃 API
@require_POST
def logout_api(request):

    # 현재 로그인 세션 종료
    auth_logout(request)

    # 로그아웃 결과 반환
    return JsonResponse({
        "success": True,
        "message": "로그아웃이 완료되었습니다."
    }, status=200)
# PICKFOO 음식 취향 저장 및 조회 API

@require_http_methods(["GET", "POST"])
def preferences_api(request):

    # 1. 로그인 여부 확인
    if not request.user.is_authenticated:
        return JsonResponse({
            "success": False,
            "message": "로그인이 필요합니다."
        }, status=401)

    # 2. 저장된 음식 취향 조회
    if request.method == "GET":

        preference = UserPreference.objects.filter(
            user=request.user
        ).first()

        if preference is None:
            return JsonResponse({
                "success": True,
                "preferences": None,
                "message": "아직 저장된 음식 취향이 없습니다."
            })

        return JsonResponse({
            "success": True,
            "preferences": {
                "food_types": preference.food_types,
                "brands": preference.brands,
                "flavors": preference.flavors,
                "spicy": preference.spicy,
                "budget": preference.budget,
                "excluded_ingredients": preference.excluded_ingredients,
                "allergies": preference.allergies
            }
        })

    # 3. 음식 취향 저장 요청 처리
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({
            "success": False,
            "message": "올바른 데이터 형식이 아닙니다."
        }, status=400)

    if not isinstance(data, dict):
        return JsonResponse({
            "success": False,
            "message": "음식 취향 데이터를 확인해 주세요."
        }, status=400)

    # 4. 저장할 데이터 검사
    fields = [
        "food_types",
        "brands",
        "flavors",
        "excluded_ingredients",
        "allergies"
    ]

    values = {}

    for field in fields:
        if field in data:
            value = data[field]

            if (
                not isinstance(value, list)
                or len(value) > 30
                or any(
                    not isinstance(item, str)
                    or not item.strip()
                    or len(item) > 100
                    for item in value
                )
            ):
                return JsonResponse({
                    "success": False,
                    "message": f"{field} 값이 올바르지 않습니다."
                }, status=400)

            values[field] = [
                item.strip() for item in value
            ]

    for field in ["spicy", "budget"]:
        if field in data:
            value = data[field]

            if (
                not isinstance(value, str)
                or len(value) > (10 if field == "spicy" else 20)
            ):
                return JsonResponse({
                    "success": False,
                    "message": f"{field} 값이 올바르지 않습니다."
                }, status=400)

            values[field] = value

    # 5. PostgreSQL에 저장
    preference, created = UserPreference.objects.update_or_create(
        user=request.user,
        defaults=values
    )

    # 6. 저장 결과 반환
    return JsonResponse({
        "success": True,
        "message": "음식 취향이 저장되었습니다.",
        "created": created
    })