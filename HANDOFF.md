# PICKFOO 작업 인수인계 (HANDOFF)

다른 AI(Codex, Claude)와 팀원이 번갈아 작업한다. **작업을 마칠 때마다 이 파일을 갱신한다.**
비밀번호, 비밀키, `.env` 값, DB 접속 주소, 토큰은 이 파일에 적지 않는다.

- 마지막 갱신: 2026-11-10 15:35 KST, Claude
- 발표: 2026-11-11

---

## 1. 브랜치와 커밋

| 항목 | 값 |
| --- | --- |
| 작업 브랜치 | `main` (별도 브랜치 없음) |
| 코드 기준 커밋 | `329477c` 교수님 피드백 반영: 트렌드 점수, 배민 주문 연결, 선호 맛 개인화, 버그 수정 |
| 이 파일 추가 커밋 | 이 파일을 올린 커밋 (`git log -1 -- HANDOFF.md`로 확인) |
| 바로 이전 팀원 커밋 | `251eaba` Remove DB menu button and rename verified filter (rnjstngur) |

커밋 기록(최신순):

| 커밋 | 작성 | 내용 |
| --- | --- | --- |
| `329477c` | carygun(Claude 작업) | 최종본. `02fd7c2`에서 실수로 되돌린 팀원 `index.html` 변경(DB 메뉴 버튼 제거, "검증된 메뉴만 보기")을 복원 |
| `02fd7c2` | carygun(Claude 작업) | 구매 칸 통합, 뒤로가기, 로그인 이동, 포인트 하루 1회 제한. 이 커밋만 보면 팀원 `index.html` 변경이 빠져 있음 |
| `251eaba` | rnjstngur | DB 메뉴 버튼 제거, 검증 필터 이름 변경 |
| `0bbc183` | rnjstngur | 11/9 Claude 수정본(zip) 반영: 트렌드, 주문하기, 선호 맛 1차 |

## 2. 배포 상태 (Railway)

- 서비스: `pickfoo-web` (+ Postgres, `pickfoo-photos` 버킷), 주소 `https://pickfoo-web-production.up.railway.app`
- **11/10 10:3x에 Railway Source를 GitHub `rnjstngur/PICKFOO` `main`에 연결**했다. 그전에는 Source가 비어 있어 팀원 PC에서 CLI로 배포하던 구조였고, GitHub push가 서버에 반영되지 않았다.
- 연결 화면에 **"Auto deploy unavailable / Could not load branches"**가 떠 있다. GitHub push 시 자동 배포가 아직 안 된다. Railway GitHub 앱 권한을 저장소 주인(rnjstngur) 계정에서 허용해야 한다. 그전까지는 Railway에서 **Deploy 버튼을 눌러 수동 배포**한다.
- 2026-11-10 10:4x에 운영 서버에 `329477c` 내용이 반영된 것을 확인했다(아래 3-3).

## 3. 실제로 실행한 테스트와 결과

### 3-1. 프런트 단위 테스트 (클라우드 작업 환경)
- 명령: `node --test tests/*.test.cjs`
- 결과: **13개 통과, 0개 실패** (추천 8, 트렌드 5)

### 3-2. 화면 테스트 (클라우드, Playwright, 390px 모바일 크기, 백엔드 없이 정적 서버)
- 조합 상세에 구매 칸이 "🛒 이 조합 구매하기" 하나만 보이고, 기존 앱 열기 버튼(`.shopping-grid`)은 숨겨짐: 확인
- 버튼은 "🛵 배달의민족에서 주문하기" 하나: 확인
- 상세 → 뒤로가기 → 홈, 홈 → 마이 → 뒤로가기 → 홈: 확인
- 홈 "📈 트렌드 조합" 패널 표시, 가로 넘침 없음, 페이지 JS 오류 0건: 확인

### 3-3. 운영 서버 확인 (2026-11-10, 로그인하지 않은 상태, 읽기만)
- `index.html`에 `app.js?v=244`, `order-plan.js?v=244`, "검증된 메뉴만 보기" 포함: 확인
- 상세 화면 구매 칸 하나, 배민 버튼 하나, 뒤로가기 동작, 트렌드 패널: 확인
- 콘솔의 401 오류는 로그인하지 않아서 생긴 것으로, 정상 동작이다.
- 운영 DB에는 아무것도 쓰지 않았다(가입·리뷰·주문 없음).

### 3-4. 백엔드 테스트 (사용자 Windows PC, `DB_ENGINE=sqlite`)
- 명령: `manage.py test points catalog accounts` (임시 venv)
- 결과: 6개 발견. **새 테스트 `test_photo_reward_is_limited_to_once_per_day` 통과.**
- 기존 `test_photo_access_is_private_and_other_account_cannot_upload` 1개는 ERROR. Windows에서 임시 폴더를 지울 때 사진 파일이 아직 열려 있어서 `PermissionError [WinError 32]`가 남. 기능 실패가 아니라 테스트 정리 단계 문제로 보이지만, **Linux나 PostgreSQL에서 다시 확인하지 않았다.**
- catalog, accounts 앱에서는 테스트가 발견되지 않았다(6개 모두 points).
- PostgreSQL/MySQL 회귀 테스트는 하지 않았다.

### 3-4-1. 트렌드 수집기 테스트 (사용자 Windows PC, `DB_ENGINE=sqlite`, API 키 없이 가짜 응답)
- 명령: `manage.py test catalog.test_trend_collector points -v 2`
- 결과: **수집기 테스트 9개 모두 통과**(관련성 판정, 작성자 수 집계, 저장·API 응답, 키 없을 때 미수집, 한 출처 실패 시 계속, 24시간 갱신 판정, 블로그 단위 작성자, 카카오 응답 해석, 네이버 HUB 주소). points는 5개 통과 + 기존 Windows 임시 파일 오류 1개(3-4와 동일)
- 프런트: `node --test tests/*.test.cjs` **16개 통과**. 가짜 API 응답으로 390px 화면 확인(자동 수집 배지, 수집 시각, 기준 미달 메모, 오류 0건)
- **실제 카카오·네이버·유튜브 API 호출은 아직 한 번도 하지 않았다**(키 미설정)

### 3-5. Android 에뮬레이터 (2026-11-09, 서버 없이 www를 넣은 시연용 빌드)
- PICKFOO 버튼 → `baemin://search` → 배민 검색 화면(`SearchHomeActivity`) 열림: 확인
- `baemin://search?keyword=...`, `?query=...`: 앱은 열리지만 검색어 자동 입력 안 됨
- `coupangeats://search?keyword=...`: 앱 첫 화면만 열림 → 쿠팡이츠 버튼 제거
- 복사한 검색어를 배민 검색창에 붙여넣기: "붙여넣기" 메뉴는 뜨지만 자동 조작으로는 입력 확인 실패. **실기기에서 확인 필요.**

## 4. 변경한 기능과 파일 (구현 완료)

| 기능 | 파일 | 내용 |
| --- | --- | --- |
| 트렌드 점수 | `www/trend.js` (신규) | T = 0.6·E + 0.4·I. E = 10×0.5^(소개 후 일수/45), 120일 지나면 0 + "스테디". I = min(10, 2×최근 7일 서로 다른 평가자 수)×(평균 별점/5). 누적 좋아요는 쓰지 않음. 홈에 "📈 트렌드 조합" 패널(지금 트렌드/스테디 탭) |
| 외부 조합 후보 | `www/trend-candidates.json` (신규) | 실제 기사 보도일이 있는 후보 29개(기사 출처·날짜). 가격·판매 여부 확인 전으로 표시 |
| 출처 표시 | `www/trend-source.js` (신규) | 조합 상세에 출처 링크, 소개일, 트렌드 분류, 갱신 정책 문구 |
| 구매 칸 | `www/order-plan.js` (신규) | 기존 "구매하러 가기" 섹션 안에 "🛒 이 조합 구매하기"로 통합. 배민 버튼만 남김(`baemin://search` + 검색어 복사, 앱 안에서만 사용자 정의 scheme 사용). 재료 체크리스트, 상품 합계·배달비·최소주문금액·예산 계산, "주문 완료" 시간 기록(localStorage). 재료별 상품 링크(`product-links-db.js`)는 같은 섹션 아래 유지 |
| 추천 | `www/recommendation.js` | 선호 맛 +2점(P 최대 12, 혼합 시 0~10 환산). 평가 이력 유사도 = 브랜드 0.5 + 음식 0.3 + 맛 0.2(Jaccard). 맛은 이름·재료 키워드 규칙(`FLAVOR_RULES`)으로 추정. 알레르기 등록 시 재료 정보 없는 조합 제외. 저장 예산 초과 조합 제외 |
| 앱 연결 | `www/app.js` | `window.PICKFOO_APP`(recipe, recipes, selected, prefs) 노출. 평가 이력에 재료·이름 포함. **뒤로가기 버튼 수정**(화면 기록 스택, 기존 코드는 상세에서 같은 상세로 이동해 동작하지 않았음) |
| 로그인 이동 | `www/login-db.js` | 로그인 성공 → 취향 미설정이면 `preferences.html`, 아니면 `index.html` |
| 가입 이동 | `www/signup-db.js` | 가입 성공 → `login.html` (가입만으로는 세션이 만들어지지 않음) |
| 포인트 남용 방지 | `backend/points/services.py`, `backend/points/tests.py` | 사진 리뷰 적립은 사용자당 하루 1회(10P). 사용자 행 `select_for_update`로 동시 요청 방지. 테스트 1개 추가 |
| 스크립트 | `www/index.html` | 새 스크립트 3개, 캐시 버전 번호(app v244, order-plan v244, recommendation v243) |
| 테스트 | `tests/recommendation.test.cjs`, `tests/trend.test.cjs` | 추천 4개, 트렌드 5개 추가 |

### 4-1. SNS 트렌드 채택 기준 (2026-11-10 추가, 구현 완료 / 데이터는 아직 없음)
- 파일: `www/trend.js`, `tests/trend.test.cjs`(2개 추가, 총 15개 통과), `data/sns_trend_template.csv`(팀 수집 양식)
- 수집: 팀이 인스타그램·유튜브 쇼츠·틱톡·블로그에서 직접 찾아 양식에 기록 → `www/trend-candidates.json`에 추가. **자동 수집 아님**(인스타 약관상 스크래핑 불가, 공식 API는 비즈니스 계정·앱 심사 필요)
- 판정(코드): ① 공개 게시물 주소·게시일 ② 서로 다른 계정 3곳 이상 또는 한 게시물 반응 1,000 이상 ③ 재료·옵션 2개 이상 ④ 주류 제외. 하나라도 못 맞추면 목록 제외
- 점수: SNS 외부 최신성에 확산 가중치(3개 계정 이상 1.0, 반응 기준만 0.8)를 곱함
- 화면: 트렌드 패널에 "SNS 화제" 탭, 플랫폼·계정 수·반응·확인일·광고 표기·판매 확인 배지
- JSON 필드: `platform`(instagram/youtube/tiktok/blog), `sourceUrl`, `sourceDate`, `accounts`, `reactions`, `observedAt`, `sponsored`, `availability`(confirmed/unverified), `ingredients`
- **아직 SNS 데이터 0건** → "SNS 화제" 탭은 빈 상태 문구가 나온다

### 4-2. 트렌드 자동 수집기 (2026-11-10 추가, 구현 완료 / 운영 키 설정·실제 수집은 아직)
- 파일: `backend/catalog/trend_collector.py`, `backend/catalog/trend_views.py`, `backend/catalog/urls.py`(경로 1개 추가), `backend/catalog/management/commands/collect_trends.py`, `backend/catalog/test_trend_collector.py`, `www/trend.js`, `tests/trend.test.cjs`
- 출처: **공식 API만** 사용. 인스타그램·틱톡은 약관상 스크래핑 금지라 수집하지 않음
  - 카카오(Daum) 블로그 검색 `KAKAO_REST_API_KEY` — **권장**. 카카오 개발자 앱의 REST API 키, 카드 등록 불필요
  - 네이버 블로그 검색 `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET` — 2026-07-31부터 신규 발급은 NAVER API HUB(네이버 클라우드, 카드 등록 필요)에서만 가능. 코드는 HUB 주소(`naverapihub.apigw.ntruss.com/search/v1/blog`)가 기본, 예전 키면 `NAVER_API_LEGACY=1`
  - YouTube Data API v3 `YOUTUBE_API_KEY` — 선택
- 대상: 전시 조합 20개(`CURATED_QUERIES` 검색어) + `www/trend-candidates.json` 후보
- 판정: 제목·요약에 검색어 핵심 단어가 모두 있는 게시물만 셈(띄어쓰기 무시). 조합별 최근 30일·120일 서로 다른 작성자 수, 최신 게시일, 예시 3개
- 저장: DB가 아니라 기본 파일 저장소의 `trend/signals.json`(운영은 pickfoo-photos 버킷). 제목·주소·날짜·작성자 식별값만 저장, 본문 저장 안 함
- 주기: `GET /api/catalog/trend-signals/`가 결과가 24시간 넘게 지났으면 백그라운드로 한 번 다시 수집(프로세스별 잠금). 수동: `python manage.py collect_trends`
- 화면: 최근 30일 작성자 3명 이상이면 SNS 기준 통과 → "SNS 화제"에 "자동 수집" 배지로 표시. 미달이면 원래 출처 유지 + "네이버 블로그 최근 30일 n명(기준 3명 미만)" 메모. 패널에 마지막 수집 시각 표시
- 필요한 환경변수(값은 여기 적지 않음): 위 셋 중 하나 이상. 없으면 수집하지 않고 패널에 "API 키가 설정되지 않아" 표시
- 작성자 판단: 카카오 결과는 게시물 주소의 블로그 단위(`blog.naver.com/아이디`, `xxx.tistory.com` 등)로 같은 블로그를 한 명으로 셈
- 한계: 블로그 반응 수(공감)는 API에서 오지 않아 작성자 수로만 판단. 검색어가 일반적이면 다른 글이 섞일 수 있음. gunicorn 워커 2개라 동시에 두 번 수집될 수 있음(결과는 덮어씀)

## 5. DB 변경, 마이그레이션

- **DB 스키마 변경 없음, 새 마이그레이션 없음.** (트렌드 수집 결과도 DB가 아니라 파일 저장소에 저장) 포인트 제한은 기존 `PointEntry` 조회만 한다.
- 운영 DB에 데이터를 쓰거나 지우지 않았다.

## 6. 실행 방법

- 웹+API 로컬 실행: `backend/.env`가 필요하다(값은 팀원에게 따로 받는다). 그다음 `02_웹_Django_실행.bat` → `http://127.0.0.1:8000/index.html`
- 프런트 테스트: 저장소 루트에서 `node --test tests/*.test.cjs`
- 백엔드 테스트(SQLite): `cd backend` → 환경변수 `DB_ENGINE=sqlite`, `DJANGO_SECRET_KEY=<임의의 테스트 값>` → `python manage.py test points catalog accounts`
- 배포: Railway `pickfoo-web`에서 Deploy (자동 배포는 2절 문제가 해결된 뒤 가능)
- Android 앱: `capacitor.config.json`의 `server.url`이 Railway 주소라서, **서버만 배포하면 기존 APK에 반영된다.** APK 재빌드는 필요 없다.

## 7. 아직 안 되는 부분과 다음 할 일

### 확인 안 됨 (구현은 됨)
- [ ] 로그인한 상태의 운영 서버: 선호 맛 저장 → 추천 이유 "선호 맛 +2점" 표시, 로그인·가입 후 자동 이동
- [ ] 실기기(갤럭시): 배민 검색 화면에 복사한 검색어 붙여넣기
- [ ] 실제 배민 주문 → 배달까지 (촬영 필요)
- [ ] 백엔드 테스트를 Linux 또는 PostgreSQL에서 재실행 (Windows 임시 파일 오류 구분)

### 계획만 있음 (구현 안 됨)
- [ ] Railway GitHub 자동 배포: 저장소 주인이 Railway GitHub 앱 권한 허용
- [ ] Railway `pickfoo-web` Variables에 `KAKAO_REST_API_KEY`(또는 네이버 HUB 키) 추가 → 배포 → `/api/catalog/trend-signals/` 한 번 열어 수집 시작 → 결과 확인
- [ ] 실제 수집 결과에서 검색어가 엉뚱한 글을 세는 조합이 있는지 확인하고 `CURATED_QUERIES` 조정
- [ ] (선택) 팀 수동 SNS 후보: 양식 `data/sns_trend_template.csv` → `trend-candidates.json`
- [ ] 실제 사용자 평가 수집(5명 이상, 가짜 평가 금지) → 트렌드 "앱 반응" 점수와 최근 7일 순위 채우기
- [ ] 효과 측정: 3명이 "배민 직접 검색" vs "PICKFOO 버튼"으로 주문 화면까지 걸린 시간·검색 횟수
- [ ] 발표 자료·판넬: 구현/미구현 구분, 측정한 값만 사용
- [ ] Android 하드웨어 뒤로가기 버튼(앱 종료됨): `MainActivity` 수정 + APK 재빌드 필요. 발표 전에는 보류
- [ ] 다른 사용자의 개인 조합 리뷰: 개인 조합이 만든 사람에게만 보이는 구조라 서버 구조 변경 필요. 보류
- [ ] 배민 장바구니 자동 담기·결제: 공개 API 없음. 제휴 없이는 불가

## 8. 알려진 한계 (발표 때 정직하게 말할 것)
- 외부 트렌드는 팀이 기사를 확인하는 **수동 큐레이션**이다. 자동 크롤링이 아니다.
- 맛 특징은 키워드 규칙이다. 학습 모델이 아니다.
- 사진 리뷰는 구매 증명이 아니다.
- 배달비, 최소주문금액은 지점마다 달라서 사용자가 배달앱에서 확인한 값을 넣는다.
- 전시 조합 20개 중 소개일이 확인된 것은 4개(pf-curated-07, 09, 10, 12)뿐이다. 나머지는 "소개일 미확인"으로 표시된다.

## 9. 2026-11-10 오후 전체 점검 (Claude)

### 9-1. 점검 방법
- 운영 서버(읽기만, 로그인 안 함): 375px 모바일 크기로 전시 조합 20개 상세 화면을 모두 열고 닫기, 페이지 6개(index, login, signup, preferences, mypage, catalog) 로드, 공개 API, 콘솔 오류
- 로그인 기능: 사용자 PC에 **별도 시험 서버**(SQLite, 운영 DB와 무관)를 띄워 가입 → 로그인 → 취향 저장 → 맞춤 추천 → 평가 작성 → 이력·최근 7일 순위 반영 → 마이페이지 → 로그아웃 → 재로그인까지 직접 실행. 시험 계정·평가는 이 로컬 DB에만 있음

### 9-2. 정상 확인
- 운영: 최신 커밋 자동 배포됨(Railway Source 연결 후 자동 배포 동작), 20개 상세 모두 오류 없음·가로 넘침 없음, 뒤로가기, 재료별 상품 링크(불닭볶음면 CU·GS 2개), 트렌드 패널 3개 탭
- 로그인: 가입 후 로그인 화면 이동, 취향 미설정 로그인 → 취향 화면, 취향 설정 후 로그인 → 메인, "선호 맛(달콤한 맛) +2점" 추천 이유, 예산 7,000원 초과 제외, 평가 저장 → 평가 이력(재료 포함)·최근 7일 순위 반영, 마이페이지 취향 표시, 로그아웃(세션 해제)

### 9-3. 발견해서 고친 것 (커밋: 이 갱신과 같은 커밋)
| 문제 | 수정 | 파일 |
| --- | --- | --- |
| "맵지 않음"으로 저장해도 매운 조합이 맞춤 추천 3위에 나옴(매운맛이 가점만 있었음) | 저장한 단계보다 매운 조합은 맞춤 추천에서 제외 + 테스트 1개 | `www/recommendation.js`, `tests/recommendation.test.cjs` |
| 구매 칸에 원래 섹션의 "검색어 복사 · 위에서 원하는 앱을 열고" 안내가 남아 없는 버튼을 가리킴 | 구매 칸에는 주문 계획과 재료별 상품 링크만 남김 | `www/order-plan.js` |
| 스타벅스·써브웨이 조합에 "편의점 앱에서 검색하세요" 상품 링크 안내가 나옴 | 편의점 조합에서만 재료별 상품 링크 표시, 그 외는 "옵션 화면에서 선택" 안내 | `www/order-plan.js` |
| 아샷추가 보도일 있는 기사가 있는데 "외부 출처 없음"으로 표시 | 확인된 출처가 있으면 "외부 출처 확인" | `www/trend-source.js` |
| 취향 저장 후 같은 화면에 머묾 | 저장 후 메인으로 이동 | `www/preferences-db.js`, `www/preferences.html` |
| (캐시) | 스크립트 버전 v248 | `www/index.html` |

- 프런트 테스트 **17개 통과**. 수정본을 시험 서버에서 다시 열어 위 5가지 동작 확인

### 9-4. 아직 안 되는 것 / 확인 못 한 것
- **트렌드 자동 수집: API 키 미설정**(운영 `configured` 모두 false) → `KAKAO_REST_API_KEY` 넣어야 수집 시작. 실제 API 호출 결과는 아직 본 적 없음
- 앱 반응 점수는 평가 1건이면 0.8점이라, 최근 기사 후보(1.5점)들보다 낮아 "지금 트렌드" 상위 5개에 안 보임. 평가가 3명 이상 쌓여야 보임(최근 7일 평가 인기 섹션에는 바로 보임)
- 맞춤 추천은 정렬을 "내 취향 우선 (규칙)"으로 바꿔야 적용됨(기본은 "기본 순서"). 시연 때 직접 선택
- 마이페이지 "저장한 조합"은 "다음 개발 단계" 안내만 있음(미구현)
- ~~우리동네GS 상품 링크가 웹으로 열림~~ → 9-5에서 수정
- Android 하드웨어 뒤로가기, 다른 사용자 개인 조합 리뷰, 배민 자동 담기: 7절과 동일
- Railway에 실수로 생긴 별도 서비스 "PICKFOO"(Crashed) 삭제 여부 확인 필요. `pickfoo-web`은 유지

### 9-5. 우리동네GS 링크 수정 (2026-11-10 15:00)
- 원인: 저장된 GS 링크가 공유 단축주소 `https://abr.ge/코드`. 우리동네GS 앱(`com.gsr.gs25`)은 `https://ourgs.abr.ge`, `https://ourgs.airbridge.io`(둘 다 Android 검증 완료), `woodongs://link`만 앱 링크로 등록 → `abr.ge`는 크롬을 거쳐 이동
- 에뮬레이터 확인(adb): `ourgs.abr.ge/코드` → GS 앱 바로 실행, `woodongs://link` → GS 앱 실행, `abr.ge/코드` → 크롬 경유(첫 시도는 크롬 연결 오류)
- 수정: `www/product-links-db.js`가 GS 링크의 `abr.ge`를 화면 표시 때 `ourgs.abr.ge`로 바꿈(DB 값은 그대로). `index.html` v249
- 포켓CU 링크(`pocketcu.co.kr/deepLink/...`)는 크롬으로 열림. CU 앱의 검증 도메인은 `pocketcu.onelink.me`뿐이라 같은 방식으로 바꿀 수 없음. 미해결
- 남은 확인: 실기기에서 GS 링크가 상품 화면까지 가는지(에뮬레이터는 GS 앱 첫 실행 권한 화면까지만 확인)

### 9-6. 브랜드 필터 · 편의점 앱 버튼 · 구매 안내 문구 (2026-11-10 15:40, 구현 완료)
사용자가 앱에서 발견한 문제와 수정:
- **CU·GS25 브랜드를 고르면 조합이 0개** → 원인: 선정 조합 브랜드가 `편의점(CU·GS25 등)`이라 `CU`와 글자가 달라 걸러짐.
  - `www/app.js`: `brandMatches()` 추가. CU·GS25·세븐일레븐을 고르면 `편의점(...)` 공용 조합도 함께 보임. "편의점"은 그대로 전체 편의점.
  - `www/recommendation.js`: `sameBrand()`도 같은 규칙(선호 브랜드 CU → 공용 편의점 조합 +3점, 이력 유사도도 동일). `sameBrand`를 내보내고 테스트 추가.
- **"편의점" 브랜드 아이콘이 빈 네모(▣)** → 🛒로 변경.
- **불닭 말고는 GS·CU 연결이 없음** → 상품 공유 링크는 관리자가 앱에서 복사해 등록한 것만 있음(현재 까르보 불닭볶음면 1건). 가짜 링크는 만들지 않음.
  - `www/product-links-db.js`: 등록 링크가 없는 재료(또는 한쪽 앱만 등록된 재료)에 "🔎 우리동네GS 검색", "🔎 포켓CU 검색" 버튼 추가. 누르면 재료명 복사 후 `https://www.gsretail.com/` / `https://cu.bgfretail.com/` 이동 → Android 앱에서는 `MainActivity`가 각 앱(`com.gsr.gs25`, `com.bgfcu.membership`)을 실행(APK 재빌드 필요 없음, 기존 코드). 브랜드가 GS25면 GS만, CU면 CU만 표시.
  - 섹션 제목 "🛒 재료별 실제 상품 링크" → "🏪 편의점 앱에서 재료 사기".
- **구매 칸 문구가 이해 안 됨** → `www/order-plan.js` 문구 정리: 버튼 "🛵 배민에서 근처 CU 찾기", 붙여넣기 안내를 버튼 아래 💡 한 줄로, 번호(①~④) 대신 "✅ 담을 것 체크리스트", "💰 결제 금액 확인 (선택)" 소제목. 편의점 조합은 "배달은 배민, 직접 사러 가기·편의점 앱은 맨 아래" 두 경로를 첫 줄에 설명.
- `index.html` 버전: recommendation·app·order-plan·product-links-db `v250` (catalog-recommendation은 v231 유지).
- 테스트: `node --test tests/recommendation.test.cjs tests/trend.test.cjs` 18개 통과. Playwright(390px, 정적 서버, API 가짜 응답)로 CU/GS25/편의점 각각 8개 표시, 구매 칸·편의점 앱 버튼 화면 확인.
- 확인 안 됨: 실제 폰에서 "우리동네GS 검색"·"포켓CU 검색" 버튼이 각 앱을 여는지(코드 경로는 기존 `MainActivity` 매핑과 같음), 클립보드 붙여넣기.
- 남은 일(계획만): 재료별 실제 상품 링크를 더 등록하려면 관리자 화면(Django admin → Ingredient product links)에서 각 앱의 "공유" 링크를 붙여넣거나 CSV 가져오기. DB 변경·마이그레이션 없음.

### 9-7. 카카오 키 연결 · 첫 운영 수집 (2026-11-10 15:22, 실제 확인)
- 사용자가 Railway `pickfoo-web` Variables에 `KAKAO_REST_API_KEY`를 넣음(값은 기록하지 않음). `/api/catalog/trend-signals/` → `configured.kakao: true`.
- 첫 수집은 15:2x 재배포 때 백그라운드 스레드가 끊겨 실패 → 다시 호출해 `collectedAt 2026-11-10T15:22:31+09:00`, 33개 조합 수집 확인.
- 확인한 문제: 카카오 블로그 검색 결과 요약(contents)에 단어가 따로 들어간 맛집 글이 섞임(예: "불닭 콘치즈"에 낙곱새 맛집 글). 아샷추 50, 불닭 짜파게티 42 등 작성자 수가 부풀려짐.
- 수정(`backend/catalog/trend_collector.py` `is_relevant`): 제목에 핵심 단어가 모두 있을 때, 또는 요약에 단어가 붙은 한 덩어리(예: `불닭콘치즈`)로 나올 때만 관련 글로 인정. 테스트 1개 추가(`test_summary_only_counts_when_words_appear_together`).
- 한 단어 조합(아샷추·블루레몬에이드·불닭냉면 등)은 제목에 있을 때만 인정(카페 메뉴판 언급 제외). `RULE_VERSION = 3`.
- `RULE_VERSION` 추가: 저장된 결과의 `ruleVersion`이 다르면 24시간 전이라도 API 첫 요청 때 다시 수집. 그래서 배포 후 API를 한 번 열면 새 기준으로 다시 모임(자동).
- 주의: Railway 재배포 직후 실행 중이던 수집은 끊긴다. 발표 전에 마지막 배포 후 API를 한 번 열어 `collectedAt`이 채워졌는지 확인.

### 9-8. 편의점 재료 상품 링크 추가 (2026-11-10 18:10)
- 사용자가 폰의 우리동네GS·포켓CU 앱에서 직접 복사한 공유 링크 17개를 `data/product_links_2026-11-10.csv`로 정리(가져오기 형식: ingredient_name, provider, product_name, url, aliases, note, is_active).
  - 재료: 얼음컵, 복숭아 아이스티, 스파게티 컵라면, 소시지, 스트링치즈, 스위트콘, 모차렐라 치즈, 참치마요 삼각김밥(GS·CU 각 1), 육개장 컵라면(CU만, GS는 기존 등록).
- 반영 방법: 데이터 마이그레이션 `backend/catalog/migrations/0009_seed_product_links_1110.py`(DB 변경 있음: 행 추가만, 스키마 변경 없음). `get_or_create`라 같은 재료+판매처가 이미 있으면 건드리지 않음. 되돌리기 시 같은 URL 행만 삭제. 관리자 CSV 가져오기로 같은 파일을 올려도 됨.
- 알게 된 것: GS 공유 단축주소(abr.ge)는 `https://ourgs.airbridge.io/link?view=gs25DeliveryDetail&orderType=pickup&itemCode=<상품 바코드>`로 넘어감. 바코드만 알면 링크를 만들 수 있지만, 판매 여부를 확인할 수 없어 사용자 복사 링크만 등록함.
- 아직 없음: 컵떡볶이, 까르보 불닭볶음면, 슬라이스 치즈, 우유, 짜파게티, 블루레몬 에이드 음료, 사이다. 에스프레소 샷은 GS 픽업 상품이 없음(사용자 확인) → 검색 버튼으로 남김.
- 확인 안 됨: 운영 DB 업로드 후 앱 화면 표시, 폰에서 링크 열림. CU 링크는 여전히 크롬을 거쳐 앱으로 감.
