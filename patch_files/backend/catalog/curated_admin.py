from django.contrib import admin
from .curated_models import CuratedCombo, CuratedComboReview


@admin.register(CuratedCombo)
class CuratedComboAdmin(admin.ModelAdmin):
    list_display = ('key', 'name', 'created_by', 'created_at')
    search_fields = ('key', 'name')
    readonly_fields = ('key', 'created_by', 'created_at')


@admin.register(CuratedComboReview)
class CuratedComboReviewAdmin(admin.ModelAdmin):
    list_display = ('combo', 'user', 'rating', 'has_photo', 'created_at')
    list_filter = ('combo', 'rating')
    search_fields = ('combo__name', 'user__username')
    readonly_fields = ('combo', 'user', 'rating', 'content', 'photo', 'created_at', 'updated_at')

    @admin.display(boolean=True)
    def has_photo(self, obj):
        return bool(obj.photo)
