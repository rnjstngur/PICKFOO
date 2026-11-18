"""신규 조합 후보(블로그에서 자동 발견) — 관리자가 확인·승인한 것만 앱에 공개한다."""
from django.conf import settings
from django.core.validators import MaxValueValidator
from django.db import models


class DiscoveredCombo(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING, '검토 대기'),
        (STATUS_APPROVED, '승인(앱 공개)'),
        (STATUS_REJECTED, '제외'),
    ]

    # 재료 집합을 정규화한 값(공백 제거·소문자·정렬). 같은 조합이 다른 글에서 다시 나와도 한 행으로 모은다.
    dedupe_key = models.CharField('중복 확인 키', max_length=300, unique=True)
    name = models.CharField('조합 이름', max_length=150)
    brand = models.CharField('브랜드', max_length=50, default='편의점(CU·GS25 등)')
    category = models.CharField('카테고리', max_length=50, blank=True, default='')
    ingredients = models.JSONField('재료', default=list)
    steps = models.JSONField('만드는 방법', default=list, blank=True)
    description = models.CharField('한 줄 소개', max_length=200, blank=True, default='')

    # 관리자가 확인해 입력하는 값. 비어 있으면 앱에서 0원·안 매움으로 처리하지 않는다.
    price = models.PositiveIntegerField('판매가 합계(원)', null=True, blank=True)
    spicy = models.PositiveSmallIntegerField('맵기(0~2)', null=True, blank=True,
                                             validators=[MaxValueValidator(2)])

    # 수집 근거(게시물 제목·주소·날짜·블로그 식별값만 저장, 본문은 저장하지 않음)
    authors = models.JSONField('언급한 블로그', default=list, blank=True)
    mention_count = models.PositiveIntegerField('서로 다른 블로그 수', default=0)
    samples = models.JSONField('원문 예시', default=list, blank=True)
    queries = models.JSONField('발견한 검색어', default=list, blank=True)
    first_seen_date = models.DateField('처음 본 게시일', null=True, blank=True)
    last_seen_date = models.DateField('최근 게시일', null=True, blank=True)

    status = models.CharField('상태', max_length=10, choices=STATUS_CHOICES,
                              default=STATUS_PENDING, db_index=True)
    reviewed_at = models.DateTimeField('검토 시각', null=True, blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='pickfoo_reviewed_discoveries')
    created_at = models.DateTimeField('발견 시각', auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-mention_count', '-last_seen_date']
        verbose_name = '신규 조합 후보'
        verbose_name_plural = '신규 조합 후보(자동 발견)'

    def __str__(self):
        return f'{self.name} [{self.get_status_display()}]'

    def approval_problems(self) -> list[str]:
        """승인 전에 꼭 채워야 하는 값. 비어 있으면 앱에서 잘못된 기본값으로 보이게 된다."""
        problems = []
        if not self.name.strip():
            problems.append('조합 이름')
        if not isinstance(self.ingredients, list) or len([x for x in self.ingredients if str(x).strip()]) < 2:
            problems.append('재료 2개 이상')
        if self.spicy is None:
            problems.append('맵기')
        return problems
