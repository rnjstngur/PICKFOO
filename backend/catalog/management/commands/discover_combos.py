"""신규 조합 후보 수집: python manage.py discover_combos
Railway 예약 작업(Cron)이나 작업 스케줄러에 하루 한 번 걸어 두면 된다.
웹 서버도 트렌드 신호를 24시간마다 갱신할 때 함께 실행한다."""
from django.core.management.base import BaseCommand

from catalog import trend_collector, trend_discovery


class Command(BaseCommand):
    help = '넓은 검색어로 블로그를 검색해 신규 조합 후보를 검토 대기 목록에 쌓습니다.'

    def handle(self, *args, **options):
        if not any(trend_collector.configured().values()):
            self.stdout.write(self.style.WARNING('검색 API 키(KAKAO_REST_API_KEY 등)가 없어 수집하지 않았습니다.'))
            return
        r = trend_discovery.run()
        self.stdout.write(self.style.SUCCESS(
            f"게시물 {r['posts']}개 확인 · 후보 {r['candidates']}개(새 후보 {r['new']}개, 갱신 {r['updated']}개)"))
        for err in r['errors']:
            self.stdout.write(self.style.WARNING(err))
