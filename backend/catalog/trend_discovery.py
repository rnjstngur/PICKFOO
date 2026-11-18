"""PICKFOO 신규 조합 자동 발견.

기존 조합 이름이 아니라 넓은 검색어(편의점 꿀조합, 스타벅스 커스텀 등)로 공식 검색 API를 매일 조회하고,
게시물 제목·요약에서 '새 조합 후보'를 규칙으로 뽑아 검토 대기 목록(DiscoveredCombo)에 쌓는다.

흐름
  1) 넓은 검색어로 수집(trend_collector의 카카오·네이버 수집 함수 재사용)
  2) 제목·요약에서 재료 추출
       - '불닭볶음면 + 스트링치즈 + 콘치즈'처럼 + 로 이어진 재료
       - '꿀조합·조합·레시피·커스텀' 글에서 재료 사전(INGREDIENT_WORDS)에 있는 재료가 2개 이상 나올 때
  3) 걸러내기: 재료 2개 미만, 술이 들어간 조합, 기존 20개 조합과 같은 재료 구성, 이미 제외한 후보
  4) 같은 재료 구성은 한 후보로 모으고 서로 다른 블로그 수를 센다
  5) 관리자가 Django 관리 화면에서 이름·재료·맵기·가격을 확인하고 승인하면 앱에 공개된다
     (승인 전·제외한 후보는 앱에 보이지 않는다)

실행: 트렌드 신호가 24시간마다 갱신될 때 함께 실행되고, `python manage.py discover_combos`로 직접 실행할 수도 있다.
저장 내용은 게시물 제목·주소·날짜·블로그 식별값뿐이며 본문은 저장하지 않는다.
"""
from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timedelta, timezone as dt_timezone
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction

from . import trend_collector as tc

log = logging.getLogger(__name__)

RUN_PATH = 'trend/discovery_last_run.json'
WINDOW_DAYS = 120          # 이보다 오래된 게시물은 후보로 보지 않는다
MAX_SAMPLES = 5
MAX_AUTHORS = 200

# 넓은 검색어 → 이 글에서 찾은 조합의 기본 브랜드
BROAD_QUERIES = {
    '편의점 꿀조합': '편의점(CU·GS25 등)',
    '편의점 신상 꿀조합': '편의점(CU·GS25 등)',
    'CU 꿀조합': 'CU',
    'GS25 꿀조합': 'GS25',
    '편의점 라면 꿀조합': '편의점(CU·GS25 등)',
    '스타벅스 커스텀 음료': '스타벅스',
    '스타벅스 프라푸치노 커스텀': '스타벅스',
    '써브웨이 꿀조합': '써브웨이',
    '서브웨이 추천 조합': '써브웨이',
}
BRAND_CATEGORY = {'스타벅스': '카페·디저트', '써브웨이': '샌드위치'}

# 재료 사전: 이 단어가 나오면 재료로 본다(긴 단어부터 맞춘다). 띄어쓰기는 무시한다.
INGREDIENT_WORDS = [
    # 라면·면
    '까르보불닭볶음면', '까르보불닭', '로제불닭', '치즈불닭', '불닭볶음면', '불닭', '짜파게티', '짜왕', '진라면', '신라면',
    '너구리', '안성탕면', '육개장사발면', '육개장', '왕뚜껑', '팔도비빔면', '비빔면', '스파게티컵라면', '컵라면', '라면',
    '컵떡볶이', '떡볶이', '우동',
    # 밥·간편식
    '참치마요삼각김밥', '삼각김밥', '참치마요', '주먹밥', '김밥', '컵밥', '즉석밥', '햇반', '도시락',
    # 치즈·유제품·계란
    '스트링치즈', '모짜렐라치즈', '모차렐라치즈', '슬라이스치즈', '체다치즈', '콘치즈', '치즈', '우유', '바나나우유',
    '초코우유', '딸기우유', '요거트', '요구르트', '계란', '구운계란', '맥반석계란',
    # 육가공·반찬
    '소시지', '비엔나', '후랑크', '핫바', '스팸', '참치캔', '참치', '닭가슴살', '베이컨', '햄', '만두', '어묵',
    # 채소·토핑·소스
    '스위트콘', '옥수수', '김치', '단무지', '양파', '할라피뇨', '마요네즈', '케찹', '칠리소스', '스리라차', '김가루',
    # 과자·디저트
    '포카칩', '감자칩', '새우깡', '꼬북칩', '빼빼로', '초코파이', '아이스크림', '메로나', '돼지바', '붕어싸만코',
    '빵빠레', '월드콘', '바닐라아이스크림',
    # 음료
    '복숭아아이스티', '아이스티', '에스프레소', '아메리카노', '얼음컵', '사이다', '콜라', '제로콜라', '탄산수', '토닉워터',
    '밀키스', '블루레몬에이드', '레몬에이드', '이온음료', '포카리스웨트', '요구르트음료', '두유', '식혜',
    # 스타벅스 커스텀
    '자바칩프라푸치노', '바닐라크림프라푸치노', '말차크림프라푸치노', '제주말차크림프라푸치노', '카라멜프라푸치노',
    '프라푸치노', '자바칩', '에스프레소샷', '샷추가', '바닐라시럽', '헤이즐넛시럽', '카라멜시럽', '초콜릿드리즐',
    '카라멜드리즐', '휘핑크림', '자몽허니블랙티', '돌체라떼', '콜드브루', '바닐라크림콜드브루',
    # 써브웨이
    '이탈리안비엠티', '에그마요', '스테이크앤치즈', '쉬림프', '치킨데리야끼', '스파이시이탈리안', '로티세리',
    '터키베이컨', '허니오트', '파마산오레가노', '플랫브레드', '랜치소스', '스위트어니언', '스모크바베큐', '핫칠리',
    '아보카도', '페퍼로니',
]
_WORDS = sorted({w for w in INGREDIENT_WORDS}, key=len, reverse=True)
# 사전 단어가 더 긴 단어의 일부일 때 짧은 쪽은 버린다(예: 까르보불닭볶음면 안의 불닭)
COMBO_HINTS = ('꿀조합', '조합', '레시피', '커스텀', '꿀팁', '만들기', '먹는법', '+', '＋')
ALCOHOL = ('소주', '맥주', '와인', '하이볼', '막걸리', '위스키', '칵테일', '사케', '보드카', '진토닉', '소맥', '술안주')
# + 로 이어진 조각에서 떼어낼 일반 단어
NOISE = ('편의점', '꿀조합', '조합', '레시피', '후기', '추천', '만들기', '먹기', '먹는법', '내돈내산', '솔직', '리뷰',
         '신상', '가격', '칼로리', '메뉴', '꿀팁', '최고', '존맛', '맛있는', '맛', '대박', 'cu', 'gs25', '세븐일레븐',
         '이마트24', '스타벅스', '스벅', '써브웨이', '서브웨이', '커스텀', '음료', '오늘', '야식', '간식', '점심', '저녁')
PLUS = re.compile(r'\s*[+＋]\s*')


def _clean(text: str) -> str:
    text = re.sub(r'<[^>]+>', '', text or '')
    text = re.sub(r'[\[\]【】()（）{}<>«»"“”\'‘’!?~·•|/:;,.…#@♥♡★☆❤️👍🔥]+', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


def norm(text: str) -> str:
    return re.sub(r'\s+', '', str(text or '')).lower()


def has_alcohol(*texts: str) -> bool:
    joined = norm(' '.join(texts))
    return any(word in joined for word in ALCOHOL)


def dictionary_ingredients(text: str) -> list[str]:
    """사전 단어를 긴 것부터 찾아 등장 순서대로 돌려준다. 이미 찾은 긴 단어 안의 짧은 단어는 빼다."""
    s = norm(text)
    taken = [False] * len(s)
    found = []
    for word in _WORDS:
        start = 0
        while True:
            i = s.find(word, start)
            if i < 0:
                break
            if not any(taken[i:i + len(word)]):
                for k in range(i, i + len(word)):
                    taken[k] = True
                found.append((i, word))
            start = i + 1
    seen, out = set(), []
    for _, word in sorted(found):
        if word not in seen:
            seen.add(word)
            out.append(word)
    return out


def _strip_noise(part: str) -> str:
    words = [w for w in part.split() if norm(w) not in NOISE and not re.fullmatch(r'[\d\W_]+', w)]
    return ' '.join(words).strip()


def plus_ingredients(text: str) -> list[str]:
    """'A + B + C' 형태에서 재료를 뽑는다. 첫 조각은 마지막 단어 쪽, 끝 조각은 첫 단어 쪽만 쓴다."""
    text = _clean(text)
    best: list[str] = []
    for seg in re.split(r'\s[-–—]\s|\s{2,}|[=＝→]', text):
        if not PLUS.search(seg):
            continue
        parts = [p for p in PLUS.split(seg) if p.strip()]
        if len(parts) < 2:
            continue
        items = []
        for idx, raw in enumerate(parts):
            words = _strip_noise(raw).split()
            if not words:
                continue
            if idx == 0:
                words = words[-2:]
            elif idx == len(parts) - 1:
                words = words[:2]
            item = ' '.join(words)
            # 사전 단어가 들어 있으면 그 단어로 맞춘다(예: '편의점 불닭볶음면 큰컵' → 불닭볶음면)
            hit = dictionary_ingredients(item)
            if len(hit) == 1 and norm(item) != hit[0]:
                item = hit[0]
            if 2 <= len(norm(item)) <= 15:
                items.append(item)
        if len(items) > len(best):
            best = items
    return best[:6]


def extract(title: str, summary: str = '') -> list[str]:
    """게시물 하나에서 조합 재료 목록을 뽑는다. 조합으로 보기 어려우면 빈 목록."""
    if has_alcohol(title):
        return []
    items = plus_ingredients(title)
    if len({norm(x) for x in items}) >= 2:
        return _dedupe(items)
    head = norm(title)
    if any(h in head for h in COMBO_HINTS):
        found = dictionary_ingredients(title)
        if len(found) >= 2:
            return found[:6]
        # 제목에 1개뿐이면 요약에서 + 표기를 한 번 더 본다
        items = plus_ingredients(summary)
        if len({norm(x) for x in items}) >= 2 and not has_alcohol(summary):
            return _dedupe(items)
    return []


def _dedupe(items: list[str]) -> list[str]:
    seen, out = set(), []
    for x in items:
        k = norm(x)
        if k and k not in seen:
            seen.add(k)
            out.append(x)
    return out


def dedupe_key(ingredients: list[str]) -> str:
    return '|'.join(sorted({norm(x) for x in ingredients if norm(x)}))[:300]


def _known_sets() -> list[set[str]]:
    path = Path(settings.BASE_DIR) / 'catalog_data' / 'curated_ingredients.json'
    try:
        rows = json.loads(path.read_text(encoding='utf-8'))
    except Exception:
        return []
    out = []
    for row in rows:
        words = set()
        for ing in row.get('ingredients', []):
            words |= {norm(w) for w in dictionary_ingredients(ing)} or {norm(ing)}
        out.append(words)
    return out


def is_existing(ingredients: list[str], known: list[set[str]]) -> bool:
    """기존 조합과 재료 구성이 거의 같으면(자카드 0.75 이상) 새 조합이 아니다."""
    cand = {norm(x) for x in ingredients}
    for words in known:
        if not words:
            continue
        inter = len(cand & words)
        if inter and inter / len(cand | words) >= 0.75:
            return True
    return False


def _brand_for(query_brand: str, text: str) -> str:
    t = norm(text)
    if '스타벅스' in t or '스벅' in t:
        return '스타벅스'
    if '써브웨이' in t or '서브웨이' in t:
        return '써브웨이'
    if 'gs25' in t:
        return 'GS25'
    if re.search(r'(^|[^a-z])cu', t):
        return 'CU'
    return query_brand


def find_candidates(posts_by_query: dict[str, list[dict]], now: datetime) -> dict[str, dict]:
    """검색어별 게시물에서 후보를 모은다. key는 재료 구성(dedupe_key)."""
    today = (now + timedelta(hours=9)).date()
    oldest = today - timedelta(days=WINDOW_DAYS)
    known = _known_sets()
    found: dict[str, dict] = {}
    for query, posts in posts_by_query.items():
        for p in posts:
            try:
                day = datetime.strptime(p.get('date', ''), '%Y-%m-%d').date()
            except ValueError:
                continue
            if day < oldest or day > today:
                continue
            ingredients = extract(p.get('title', ''), p.get('summary', ''))
            if len(ingredients) < 2 or is_existing(ingredients, known):
                continue
            key = dedupe_key(ingredients)
            c = found.setdefault(key, {
                'dedupe_key': key, 'ingredients': ingredients, 'name': ' + '.join(ingredients),
                'brand': _brand_for(BROAD_QUERIES.get(query, '편의점(CU·GS25 등)'), p.get('title', '')),
                'authors': set(), 'samples': [], 'queries': set(), 'first': day, 'last': day,
            })
            c['authors'].add(p.get('author') or p.get('url'))
            c['queries'].add(query)
            c['first'] = min(c['first'], day)
            c['last'] = max(c['last'], day)
            if p.get('url') and all(s['url'] != p['url'] for s in c['samples']):
                c['samples'].append({'title': _clean(p.get('title', ''))[:120], 'url': p['url'], 'date': day.isoformat()})
    for c in found.values():
        c['samples'].sort(key=lambda s: s['date'], reverse=True)
    return found


@transaction.atomic
def save_candidates(found: dict[str, dict]) -> dict:
    """후보를 DB에 반영한다. 승인·제외한 후보의 상태와 관리자가 고친 이름·재료는 건드리지 않는다."""
    from .discovery_models import DiscoveredCombo
    stats = {'new': 0, 'updated': 0, 'skipped_rejected': 0}
    for key, c in found.items():
        row = DiscoveredCombo.objects.select_for_update().filter(dedupe_key=key).first()
        if row is None:
            DiscoveredCombo.objects.create(
                dedupe_key=key, name=c['name'][:150], brand=c['brand'],
                category=BRAND_CATEGORY.get(c['brand'], '편의점 간편식'),
                ingredients=c['ingredients'], authors=sorted(c['authors'])[:MAX_AUTHORS],
                mention_count=len(c['authors']), samples=c['samples'][:MAX_SAMPLES],
                queries=sorted(c['queries']), first_seen_date=c['first'], last_seen_date=c['last'],
            )
            stats['new'] += 1
            continue
        if row.status == DiscoveredCombo.STATUS_REJECTED:
            stats['skipped_rejected'] += 1
        authors = sorted(set(row.authors or []) | c['authors'])[:MAX_AUTHORS]
        samples = list(row.samples or [])
        for s in c['samples']:
            if all(x.get('url') != s['url'] for x in samples):
                samples.append(s)
        samples.sort(key=lambda s: s.get('date', ''), reverse=True)
        row.authors = authors
        row.mention_count = len(authors)
        row.samples = samples[:MAX_SAMPLES]
        row.queries = sorted(set(row.queries or []) | c['queries'])
        row.first_seen_date = min(filter(None, [row.first_seen_date, c['first']]))
        row.last_seen_date = max(filter(None, [row.last_seen_date, c['last']]))
        row.save(update_fields=['authors', 'mention_count', 'samples', 'queries',
                                'first_seen_date', 'last_seen_date', 'updated_at'])
        stats['updated'] += 1
    return stats


def run(now: datetime | None = None, fetchers: dict | None = None) -> dict:
    """넓은 검색어로 수집해 후보를 저장하고 실행 기록을 남긴다. fetchers는 테스트용 가짜 API."""
    now = now or datetime.now(dt_timezone.utc)
    conf = tc.configured()
    fetchers = fetchers or {}
    use = {
        'kakao_blog': fetchers.get('kakao_blog') or (tc.fetch_kakao_blog if conf['kakao'] else None),
        'naver_blog': fetchers.get('naver_blog') or (tc.fetch_naver_blog if conf['naver'] else None),
    }
    posts_by_query: dict[str, list[dict]] = {q: [] for q in BROAD_QUERIES}
    errors = []
    for query in BROAD_QUERIES:
        for source, fn in use.items():
            if not fn:
                continue
            try:
                posts_by_query[query].extend(fn(query))
            except Exception as exc:  # 한 검색어 실패가 전체를 멈추지 않게 한다
                errors.append(f'{query}/{source}: {type(exc).__name__}')
    found = find_candidates(posts_by_query, now)
    stats = save_candidates(found)
    record = {
        'ranAt': now.astimezone(tc.KST).isoformat(timespec='seconds'),
        'sources': [s for s, fn in use.items() if fn],
        'queries': list(BROAD_QUERIES),
        'posts': sum(len(v) for v in posts_by_query.values()),
        'candidates': len(found), **stats, 'errors': errors[:30],
    }
    try:
        if default_storage.exists(RUN_PATH):
            default_storage.delete(RUN_PATH)
        default_storage.save(RUN_PATH, ContentFile(json.dumps(record, ensure_ascii=False).encode('utf-8')))
    except Exception:
        log.exception('신규 조합 발견 실행 기록을 저장하지 못했습니다.')
    return record


def last_run() -> dict | None:
    try:
        if not default_storage.exists(RUN_PATH):
            return None
        with default_storage.open(RUN_PATH, 'rb') as fh:
            return json.loads(fh.read().decode('utf-8'))
    except Exception:
        return None
