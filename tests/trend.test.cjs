const test=require('node:test');const assert=require('node:assert/strict');
const T=require('../www/trend.js');
const now=new Date('2026-11-09T12:00:00+09:00');
test('소개 직후 외부 점수는 10점이고 45일마다 절반이 된다',()=>{
 assert.equal(Math.round(T.externalScore('2026-11-09',now).value),10);
 assert.equal(T.externalScore('2026-09-25',now).value.toFixed(1),'5.0');
});
test('소개 후 120일이 지나면 스테디로 분류하고 외부 점수는 0',()=>{
 const e=T.externalScore('2026-06-01',now);assert.equal(e.kind,'steady');assert.equal(e.value,0);
 assert.equal(T.externalScore(null,now).kind,'unknown');
});
test('앱 반응 점수는 최근 7일 평가자 수와 평균 별점으로 계산하고 10점이 상한',()=>{
 assert.equal(T.inAppScore(0,5),0);assert.equal(T.inAppScore(3,5),6);assert.equal(T.inAppScore(10,5),10);assert.equal(T.inAppScore(3,2.5),3);
});
test('오래된 조합이라도 이번 주 앱 반응이 크면 최근 소개 조합보다 앞설 수 있다',()=>{
 const r=T.rankTrends([{key:'old',sourceDate:'2020-06-28',reviewers7d:5,avg7d:5},{key:'new',sourceDate:'2026-08-12',reviewers7d:0,avg7d:0}],now);
 assert.deepEqual(r.map(x=>x.key),['old','new']);
 assert.equal(r[0].trend.label,'👥 PICKFOO 반응');assert.equal(r[1].trend.label,'📰 최근 외부 소개');
});
test('누적 인기만 있는 과거 조합은 트렌드 점수 0',()=>{
 assert.equal(T.trendScore({sourceDate:'2018-09-24'},now).total,0);
});
