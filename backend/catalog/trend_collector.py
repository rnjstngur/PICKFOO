"""PICKFOO 트렌드 자동 수집기.

공식 검색 API만 사용한다(약관상 스크래핑이 금지된 인스타그램·틱톡은 수집하지 않는다).
  - 네이버 검색 API: 블로그 (환경변수 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET)
  - YouTube Data API v3: 동영상·쇼츠 (환경변수 YOUTUBE_API_KEY)

조합마다 최근 게시물을 검색해, 제목·요약에 조합 이름의 단어가 모두 들어간 게시물만 센다.
결과는 기본 파일 저장소(운영: pickfoo-photos 버킷, 로컬: backend/media)에 JSON 한 개로 저장한다.
DB 테이블을 추가하지 않으므로 마이그레이션이 필요 없다.

저장 내용은 게시물 제목·주소·날짜·작성자(블로그/채널) 식별값뿐이다. 본문은 저장하지 않는다.
"""
from __future__ import annotations

import html
import json
import logging
import os
import re
import threading
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone as dt_timezone
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

log = logging.getLogger(__name__)

SIGNALS_PATH = 'trend/signals.json'
STALE_HOURS = 24          # 이 시간이 지나면 다음 조회 때 자동으로 다시 수집한다
WINDOW_DAYS = 120         # 트렌드 판단 기간(프런트 RECENT_DAYS와 동일)
SPREAD_DAYS = 30          # '서로 다른 작성자 수'를 세는 최근 기간
SAMPLE_COUNT = 3
HTTP_TIMEOUT = 8
KST = dt_timezone(timedelta(hours=9))

# 전시 조합 검색어. 써브웨이 조합은 이름만으로는 다른 글이 섞여 브랜드를 붙인다.
CURATED_QUERIES = {
    'pf-curated-01': '마크정식',
    'pf-curated-02': '불닭 콘치즈',
    'pf-curated-03': '불닭 치즈볶음밥',
    'pf-curated-04': '까르보불닭 치즈',
    'pf-curated-05': '불닭 짜파게티',
    'pf-curated-06': '참치마요 라면',
    'pf-curated-07': '아샷추',
    'pf-curated-08': '블루레몬에이드',
    'pf-curated-09': '돼지바 프라푸치노',
    'pf-curated-10': '슈렉 프라푸치노',
    'pf-curated-11': '쿠앤크 프라푸치노',
    'pf-curated-12': '고디바 프라푸치노',
    'pf-curated-13': '버터비어 프라푸치노',
    'pf-curated-14': '초코나무숲 프라푸치노',
    'pf-curated-15': '써브웨이 이탈리안비엠티 꿀조합',
    'pf-curated-16': '써브웨이 에그마요 베이컨',
    'pf-curated-17': '써브웨이 스테이크 치즈 꿀조합',
    'pf-curated-18': '써브웨이 쉬림프 에그마요',
    'pf-curated-19': '써브웨이 치킨데리야끼 꿀조합',
    'pf-curated-20': '써브웨이 스파이시 이탈리안 꿀조합',
}
# 관련성 판단에서 빼는 일반 단어
STOP_WORDS = {'조합', '꿀조합', '버전', '편의점', '레시피'}

_refresh_lock = threading.Lock()


def configured() -> dict:
    return {
        'naver': bool(os.getenv('NAVER_CLIENT_ID') and os.getenv('NAVER_CLIENT_SECRET')),
        'youtube': bool(os.getenv('YOUTUBE_API_KEY')),
    }


def _norm(text: str) -> str:
    text = re.sub(r'<[^>]+>', '', html.unescape(text or ''))
    return re.sub(r'\s+', '', text).lower()


def tokens_for(query: str) -> list[str]:
    return [t.lower() for t in query.split() if t and t not in STOP_WORDS]


def is_relevant(query: str, *texts: str) -> bool:
    """검색어의 핵심 단어가 제목·요약에 모두 들어 있어야 관련 게시물로 본다(띄어쓰기 무시)."""
    body = _norm(' '.join(texts))
    toks = tokens_for(query)
    return bool(toks) and all(t.replace(' ', '') in body for t in toks)


def combos() -> list[dict]:
    """수집 대상: 전시 조합 20개 + 출처 날짜가 있는 외부 후보(www/trend-candidates.json)."""
    items = []
    seed = Path(settings.BASE_DIR) / 'catalog_data' / 'curated_combos.json'
    for row in json.loads(seed.read_text(encoding='utf-8')):
        items.append({'key': row['key'], 'name': row['name'],
                      'query': CURATED_QUERIES.get(row['key'], row['name'])})
    cand = Path(settings.PROJECT_DIR) / 'www' / 'trend-candidates.json'
    if cand.exists():
        for row in json.loads(cand.read_text(encoding='utf-8')):
            if row.get('id') and row.get('name'):
                items.append({'key': row['id'], 'name': row['name'], 'query': row['name']})
    return items


def _get_json(url: str, headers: dict | None = None) -> dict:
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:  # noqa: S310 (fixed https hosts)
        return json.loads(resp.read().decode('utf-8'))


def fetch_naver_blog(query: str) -> list[dict]:
    url = 'https://openapi.naver.com/v1/search/blog.json?' + urllib.parse.urlencode(
        {'query': query, 'display': 100, 'sort': 'date'})
    data = _get_json(url, {'X-Naver-Client-Id': os.getenv('NAVER_CLIENT_ID', ''),
                           'X-Naver-Client-Secret': os.getenv('NAVER_CLIENT_SECRET', '')})
    posts = []
    for it in data.get('items', []):
        d = str(it.get('postdate') or '')
        if not re.fullmatch(r'\d{8}', d):
            continue
        posts.append({'title': re.sub(r'<[^>]+>', '', html.unescape(it.get('title', ''))),
                      'summary': it.get('description', ''),
                      'url': it.get('link', ''),
                      'author': it.get('bloggerlink') or it.get('bloggername') or '',
                      'date': f'{d[:4]}-{d[4:6]}-{d[6:]}'})
    return posts


def fetch_youtube(query: str, now: datetime) -> list[dict]:
    after = (now - timedelta(days=WINDOW_DAYS)).astimezone(dt_timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    url = 'https://www.googleapis.com/youtube/v3/search?' + urllib.parse.urlencode(
        {'part': 'snippet', 'q': query, 'type': 'video', 'order': 'date', 'maxResults': 50,
         'publishedAfter': after, 'regionCode': 'KR', 'relevanceLanguage': 'ko',
         'key': os.getenv('YOUTUBE_API_KEY', '')})
    data = _get_json(url)
    posts = []
    for it in data.get('items', []):
        sn = it.get('snippet') or {}
        vid = (it.get('id') or {}).get('videoId')
        published = str(sn.get('publishedAt') or '')[:10]
        if not vid or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', published):
            continue
        posts.append({'title': html.unescape(sn.get('title', '')), 'summary': sn.get('description', ''),
                      'url': f'https://www.youtube.com/watch?v={vid}', 'author': sn.get('channelId', ''),
                      'date': published})
    return posts


def summarize(query: str, posts: list[dict], now: datetime) -> dict | None:
    """관련 게시물만 남겨 최근 30일·120일 서로 다른 작성자 수, 최신 게시일, 예시 3개를 만든다."""
    today = now.astimezone(KST).date()
    rel = []
    for p in posts:
        try:
            age = (today - datetime.strptime(p['date'], '%Y-%m-%d').date()).days
        except ValueError:
            continue
        if 0 <= age <= WINDOW_DAYS and p.get('author') and is_relevant(query, p['title'], p.get('summary', '')):
            rel.append({**p, 'age': age})
    if not rel:
        return None
    rel.sort(key=lambda p: p['age'])
    return {
        'authors30': len({p['author'] for p in rel if p['age'] <= SPREAD_DAYS}),
        'authors120': len({p['author'] for p in rel}),
        'posts120': len(rel),
        'latest': rel[0]['date'],
        'samples': [{'title': p['title'][:120], 'url': p['url'], 'date': p['date']} for p in rel[:SAMPLE_COUNT]],
    }


def collect(now: datetime | None = None, fetchers: dict | None = None) -> dict:
    """모든 조합을 수집해 저장소에 저장하고 결과를 돌려준다. fetchers는 테스트에서 가짜 API로 바꿀 때 쓴다."""
    now = now or datetime.now(dt_timezone.utc)
    conf = configured()
    fetchers = fetchers or {}
    use = {
        'naver_blog': fetchers.get('naver_blog') or (fetch_naver_blog if conf['naver'] else None),
        'youtube': fetchers.get('youtube') or ((lambda q: fetch_youtube(q, now)) if conf['youtube'] else None),
    }
    items, errors = {}, []
    for combo in combos():
        row = {'key': combo['key'], 'name': combo['name'], 'query': combo['query']}
        for source, fn in use.items():
            if not fn:
                continue
            try:
                summary = summarize(combo['query'], fn(combo['query']), now)
            except Exception as exc:  # 한 조합·한 출처 실패가 전체 수집을 멈추지 않게 한다
                errors.append(f"{combo['key']}/{source}: {type(exc).__name__}")
                continue
            if summary:
                row[source] = summary
        if len(row) > 3:
            items[combo['key']] = row
    result = {
        'collectedAt': now.astimezone(KST).isoformat(timespec='seconds'),
        'sources': [s for s, fn in use.items() if fn],
        'windowDays': WINDOW_DAYS, 'spreadDays': SPREAD_DAYS,
        'items': items, 'errors': errors[:50],
    }
    save(result)
    return result


def save(result: dict) -> None:
    if default_storage.exists(SIGNALS_PATH):
        default_storage.delete(SIGNALS_PATH)
    default_storage.save(SIGNALS_PATH, ContentFile(json.dumps(result, ensure_ascii=False).encode('utf-8')))


def load() -> dict | None:
    try:
        if not default_storage.exists(SIGNALS_PATH):
            return None
        with default_storage.open(SIGNALS_PATH, 'rb') as fh:
            return json.loads(fh.read().decode('utf-8'))
    except Exception:
        log.exception('트렌드 신호 파일을 읽지 못했습니다.')
        return None


def is_stale(result: dict | None, now: datetime | None = None) -> bool:
    if not result or not result.get('collectedAt'):
        return True
    now = now or datetime.now(dt_timezone.utc)
    try:
        at = datetime.fromisoformat(result['collectedAt'])
    except ValueError:
        return True
    return now - at > timedelta(hours=STALE_HOURS)


def refresh_in_background() -> bool:
    """오래된 결과면 백그라운드에서 한 번만 다시 수집한다. 이미 수집 중이면 아무것도 하지 않는다."""
    if not any(configured().values()) or not _refresh_lock.acquire(blocking=False):
        return False

    def run():
        try:
            collect()
        except Exception:
            log.exception('트렌드 자동 수집 실패')
        finally:
            _refresh_lock.release()

    threading.Thread(target=run, name='pickfoo-trend-collect', daemon=True).start()
    return True
