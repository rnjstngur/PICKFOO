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