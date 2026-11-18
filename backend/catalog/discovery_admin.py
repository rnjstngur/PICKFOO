"""관리자 검토 화면: 자동 발견한 신규 조합 후보를 확인하고 승인·제외한다."""
from django.contrib import admin, messages
from django.utils import timezone
from django.utils.html import format_html, format_html_join

from .discovery_models import DiscoveredCombo


@admin.register(DiscoveredCombo)
class DiscoveredComboAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand', 'status', 'mention_count', 'last_seen_date', 'price', 'spicy', 'source_links')
    list_filter = ('status', 'brand')
    search_fields = ('name', 'dedupe_key')
    ordering = ('status', '-mention_count', '-last_seen_date')
    actions = ('approve', 'reject', 'back_to_pending')
    readonly_fields = ('dedupe_key', 'mention_count', 'authors', 'sample_list', 'queries',
                       'first_seen_date', 'last_seen_date', 'reviewed_at', 'reviewed_by', 'created_at', 'updated_at')
    fieldsets = (
        ('검토할 내용(승인 전에 확인·수정)', {
            'fields': ('status', 'name', 'brand', 'category', 'ingredients', 'steps', 'description', 'spicy', 'price'),
            'description': '재료는 ["불닭볶음면", "스트링치즈"]처럼 목록으로 입력하세요. 맵기는 0(안 매움)~2(매움). '
                           '가격은 연결 상품 판매가 합계(원)이며 비워 두면 앱에 "가격 확인 중"으로 나와요.',
        }),
        ('수집 근거', {'fields': ('sample_list', 'mention_count', 'authors', 'queries', 'first_seen_date', 'last_seen_date')}),
        ('기록', {'fields': ('dedupe_key', 'reviewed_at', 'reviewed_by', 'created_at', 'updated_at')}),
    )

    @admin.display(description='원문')
    def source_links(self, obj):
        rows = (obj.samples or [])[:2]
        return format_html_join(' ', '<a href="{}" target="_blank" rel="noopener">{}</a>',
                                ((s.get('url', ''), s.get('date', '원문')) for s in rows)) or '-'

    @admin.display(description='원문 예시')
    def sample_list(self, obj):
        rows = obj.samples or []
        if not rows:
            return '-'
        return format_html('<ul style="margin:0;padding-left:18px">{}</ul>', format_html_join(
            '', '<li>{} · <a href="{}" target="_blank" rel="noopener">{}</a></li>',
            ((s.get('date', ''), s.get('url', ''), s.get('title', '') or s.get('url', '')) for s in rows)))

    def save_model(self, request, obj, form, change):
        # 상세 화면에서 상태를 '승인'으로 바꿀 때도 필수 값을 확인한다.
        if obj.status == DiscoveredCombo.STATUS_APPROVED and obj.approval_problems():
            obj.status = DiscoveredCombo.STATUS_PENDING
            messages.error(request, f'승인하려면 먼저 입력하세요: {", ".join(obj.approval_problems())}. 검토 대기로 저장했어요.')
        if 'status' in form.changed_data:
            obj.reviewed_at = timezone.now()
            obj.reviewed_by = request.user
        super().save_model(request, obj, form, change)

    @admin.action(description='선택한 후보 승인(앱에 공개)')
    def approve(self, request, queryset):
        ok, blocked = 0, []
        for obj in queryset:
            problems = obj.approval_problems()
            if problems:
                blocked.append(f'{obj.name}({", ".join(problems)})')
                continue
            obj.status = DiscoveredCombo.STATUS_APPROVED
            obj.reviewed_at = timezone.now()
            obj.reviewed_by = request.user
            obj.save(update_fields=['status', 'reviewed_at', 'reviewed_by', 'updated_at'])
            ok += 1
        if ok:
            messages.success(request, f'{ok}개를 승인했어요. 앱 목록에 바로 나타나요.')
        if blocked:
            messages.warning(request, '필수 값이 비어 승인하지 못했어요: ' + '; '.join(blocked))

    @admin.action(description='선택한 후보 제외(다시 수집돼도 공개 안 함)')
    def reject(self, request, queryset):
        n = queryset.update(status=DiscoveredCombo.STATUS_REJECTED, reviewed_at=timezone.now(), reviewed_by=request.user)
        messages.success(request, f'{n}개를 제외했어요.')

    @admin.action(description='선택한 후보를 검토 대기로 되돌리기(앱에서 숨김)')
    def back_to_pending(self, request, queryset):
        n = queryset.update(status=DiscoveredCombo.STATUS_PENDING, reviewed_at=timezone.now(), reviewed_by=request.user)
        messages.success(request, f'{n}개를 검토 대기로 되돌렸어요.')
