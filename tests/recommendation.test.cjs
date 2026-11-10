const test=require('node:test');const assert=require('node:assert/strict');
const R=require('../www/recommendation.js');
const a={id:'a',category:'한식',brand:'CU',spicy:0,price:4300,ingredients:['밥','계란']};
const b={id:'b',category:'카페·디저트',brand:'스타벅스',spicy:0,price:6100,ingredients:['우유']};
const c={id:'c',category:'한식',brand:'GS25',spicy:2,price:5200,ingredients:['새우','고추']};
test('한식 선호와 카페 선호 프로필에 따른 추천 순위가 달라진다',()=>{
 assert.equal(R.rank([b,a,c],{foodTypes:['한식'],brands:['CU']})[0].id,'a');
 assert.equal(R.rank([a,b,c],{foodTypes:['카페·디저트'],brands:['스타벅스']})[0].id,'b');
});
test('명시적으로 제외한 재료가 포함된 후보는 먼저 제외한다',()=>{
 assert.deepEqual(R.rank([a,b,c],{foodTypes:['한식'],excludedIngredients:['새우']}).map(r=>r.id),['a','b']);
});
test('프로필이 없으면 입력 순서를 유지한다',()=>{assert.deepEqual(R.rank([b,a,c],{}).map(r=>r.id),['b','a','c']);});
test('추천 이유가 선호 일치 요인을 설명한다',()=>{assert.match(R.reason(a,{foodTypes:['한식'],brands:['CU']}),/선호 음식.*선호 브랜드/)});
test('알레르기를 등록하면 재료 정보가 비어 있는 후보는 제외한다',()=>{
 const empty={id:'e',category:'한식',brand:'CU',spicy:0,price:3000,ingredients:[]};
 assert.deepEqual(R.rank([a,empty],{allergies:['땅콩']}).map(r=>r.id),['a']);
 assert.deepEqual(R.rank([a,empty],{}).map(r=>r.id),['a','e']);
});
test('저장한 예산을 넘는 후보는 개인화 추천에서 제외한다',()=>{
 assert.deepEqual(R.rank([a,b,c],{budget:'5000'}).map(r=>r.id),['a']);
 assert.deepEqual(R.rank([a,b,c],{budget:'all'}).map(r=>r.id),['a','b','c']);
});
test('선호 맛이 일치하면 +2점과 이유를 표시한다',()=>{
 const sweet={id:'s',category:'카페·디저트',brand:'스타벅스',spicy:0,price:6000,name:'딸기 프라푸치노',ingredients:['딸기 시럽','휘핑크림']};
 const salty={id:'t',category:'카페·디저트',brand:'스타벅스',spicy:0,price:6000,name:'햄 샌드',ingredients:['햄','빵']};
 assert.deepEqual(R.rank([salty,sweet],{flavors:['달콤한 맛']}).map(r=>r.id),['s','t']);
 assert.match(R.reason(sweet,{flavors:['달콤한 맛']}),/선호 맛\(달콤한 맛\) \+2점/);
});
test('평가 이력의 맛이 비슷한 조합이 더 높은 이력 점수를 받는다',()=>{
 const hist=[{id:'h',brand:'X',category:'Y',name:'초코 딸기',ingredients:['초코','딸기'],rating:5}];
 const sweet={id:'s',brand:'A',category:'B',name:'초코 쿠키',ingredients:['초코']};
 const spicy={id:'p',brand:'A',category:'B',name:'불닭',ingredients:['불닭볶음면']};
 assert.ok(R.historyScore(sweet,{history:hist}));
 assert.equal(R.historyScore(spicy,{history:hist}),null);
});
test('저장한 매운맛 단계보다 매운 조합은 개인화 추천에서 제외한다',()=>{
 const mild={id:'m',category:'한식',brand:'CU',spicy:0,price:3000,ingredients:['밥']};
 const hot={id:'h',category:'한식',brand:'CU',spicy:2,price:3000,ingredients:['불닭']};
 assert.deepEqual(R.rank([hot,mild],{spicy:'0'}).map(r=>r.id),['m']);
 assert.deepEqual(R.rank([hot,mild],{spicy:'2'}).map(r=>r.id).sort(),['h','m']);
 assert.deepEqual(R.rank([hot,mild],{spicy:'all'}).map(r=>r.id).sort(),['h','m']);
});

test('편의점 공용 조합은 CU·GS25 선호 브랜드와 같은 브랜드로 본다', () => {
  const R = require('../www/recommendation.js');
  assert.equal(R.sameBrand('CU', '편의점(CU·GS25 등)'), true);
  assert.equal(R.sameBrand('GS25', '편의점(CU·GS25 등)'), true);
  assert.equal(R.sameBrand('CU', 'GS25'), false);
  assert.equal(R.sameBrand('스타벅스', '편의점(CU·GS25 등)'), false);
  assert.equal(R.sameBrand('서브웨이', '써브웨이'), true);
});
