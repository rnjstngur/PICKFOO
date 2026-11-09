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
