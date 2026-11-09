/* PICKFOO points ledger bridge: authenticated DB points only.
   Demo local points for sample recipes remain stored separately in localStorage,
   and are never presented as the actual logged-in user's DB balance.
*/
(() => {
  'use strict';
  const API = window.PICKFOO_API_BASE;
  const byId = (id) => document.getElementById(id);
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  };
  function renderMessage(target, text) {
    if (!target) return;
    target.replaceChildren(el('div','empty-state',text));
  }
  async function getToken() {
    const resp = await fetch(`${API}/api/accounts/csrf/`, { credentials:'include' });
    if (!resp.ok) throw new Error('CSRF 토큰 요청 실패');
    const data = await resp.json();
    const cookie = document.cookie.split('; ').find(x => x.startsWith('csrftoken='));
    const token = cookie ? decodeURIComponent(cookie.slice(10)) : data.csrf_token;
    if (!token) throw new Error('CSRF 토큰을 확인할 수 없습니다.');
    return token;
  }
  async function summary() {
    const resp = await fetch(`${API}/api/points/`, {credentials:'include', cache:'no-store'});
    if (resp.status === 401) throw new Error('로그인 후 포인트를 확인할 수 있어요.');
    if (!resp.ok) throw new Error(`포인트 서버 오류: HTTP ${resp.status}`);
    return resp.json();
  }
  let requestSeq = 0;
  async function renderPoints() {
    const seq = ++requestSeq;
    const balance = byId('pointsBalance'), history = byId('pointsHistory');
    if (balance) balance.textContent = '…';
    renderMessage(history, 'PostgreSQL 포인트 내역을 불러오는 중입니다.');
    const label = document.querySelector('#pointsView .points-card small');
    if (label) label.textContent = 'DB 사진 리뷰 최초 1회 10P (가상 포인트)';
    const hint = document.querySelector('#pointsView .section-heading .subtle');
    if (hint) hint.textContent = 'PostgreSQL에 저장됨';
    try {
      const data = await summary();
      if (seq !== requestSeq) return;
      if (balance) balance.textContent = Number(data.balance).toLocaleString('ko-KR');
      if (!history) return;
      history.replaceChildren();
      if (!data.history?.length) return renderMessage(history, '아직 DB 포인트 내역이 없습니다. 사진 리뷰를 처음 올리면 10P가 적립됩니다.');
      data.history.forEach(row => {
        const item = el('div','history-item');
        const info = el('div','',row.label);
        const date = el('small','',new Date(row.date).toLocaleDateString('ko-KR'));
        info.appendChild(date);
        item.appendChild(info);
        item.appendChild(el('span',row.type==='earn'?'earn':'spend',`${row.type==='earn'?'+':'−'}${row.amount}P`));
        history.appendChild(item);
      });
    } catch (e) { if (seq===requestSeq) { if(balance) balance.textContent='—'; renderMessage(history,e.message); } }
  }
  async function renderShop() {
    const seq=++requestSeq;
    const balance=byId('shopBalance'), grid=byId('shopGrid');
    if (balance) balance.textContent='…';
    renderMessage(grid,'시연용 포인트 상점을 불러오는 중입니다.');
    try {
      const data=await summary();
      if (seq!==requestSeq || !grid) return;
      if(balance) balance.textContent=`${data.balance}P`;
      grid.replaceChildren();
      const emojis={p1:'🎟️',p2:'☕',p3:'🍪',p4:'🎁'};
      data.products.forEach(product=>{
        const card=el('div','shop-card');
        card.append(el('div','shop-emoji',emojis[product.id]||'🎁'),
                    el('h3','',product.name),
                    el('p','',`${product.price}P · 시제품 교환 (실제 상품 없음)`));
        const btn=el('button','',data.balance<product.price?'포인트 부족':`${product.price}P로 교환`);
        btn.disabled=data.balance<product.price;
        btn.addEventListener('click',async()=>{
          if (!window.confirm(`${product.name}을(를) ${product.price}P로 시연용 교환할까요? 실제 상품은 제공되지 않습니다.`)) return;
          btn.disabled=true;
          try {
            const token=await getToken();
            const resp=await fetch(`${API}/api/points/redeem/`,{
              method:'POST',credentials:'include',
              headers:{'Content-Type':'application/json','X-CSRFToken':token},
              body:JSON.stringify({product_id:product.id})
            });
            const reply=await resp.json();
            if (!resp.ok) throw new Error(reply.error||`HTTP ${resp.status}`);
            window.alert(reply.message);
            renderShop();
          } catch(e){window.alert(e.message); btn.disabled=false;}
        });
        card.appendChild(btn);grid.appendChild(card);
      });
    }catch(e){if(seq===requestSeq){if(balance)balance.textContent='—';renderMessage(grid,e.message);}}
  }
  window.PICKFOO_DB_POINTS={renderPoints,renderShop,refresh:()=>{
    if(byId('pointsView')?.classList.contains('active')) renderPoints();
    if(byId('shopView')?.classList.contains('active')) renderShop();
  }};
})();
