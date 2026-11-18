"""신규 조합 자동 발견 테스트. 실제 API는 호출하지 않는다(DB_ENGINE=sqlite로 실행 가능)."""
from datetime import datetime, timedelta, timezone as dt_timezone
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings

from catalog import trend_discovery as td
from catalog.discovery_models import DiscoveredCombo

NOW = datetime(2026, 11, 18, 3, 0, tzinfo=dt_timezone.utc)  # 2026-11-18 12:00 KST


def post(author, title, days_ago=1, url=None):
    d = (NOW + timedelta(hours=9)).date() - timedelta(days=days_ago)
    return {'title': title, 'summary': '', 'url': url or f'https://blog.example/{author}/{abs(hash(title)) % 9999}',
            'author': author, 'date': d.isoformat()}


class ExtractTests(TestCase):
    def test_plus_titles_and_dictionary_titles(self):
        self.assertEqual(td.extract('편의점 꿀조합 불닭볶음면 + 스트링치즈 + 콘치즈 후기'), ['불닭볶음면', '스트링치즈', '콘치즈'])
        self.assertEqual(td.extract('[CU 신상] 짜파게티+스팸+계란 조합 미쳤다'), ['짜파게티', '스팸', '계란'])
        self.assertEqual(td.extract('GS25 꿀조합 너구리에 참치캔이랑 김치 넣어 먹기'), ['너구리', '참치캔', '김치'])
        self.assertEqual(td.extract('편의점 꿀조합 메로나 + 우유 = 메로나 우유'), ['메로나', '우유'])

    def test_rejects_alcohol_and_non_combo_posts(self):
        self.assertEqual(td.extract('편의점 하이볼 꿀조합 위스키+토닉워터'), [])
        self.assertEqual(td.extract('오늘 점심 편의점 도시락 후기'), [])
        self.assertEqual(td.extract('불닭볶음면 맛있다'), [])  # 재료 1개

    def test_existing_combo_is_not_new(self):
        known = td._known_sets()
        self.assertTrue(td.is_existing(['불닭볶음면', '짜파게티'], known))   # 기존 '불닭 짜파게티'
        self.assertFalse(td.is_existing(['짜파게티', '스팸', '계란'], known))


class RunTests(TestCase):
    def setUp(self):
        self.tmp = TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        media = override_settings(MEDIA_ROOT=self.tmp.name)
        media.enable()
        self.addCleanup(media.disable)

    def fake(self, posts):
        return {'kakao_blog': lambda q: posts if q == '편의점 꿀조합' else []}

    def test_run_groups_by_ingredients_and_counts_distinct_blogs(self):
        posts = [post('a', '짜파게티+스팸+계란 꿀조합'), post('a', '스팸 계란 짜파게티 꿀조합 또 먹음', 3),
                 post('b', '편의점 꿀조합 계란 + 스팸 + 짜파게티'), post('c', '오래된 글 짜파게티+스팸+계란', 300),
                 post('d', '불닭볶음면 + 짜파게티 꿀조합')]
        r = td.run(now=NOW, fetchers=self.fake(posts))
        self.assertEqual(r['new'], 1)                       # 120일 지난 글·기존 조합은 제외
        row = DiscoveredCombo.objects.get()
        self.assertEqual(row.mention_count, 2)              # a, b (같은 블로그 a는 1번)
        self.assertEqual(row.status, DiscoveredCombo.STATUS_PENDING)
        self.assertEqual(td.last_run()['candidates'], 1)

    def test_rerun_does_not_duplicate_and_keeps_rejected(self):
        posts = [post('a', '짜파게티+스팸+계란 꿀조합')]
        td.run(now=NOW, fetchers=self.fake(posts))
        DiscoveredCombo.objects.update(status=DiscoveredCombo.STATUS_REJECTED, name='관리자가 고친 이름')
        td.run(now=NOW, fetchers=self.fake(posts + [post('z', '짜파게티 + 스팸 + 계란')]))
        row = DiscoveredCombo.objects.get()
        self.assertEqual(row.status, DiscoveredCombo.STATUS_REJECTED)
        self.assertEqual(row.name, '관리자가 고친 이름')
        self.assertEqual(row.mention_count, 2)

    def test_api_shows_only_approved(self):
        td.run(now=NOW, fetchers=self.fake([post('a', '짜파게티+스팸+계란 꿀조합'), post('b', '너구리+참치캔 조합')]))
        self.assertEqual(self.client.get('/api/catalog/discovered/').json()['items'], [])
        row = DiscoveredCombo.objects.get(name__startswith='짜파게티')
        self.assertIn('맵기', row.approval_problems())       # 맵기 없이 승인 불가
        row.spicy = 0
        row.status = DiscoveredCombo.STATUS_APPROVED
        row.save()
        body = self.client.get('/api/catalog/discovered/').json()
        self.assertEqual([x['name'] for x in body['items']], ['짜파게티 + 스팸 + 계란'])
        self.assertIsNone(body['items'][0]['price'])        # 가격 미확인은 null(0원 아님)
        self.assertEqual(body['pending'], 1)

    def test_admin_approve_action_blocks_missing_values(self):
        td.run(now=NOW, fetchers=self.fake([post('a', '짜파게티+스팸+계란 꿀조합')]))
        admin = get_user_model().objects.create_superuser('admin-test', 'admin@example.test', 'x-test-only-1!')
        self.client.force_login(admin)
        row = DiscoveredCombo.objects.get()
        url = '/admin/catalog/discoveredcombo/'
        self.client.post(url, {'action': 'approve', '_selected_action': [row.pk]})
        row.refresh_from_db()
        self.assertEqual(row.status, DiscoveredCombo.STATUS_PENDING)
        row.spicy = 1
        row.save()
        self.client.post(url, {'action': 'approve', '_selected_action': [row.pk]})
        row.refresh_from_db()
        self.assertEqual(row.status, DiscoveredCombo.STATUS_APPROVED)
