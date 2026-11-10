"""트렌드 자동 수집기 테스트. 실제 API는 호출하지 않고 가짜 응답을 넣는다(DB_ENGINE=sqlite로 실행 가능)."""
from datetime import datetime, timedelta, timezone as dt_timezone
from tempfile import TemporaryDirectory
from unittest import mock

from django.test import TestCase, override_settings

from catalog import trend_collector as tc

NOW = datetime(2026, 11, 10, 3, 0, tzinfo=dt_timezone.utc)  # 2026-11-10 12:00 KST


def post(author, days_ago, title='불닭 콘치즈 만들어봄', url=None):
    d = (NOW + timedelta(hours=9)).date() - timedelta(days=days_ago)
    return {'title': title, 'summary': '', 'url': url or f'https://blog.example/{author}/{days_ago}',
            'author': author, 'date': d.isoformat()}


class TrendCollectorTests(TestCase):
    def setUp(self):
        self.tmp = TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.media = override_settings(MEDIA_ROOT=self.tmp.name)
        self.media.enable()
        self.addCleanup(self.media.disable)

    def test_relevance_requires_all_core_words_ignoring_spaces(self):
        self.assertTrue(tc.is_relevant('불닭 콘치즈', '<b>불닭콘치즈</b> 후기'))
        self.assertFalse(tc.is_relevant('불닭 콘치즈', '불닭볶음면 후기'))
        self.assertTrue(tc.is_relevant('써브웨이 이탈리안비엠티 꿀조합', '써브웨이 이탈리안 비엠티 주문법'))

    def test_summary_only_counts_when_words_appear_together(self):
        # 맛집 글 요약에 단어가 따로 나오면 제외, 붙어서 나오면 인정
        self.assertFalse(tc.is_relevant('불닭 콘치즈', '수원역 낙곱새 맛집', '매운맛 불닭 소스에 계란찜, 콘치즈 사이드'))
        self.assertTrue(tc.is_relevant('불닭 콘치즈', '오늘 야식', '편의점 불닭 콘치즈 만들어 먹음'))

    def test_summary_counts_distinct_authors_and_drops_old_or_unrelated_posts(self):
        posts = [post('a', 1), post('a', 3), post('b', 10), post('c', 25), post('d', 60),
                 post('e', 200), post('f', 2, title='다른 음식')]
        s = tc.summarize('불닭 콘치즈', posts, NOW)
        self.assertEqual(s['authors30'], 3)      # a, b, c
        self.assertEqual(s['authors120'], 4)     # + d (e는 120일 초과, f는 관련 없음)
        self.assertEqual(s['latest'], post('a', 1)['date'])
        self.assertEqual(len(s['samples']), 3)

    def test_collect_saves_file_and_api_returns_it_without_refetch(self):
        fake_blog = lambda q: [post('a', 1, title=q), post('b', 5, title=q), post('c', 9, title=q)]
        with mock.patch.dict('os.environ', {'KAKAO_REST_API_KEY': '', 'NAVER_CLIENT_ID': '', 'NAVER_CLIENT_SECRET': '', 'YOUTUBE_API_KEY': ''}):
            result = tc.collect(now=NOW, fetchers={'naver_blog': fake_blog})
        self.assertIn('pf-curated-02', result['items'])
        self.assertEqual(result['items']['pf-curated-02']['naver_blog']['authors30'], 3)
        with mock.patch.object(tc, 'is_stale', return_value=False):
            body = self.client.get('/api/catalog/trend-signals/').json()
        self.assertEqual(body['items']['pf-curated-02']['naver_blog']['authors30'], 3)
        self.assertFalse(body['refreshing'])

    def test_api_without_keys_does_not_start_collection(self):
        with mock.patch.dict('os.environ', {'KAKAO_REST_API_KEY': '', 'NAVER_CLIENT_ID': '', 'NAVER_CLIENT_SECRET': '', 'YOUTUBE_API_KEY': ''}):
            body = self.client.get('/api/catalog/trend-signals/').json()
        self.assertEqual(body['configured'], {'kakao': False, 'naver': False, 'youtube': False})
        self.assertFalse(body['refreshing'])
        self.assertEqual(body['items'], {})

    def test_one_failing_source_does_not_stop_collection(self):
        def broken(q):
            raise TimeoutError('slow')
        result = tc.collect(now=NOW, fetchers={'naver_blog': broken, 'youtube': lambda q: [post('x', 1, title=q)]})
        self.assertTrue(result['errors'])
        self.assertIn('youtube', result['items']['pf-curated-01'])

    def test_stale_after_24_hours(self):
        self.assertTrue(tc.is_stale(None))
        fresh = {'collectedAt': (NOW - timedelta(hours=2)).isoformat()}
        old = {'collectedAt': (NOW - timedelta(hours=30)).isoformat()}
        self.assertFalse(tc.is_stale(fresh, NOW))
        self.assertTrue(tc.is_stale(old, NOW))

    def test_blog_root_counts_one_blog_once(self):
        self.assertEqual(tc.blog_root('https://blog.naver.com/abc/223'), 'blog.naver.com/abc')
        self.assertEqual(tc.blog_root('https://m.blog.naver.com/abc/999'), 'blog.naver.com/abc')
        self.assertEqual(tc.blog_root('https://foo.tistory.com/12'), 'foo.tistory.com')
        self.assertEqual(tc.blog_root('https://brunch.co.kr/@me/3'), 'brunch.co.kr/@me')

    def test_kakao_response_is_parsed_with_blog_as_author(self):
        fake = {'documents': [
            {'title': '<b>불닭</b> 콘치즈', 'contents': '', 'url': 'https://a.tistory.com/1', 'blogname': 'A', 'datetime': '2026-11-08T10:00:00.000+09:00'},
            {'title': '불닭 콘치즈 2', 'contents': '', 'url': 'https://a.tistory.com/2', 'blogname': 'A', 'datetime': '2026-11-07T10:00:00.000+09:00'},
            {'title': '불닭 콘치즈', 'contents': '', 'url': 'https://blog.naver.com/b/9', 'blogname': 'B', 'datetime': '2026-11-06T10:00:00.000+09:00'}]}
        with mock.patch.object(tc, '_get_json', return_value=fake) as get:
            posts = tc.fetch_kakao_blog('불닭 콘치즈')
        self.assertIn('KakaoAK', get.call_args[0][1]['Authorization'])
        self.assertEqual([p['author'] for p in posts], ['a.tistory.com', 'a.tistory.com', 'blog.naver.com/b'])
        self.assertEqual(tc.summarize('불닭 콘치즈', posts, NOW)['authors30'], 2)

    def test_naver_uses_api_hub_by_default(self):
        with mock.patch.object(tc, '_get_json', return_value={'items': []}) as get, \
             mock.patch.dict('os.environ', {'NAVER_API_LEGACY': '', 'NAVER_CLIENT_ID': 'id', 'NAVER_CLIENT_SECRET': 'x'}):
            tc.fetch_naver_blog('아샷추')
        url, headers = get.call_args[0]
        self.assertTrue(url.startswith('https://naverapihub.apigw.ntruss.com/search/v1/blog?'))
        self.assertIn('X-NCP-APIGW-API-KEY-ID', headers)
