"""PICKFOO 운영자용 실제 메뉴/재료 관리 화면.

Django Admin에서 브랜드, 메뉴, 재료와 메뉴별 재료 연결을 관리합니다.
음식 조합(Recipe)과 리뷰(RecipeReview)는 기존 API로 관리합니다.
"""
from django.contrib import admin
from .models import Brand, Menu, Ingredient, MenuIngredient


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "official_website", "updated_at")
    list_filter = ("category",)
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ("name", "updated_at")
    search_fields = ("name",)
    ordering = ("name",)


class MenuIngredientInline(admin.TabularInline):
    model = MenuIngredient
    extra = 0
    autocomplete_fields = ("ingredient",)
    fields = ("ingredient", "source_url", "last_verified_at")
    verbose_name = "메뉴에 포함된 재료"
    verbose_name_plural = "메뉴에 포함된 재료"


@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = (
        "name", "brand", "category", "price",
        "availability_status", "last_verified_at",
    )
    list_filter = ("availability_status", "brand", "category")
    search_fields = ("name", "brand__name", "description")
    autocomplete_fields = ("brand",)
    inlines = (MenuIngredientInline,)
    ordering = ("brand__name", "name")


@admin.register(MenuIngredient)
class MenuIngredientAdmin(admin.ModelAdmin):
    list_display = ("menu", "ingredient", "source_url", "last_verified_at")
    search_fields = ("menu__name", "menu__brand__name", "ingredient__name")
    autocomplete_fields = ("menu", "ingredient")
    list_select_related = ("menu", "ingredient")
