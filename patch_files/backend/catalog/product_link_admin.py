"""Admin-only edit and Excel CSV import; never writable from public mobile UI."""
from django import forms
from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.template.response import TemplateResponse
from django.urls import path, reverse

from .product_link_import import import_csv_bytes
from .product_link_models import IngredientProductLink


class ProductLinkCsvForm(forms.Form):
    csv_file = forms.FileField(label='CSV UTF-8 파일', help_text='엑셀에서 CSV UTF-8(.csv)로 저장하세요. 500KB·300행 이하.')


@admin.register(IngredientProductLink)
class IngredientProductLinkAdmin(admin.ModelAdmin):
    list_display = ('ingredient_name', 'provider', 'product_name', 'is_active', 'updated_at')
    list_filter = ('provider', 'is_active')
    search_fields = ('ingredient_name', 'product_name', 'aliases')
    readonly_fields = ('ingredient_key', 'created_at', 'updated_at')
    change_list_template = 'admin/catalog/ingredientproductlink/change_list.html'
    fields = ('ingredient_name', 'provider', 'product_name', 'url', 'aliases', 'note',
              'is_active', 'ingredient_key', 'created_at', 'updated_at')

    def get_urls(self):
        return [
            path('import-csv/', self.admin_site.admin_view(self.import_csv),
                 name='catalog_ingredientproductlink_import_csv'),
        ] + super().get_urls()

    def import_csv(self, request):
        if not self.has_add_permission(request):
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied
        form = ProductLinkCsvForm(request.POST or None, request.FILES or None)
        if request.method == 'POST' and form.is_valid():
            try:
                uploaded = form.cleaned_data['csv_file']
                if uploaded.size > 512_000:
                    raise ValueError('CSV 파일은 500KB 이하만 지원합니다.')
                new, changed = import_csv_bytes(uploaded.read())
            except ValueError as exc:
                form.add_error('csv_file', str(exc))
            else:
                self.message_user(request, f'상품 링크 등록 완료: 신규 {new}건, 갱신 {changed}건', messages.SUCCESS)
                return HttpResponseRedirect(reverse('admin:catalog_ingredientproductlink_changelist'))
        context = {
            **self.admin_site.each_context(request),
            'title': '재료별 상품 링크 CSV 일괄 등록',
            'opts': self.model._meta,
            'form': form,
        }
        return TemplateResponse(request, 'admin/catalog/ingredientproductlink/import_csv.html', context)
