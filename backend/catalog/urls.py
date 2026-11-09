from django.urls import path
from . import views

urlpatterns = [
    path("reviews/<int:review_id>/photo/view/", views.recipe_review_photo_view, name="recipe-review-photo-view"),
    # 실제 메뉴 조회
    path(
        "menus/",
        views.menu_list,
        name="catalog-menu-list"
    ),

    # 음식 조합 등록
    path(
        "recipes/",
        views.recipe_create,
        name="catalog-recipe-create"
    ),

    # 내가 등록한 음식 조합 조회
    path(
        "recipes/mine/",
        views.my_recipe_list,
        name="my-recipe-list"
    ),

    # 내가 등록한 음식 조합 삭제
    path(
        "recipes/<int:recipe_id>/",
        views.recipe_delete,
        name="catalog-recipe-delete"
    ),
    # 음식 조합 수정
path(
    "recipes/<int:recipe_id>/edit/",
    views.recipe_update,
    name="catalog-recipe-update"
),

# 음식 조합 리뷰 등록
path(
    "recipes/<int:recipe_id>/reviews/",
    views.recipe_review_create,
    name="recipe-review-create"
),
# 음식 조합 리뷰 조회
path(
    "recipes/<int:recipe_id>/reviews/list/",
    views.recipe_review_list,
    name="recipe-review-list"
),

# 리뷰 사진 업로드
path(
    "reviews/<int:review_id>/photo/",
    views.recipe_review_photo_upload,
    name="recipe-review-photo-upload"
),

# STEP 197: 리뷰 수정
path(
    "reviews/<int:review_id>/edit/",
    views.recipe_review_update,
    name="recipe-review-update"
),

# STEP 197: 리뷰 삭제
path(
    "reviews/<int:review_id>/",
    views.recipe_review_delete,
    name="recipe-review-delete"
),
]

# PICKFOO_STEP233_VERIFICATION
from . import curated_views
urlpatterns += [
    path('curated/verification/', curated_views.curated_summary, name='curated-verification'),
    path('curated/reviews/<int:review_id>/photo/view/', curated_views.curated_photo_view, name='curated-photo-view'),
    path('curated/reviews/<int:review_id>/photo/', curated_views.curated_photo_upload, name='curated-photo-upload'),
    path('curated/reviews/<int:review_id>/', curated_views.curated_review_manage, name='curated-review-manage'),
    path('curated/<slug:key>/reviews/', curated_views.curated_reviews, name='curated-review-list-create'),
]

# PICKFOO_STEP235_PERSONAL_HISTORY
from .curated_history_views import my_rating_history
urlpatterns += [
    path('curated/my-rating-history/', my_rating_history, name='curated-my-rating-history'),
]

# PICKFOO_STEP236_TRENDING
from .curated_trending_views import curated_trending
urlpatterns += [
    path('curated/trending/', curated_trending, name='curated-trending'),
]

# PICKFOO_STEP240_PRODUCT_LINK_DB
from .product_link_views import links_for_ingredients
urlpatterns += [
    path('product-links/', links_for_ingredients, name='pickfoo-product-links'),
]
