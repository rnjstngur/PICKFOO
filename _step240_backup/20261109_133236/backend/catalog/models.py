from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


# PICKFOO 브랜드 데이터베이스
class Brand(models.Model):

    # 브랜드 종류
    CATEGORY_CHOICES = [
        ("convenience", "편의점"),
        ("cafe", "카페"),
        ("restaurant", "음식점"),
        ("other", "기타"),
    ]

    # 브랜드 이름
    name = models.CharField(
        max_length=100,
        unique=True
    )

    # 브랜드 종류
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="other"
    )

    # 브랜드 공식 홈페이지
    official_website = models.URLField(
        blank=True
    )

    # 최초 등록일
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    # 마지막 수정일
    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.name


    # PICKFOO 브랜드별 음식 메뉴
class Menu(models.Model):

    # 판매 상태
    STATUS_CHOICES = [
        ("unknown", "확인되지 않음"),
        ("available", "판매 중"),
        ("unavailable", "판매 중단"),
    ]

    # 메뉴가 속한 브랜드
    brand = models.ForeignKey(
        Brand,
        on_delete=models.PROTECT,
        related_name="menus"
    )

    # 메뉴 이름
    name = models.CharField(
        max_length=150
    )

    # 음식 종류
    category = models.CharField(
        max_length=50,
        blank=True
    )

    # 메뉴 설명
    description = models.TextField(
        blank=True
    )

    # 판매 가격 (원)
    price = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    # 정보 출처 URL
    source_url = models.URLField(
        blank=True
    )

    # 판매 상태
    availability_status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="unknown"
    )

    # 마지막 정보 확인 날짜
    last_verified_at = models.DateField(
        null=True,
        blank=True
    )

    # 최초 등록일
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    # 마지막 수정일
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["brand", "name"],
                name="unique_brand_menu_name"
            )
        ]

    def __str__(self):
        return f"{self.brand.name} - {self.name}"

    # PICKFOO 음식 재료 데이터베이스
class Ingredient(models.Model):

    # 재료 이름
    name = models.CharField(
        max_length=100,
        unique=True
    )

    # 재료 설명
    description = models.TextField(
        blank=True
    )

    # 최초 등록일
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    # 마지막 수정일
    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.name


    # PICKFOO 메뉴와 재료 연결 테이블
class MenuIngredient(models.Model):

    # 음식 메뉴
    menu = models.ForeignKey(
        Menu,
        on_delete=models.CASCADE,
        related_name="menu_ingredients"
    )

    # 음식 재료
    ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.PROTECT,
        related_name="menu_ingredients"
    )

    # 재료 정보의 출처
    source_url = models.URLField(
        blank=True
    )

    # 재료 정보 마지막 확인 날짜
    last_verified_at = models.DateField(
        null=True,
        blank=True
    )

    # 최초 등록일
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    # 마지막 수정일
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["menu", "ingredient"],
                name="unique_menu_ingredient"
            )
        ]

    def __str__(self):
        return f"{self.menu.name} - {self.ingredient.name}"


        # PICKFOO 사용자 등록 음식 조합
class Recipe(models.Model):

    # 등록한 사용자
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pickfoo_recipes"
    )

    # 음식 조합 이름
    name = models.CharField(
        max_length=150
    )

    # 화면에 표시할 브랜드 이름
    brand_name = models.CharField(
        max_length=100,
        blank=True
    )

    # 음식 종류
    category = models.CharField(
        max_length=50
    )

    # 예상 가격
    estimated_price = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    # 매운맛 단계
    SPICY_CHOICES = [
        (0, "안 매움"),
        (1, "약간 매움"),
        (2, "매움"),
    ]

    spicy = models.PositiveSmallIntegerField(
        choices=SPICY_CHOICES,
        default=0
    )

    # 음식 조합 설명
    description = models.TextField(
        blank=True
    )

    # 필요한 재료 목록
    ingredients = models.JSONField(
        default=list
    )

    # 만드는 방법
    steps = models.JSONField(
        default=list
    )

    # 최초 등록일
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    # 마지막 수정일
    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.name




    # PICKFOO 음식 조합 리뷰
class RecipeReview(models.Model):

    # 리뷰를 작성한 사용자
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pickfoo_reviews"
    )

    # 리뷰 대상 음식 조합
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name="reviews"
    )

    # 별점 (1~5점)
    rating = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5)
        ]
    )

    # 리뷰 내용
    content = models.TextField(
        max_length=2000
    )

    # 리뷰 사진 (선택 사항)
    photo = models.ImageField(
        upload_to="review_photos/%Y/%m/",
        blank=True
    )

    # 작성 날짜
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    # 수정 날짜
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "recipe"],
                name="unique_user_recipe_review"
            )
        ]

    def __str__(self):
        return f"{self.recipe.name} - {self.rating}점"

# PICKFOO_STEP233_VERIFICATION
from .curated_models import CuratedCombo, CuratedComboReview
