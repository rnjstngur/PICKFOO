/* PICKFOO_STEP233_VERIFICATION */
/* PICKFOO_STEP235_PERSONAL_HISTORY */
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  // 오프라인 시연: 외부 Supabase SDK가 없어도 전체 UI를 사용할 수 있습니다.
  const STORE = 'pickfoo_demo_v3';
const initialRecipes = [
  {
    "id": "pf-curated-01",
    "name": "마크정식",
    "brand": "편의점(CU·GS25 등)",
    "category": "편의점 간편식",
    "price": 8000,
    "spicy": 2,
    "emoji": "🍜",
    "color": "#FBE5D6",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "컵떡볶이",
      "스파게티 컵라면",
      "소시지",
      "스트링치즈"
    ],
    "steps": [
      "떡볶이와 컵라면을 각각 포장 안내대로 조리해요.",
      "면과 떡볶이를 섞어요.",
      "소시지와 치즈를 더해 마무리해요."
    ],
    "desc": "SNS에서 널리 알려진 편의점 대표 조합. 떡볶이의 매콤달콤함에 치즈 풍미를 더해요.",
    "sourceNote": "https://pyeonchemi.cloud/combo/mark-jeongsik/"
  },
  {
    "id": "pf-curated-02",
    "name": "불닭 콘치즈",
    "brand": "편의점(CU·GS25 등)",
    "category": "편의점 간편식",
    "price": 6500,
    "spicy": 2,
    "emoji": "🌽",
    "color": "#FCE8D0",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "불닭볶음면",
      "스위트콘",
      "모차렐라 치즈"
    ],
    "steps": [
      "불닭볶음면을 포장 안내대로 조리해요.",
      "물기 뺀 콘과 치즈를 얹어요.",
      "치즈가 녹도록 데워 섞어 먹어요."
    ],
    "desc": "불닭의 매콤함과 콘치즈의 달콤고소함이 어우러지는 조합.",
    "sourceNote": "https://v.daum.net/v/9xXKTFVZjk"
  },
  {
    "id": "pf-curated-03",
    "name": "불닭 치즈볶음밥",
    "brand": "편의점(CU·GS25 등)",
    "category": "편의점 간편식",
    "price": 6500,
    "spicy": 2,
    "emoji": "🍚",
    "color": "#FCE3D5",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "불닭볶음면",
      "참치마요 삼각김밥",
      "슬라이스 치즈"
    ],
    "steps": [
      "불닭볶음면을 조리한 뒤 면을 먹기 좋게 자르세요.",
      "삼각김밥을 풀어 면과 섞어요.",
      "치즈를 얹어 따뜻하게 마무리해요."
    ],
    "desc": "불닭 소스에 삼각김밥과 치즈를 더한 든든한 응용 조합.",
    "sourceNote": "편의점 재료 응용 레시피(개별 SNS 유행 확인 필요)"
  },
  {
    "id": "pf-curated-04",
    "name": "까르보 불닭 치즈라면",
    "brand": "편의점(CU·GS25 등)",
    "category": "편의점 간편식",
    "price": 6200,
    "spicy": 1,
    "emoji": "🧀",
    "color": "#FAEBD7",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "까르보 불닭볶음면",
      "우유",
      "슬라이스 치즈"
    ],
    "steps": [
      "까르보 불닭볶음면을 포장 안내대로 조리해요.",
      "물 대신 우유를 소량 곁들여 소스를 부드럽게 만들어요.",
      "치즈를 넣어 섞어요."
    ],
    "desc": "크리미한 우유와 치즈가 매운맛을 부드럽게 하는 조합.",
    "sourceNote": "불닭 커스텀 응용 레시피(주문/재고 확인 필요)"
  },
  {
    "id": "pf-curated-05",
    "name": "불닭 짜파게티",
    "brand": "편의점(CU·GS25 등)",
    "category": "편의점 간편식",
    "price": 4000,
    "spicy": 2,
    "emoji": "🍝",
    "color": "#F8DFD3",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "짜파게티",
      "불닭볶음면"
    ],
    "steps": [
      "두 면을 제품 안내대로 익혀요.",
      "물기를 조절한 뒤 양쪽 소스를 취향에 맞게 섞어요.",
      "잘 비벼 나눠 먹어요."
    ],
    "desc": "짜장 풍미와 불닭의 매콤함을 한 번에 즐기는 조합.",
    "sourceNote": "편의점 면 혼합 응용 레시피(개별 SNS 유행 확인 필요)"
  },
  {
    "id": "pf-curated-06",
    "name": "참치마요 라면정식",
    "brand": "편의점(CU·GS25 등)",
    "category": "편의점 간편식",
    "price": 3800,
    "spicy": 1,
    "emoji": "🍙",
    "color": "#F8EBDC",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "참치마요 삼각김밥",
      "육개장 컵라면"
    ],
    "steps": [
      "육개장 컵라면을 안내대로 익혀요.",
      "참치마요 삼각김밥을 곁들여 먹어요.",
      "취향에 따라 김밥을 소량 국물에 적셔요."
    ],
    "desc": "얼큰한 라면과 고소한 참치마요를 함께 즐기는 간편식.",
    "sourceNote": "편의점 조합 응용 레시피(개별 SNS 유행 확인 필요)"
  },
  {
    "id": "pf-curated-07",
    "name": "아샷추 편의점 버전",
    "brand": "편의점(CU·GS25 등)",
    "category": "카페·음료",
    "price": 4500,
    "spicy": 0,
    "emoji": "🧋",
    "color": "#E9E4F3",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "복숭아 아이스티",
      "에스프레소 샷",
      "얼음컵"
    ],
    "steps": [
      "얼음컵에 복숭아 아이스티를 부어요.",
      "식힌 에스프레소 샷을 소량 더해요.",
      "충분히 저어 마셔요."
    ],
    "desc": "복숭아 아이스티의 단맛과 커피 쌉싸름함을 함께 즐기는 아샷추 변형.",
    "sourceNote": "아샷추 널리 알려진 음료 조합; 제품별 샷 판매 여부 확인"
  },
  {
    "id": "pf-curated-08",
    "name": "블루레몬 에이드",
    "brand": "편의점(CU·GS25 등)",
    "category": "카페·음료",
    "price": 4300,
    "spicy": 0,
    "emoji": "🥤",
    "color": "#DDEFF8",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "블루레몬 에이드 음료",
      "사이다",
      "얼음컵"
    ],
    "steps": [
      "얼음컵에 블루레몬 에이드를 부어요.",
      "사이다를 조금씩 더해 탄산을 조절해요.",
      "잘 섞어 마셔요."
    ],
    "desc": "상큼한 레몬 향과 탄산감을 살린 음료 조합.",
    "sourceNote": "편의점 음료 응용 레시피(개별 SNS 유행 확인 필요)"
  },
  {
    "id": "pf-curated-09",
    "name": "돼지바 프라푸치노",
    "brand": "스타벅스",
    "category": "카페·디저트",
    "price": 8500,
    "spicy": 0,
    "emoji": "🍓",
    "color": "#FBE0E7",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "딸기 계열 크림 프라푸치노",
      "자바칩",
      "초콜릿 드리즐",
      "휘핑크림"
    ],
    "steps": [
      "매장에서 주문 가능한 딸기 계열 프라푸치노를 선택해요.",
      "자바칩·초콜릿 드리즐 가능 여부를 문의해요.",
      "가능한 옵션만 추가해요."
    ],
    "desc": "딸기와 초콜릿을 조합해 돼지바 아이스크림 맛을 연상시키는 비공식 커스텀.",
    "sourceNote": "https://circle-85.tistory.com/74 | 원조 베이스 단종·변경 가능; 현재 딸기 메뉴 및 옵션 확인 필요"
  },
  {
    "id": "pf-curated-10",
    "name": "슈렉 프라푸치노",
    "brand": "스타벅스",
    "category": "카페·디저트",
    "price": 8700,
    "spicy": 0,
    "emoji": "🍵",
    "color": "#DFF0DC",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "제주 말차 크림 프라푸치노",
      "에스프레소 샷",
      "자바칩",
      "초콜릿 드리즐"
    ],
    "steps": [
      "제주 말차 크림 프라푸치노를 선택해요.",
      "샷과 자바칩을 추가해요.",
      "가능하면 초콜릿 드리즐로 마무리해요."
    ],
    "desc": "말차의 쌉싸름함과 초콜릿의 달콤함을 더한 인기 비공식 커스텀.",
    "sourceNote": "https://circle-85.tistory.com/74 | https://www.starbucks.co.kr/menu/drink_list.do"
  },
  {
    "id": "pf-curated-11",
    "name": "쿠앤크 프라푸치노",
    "brand": "스타벅스",
    "category": "카페·디저트",
    "price": 8300,
    "spicy": 0,
    "emoji": "🍪",
    "color": "#EBE9E7",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "크림 베이스 프라푸치노",
      "자바칩",
      "휘핑크림"
    ],
    "steps": [
      "주문 가능한 크림 베이스 프라푸치노를 선택해요.",
      "자바칩 추가를 요청해요.",
      "휘핑크림을 선택해 마무리해요."
    ],
    "desc": "바삭한 초콜릿 칩과 부드러운 크림을 조합한 쿠키앤크림 느낌.",
    "sourceNote": "https://circle-85.tistory.com/74 | 베이스/옵션 국내 주문 가능 여부 확인 필요"
  },
  {
    "id": "pf-curated-12",
    "name": "고디바 프라푸치노",
    "brand": "스타벅스",
    "category": "카페·디저트",
    "price": 8800,
    "spicy": 0,
    "emoji": "🍫",
    "color": "#E6D8D0",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "자바 칩 프라푸치노",
      "초콜릿 드리즐",
      "헤이즐넛 시럽(가능 시)"
    ],
    "steps": [
      "자바 칩 프라푸치노를 주문해요.",
      "초콜릿 드리즐을 추가해요.",
      "헤이즐넛 시럽 주문 가능 시 소량 더해요."
    ],
    "desc": "초콜릿 풍미를 진하게 즐기는 비공식 프라푸치노 조합.",
    "sourceNote": "https://circle-85.tistory.com/74 | https://www.starbucks.co.kr/menu/drink_list.do | 헤이즐넛 시럽 제공 여부 확인"
  },
  {
    "id": "pf-curated-13",
    "name": "버터비어 프라푸치노",
    "brand": "스타벅스",
    "category": "카페·디저트",
    "price": 8500,
    "spicy": 0,
    "emoji": "🍮",
    "color": "#F7E8CF",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "크림 베이스 프라푸치노",
      "캐러멜 시럽",
      "캐러멜 드리즐",
      "휘핑크림"
    ],
    "steps": [
      "주문 가능한 크림 베이스 프라푸치노를 선택해요.",
      "캐러멜 시럽과 휘핑크림을 요청해요.",
      "캐러멜 드리즐로 마무리해요."
    ],
    "desc": "버터스카치 느낌의 달콤한 캐러멜 풍미를 강조한 비공식 조합.",
    "sourceNote": "https://circle-85.tistory.com/74 | 크림 베이스 및 시럽 제공 여부 확인"
  },
  {
    "id": "pf-curated-14",
    "name": "초코나무숲 프라푸치노",
    "brand": "스타벅스",
    "category": "카페·디저트",
    "price": 8800,
    "spicy": 0,
    "emoji": "🌿",
    "color": "#E4EFDD",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "제주 말차 크림 프라푸치노",
      "자바칩",
      "초콜릿 드리즐",
      "휘핑크림"
    ],
    "steps": [
      "제주 말차 크림 프라푸치노를 선택해요.",
      "자바칩을 추가해요.",
      "초콜릿 드리즐과 휘핑크림을 곁들여요."
    ],
    "desc": "말차와 초콜릿을 강조해 초코나무숲 아이스크림을 연상시키는 조합.",
    "sourceNote": "https://circle-85.tistory.com/74 | https://www.starbucks.co.kr/menu/drink_list.do"
  },
  {
    "id": "pf-curated-15",
    "name": "이탈리안 비엠티 꿀조합",
    "brand": "써브웨이",
    "category": "샌드위치",
    "price": 7200,
    "spicy": 0,
    "emoji": "🥪",
    "color": "#E6F1DE",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "이탈리안 비엠티 15cm",
      "파마산 오레가노 빵",
      "스위트 어니언 소스",
      "랜치 소스"
    ],
    "steps": [
      "이탈리안 비엠티 15cm를 선택해요.",
      "파마산 오레가노 빵을 고르고 채소를 선택해요.",
      "스위트 어니언과 랜치를 요청해요."
    ],
    "desc": "짭짤한 햄과 달콤고소한 소스가 잘 어울리는 서브웨이 커스텀.",
    "sourceNote": "https://subway.3xbase.com/ | 가격은 옵션 미포함 대략치"
  },
  {
    "id": "pf-curated-16",
    "name": "에그마요 베이컨 조합",
    "brand": "써브웨이",
    "category": "샌드위치",
    "price": 7800,
    "spicy": 0,
    "emoji": "🥚",
    "color": "#F1F1D8",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "에그마요 15cm",
      "화이트 빵",
      "베이컨 추가",
      "랜치 소스",
      "스위트 칠리 소스"
    ],
    "steps": [
      "에그마요 15cm와 화이트 빵을 선택해요.",
      "베이컨을 추가해요.",
      "랜치와 스위트 칠리 소스를 요청해요."
    ],
    "desc": "부드러운 에그마요에 베이컨 식감과 달콤한 소스를 더한 조합.",
    "sourceNote": "https://subway.3xbase.com/ | 추가 토핑 가격은 매장별 확인"
  },
  {
    "id": "pf-curated-17",
    "name": "스테이크 치즈 조합",
    "brand": "써브웨이",
    "category": "샌드위치",
    "price": 8500,
    "spicy": 0,
    "emoji": "🥩",
    "color": "#E9E0D7",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "스테이크 & 치즈 15cm",
      "플랫브레드",
      "스모크 바비큐 소스",
      "스위트 어니언 소스"
    ],
    "steps": [
      "스테이크 & 치즈 15cm를 주문해요.",
      "플랫브레드와 채소를 선택해요.",
      "스모크 바비큐와 스위트 어니언을 곁들여요."
    ],
    "desc": "고기 풍미에 바비큐의 스모키함과 달콤함을 더해요.",
    "sourceNote": "https://subway.3xbase.com/ | 옵션 제공 여부 확인"
  },
  {
    "id": "pf-curated-18",
    "name": "쉬림프 에그마요 조합",
    "brand": "써브웨이",
    "category": "샌드위치",
    "price": 9900,
    "spicy": 0,
    "emoji": "🍤",
    "color": "#E2EDE9",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "쉬림프 15cm",
      "허니오트 빵",
      "에그마요 추가",
      "스위트 어니언 소스"
    ],
    "steps": [
      "쉬림프 15cm를 주문해요.",
      "허니오트 빵과 채소를 고르세요.",
      "가능하면 에그마요를 추가하고 스위트 어니언 소스를 선택해요."
    ],
    "desc": "탱글한 새우와 고소한 에그마요를 함께 즐기는 조합.",
    "sourceNote": "https://subway.3xbase.com/ | 에그마요 추가 가능 여부/가격 확인"
  },
  {
    "id": "pf-curated-19",
    "name": "치킨 데리야끼 꿀조합",
    "brand": "써브웨이",
    "category": "샌드위치",
    "price": 7400,
    "spicy": 0,
    "emoji": "🍗",
    "color": "#F1E6D8",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "치킨 데리야끼 15cm",
      "플랫브레드",
      "스위트 칠리 소스",
      "랜치 소스"
    ],
    "steps": [
      "치킨 데리야끼 15cm를 선택해요.",
      "플랫브레드와 채소를 선택해요.",
      "스위트 칠리와 랜치 소스를 곁들여요."
    ],
    "desc": "달짝지근한 데리야끼 치킨에 소스를 더한 샌드위치.",
    "sourceNote": "https://subway.3xbase.com/"
  },
  {
    "id": "pf-curated-20",
    "name": "스파이시 이탈리안 조합",
    "brand": "써브웨이",
    "category": "샌드위치",
    "price": 7200,
    "spicy": 2,
    "emoji": "🌶️",
    "color": "#F8DDDC",
    "curated": true,
    "demoPicked": false,
    "verified": false,
    "rating": 0,
    "reviewCount": 0,
    "ingredients": [
      "스파이시 이탈리안 15cm",
      "파마산 오레가노 빵",
      "할라피뇨",
      "핫 칠리 소스",
      "사우스웨스트 치폴레 소스"
    ],
    "steps": [
      "스파이시 이탈리안 15cm를 선택해요.",
      "할라피뇨를 추가해요.",
      "핫 칠리와 치폴레를 취향에 맞게 소량 선택해요."
    ],
    "desc": "페퍼로니·살라미의 진한 맛에 매콤한 소스를 더한 조합.",
    "sourceNote": "https://subway.3xbase.com/ | 매장 옵션/소스 이름 확인"
  }
];
const brands=[['전체 브랜드','▦','#eee9e3'],['스타벅스','☕','#e1eee8'],['서브웨이','🥪','#faedcf'],['CU','🏪','#e1eee6'],['GS25','🏪','#e2e8fa'],['세븐일레븐','7️⃣','#f8e0d8'],['편의점','🛒','#e1eee6'],['기타','🍔','#fde3dc']];
const foods=[['전체 음식','▦','#eee9e3'],['한식','🍚','#f5e4cf'],['양식','🍝','#e2eee4'],['일식','🍣','#f8e0d8'],['중식','🥟','#fbe7c9'],['분식','🍢','#f8dfdf'],['카페·디저트','🍰','#eee2d6'],['샌드위치','🥪','#e3eee7'],['치킨','🍗','#f9e9ce'],['편의점 간편식','🏪','#e1eee6']];
const shops=[{id:'baemin',name:'배달의민족 앱 열기',icon:'🛵',desc:'앱이 설치되어 있으면 앱 실행',url:'https://www.baemin.com/',package:'com.woowahan.baemin'},{id:'coupang',name:'쿠팡이츠 앱 열기',icon:'🍴',desc:'앱이 설치되어 있으면 앱 실행',url:'https://www.coupangeats.com/',package:'com.coupang.eats'},{id:'gs',name:'우리동네GS 앱 열기',icon:'🏪',desc:'앱이 설치되어 있으면 앱 실행',url:'https://www.gsretail.com/',package:'com.gsr.gs25'},{id:'cu',name:'포켓CU 앱 열기',icon:'🏪',desc:'앱이 설치되어 있으면 앱 실행',url:'https://cu.bgfretail.com/',package:'com.bgfcu.pocketcu'}];
const products=[{id:'p1',name:'편의점 상품권 (예시)',emoji:'🎟️',price:100,desc:'시제품 교환 체험'},{id:'p2',name:'커피 교환권 (예시)',emoji:'☕',price:250,desc:'시제품 교환 체험'},{id:'p3',name:'간식 박스 (예시)',emoji:'🍪',price:400,desc:'시제품 교환 체험'},{id:'p4',name:'PICKFOO 굿즈 (예시)',emoji:'🎁',price:600,desc:'시제품 교환 체험'}];
let state={brand:'전체 브랜드',food:'전체 음식',verified:false,exclude:false,selected:null};
// 기존 사용자 저장 데이터를 보호하면서, 예전 시연 12개만 팀 선정 20개로 교체합니다.
const previousPresetIds = new Set(Array.from({length:12}, (_,i) => 'r'+(i+1)));
let data=load();
function load(){
  const defaults={recipes:initialRecipes,reviews:[],points:[],nickname:'게스트',preferences:{food:'전체',brand:'전체'}};
  try {
    const saved=JSON.parse(localStorage.getItem(STORE)||'{}');
    if (!saved || typeof saved!=='object' || Array.isArray(saved)) return defaults;
    const originals=Array.isArray(saved.recipes)?saved.recipes:[];
    const personal=originals.filter(r => r && typeof r.id==='string' &&
      !previousPresetIds.has(r.id) && !r.id.startsWith('pf-curated-') && r.curated!==true);
    // 저장된 DB 계정 정보와 사용자가 추가한 조합을 지우지 않습니다.
    return {...defaults,...saved,recipes:[...initialRecipes,...personal]};
  } catch(e) {return defaults;}
}
function save(){localStorage.setItem(STORE,JSON.stringify(data))} 

// 서버에 저장된 조합은 localStorage의 오래된 복사본 대신 현재 로그인 계정의 DB에서 다시 읽는다.
function isDbRecipe(recipe) {
  return !!recipe && (recipe.dbSaved === true || recipe.serverRecipeId != null);
}
data.recipes = data.recipes.filter(recipe => !isDbRecipe(recipe));

function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2500)}
// 뒤로가기: 이전 화면 기록(최대 20개)으로 돌아간다. 기존에는 상세 화면에서 같은 상세 화면으로 이동해 동작하지 않았다.
const viewHistory=[];
function currentView(){const v=document.querySelector('.view.active');return v?v.id:'homeView'}
function showView(id,fromBack){const prev=currentView();if(!fromBack&&prev!==id){viewHistory.push(prev);if(viewHistory.length>20)viewHistory.shift()}$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));$$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===id));if(id==='homeView')renderRecipes();if(id==='pointsView')renderPoints();if(id==='shopView')renderShop();if(id==='myPageView')renderProfile();window.scrollTo({top:0,behavior:'smooth'})}
function categoryButtons(target,items,type){const root=$(target);root.innerHTML='';items.forEach(([name,icon,color])=>{const value=name==='전체 브랜드'?'전체 브랜드':name==='전체 음식'?'전체 음식':name;const selected=type==='brand'?state.brand===value:state.food===value;const b=document.createElement('button');b.className='category-item'+(selected?' selected':'');b.innerHTML=`<span class="category-icon" style="background:${color}">${icon}</span><span class="category-label">${name}</span>`;b.addEventListener('click',()=>{if(type==='brand'){state.brand=value;$('#brandCount').textContent=value==='전체 브랜드'?'전체 브랜드 선택':value+' 선택됨'}else state.food=value;renderCategories();renderRecipes()});root.appendChild(b)})}
function renderCategories(){categoryButtons('#brandCategories',brands,'brand');categoryButtons('#foodCategories',foods,'food')}
// 브랜드 필터: '편의점(CU·GS25 등)' 공용 조합은 CU·GS25·세븐일레븐 어느 것을 골라도 함께 보인다.
function brandMatches(selected,brand){brand=String(brand||'');if(selected==='전체 브랜드'||selected==='전체')return true;const shared=brand.startsWith('편의점(');if(selected==='편의점')return ['CU','GS25','세븐일레븐','이마트24'].includes(brand)||shared;if(['CU','GS25','세븐일레븐'].includes(selected))return brand===selected||shared;return brand===selected||(selected==='서브웨이'&&brand==='써브웨이')}
function filtered(){const q=$('#searchInput').value.trim().toLowerCase(),budget=$('#budgetFilter').value,spicy=$('#spicyFilter').value;let list=data.recipes.filter(r=>{const brandOk=brandMatches(state.brand,r.brand);const foodOk=state.food==='전체 음식'||state.food==='전체'||r.category===state.food||(state.food==='카페·디저트'&&r.category==='카페·음료');const queryOk=!q||[r.name,r.brand,r.category,...r.ingredients].join(' ').toLowerCase().includes(q);const priceOk=budget==='all'||r.price<=Number(budget);const spicyOk=spicy==='all'||r.spicy===Number(spicy);const verifiedOk=!state.verified||(r.curated===true ? r.verification?.verified===true : r.dbVerified===true);const excludeOk=!state.exclude||!r.ingredients.some(i=>/땅콩|갑각류|새우/.test(i));return brandOk&&foodOk&&queryOk&&priceOk&&spicyOk&&verifiedOk&&excludeOk});
  if ($('#sortMode').value === 'personalized') {
    const p=activePreferences();
    if (p) list=window.PICKFOO_RECOMMENDER.rank(list,p);
  }
  return list;
}
// DB에서 불러온 사용자 음식 취향
let dbRecommendationPreferences = null;

// STEP 235: 현재 로그인 계정의 실제 평가 이력만 메모리에 보관합니다.
// localStorage나 다른 사용자의 공개 평균 평점은 학습 이력으로 사용하지 않습니다.
let dbRatingHistory = [];
let ratingHistoryRequestVersion = 0;
let ratingHistoryRequestedAt = 0;

async function loadDbRatingHistory(force = false) {
  // 웹앱이 화면에 다시 나타날 때 불필요한 중복 요청을 줄입니다.
  if (!force && Date.now() - ratingHistoryRequestedAt < 30000) return;
  ratingHistoryRequestedAt = Date.now();
  const version = ++ratingHistoryRequestVersion;
  try {
    const response = await fetch(
      window.PICKFOO_API_BASE + '/api/catalog/curated/my-rating-history/',
      { method: 'GET', credentials: 'include', cache: 'no-store' }
    );
    if (version !== ratingHistoryRequestVersion) return;
    if (response.status === 401) {
      dbRatingHistory = [];
      renderRecipes();
      return;
    }
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const payload = await response.json();
    if (!Array.isArray(payload.history)) throw new Error('평가 이력 응답 형식 오류');

    const curatedById = new Map(initialRecipes.filter(r => r.curated === true).map(r => [r.id, r]));
    const used = new Set();
    const loaded = [];
    for (const row of payload.history.slice(0, 100)) {
      const key = row?.combo_key;
      const recipe = curatedById.get(key);
      const rating = Number(row?.rating);
      if (!recipe || used.has(key) || !Number.isInteger(rating) || rating < 1 || rating > 5) continue;
      used.add(key);
      loaded.push({id: recipe.id, brand: recipe.brand, category: recipe.category, name: recipe.name, ingredients: recipe.ingredients, spicy: recipe.spicy, rating});
    }
    if (version !== ratingHistoryRequestVersion) return;
    dbRatingHistory = loaded;
    renderRecipes();
    console.log('PICKFOO STEP 235: 내 평가 이력 ' + loaded.length + '건을 추천에 반영합니다.');
  } catch (error) {
    if (version !== ratingHistoryRequestVersion) return;
    // API 연결 문제가 발생하더라도 기존 취향 추천은 계속 작동합니다.
    dbRatingHistory = [];
    console.warn('PICKFOO: 평가 이력을 불러오지 못해 기존 취향 추천을 사용합니다.', error);
    renderRecipes();
  }
}

// 추천 기능에서 사용할 음식 취향과 실제 DB 평가 이력을 합칩니다.
function activePreferences() {
  if (!dbRecommendationPreferences) return null;
  return {...dbRecommendationPreferences, history: dbRatingHistory};
}
// 주문 계획·출처 표시 모듈(order-plan.js, trend-source.js)이 읽기 전용으로 사용합니다.
window.PICKFOO_APP = {
  recipe: id => data.recipes.find(x => x.id === id) || null,
  recipes: () => data.recipes.slice(),
  selected: () => state.selected,
  prefs: () => activePreferences()
};
function reasonFor(r){
  if($('#sortMode').value!=='personalized')return '';
  const p=activePreferences();
  return p?window.PICKFOO_RECOMMENDER.reason(r,p):'';
}

// PostgreSQL에 저장된 음식 취향 불러오기
async function loadDbRecommendationPreferences() {

    try {

        const response = await fetch(
            window.PICKFOO_API_BASE + "/api/accounts/preferences/",
            {
                method: "GET",
                credentials: "include"
            }
        );

        // 로그인하지 않은 사용자
        if (response.status === 401) {
            dbRecommendationPreferences = null;
            renderRecipes();
            return;
        }

        if (!response.ok) {
            throw new Error("음식 취향 조회 실패");
        }

        const result = await response.json();
        const p = result.preferences;

        // 저장된 음식 취향이 없는 경우
        if (!p) {
            dbRecommendationPreferences = null;
            renderRecipes();
            return;
        }

        // DB 저장값을 추천 알고리즘 형식으로 변환
        const foodMap = {
            "편의점": "편의점 간편식",
            "카페": "카페·디저트"
        };

        const spicyMap = {
            "맵지 않음": "0",
            "안 매움": "0",
            "약간 매움": "1",
            "매움": "2"
        };

        dbRecommendationPreferences = {

            foodTypes: (p.food_types || []).map(
                food => foodMap[food] || food
            ),

            brands: p.brands || [],

            flavors: p.flavors || [],

            spicy: spicyMap[p.spicy] ?? p.spicy ?? "all",

            budget: p.budget || "all",

            excludedIngredients:
                p.excluded_ingredients || [],

            allergies: p.allergies || []
        };

        console.log(
            "PICKFOO DB 음식 취향 불러오기 성공"
        );

        // 추천 목록 다시 표시
        renderRecipes();

    } catch (error) {

        console.error(
            "DB 음식 취향 조회 오류:",
            error
        );

        dbRecommendationPreferences = null;
    }
}
// STEP 154: 현재 로그인한 사용자가 PostgreSQL에 저장한 음식 조합 조회
async function loadMyDbRecipes() {
  try {
    const response = await fetch(window.PICKFOO_API_BASE + '/api/catalog/recipes/mine/', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    });

    // 로그인하지 않았으면 DB 조합을 표시하지 않는다.
    if (response.status === 401) {
      data.recipes = data.recipes.filter(recipe => !isDbRecipe(recipe));
      renderRecipes();
      console.log('PICKFOO: 로그인하면 본인이 등록한 DB 조합을 불러올 수 있습니다.');
      return;
    }
    if (!response.ok) {
      throw new Error('내 음식 조합 조회 실패 (HTTP ' + response.status + ')');
    }

    const payload = await response.json();
    if (!Array.isArray(payload.recipes)) {
      throw new Error('음식 조합 조회 결과 형식이 올바르지 않습니다.');
    }

    // 기존 app.js의 조합 표시·상세 화면·추천 점수 형식으로 변환
    const serverRecipes = payload.recipes.map(function (item) {
      const price = item.estimated_price;
      // 현재 카드와 예산 점수 계산은 숫자 가격을 필요로 한다.
      // 가격 미확인 조합은 0원으로 오인하지 않도록 이번 목록에서는 보류한다.
      if (!Number.isSafeInteger(price) || price <= 0) {
        console.warn('예상 가격이 없어 메인 목록에서 보류한 DB 조합:', item.name);
        return null;
      }

      return {
        id: 'db' + item.id,
        serverRecipeId: item.id,
        dbSaved: true,
        name: item.name,
        brand: item.brand_name || '기타',
        category: item.category,
        price: price,
        spicy: Number(item.spicy),
        emoji: '🍽️',
        color: '#e4eee6',
        demoPicked: false,
        rating: 0,
        reviewCount: 0,
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
        steps: Array.isArray(item.steps) ? item.steps : [],
        desc: item.description || '사용자가 등록한 커스텀 조합이에요.'
      };
    }).filter(Boolean);

    // 서버 ID 기준으로 중복 제거. 기존 12개 시연 조합과 예전 로컬 전용 조합은 유지.
    const localRecipes = data.recipes.filter(recipe => !isDbRecipe(recipe));
    data.recipes = [
      ...localRecipes.filter(recipe => recipe.curated === true),
      ...serverRecipes,
      ...localRecipes.filter(recipe => recipe.curated !== true)
    ];

    renderRecipes();
    console.log('✅ PostgreSQL에서 내 음식 조합 ' + serverRecipes.length + '개 불러오기 성공');
  } catch (error) {
    console.error('PICKFOO DB 음식 조합 조회 오류:', error);
  }
}

// STEP 178: DB 조합의 실제 리뷰 수·평균 별점을 메인 카드에 표시한다.
// 브라우저가 임의로 만든 예시 별점과 DB 리뷰는 섞지 않는다.
const dbCardReviewStats = new Map();
const dbCardReviewPending = new Set();

function dbCardReviewLabel(recipeId) {
  const stats = dbCardReviewStats.get(recipeId);
  if (!stats) return 'DB 별점 조회 중…';
  if (stats.error) return 'DB 리뷰 조회 실패';
  if (stats.count === 0) return 'DB 평점 없음 · 리뷰 0건';
  return 'DB ★ ' + stats.average.toFixed(1) + ' · 리뷰 ' + stats.count + '건';
}

async function loadDbCardReviewStats(recipeId) {
  if (!Number.isSafeInteger(recipeId) || recipeId <= 0) return;
  if (dbCardReviewStats.has(recipeId) || dbCardReviewPending.has(recipeId)) return;
  dbCardReviewPending.add(recipeId);

  try {
    const response = await fetch(
      window.PICKFOO_API_BASE + '/api/catalog/recipes/' + recipeId + '/reviews/list/',
      { method: 'GET', credentials: 'include', cache: 'no-store' }
    );
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const payload = await response.json();
    const count = payload.review_count;
    const average = payload.average_rating;
    if (!Number.isInteger(count) || count < 0 ||
        (count > 0 && (typeof average !== 'number' ||
          !Number.isFinite(average) || average < 1 || average > 5))) {
      throw new Error('리뷰 통계 응답 형식 오류');
    }
    dbCardReviewStats.set(recipeId, {
      count: count,
      average: count > 0 ? average : null
    });
    console.log('✅ DB 조합 ' + recipeId + ' 리뷰 통계: ' + count + '건');
  } catch (error) {
    dbCardReviewStats.set(recipeId, { error: true });
    console.error('PICKFOO DB 카드 리뷰 통계 조회 실패 (조합 ' + recipeId + '):', error);
  } finally {
    dbCardReviewPending.delete(recipeId);
    // 검색·정렬에 의해 목록이 달라졌을 수도 있으므로 현재 필터 결과로 다시 그린다.
    renderRecipes();
  }
}

function renderRecipes(){const recipes=filtered();$('#recipeGrid').innerHTML='';$('#emptyState').classList.toggle('hidden',recipes.length>0);$('#resultsTitle').textContent=state.food!=='전체 음식'?state.food:state.brand!=='전체 브랜드'?state.brand:'추천 조합';$('#resultsSubtitle').textContent=`조건에 맞는 조합 ${recipes.length}개`;recipes.forEach(r=>{const card=document.createElement('article');card.className='recipe-card';card.innerHTML=`<div class="recipe-art" style="background:${r.color}">${r.emoji}${r.curated?(r.verification?.verified?'<span class="badge">✓ 내부 검증</span>':'<span class="badge">전시 추천</span>'):r.dbSaved?'<span class="badge">DB 등록</span>':(r.demoPicked??r.verified)?'<span class="badge">시연 예시</span>':''}</div><div class="recipe-body"><div class="recipe-brand">${esc(r.brand)} · ${esc(r.category)}</div><div class="recipe-title">${esc(r.name)}</div><div class="recipe-meta"><span class="price">${(r.dbSaved||r.curated)?"예상 ":"약 "}${Number(r.price).toLocaleString()}원</span><span class="rating">${r.curated?(r.verification?.verified?"✓ 검증 · 보정 ★ "+Number(r.verification.adjusted_rating).toFixed(2):r.verification?"평가 "+r.verification.review_count+"건 · 검증 대기":"검증 점수 조회 중…"):r.dbSaved?esc(dbCardReviewLabel(r.serverRecipeId)):"예시 ★ "+Number(r.rating||0).toFixed(1)}</span></div><div class="recipe-tags"><span class="tag">${['안 매움','약간 매움','매움'][r.spicy]||'보통'}</span><span class="tag">재료 ${r.ingredients.length}개</span></div>${reasonFor(r)?`<p class="reason">${esc(reasonFor(r))}</p>`:''}</div></div>`;card.addEventListener('click',()=>openDetail(r.id));$('#recipeGrid').appendChild(card);if(r.dbSaved)loadDbCardReviewStats(r.serverRecipeId)})}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function openDetail(id){const r=data.recipes.find(x=>x.id===id);if(!r)return;state.selected=id;document.getElementById('detailContent').dataset.curatedKey = r.curated ? r.id : '';const reviews=data.reviews.filter(x=>x.recipeId===id);$('#detailContent').innerHTML=`<div class="detail-hero" style="background:${r.color}"><span>${r.emoji}</span>${r.curated?(r.verification?.verified?'<span class="verified-badge">✓ PICKFOO 내부 검증</span>':'<span class="verified-badge">팀 선정 · 검증 대기</span>'):r.dbSaved?'<span class="verified-badge">사용자 등록 · DB 저장</span>':(r.demoPicked??r.verified)?'<span class="verified-badge">시연용 선정 예시</span>':''}</div><div class="detail-brand">${esc(r.brand)} · ${esc(r.category)}</div><h1 class="detail-title">${esc(r.name)}</h1><p class="detail-intro">${esc(r.desc||'내 취향에 맞게 재료를 조합해 보세요.')}</p><div class="detail-stats"><span>💰 ${(r.dbSaved||r.curated)?"예상 ":"약 "}${Number(r.price).toLocaleString()}원</span><span>${r.curated?(r.verification?.adjusted_rating!=null?"보정 평점 ⭐ "+r.verification.adjusted_rating:"보정 평점 미집계"):r.dbSaved?"DB 평균 별점 조회 중…":"예시 평점 ⭐ "+Number(r.rating||0).toFixed(1)+" (가상 수치)"}</span><span>${r.dbSaved?"DB 리뷰 조회 중…":"이 기기의 후기 "+reviews.length+"건"}</span><span>🌶️ ${['안 매움','약간 매움','매움'][r.spicy]||'보통'}</span></div><div class="detail-section"><h3>🧺 필요한 재료</h3><div class="ingredient-list">${r.ingredients.map(i=>`<div class="ingredient">${esc(i)}</div>`).join('')}</div><p class="notice">${r.curated?"전시용 선정 조합입니다. 가격은 예상치이며 판매 여부·원재료·알레르기 정보는 직접 확인해야 합니다. 내부 검증 배지는 실제 DB 리뷰 10명 이상, 보정 평점 3.8 이상, 사진 리뷰 3건 이상인 경우에만 부여되며 식품 안전을 보증하지 않습니다.":r.dbSaved?"이 조합·가격·재료는 사용자가 입력한 정보입니다. 실제 판매 여부, 원재료와 알레르기 안전은 확인되지 않았습니다.":"이 메뉴·가격·평점은 시연용 예시입니다. 실판매 여부, 원재료 및 알레르기 안전은 보장하지 않습니다."}</p></div><div class="detail-section"><h3>👩‍🍳 조합 만드는 방법</h3><ol class="step-list">${r.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></div><div class="detail-section"><h3>🛒 구매하러 가기</h3><p class="page-desc">버튼을 누르면 설치된 앱을 먼저 열도록 시도하고, 앱을 열 수 없으면 해당 서비스 웹사이트로 이동해요. 앱의 상품 검색 화면으로 바로 이동하는 공식 연결 주소는 제공되지 않아 앱이 열리면 재료명을 직접 검색해 주세요. 자동 장바구니 담기는 지원하지 않아요.</p><div class="shopping-grid">${shops.map(s=>`<a class="shop-link" href="${s.url}" data-shop="${s.id}" rel="noopener noreferrer"><span class="shop-icon">${s.icon}</span><span>${esc(s.name)}<small>${esc(s.desc)}</small></span></a>`).join('')}</div></div><div class="detail-section"><div class="section-heading"><h3>${(r.dbSaved||r.curated)?"💬 PostgreSQL 리뷰":"💬 이 기기에 저장된 후기"}</h3><button class="text-btn" id="writeReviewBtn">${r.curated?"검증 평가·사진 후기":r.dbSaved?"DB 리뷰·사진 첨부":"사진 리뷰 +10P"}</button></div><div class="review-list">${reviews.length?reviews.map(rv=>`<div class="review-card"><div class="review-head">${esc(rv.nickname)} <span>${'★'.repeat(rv.rating)}${'☆'.repeat(5-rv.rating)}</span></div><div>${esc(rv.text)}</div>${rv.photo?`<img src="${rv.photo}" alt="사용자 리뷰 사진">`:''}</div>`).join(''):'<div class="empty-state">아직 등록된 후기가 없어요.<br>첫 번째 리뷰를 남겨 주세요.</div>'}</div></div><button class="primary-btn full" id="detailReviewBtn">${r.curated?"검증 평가 작성 / 수정":r.dbSaved?"DB 리뷰 작성 / 사진 추가":"사진 리뷰 작성하고 10P 받기"}</button>`;$('#writeReviewBtn').addEventListener('click',()=>openReview(id));$('#detailReviewBtn').addEventListener('click',()=>openReview(id));
  // STEP 161: PostgreSQL에 저장된 현재 계정의 조합에만 수정·삭제 버튼을 표시한다.
  if (r.dbSaved === true && Number.isSafeInteger(r.serverRecipeId) && r.serverRecipeId > 0) {
    const actionSection = document.createElement('div');
    actionSection.className = 'detail-section';
    actionSection.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'text-btn';
    editBtn.textContent = '✏️ 내가 등록한 조합 수정';
    editBtn.style.cssText = 'color:#b94b1b;background:#fff2e8;border:1px solid #ffc6a8;border-radius:10px;padding:12px 16px;cursor:pointer;font-weight:700;';
    editBtn.addEventListener('click', () => editMyDbRecipe(r));
    actionSection.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'text-btn';
    deleteBtn.textContent = '🗑️ 내가 등록한 조합 삭제';
    deleteBtn.style.cssText = 'color:#b72e2e;background:#fff1ee;border:1px solid #e8a29b;border-radius:10px;padding:12px 16px;cursor:pointer;font-weight:700;';
    deleteBtn.addEventListener('click', () => deleteMyDbRecipe(r, deleteBtn));
    actionSection.appendChild(deleteBtn);
    $('#detailContent').appendChild(actionSection);
  }
  showView('detailView');
  // STEP 176: DB 조합의 리뷰와 평균 별점을 실제 PostgreSQL에서 조회한다.
  ++dbReviewLoadSequence;
  if (r.dbSaved === true && Number.isSafeInteger(r.serverRecipeId) && r.serverRecipeId > 0) {
    loadDbReviewsForDetail(r.serverRecipeId, dbReviewLoadSequence);
  }
}

// STEP 176: 기존 상세 화면의 리뷰 목록을 실제 DB 결과로 교체한다.
// 시연용 조합의 로컬 리뷰는 변경하지 않는다.
let dbReviewLoadSequence = 0;
async function loadDbReviewsForDetail(recipeId, sequence) {
  const detail = document.getElementById('detailContent');
  const list = detail?.querySelector('.review-list');
  const stats = detail?.querySelector('.detail-stats');
  if (!list || !stats) return;

  const statItems = stats.querySelectorAll('span');
  list.textContent = 'PostgreSQL 리뷰를 불러오는 중...';

  function stillCurrent() {
    return sequence === dbReviewLoadSequence;
  }

  try {
    const response = await fetch(
      `${window.PICKFOO_API_BASE}/api/catalog/recipes/${recipeId}/reviews/list/`,
      { method: 'GET', credentials: 'include', cache: 'no-store' }
    );
    if (!response.ok) {
      if (response.status === 401) throw new Error('로그인 후 다시 확인해 주세요.');
      if (response.status === 404) throw new Error('조회할 수 없는 음식 조합입니다.');
      throw new Error('리뷰 조회 오류 (HTTP ' + response.status + ')');
    }
    const payload = await response.json();
    if (!stillCurrent()) return;

    if (!Array.isArray(payload.reviews) || !Number.isInteger(payload.review_count)) {
      throw new Error('리뷰 응답 형식이 올바르지 않습니다.');
    }

    const count = payload.review_count;
    const average = typeof payload.average_rating === 'number'
      && Number.isFinite(payload.average_rating)
      ? payload.average_rating.toFixed(1) : null;

    if (statItems[1]) statItems[1].textContent = average == null
      ? 'DB 평균 별점: 아직 없음'
      : `DB 평균 별점 ⭐ ${average} / 5.0`;
    if (statItems[2]) statItems[2].textContent = `DB 리뷰 ${count}건`;

    list.replaceChildren();
    if (!payload.reviews.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = '아직 PostgreSQL에 등록된 리뷰가 없어요.';
      list.appendChild(empty);
      return;
    }

    payload.reviews.forEach(function (review) {
      const card = document.createElement('div');
      card.className = 'review-card';

      const head = document.createElement('div');
      head.className = 'review-head';
      const name = document.createElement('span');
      name.textContent = review.nickname || '사용자';
      const stars = document.createElement('span');
      const rating = Number(review.rating);
      stars.textContent = Number.isInteger(rating) && rating >= 1 && rating <= 5
        ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '별점 확인 필요';
      head.appendChild(name);
      head.appendChild(stars);

      const content = document.createElement('div');
      content.textContent = review.content || '';
      card.appendChild(head);
      card.appendChild(content);

      // STEP 192: PostgreSQL 리뷰에 연결된 실제 사진을 상세 화면에 표시한다.
      // URL은 Django 서버의 리뷰 사진 경로만 허용하고, HTML 문자열로 삽입하지 않는다.
      if (typeof review.photo_url === 'string' && review.photo_url.trim()) {
        try {
          const photoUrl = new URL(review.photo_url, window.PICKFOO_API_BASE);
          const apiOrigin = new URL(window.PICKFOO_API_BASE, window.location.href).origin;
          // Railway Bucket의 비공개 사진은 Django의 인증된 사진 조회 API로 제공된다.
          // 기존 /media/review_photos/ 형식도 이전 버전과의 호환을 위해 유지한다.
          const isPhotoViewApi = /^\/api\/catalog\/reviews\/[1-9]\d*\/photo\/view\/$/.test(photoUrl.pathname);
          const isLegacyMedia = photoUrl.pathname.startsWith('/media/review_photos/');
          if (photoUrl.origin === apiOrigin && (isPhotoViewApi || isLegacyMedia)) {
            const photo = document.createElement('img');
            photo.src = photoUrl.href;
            photo.alt = '리뷰에 첨부된 음식 사진';
            photo.loading = 'lazy';
            photo.style.cssText = 'display:block;width:100%;max-width:360px;max-height:320px;object-fit:contain;border-radius:12px;margin-top:12px;border:1px solid #ece5df;background:#f8f4ef;';
            photo.addEventListener('error', function () {
              const message = document.createElement('small');
              message.textContent = '사진을 불러오지 못했어요. 서버 사진 경로를 확인해 주세요.';
              message.style.cssText = 'display:block;margin-top:8px;color:#a33;';
              photo.replaceWith(message);
            });
            card.appendChild(photo);
          }
        } catch (error) {
          console.warn('리뷰 사진 주소가 올바르지 않습니다:', error);
        }
      }

      if (review.created_at) {
        const date = new Date(review.created_at);
        if (!Number.isNaN(date.getTime())) {
          const dateLabel = document.createElement('small');
          dateLabel.style.cssText = 'display:block;margin-top:8px;color:#888;';
          dateLabel.textContent = date.toLocaleDateString('ko-KR');
          card.appendChild(dateLabel);
        }
      }
      // STEP 199: 서버가 현재 계정의 리뷰라고 확인한 경우에만 관리 버튼 표시.
      if (review.is_mine === true && Number.isSafeInteger(review.id) && review.id > 0) {
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;';

        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'text-btn';
        edit.textContent = '✏️ 내 리뷰 수정';
        edit.style.cssText = 'padding:9px 12px;border:1px solid #f4bea2;border-radius:9px;background:#fff2e8;color:#a3431c;cursor:pointer;font-weight:700;';
        edit.addEventListener('click', () => editMyDbReview(review, recipeId, sequence));

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'text-btn';
        remove.textContent = '🗑️ 내 리뷰 삭제';
        remove.style.cssText = 'padding:9px 12px;border:1px solid #e8a29b;border-radius:9px;background:#fff1ee;color:#a52d2d;cursor:pointer;font-weight:700;';
        remove.addEventListener('click', () => deleteMyDbReview(review, recipeId, sequence, remove));

        actions.append(edit, remove);
        card.appendChild(actions);
      }

      list.appendChild(card);
    });

    console.log(`✅ PostgreSQL 리뷰 ${count}개 조회 성공 (조합 ID: ${recipeId})`);
  } catch (error) {
    if (!stillCurrent()) return;
    console.error('PICKFOO DB 리뷰 조회 실패:', error);
    list.textContent = 'DB 리뷰를 불러오지 못했습니다. ' + error.message;
    if (statItems[1]) statItems[1].textContent = 'DB 평균 별점 조회 실패';
    if (statItems[2]) statItems[2].textContent = 'DB 리뷰 조회 실패';
  }
}

// STEP 199: PATCH/DELETE 요청 전에 Django의 CSRF 쿠키를 가져온다.
async function getDbReviewCsrfToken() {
  const response = await fetch(window.PICKFOO_API_BASE + '/api/accounts/csrf/', {
    credentials: 'include', cache: 'no-store'
  });
  if (!response.ok) throw new Error('CSRF 인증 요청에 실패했어요.');
  const cookie = document.cookie.split('; ').find(part => part.startsWith('csrftoken='));
  if (!cookie) throw new Error('CSRF 쿠키를 찾지 못했어요. 로그인 상태를 확인하고 새로고침해 주세요.');
  return decodeURIComponent(cookie.slice('csrftoken='.length));
}

// 수정 또는 삭제 후, 실제 DB 평균 별점·리뷰 개수를 다시 읽는다.
function refreshDbReviewAfterMutation(recipeId, sequence) {
  dbCardReviewStats.delete(recipeId);
  loadDbCardReviewStats(recipeId);
  if (sequence === dbReviewLoadSequence &&
      state.selected === 'db' + recipeId &&
      document.getElementById('detailView')?.classList.contains('active')) {
    loadDbReviewsForDetail(recipeId, sequence);
  }
}

// STEP 199: 본인이 작성한 PostgreSQL 리뷰의 별점·본문만 수정한다.
function editMyDbReview(review, recipeId, sequence) {
  if (review.is_mine !== true || !Number.isSafeInteger(review.id)) return;

  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-label', '내 DB 리뷰 수정');
  dialog.style.cssText = 'box-sizing:border-box;width:min(92vw,520px);max-height:87vh;overflow-y:auto;border:0;border-radius:18px;padding:24px;background:#fffaf6;color:#302c2a;box-shadow:0 18px 55px #0003;';
  // 아래 HTML은 고정된 마크업이다. 사용자 리뷰 내용은 textContent/value로만 넣는다.
  dialog.innerHTML = `
    <form style="display:grid;gap:12px;">
      <h2 style="margin:0;font-size:21px;">✏️ 내 리뷰 수정</h2>
      <p style="margin:0;color:#755d53;font-size:13px;">별점과 리뷰 글만 수정해요. 사진은 그대로 유지돼요.</p>
      <label style="display:grid;gap:6px;font-weight:700;">별점
        <select name="rating" required style="font:inherit;padding:11px;border:1px solid #d7cbc4;border-radius:9px;background:white;">
          <option value="1">★☆☆☆☆ (1점)</option>
          <option value="2">★★☆☆☆ (2점)</option>
          <option value="3">★★★☆☆ (3점)</option>
          <option value="4">★★★★☆ (4점)</option>
          <option value="5">★★★★★ (5점)</option>
        </select>
      </label>
      <label style="display:grid;gap:6px;font-weight:700;">리뷰 내용
        <textarea name="content" required maxlength="2000" rows="5" style="font:inherit;resize:vertical;padding:11px;border:1px solid #d7cbc4;border-radius:9px;"></textarea>
      </label>
      <p class="db-review-edit-error" role="alert" hidden style="margin:0;color:#aa2727;"></p>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:6px;">
        <button type="button" data-cancel style="padding:11px 17px;border:1px solid #c9beb5;background:white;border-radius:9px;cursor:pointer;">취소</button>
        <button type="submit" data-save style="padding:11px 17px;border:0;background:#db652a;color:white;border-radius:9px;font-weight:700;cursor:pointer;">💾 수정 저장</button>
      </div>
    </form>`;

  const form = dialog.querySelector('form');
  const rating = form.elements.namedItem('rating');
  const content = form.elements.namedItem('content');
  const saveButton = dialog.querySelector('[data-save]');
  const errorLabel = dialog.querySelector('.db-review-edit-error');
  rating.value = String(review.rating);
  content.value = String(review.content || '');
  dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  document.body.appendChild(dialog);
  dialog.showModal();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (saveButton.disabled) return;
    const newRating = Number(rating.value);
    const newContent = content.value.trim();
    if (!Number.isInteger(newRating) || newRating < 1 || newRating > 5 ||
        newContent.length < 1 || newContent.length > 2000) {
      errorLabel.textContent = '별점은 1~5점, 리뷰 내용은 1~2000자로 입력해 주세요.';
      errorLabel.hidden = false;
      return;
    }
    saveButton.disabled = true;
    errorLabel.hidden = true;
    try {
      const token = await getDbReviewCsrfToken();
      const response = await fetch(`${window.PICKFOO_API_BASE}/api/catalog/reviews/${review.id}/edit/`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': token },
        body: JSON.stringify({ rating: newRating, content: newContent })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `리뷰 수정 실패 (HTTP ${response.status})`);
      dialog.close();
      toast('✅ PostgreSQL 리뷰를 수정했어요.');
      refreshDbReviewAfterMutation(recipeId, sequence);
    } catch (error) {
      console.error('PICKFOO DB 리뷰 수정 오류:', error);
      errorLabel.textContent = error.message;
      errorLabel.hidden = false;
    } finally {
      saveButton.disabled = false;
    }
  });
}

// STEP 199: 본인 리뷰 삭제. 사진 파일도 Django 삭제 API에서 함께 정리한다.
async function deleteMyDbReview(review, recipeId, sequence, button) {
  if (review.is_mine !== true || !Number.isSafeInteger(review.id)) return;
  if (!window.confirm('이 리뷰를 삭제할까요? 별점·글·첨부 사진이 함께 삭제되며 되돌릴 수 없어요.')) return;
  if (button.disabled) return;
  button.disabled = true;
  try {
    const token = await getDbReviewCsrfToken();
    const response = await fetch(`${window.PICKFOO_API_BASE}/api/catalog/reviews/${review.id}/`, {
      method: 'DELETE', credentials: 'include',
      headers: { 'X-CSRFToken': token }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `리뷰 삭제 실패 (HTTP ${response.status})`);
    toast('✅ PostgreSQL 리뷰를 삭제했어요.');
    refreshDbReviewAfterMutation(recipeId, sequence);
  } catch (error) {
    console.error('PICKFOO DB 리뷰 삭제 오류:', error);
    window.alert('리뷰를 삭제하지 못했어요. ' + error.message);
  } finally {
    button.disabled = false;
  }
}

// STEP 161: 내 DB 조합 수정 창 — 기존 DB ID와 등록자는 유지한다.
function editMyDbRecipe(recipe) {
  if (!recipe?.dbSaved || !Number.isSafeInteger(recipe.serverRecipeId) || recipe.serverRecipeId <= 0) {
    toast('수정할 수 없는 조합입니다.');
    return;
  }
  const dialog = document.createElement('dialog');
  dialog.className = 'pickfoo-recipe-edit-dialog';
  dialog.setAttribute('aria-label', '내 음식 조합 수정');
  dialog.style.cssText = 'box-sizing:border-box;width:min(94vw,560px);max-height:88vh;overflow-y:auto;border:0;border-radius:18px;padding:24px;background:#fffaf6;color:#303030;box-shadow:0 16px 45px #0003;';

  // HTML 구조는 고정 문자열이며, 사용자가 작성한 값은 아래에서 .value로 넣는다.
  dialog.innerHTML = `
    <form class="pickfoo-edit-form">
      <h2 style="margin:0 0 8px;font-size:21px;">✏️ 내가 등록한 조합 수정</h2>
      <p style="margin:0 0 18px;color:#755d53;font-size:13px;">수정한 내용은 PostgreSQL에 저장됩니다.</p>
      <label>조합 이름
        <input name="name" required maxlength="150">
      </label>
      <label>브랜드
        <input name="brand_name" maxlength="100" placeholder="브랜드 또는 기타">
      </label>
      <label>음식 종류
        <select name="category" required></select>
      </label>
      <label>예상 가격 (원)
        <input name="estimated_price" type="number" min="1" max="10000000" step="1" required>
      </label>
      <label>매운맛
        <select name="spicy">
          <option value="0">안 매움</option>
          <option value="1">약간 매움</option>
          <option value="2">매움</option>
        </select>
      </label>
      <label>필요한 재료 (쉼표로 구분)
        <textarea name="ingredients" rows="3" required></textarea>
      </label>
      <label>만드는 방법 (한 줄에 한 단계씩)
        <textarea name="steps" rows="4" required></textarea>
      </label>
      <label>조합 설명
        <textarea name="description" rows="3" maxlength="2000"></textarea>
      </label>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;">
        <button type="button" class="pickfoo-edit-cancel">취소</button>
        <button type="submit" class="pickfoo-edit-save">💾 수정 저장</button>
      </div>
    </form>`;

  if (!document.getElementById('pickfoo-recipe-edit-style')) {
    const style = document.createElement('style');
    style.id = 'pickfoo-recipe-edit-style';
    style.textContent = `
      .pickfoo-recipe-edit-dialog::backdrop{background:rgba(24,18,14,.55)}
      .pickfoo-recipe-edit-dialog label{display:block;font-size:13px;font-weight:700;color:#60483e;margin:12px 0}
      .pickfoo-recipe-edit-dialog input,.pickfoo-recipe-edit-dialog textarea,.pickfoo-recipe-edit-dialog select{display:block;box-sizing:border-box;width:100%;padding:10px;margin-top:6px;border:1px solid #e5cfc1;border-radius:9px;background:white;color:#303030;font:inherit;font-weight:400}
      .pickfoo-recipe-edit-dialog button{border:0;border-radius:9px;padding:10px 15px;font-size:14px;font-weight:700;cursor:pointer}
      .pickfoo-recipe-edit-dialog .pickfoo-edit-cancel{background:#eee6de;color:#594b45}
      .pickfoo-recipe-edit-dialog .pickfoo-edit-save{background:#f16c3c;color:white}
      .pickfoo-recipe-edit-dialog .pickfoo-edit-save:disabled{opacity:.55;cursor:wait}`;
    document.head.appendChild(style);
  }

  const form = dialog.querySelector('form');
  const field = key => form.elements.namedItem(key);
  field('name').value = recipe.name || '';
  field('brand_name').value = recipe.brand || '';
  field('estimated_price').value = recipe.price;
  field('spicy').value = String(recipe.spicy);
  field('ingredients').value = (recipe.ingredients || []).join(', ');
  field('steps').value = (recipe.steps || []).join('\n');
  field('description').value = recipe.desc || '';

  // 기존 PICKFOO 음식 종류 선택지와 일치시키되, 기존 데이터의 종류도 보존한다.
  const categories = new Set(foods.slice(1).map(item => item[0]));
  categories.add(recipe.category);
  for (const category of categories) {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    field('category').appendChild(option);
  }
  field('category').value = recipe.category;

  dialog.querySelector('.pickfoo-edit-cancel').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => dialog.remove(), {once: true});
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const name = field('name').value.trim();
    const brandName = field('brand_name').value.trim();
    const category = field('category').value.trim();
    const price = Number(field('estimated_price').value);
    const spicy = Number(field('spicy').value);
    const description = field('description').value.trim();
    const ingredients = field('ingredients').value.split(',').map(v => v.trim()).filter(Boolean);
    const steps = field('steps').value.split(/\r?\n/).map(v => v.trim()).filter(Boolean);

    if (!name || name.length > 150 || brandName.length > 100 || !category || category.length > 50 || description.length > 2000) {
      alert('조합 이름, 브랜드, 음식 종류 또는 설명을 확인해 주세요.'); return;
    }
    if (!Number.isSafeInteger(price) || price < 1 || price > 10000000 || ![0, 1, 2].includes(spicy)) {
      alert('예상 가격과 매운맛 단계를 확인해 주세요.'); return;
    }
    if (!ingredients.length || ingredients.length > 30 || ingredients.some(v => v.length > 100)) {
      alert('재료는 1~30개, 각 항목 100자 이하로 입력해 주세요.'); return;
    }
    if (!steps.length || steps.length > 20 || steps.some(v => v.length > 500)) {
      alert('만드는 방법은 1~20단계, 각 단계 500자 이하로 입력해 주세요.'); return;
    }

    const submitButton = dialog.querySelector('.pickfoo-edit-save');
    submitButton.disabled = true;
    try {
      const apiBase = window.PICKFOO_API_BASE;
      const csrfResponse = await fetch(apiBase + '/api/accounts/csrf/', {method:'GET',credentials:'include'});
      if (!csrfResponse.ok) throw new Error('보안 토큰 발급에 실패했습니다.');
      const csrfCookie = document.cookie.split('; ').find(item => item.startsWith('csrftoken='));
      const csrfToken = csrfCookie ? decodeURIComponent(csrfCookie.slice('csrftoken='.length)) : '';
      if (!csrfToken) throw new Error('보안 토큰을 찾지 못했습니다.');

      const response = await fetch(apiBase + '/api/catalog/recipes/' + recipe.serverRecipeId + '/edit/', {
        method: 'PATCH',
        credentials: 'include',
        headers: {'Content-Type':'application/json','X-CSRFToken':csrfToken},
        body: JSON.stringify({
          name,brand_name:brandName,category,estimated_price:price,spicy,
          description,ingredients,steps
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) throw new Error('로그인이 필요합니다.');
        if (response.status === 403) throw new Error('보안 인증에 실패했습니다. 새로고침 후 다시 시도해 주세요.');
        if (response.status === 404) throw new Error('수정할 조합을 찾을 수 없거나 권한이 없습니다.');
        throw new Error(payload.error || '수정 실패 (HTTP ' + response.status + ')');
      }
      if (!payload.recipe || Number(payload.recipe.id) !== recipe.serverRecipeId) {
        throw new Error('수정 결과를 확인할 수 없습니다. 새로고침해 주세요.');
      }

      // DB 저장에 성공한 후에만 같은 객체를 갱신한다. 조합 ID와 등록자는 유지.
      const updated = payload.recipe;
      recipe.name = updated.name;
      recipe.brand = updated.brand_name || '기타';
      recipe.category = updated.category;
      recipe.price = updated.estimated_price;
      recipe.spicy = Number(updated.spicy);
      recipe.desc = updated.description || '';
      recipe.ingredients = updated.ingredients;
      recipe.steps = updated.steps;
      save();
      dialog.close();
      openDetail(recipe.id);
      toast('PostgreSQL에 조합 수정 내용을 저장했어요!');
      console.log('✅ PICKFOO DB 조합 수정 완료:', recipe.serverRecipeId);
    } catch (error) {
      console.error('PICKFOO DB 조합 수정 실패:', error);
      alert(error.message || '수정 중 오류가 발생했습니다.');
    } finally {
      submitButton.disabled = false;
    }
  });

  document.body.appendChild(dialog);
  dialog.showModal();
  field('name').focus();
}

// STEP 157: 등록자만 삭제할 수 있도록 Django API가 소유권을 검사한다.
async function deleteMyDbRecipe(recipe, button) {
  if (!recipe?.dbSaved || !Number.isSafeInteger(recipe.serverRecipeId) || recipe.serverRecipeId <= 0) {
    toast('삭제할 수 없는 조합입니다.');
    return;
  }
  if (!confirm(recipe.name + ' 조합을 PostgreSQL에서 삭제할까요?\n삭제 후에는 복구할 수 없습니다.')) return;
  button.disabled = true;
  try {
    const apiBase = window.PICKFOO_API_BASE;
    const csrfResponse = await fetch(apiBase + '/api/accounts/csrf/', {
      method: 'GET', credentials: 'include'
    });
    if (!csrfResponse.ok) throw new Error('보안 토큰 발급에 실패했습니다.');
    const csrfCookie = document.cookie.split('; ').find(c => c.startsWith('csrftoken='));
    const csrfToken = csrfCookie ? decodeURIComponent(csrfCookie.slice('csrftoken='.length)) : '';
    if (!csrfToken) throw new Error('보안 토큰을 찾지 못했습니다.');

    const response = await fetch(
      apiBase + '/api/catalog/recipes/' + recipe.serverRecipeId + '/',
      {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken }
      }
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) throw new Error('다시 로그인한 후 시도해 주세요.');
      if (response.status === 403) throw new Error('보안 인증에 실패했습니다. 새로고침 후 다시 시도해 주세요.');
      if (response.status === 404) throw new Error('삭제할 조합이 없거나 삭제 권한이 없습니다.');
      throw new Error(result.error || '삭제 실패 (HTTP ' + response.status + ')');
    }

    // 서버에서 성공한 경우에만 화면과 localStorage의 캐시를 갱신한다.
    data.recipes = data.recipes.filter(item =>
      !(item.dbSaved === true && item.serverRecipeId === recipe.serverRecipeId)
    );
    save();
    state.selected = null;
    showView('homeView');
    toast('PostgreSQL에서 내 조합을 삭제했어요.');
    console.log('✅ PICKFOO DB 조합 삭제 완료:', recipe.serverRecipeId);
  } catch (error) {
    console.error('PICKFOO DB 조합 삭제 실패:', error);
    toast(error.message || '조합 삭제 중 오류가 발생했습니다.');
  } finally {
    button.disabled = false;
  }
}

function openReview(id){$('#reviewRecipeId').value=id;$('#reviewNickname').value=data.nickname==='게스트'?'':data.nickname;$('#reviewText').value='';$('#reviewPhoto').value='';$('#photoPreview').innerHTML='';showView('reviewView')}
$('#reviewPhoto').addEventListener('change',()=>{const f=$('#reviewPhoto').files[0];$('#photoPreview').innerHTML='';if(f){if(f.size>3*1024*1024){toast('사진은 3MB 이하로 선택해 주세요.');$('#reviewPhoto').value='';return}const img=document.createElement('img');img.alt='선택한 사진 미리보기';img.src=URL.createObjectURL(f);$('#photoPreview').appendChild(img)}});
$('#reviewForm').addEventListener('submit',e=>{e.preventDefault();const f=$('#reviewPhoto').files[0];if(!f){toast('사진을 첨부해 주세요.');return}const reader=new FileReader();reader.onload=()=>{const id=$('#reviewRecipeId').value;const r=data.recipes.find(x=>x.id===id);const rv={id:'rv'+Date.now(),recipeId:id,nickname:$('#reviewNickname').value.trim()||'게스트',rating:Number($('#reviewRating').value),text:$('#reviewText').value.trim(),photo:reader.result,date:new Date().toISOString()};data.reviews.unshift(rv);data.nickname=rv.nickname;data.points.unshift({id:'pt'+Date.now(),type:'earn',amount:10,label:`사진 리뷰: ${r?.name||'조합 리뷰'}`,date:rv.date});/* 리뷰는 샘플 평점과 검증 여부를 바꾸지 않습니다. */save();toast('사진 리뷰 등록 완료! 10P 적립했어요.');openDetail(id)};reader.readAsDataURL(f)});
// 사용자 조합 등록: PostgreSQL 저장이 성공한 경우에만 화면과 로컬 캐시에도 추가
$('#uploadForm').addEventListener('submit', async e => {
  e.preventDefault();

  const form = e.currentTarget;
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn?.disabled) return;

  const name = $('#newName').value.trim();
  const brand = $('#newBrand').value;
  const category = $('#newCategory').value;
  const price = Number($('#newPrice').value);
  const spicy = Number($('#newSpicy').value);
  const ingredients = $('#newIngredients').value.split(',').map(x => x.trim()).filter(Boolean);
  const steps = $('#newSteps').value.split(/\n+/).map(x => x.trim()).filter(Boolean);
  const finalSteps = steps.length ? steps : ['등록한 재료를 취향에 맞게 조합해 주세요.'];
  const desc = '사용자가 등록한 커스텀 조합이에요.';

  if (!name || !category || !ingredients.length) {
    toast('조합 이름, 종류, 재료를 입력해 주세요.');
    return;
  }
  // 현재 카드 UI는 가격이 없는 조합을 지원하지 않으므로 이번 연결에서는 가격 필수
  if (!Number.isInteger(price) || price <= 0 || price > 10000000) {
    toast('예상 가격을 1원 이상으로 입력해 주세요.');
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  try {
    const apiBase = window.PICKFOO_API_BASE;

    // Django CSRF 쿠키 발급 (현재 프로젝트에서 이미 사용 중인 엔드포인트)
    const csrfResponse = await fetch(apiBase + '/api/accounts/csrf/', {
      method: 'GET',
      credentials: 'include'
    });
    if (!csrfResponse.ok) throw new Error('CSRF 쿠키 발급 실패 (' + csrfResponse.status + ')');

    const csrfCookie = document.cookie.split('; ')
      .find(c => c.startsWith('csrftoken='));
    const csrfToken = csrfCookie ? decodeURIComponent(csrfCookie.slice('csrftoken='.length)) : '';
    if (!csrfToken) throw new Error('CSRF 토큰을 찾지 못했습니다.');

    const response = await fetch(apiBase + '/api/catalog/recipes/', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify({
        name,
        brand_name: brand,
        category,
        estimated_price: price,
        spicy,
        description: desc,
        ingredients,
        steps: finalSteps
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) throw new Error('로그인 후 등록해 주세요.');
      if (response.status === 403) throw new Error('보안 인증에 실패했습니다. 새로고침 후 다시 시도해 주세요.');
      throw new Error(payload.error || '등록 실패 (HTTP ' + response.status + ')');
    }

    const serverRecipe = payload.recipe;
    if (!serverRecipe || !Number.isInteger(serverRecipe.id)) {
      throw new Error('서버 저장 응답을 확인할 수 없습니다.');
    }

    // 기존 UI와 상세 화면을 유지하기 위한 로컬 캐시. 서버가 원본임.
    const recipe = {
      id: 'db' + serverRecipe.id,
      serverRecipeId: serverRecipe.id,
      dbSaved: true,
      name, brand, category, price, spicy,
      emoji: '🍽️', color: '#e4eee6',
      demoPicked: false, rating: 0, reviewCount: 0,
      ingredients, steps: finalSteps, desc
    };
    // 같은 DB 조합을 캐시에 중복 추가하지 않기
    data.recipes = data.recipes.filter(r => r.serverRecipeId !== serverRecipe.id);
    data.recipes.unshift(recipe);
    save();
    form.reset();
    state.brand = '전체 브랜드';
    state.food = '전체 음식';
    renderCategories();
    toast('PostgreSQL에 음식 조합을 저장했어요!');
    openDetail(recipe.id);
  } catch (error) {
    console.error('PICKFOO 조합 등록 오류:', error);
    toast(error.message || '조합 등록 중 오류가 발생했습니다.');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});
function balance(){return data.points.reduce((n,p)=>n+(p.type==='earn'?p.amount:-p.amount),0)}function renderPoints(){if(window.PICKFOO_DB_POINTS)return window.PICKFOO_DB_POINTS.renderPoints();$('#pointsBalance').textContent=balance().toLocaleString();const h=$('#pointsHistory');h.innerHTML='';if(!data.points.length){h.innerHTML='<div class="empty-state">아직 포인트 내역이 없어요.<br>사진 리뷰를 작성하면 10P를 받을 수 있어요.</div>';return}data.points.forEach(p=>{const d=document.createElement('div');d.className='history-item';d.innerHTML=`<div>${esc(p.label)}<small>${new Date(p.date).toLocaleDateString('ko-KR')}</small></div><span class="${p.type==='earn'?'earn':'spend'}">${p.type==='earn'?'+':'−'}${p.amount}P</span>`;h.appendChild(d)})}
function renderShop(){if(window.PICKFOO_DB_POINTS)return window.PICKFOO_DB_POINTS.renderShop();$('#shopBalance').textContent=balance()+'P';$('#shopGrid').innerHTML='';products.forEach(p=>{const card=document.createElement('div');card.className='shop-card';card.innerHTML=`<div class="shop-emoji">${p.emoji}</div><h3>${esc(p.name)}</h3><p>${p.price}P · ${esc(p.desc)}</p><button ${balance()<p.price?'disabled':''}>${balance()<p.price?'포인트 부족':p.price+'P로 교환'}</button>`;card.querySelector('button').addEventListener('click',()=>{if(balance()<p.price){toast('포인트가 부족해요.');return}if(!confirm(`${p.name}을(를) ${p.price}P로 교환할까요? 실제 상품이 지급되지는 않는 시제품 체험입니다.`))return;data.points.unshift({id:'pt'+Date.now(),type:'spend',amount:p.price,label:`상점 교환: ${p.name}`,date:new Date().toISOString()});save();renderShop();toast('시제품 교환 내역이 저장됐어요.')});$('#shopGrid').appendChild(card)})}
function getCurrentUser(){try{return JSON.parse(localStorage.getItem('pickfoo_current_user')||'null')}catch(e){return null}}function renderProfile(){const user=getCurrentUser();const name=user?.nickname||data.nickname||'게스트';$('#profileName').textContent=name;$('#profileNickname').value=name==='게스트'?'':name;$('#profileFood').value=data.preferences?.food||'전체';$('#profileBrand').value=data.preferences?.brand||'전체';$('#profileLoginLink').style.display=user?'none':'block';$('#profileLogoutBtn').style.display=user?'block':'none';$('#profileAuthNotice').textContent=user?`로그인 계정: ${user.email}`:'이 기기에만 저장되는 시연용 계정입니다. 실제 비밀번호를 사용하지 마세요.'}$('#profileForm').addEventListener('submit',e=>{e.preventDefault();const user=getCurrentUser();data.nickname=$('#profileNickname').value.trim()||'게스트';data.preferences={food:$('#profileFood').value,brand:$('#profileBrand').value};save();if(user){user.nickname=data.nickname;user.preferences={...(user.preferences||{}),food:data.preferences.food,brand:data.preferences.brand};localStorage.setItem('pickfoo_current_user',JSON.stringify(user));try{const users=JSON.parse(localStorage.getItem('pickfoo_users')||'[]');localStorage.setItem('pickfoo_users',JSON.stringify(users.map(u=>u.email===user.email?{...u,...user}:u)))}catch(e){}}renderProfile();toast('취향을 저장했어요.')});$('#profileLogoutBtn').addEventListener('click',e=>{e.preventDefault();localStorage.removeItem('pickfoo_current_user');toast('이 기기의 시연용 계정에서 로그아웃했어요.');renderProfile()});
$('#sortMode').addEventListener('change',()=>{if($('#sortMode').value==='personalized'&&!activePreferences()){toast('마이페이지에서 취향을 먼저 저장해 주세요.');$('#sortMode').value='default'}renderRecipes()});$('#searchInput').addEventListener('input',renderRecipes);$('#searchClear').addEventListener('click',()=>{$('#searchInput').value='';renderRecipes()});$('#budgetFilter').addEventListener('change',renderRecipes);$('#spicyFilter').addEventListener('change',renderRecipes);$('#excludeBtn').addEventListener('click',()=>{state.exclude=!state.exclude;$('#excludeBtn').innerHTML=state.exclude?'알레르기 유발 재료 제외 ✓ <span>⌄</span>':'땅콩·갑각류 제외 <span>⌄</span>';renderRecipes();toast(state.exclude?'땅콩·갑각류·새우 포함 조합을 제외해요.':'재료 제외 필터를 해제했어요.')});$('#verifiedToggle').addEventListener('click',()=>{state.verified=!state.verified;$('#verifiedToggle').classList.toggle('off',!state.verified);$('.checkmark').textContent=state.verified?'✓':' ';renderRecipes()});$('#resetFilters').addEventListener('click',()=>{state={brand:'전체 브랜드',food:'전체 음식',verified:false,exclude:false,selected:null};$('#searchInput').value='';$('#sortMode').value='default';$('#budgetFilter').value='all';$('#spicyFilter').value='all';$('#excludeBtn').innerHTML='땅콩·갑각류 제외 <span>⌄</span>';$('#verifiedToggle').classList.add('off');$('.checkmark').textContent=' ';$('#brandCount').textContent='전체 브랜드 선택';renderCategories();renderRecipes()});
$('#uploadComboBtn').addEventListener('click',()=>showView('uploadView'));$('#pointsBtn').addEventListener('click',()=>showView('pointsView'));$('#openShopBtn').addEventListener('click',()=>showView('shopView'));$('#navUpload').addEventListener('click',()=>showView('uploadView'));$('#navPoints').addEventListener('click',()=>showView('pointsView'));$('#navMy').addEventListener('click',()=>showView('myPageView'));$('#myPageBtn').addEventListener('click',()=>showView('myPageView'));$('#myPointsBtn').addEventListener('click',()=>showView('pointsView'));$$('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));$('#backBtn').addEventListener('click',()=>{let prev=viewHistory.pop();while(prev&&prev===currentView())prev=viewHistory.pop();showView(prev||'homeView',true)});
renderCategories();
renderRecipes();
renderPoints();
renderShop();
renderProfile();

// 서버에서 사용자 음식 취향과 본인 등록 조합, 내 실제 평가 이력 불러오기
loadDbRecommendationPreferences();
loadMyDbRecipes();
void loadDbRatingHistory();
// 돌아왔을 때 로그인 계정·평가 수정 사항을 다시 읽습니다.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void loadDbRatingHistory();
});

// PICKFOO_STEP233_VERIFICATION: only real server reviews can award a badge.
window.addEventListener('pickfoo:curated-verification', event => {
  const values = event.detail || {};
  for (const item of data.recipes) {
    if (item.curated === true && Object.prototype.hasOwnProperty.call(values, item.id)) {
      item.verification = values[item.id];
    }
  }
  renderRecipes();
  // 검증 평가의 생성·수정·삭제 후 요약이 갱신될 때 개인 이력도 갱신합니다.
  void loadDbRatingHistory(true);
});

// PICKFOO_STEP236_TRENDING: 메인 추천 상태와 무관하게 전시 조합 상세를 엽니다.
window.addEventListener('pickfoo:open-curated-recipe', event => {
  const key = event.detail?.key;
  if (typeof key !== 'string' || !/^pf-curated-(0[1-9]|1\d|20)$/.test(key)) return;
  if (data.recipes.some(r => r.curated === true && r.id === key)) openDetail(key);
});
})();
