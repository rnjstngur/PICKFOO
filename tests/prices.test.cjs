const test=require('node:test');const assert=require('node:assert/strict');
const P=require('../www/prices.js');
test('편의점 조합은 재료 판매가 합계(모두 확인된 경우)',()=>{
  const r={curated:true,brand:'편의점(CU·GS25 등)',ingredients:['짜파게티','불닭볶음면'],price:4000};
  const i=P.info(r); assert.equal(i.kind,'sum'); assert.equal(i.total,3400); assert.equal(i.label,'3,400원');
  P.applyTo([r]); assert.equal(r.price,3400);
});
test('가격 미확인 재료가 있으면 합계를 보여주지 않는다',()=>{
  const i=P.info({curated:true,brand:'편의점(CU·GS25 등)',ingredients:['불닭볶음면','미등록재료']});
  assert.equal(i.kind,'pending'); assert.equal(i.total,null); assert.deepEqual(i.missing,['미등록재료']);
});
test('편의점에서 팔지 않는 재료는 합계에서 빼고 안내한다',()=>{
  const i=P.info({curated:true,brand:'편의점(CU·GS25 등)',ingredients:['복숭아 아이스티','에스프레소 샷']});
  assert.equal(i.kind,'sum'); assert.equal(i.total,900); assert.equal(i.excluded[0].name,'에스프레소 샷');
});
test('매장 메뉴는 숫자를 표시하지 않고, 사용자 조합은 입력값',()=>{
  assert.equal(P.info({curated:true,brand:'스타벅스',ingredients:['자바칩']}).label,'매장 가격 확인');
  assert.equal(P.info({curated:false,brand:'CU',price:5500}).label,'5,500원');
  assert.doesNotMatch(P.note({curated:true,brand:'편의점(CU·GS25 등)',ingredients:['짜파게티']}),/예상|약 /);
});
test('가격을 표시하지 않는 조합은 예산 필터에서 빼지 않는다',()=>{
  const R=require('../www/recommendation.js');
  const store={curated:true,brand:'스타벅스',ingredients:['자바칩'],price:8300};
  P.applyTo([store]); assert.equal(store.priceUnknown,true);
  assert.equal(R.overBudget(store,{budget:'5000'}),false);
  const user={curated:false,brand:'CU',price:8000}; P.applyTo([user]);
  assert.equal(R.overBudget(user,{budget:'5000'}),true);
});
test('매장 메뉴는 기본 메뉴 + 유료 옵션 합계, 출처 없는 토핑은 숫자를 만들지 않는다',()=>{
  const sw=P.info({id:'pf-curated-15',curated:true,brand:'써브웨이',ingredients:[]});
  assert.equal(sw.kind,'menu'); assert.equal(sw.total,7500);
  const sb=P.info({id:'pf-curated-10',curated:true,brand:'스타벅스',ingredients:[]});
  assert.equal(sb.total,6500+800*3);
  assert.match(P.note({id:'pf-curated-16',curated:true,brand:'써브웨이',ingredients:[]}),/베이컨 추가는 매장 가격/);
  assert.equal(P.info({id:'pf-curated-11',curated:true,brand:'스타벅스',ingredients:[]}).label,'매장 가격 확인');
});
