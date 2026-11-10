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
test('SNS 후보는 원문·확산·재료·주류 기준을 모두 맞춰야 채택된다',()=>{
 const base={platform:'instagram',sourceUrl:'https://www.instagram.com/p/x/',sourceDate:'2026-11-01',ingredients:['불닭볶음면','스트링치즈'],accounts:3,reactions:0};
 assert.equal(T.snsCheck(base).ok,true);
 assert.equal(T.snsCheck({...base,accounts:1}).ok,false);
 assert.equal(T.snsCheck({...base,accounts:1,reactions:1500}).ok,true);
 assert.equal(T.snsCheck({...base,ingredients:['불닭볶음면']}).ok,false);
 assert.equal(T.snsCheck({...base,sourceUrl:''}).ok,false);
 assert.equal(T.snsCheck({...base,ingredients:['소주','토닉워터']}).ok,false);
});
test('기준 미달 SNS 후보는 순위에서 빠지고, 단일 게시물 반응만 충족하면 외부 점수 0.8배',()=>{
 const a={key:'a',platform:'instagram',sourceUrl:'https://www.instagram.com/p/a/',sourceDate:'2026-11-09',ingredients:['x','y'],accounts:3};
 const b={key:'b',platform:'instagram',sourceUrl:'https://www.instagram.com/p/b/',sourceDate:'2026-11-09',ingredients:['x','y'],accounts:1,reactions:2000};
 const bad={key:'bad',platform:'tiktok',sourceUrl:'https://www.tiktok.com/@a/1',sourceDate:'2026-11-09',ingredients:['x'],accounts:5};
 const r=T.rankTrends([b,bad,a],now);
 assert.deepEqual(r.map(x=>x.key),['a','b']);
 assert.equal((r[1].trend.external/r[0].trend.external).toFixed(2),'0.80');
 assert.equal(r[0].trend.label,'📸 SNS 화제');
});
test('자동 수집 신호는 최근 30일 작성자 3명 이상일 때만 SNS 항목이 되고, 미달이면 원래 출처를 유지한다',()=>{
 const item={key:'k',name:'불닭 콘치즈',ingredients:['불닭볶음면','콘'],sourceDate:'2020-01-01'};
 const good={naver_blog:{authors30:4,authors120:9,latest:'2026-11-08',samples:[{url:'https://blog.naver.com/a/1'}]},youtube:{authors30:1,authors120:2,latest:'2026-11-09',samples:[]}};
 const g=T.applySignal(item,good,'2026-11-10T09:00:00+09:00');
 assert.equal(g.platform,'blog');assert.equal(g.accounts,4);assert.equal(g.sourceDate,'2026-11-08');assert.equal(g.autoCollected,true);
 assert.equal(T.trendScore(g,now).label,'📸 SNS 화제');
 const weak={naver_blog:{authors30:2,authors120:5,latest:'2026-11-08',samples:[{url:'https://blog.naver.com/a/1'}]}};
 const w=T.applySignal(item,weak,'2026-11-10');
 assert.equal(w.platform,undefined);assert.equal(w.sourceDate,'2020-01-01');assert.match(w.signalNote,/2명/);
 assert.equal(T.applySignal(item,null),item);
});

test('원문 예시 제목에 조합 이름이 없으면 SNS 화제로 채택하지 않는다', () => {
  const T = require('../www/trend.js');
  const base = { id: 'x', title: '돼지바 프라푸치노', sourceDate: '2020-06-28', ingredients: ['자바칩 프라푸치노', '딸기 시럽', '초콜릿 칩'] };
  const sig = { kakao_blog: { authors30: 5, authors120: 19, latest: '2026-11-09', samples: [{ url: 'https://a.example/1', title: '논산 빵집', titleMatch: false }] } };
  const out = T.applySignal(base, sig, '2026-11-10T18:00:00+09:00');
  assert.equal(out.autoCollected, undefined);
  assert.match(out.signalNote, /제목 일치 원문 없음/);
  const ok = { kakao_blog: Object.assign({}, sig.kakao_blog, { samples: [{ url: 'https://b.example/1', title: '돼지바 프라푸치노 후기', titleMatch: true }] }) };
  assert.equal(T.applySignal(base, ok, '2026-11-10T18:00:00+09:00').autoCollected, true);
});
