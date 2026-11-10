# PICKFOO 작업 인수인계 (HANDOFF)

다른 AI(Codex, Claude)와 팀원이 번갈아 작업한다. **작업을 마칠 때마다 이 파일을 갱신한다.**
비밀번호, 비밀키, `.env` 값, DB 접속 주소, 토큰은 이 파일에 적지 않는다.

- 마지막 갱신: 2026-11-10 11:00 KST, Claude
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

## 5. DB 변경, 마이그레이션

- **DB 스키마 변경 없음, 새 마이그레이션 없음.** 포인트 제한은 기존 `PointEntry` 조회만 한다.
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
- [ ] SNS 조합 5~10개 수집(양식 `data/sns_trend_template.csv`) → `trend-candidates.json`에 추가 → 배포
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
