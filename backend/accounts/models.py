from django.db import models
from django.conf import settings


# PICKFOO 사용자 음식 취향
class UserPreference(models.Model):

    # 회원 정보와 연결 (한 회원당 하나의 취향 정보)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="preferences"
    )

    # 좋아하는 음식 종류
    food_types = models.JSONField(default=list)

    # 선호 브랜드
    brands = models.JSONField(default=list)

    # 선호하는 맛
    flavors = models.JSONField(default=list)

    # 매운맛 정도
    spicy = models.CharField(
        max_length=10,
        default="all"
    )

    # 한 끼 예산
    budget = models.CharField(
        max_length=20,
        default="all"
    )

    # 제외할 재료
    excluded_ingredients = models.JSONField(default=list)

    # 알레르기 정보
    allergies = models.JSONField(default=list)

    # 최초 생성일
    created_at = models.DateTimeField(auto_now_add=True)

    # 마지막 수정일
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}의 음식 취향"