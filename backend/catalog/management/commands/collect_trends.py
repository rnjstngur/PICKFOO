"""트렌드 신호를 지금 바로 수집한다. 예약 실행(Railway Cron 등)에도 이 명령을 쓴다.

    python manage.py collect_trends
"""
from django.core.management.base import BaseCommand

from catalog import trend_collector


class Command(BaseCommand):
    help = '네이버 블로그·유튜브 공식 API로 조합별 최근 게시물을 수집해 트렌드 신호 파일을 갱신합니다.'

    def handle(self, *args, **options):
        conf = trend_collector.configured()
        if not any(conf.values()):
            self.stderr.write('API 키가 없습니다. NAVER_CLIENT_ID/NAVER_CLIENT_SECRET 또는 YOUTUBE_API_KEY를 설정하세요.')
            return
        result = trend_collector.collect()
        items = result['items']
        self.stdout.write(f"수집 완료 {result['collectedAt']} · 출처 {', '.join(result['sources'])} · 신호 있는 조합 {len(items)}개")
        for key, row in sorted(items.items()):
            parts = []
            for src in ('naver_blog', 'youtube'):
                if src in row:
                    s = row[src]
                    parts.append(f"{src} 30일 {s['authors30']}명/120일 {s['authors120']}명 최신 {s['latest']}")
            self.stdout.write(f"  {key} {row['name']}: " + ' | '.join(parts))
        for err in result['errors']:
            self.stderr.write('  오류 ' + err)
