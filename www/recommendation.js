/* PICKFOO STEP 235 - 기존 취향 점수와 실제 개인 평가 이력을 혼합하는 규칙 기반 추천 */
(function (root, factory) {
  const api=factory();
  if (typeof module==='object' && module.exports) module.exports=api;
  if (root) root.PICKFOO_RECOMMENDER=api;
})(typeof window!=='undefined' ? window : null, function () {
  const text=v=>String(v??'').toLowerCase().replace(/\s+/g,'');
  function sameFood(value, target) {
    const a = text(value), b = text(target);
    if (a===b) return true;
    const coffee = new Set([text('카페·음료'),text('카페·디저트')]);
    return coffee.has(a)&&coffee.has(b);
  }
  function sameBrand(value, target) {
    const normalize = v=>text(v).replace('써브웨이','서브웨이');
    return normalize(value)===normalize(target);
  }
  // 맛 특징: 조합 이름·재료의 키워드 규칙으로 추정한다(학습 모델 아님). 규칙은 아래 표가 전부다.
  const FLAVOR_RULES = {
    '달콤한 맛': ['초코','초콜릿','시럽','딸기','바닐라','캐러멜','카라멜','휘핑','아이스티','에이드','복숭아','꿀','허니','데리야끼','프라푸치노','쿠키','크림','스위트','망고','고디바','누가','마시멜로'],
    '짭짤한 맛': ['라면','라볶이','소시지','햄','베이컨','짜파','짜장','간장','육개장','삼각김밥','비엠티','이탈리안','스테이크','감자칩','김가루','참치'],
    '담백한 맛': ['계란','에그','두부','닭가슴','우유','플랫브레드','화이트','오트','햇반','밥','샐러드'],
    '매콤한 맛': ['불닭','떡볶이','할라피뇨','핫 칠리','핫','매운','스파이시','고추','치폴레','짬뽕','마라'],
    '고소한 맛': ['치즈','마요','버터','참깨','깨','땅콩','견과','파마산','참기름','콘','옥수수','말차','그린티','콩']
  };
  function flavorTags(recipe) {
    const t = text([recipe.name, ...(recipe.ingredients||[])].join(' '));
    const tags = Object.keys(FLAVOR_RULES).filter(k => FLAVOR_RULES[k].some(w => t.includes(text(w))));
    if (Number(recipe.spicy) >= 1 && !tags.includes('매콤한 맛')) tags.push('매콤한 맛');
    return tags;
  }
  function flavorMatches(recipe, profile={}) {
    const wanted = (profile.flavors||[]).map(String);
    if (!wanted.length) return [];
    const tags = flavorTags(recipe);
    return wanted.filter(f => tags.includes(f));
  }
  // 취향 점수 P 원점수: 음식4 + 브랜드3 + 맵기2 + 선호 맛2 + 예산1 = 최대 12점
  const P_MAX = 12;
  function score(recipe, profile={}) {
    let points=0;
    const foods=profile.foodTypes||[];
    const brands=profile.brands||[];
    if(foods.some(v=>sameFood(v,recipe.category))) points+=4;
    if(brands.some(v=>sameBrand(v,recipe.brand))) points+=3;
    if(profile.spicy!==undefined && profile.spicy!=='all' && profile.spicy!=='' && Number(profile.spicy)===Number(recipe.spicy)) points+=2;
    if(flavorMatches(recipe, profile).length) points+=2;
    if(profile.budget && profile.budget!=='all' && recipe.price<=Number(profile.budget)) points+=1;
    return points;
  }
  function conflicts(recipe, profile={}) {
    const list=(recipe.ingredients||[]).map(v=>String(v??'').trim()).filter(Boolean);
    const ingredient=text(list.join(' '));
    const allergies=(profile.allergies||[]).map(text).filter(Boolean);
    const denied=[...(profile.excludedIngredients||[]).map(text).filter(Boolean),...allergies];
    // 알레르기를 등록했는데 재료 정보가 비어 있으면 안전 여부를 알 수 없으므로 제외한다.
    if (allergies.length && !list.length) return true;
    // 입력된 재료명 문자열의 포함 여부만 확인한다. 알레르기 안전을 보장하지 않는다.
    return denied.some(item=>ingredient.includes(item));
  }
  // 저장한 예산은 필수 조건으로 적용한다. 가격을 모르는 후보도 예산 충족을 확인할 수 없어 제외한다.
  function overBudget(recipe, profile={}) {
    const budget=Number(profile.budget);
    if (profile.budget==null || profile.budget==='' || profile.budget==='all' || !(budget>0)) return false;
    const price=Number(recipe.price);
    return !(Number.isFinite(price) && price>0 && price<=budget);
  }
  // 평가 이력 H: 본인이 평가한 *다른* 전시 조합 중 브랜드(0.5)/음식 종류(0.3)/맛 특징(0.2)이
  // 비슷한 항목의 평균 별점(1~5)을 0~10점으로 환산합니다.
  // 입력이 1건뿐이면 과적합을 막기 위해 과거 평가의 반영 비율을 작게 시작합니다.
  function historyScore(recipe, profile={}) {
    const history = Array.isArray(profile.history) ? profile.history : [];
    let weightedTotal = 0;
    let totalWeight = 0;
    for (const row of history) {
      if (!row || row.id === recipe.id) continue;
      const stars = Number(row.rating);
      if (!Number.isInteger(stars) || stars < 1 || stars > 5) continue;
      const brandMatch = sameBrand(row.brand, recipe.brand);
      const foodMatch = sameFood(row.category, recipe.category);
      // 맛 유사도: 두 조합의 맛 특징 Jaccard(교집합/합집합). 재료 정보가 없는 이력은 0.
      const a = new Set(flavorTags(row)), b = new Set(flavorTags(recipe));
      const union = new Set([...a, ...b]).size;
      const flavorSim = union ? [...a].filter(x => b.has(x)).length / union : 0;
      const weight = (brandMatch ? 0.5 : 0) + (foodMatch ? 0.3 : 0) + 0.2 * flavorSim;
      if (!weight) continue;
      weightedTotal += ((stars - 1) * 2.5) * weight;
      totalWeight += weight;
    }
    if (totalWeight <= 0) return null;
    return {value: weightedTotal / totalWeight, evidence: totalWeight};
  }

  // S=(1-alpha)P + alpha H. P/H 모두 0~10점 척도이며,
  // alpha는 유사 평가가 쌓일수록 최대 0.4까지 커집니다.
  // 이력이 없으면 alpha=0이므로 기존 추천 점수 P를 그대로 사용합니다.
  function hybridScore(recipe, profile={}) {
    const p = score(recipe, profile) * 10 / P_MAX;
    const h = historyScore(recipe, profile);
    if (!h) return {total:p, preference:p, history:null, alpha:0};
    const alpha = Math.min(0.4, 0.4 * h.evidence / (h.evidence + 2));
    return {total:(1-alpha)*p + alpha*h.value,
            preference:p, history:h.value, alpha};
  }

  function rank(recipes,profile={}) {
    return recipes.filter(r=>!conflicts(r,profile) && !overBudget(r,profile))
      .map((r,index)=>({r,index,points:hybridScore(r,profile).total}))
      .sort((a,b)=>b.points-a.points || a.index-b.index).map(x=>x.r);
  }
  // PICKFOO 개인화 추천 점수 및 이유 표시
function reason(recipe, profile = {}) {

    const parts = [];
    let maxPoints = 0;

    // 1. 좋아하는 음식 종류
    const foods = profile.foodTypes || [];

    if (foods.length > 0) {
        maxPoints += 4;

        if (foods.some(v=>sameFood(v,recipe.category))) {
            parts.push(
                `선호 음식(${recipe.category}) +4점`
            );
        }
    }

    // 2. 선호 브랜드
    const brands = profile.brands || [];

    if (brands.length > 0) {
        maxPoints += 3;

        if (brands.some(v=>sameBrand(v,recipe.brand))) {
            parts.push(
                `선호 브랜드(${recipe.brand}) +3점`
            );
        }
    }

    // 3. 매운맛 취향
    if (
        profile.spicy !== undefined &&
        profile.spicy !== "all" &&
        profile.spicy !== ""
    ) {
        maxPoints += 2;

        if (
            Number(profile.spicy) ===
            Number(recipe.spicy)
        ) {
            parts.push("매운맛 취향 일치 +2점");
        }
    }

    // 3-1. 선호 맛
    if ((profile.flavors||[]).length) {
        maxPoints += 2;
        const hit = flavorMatches(recipe, profile);
        if (hit.length) parts.push(`선호 맛(${hit.join('·')}) +2점`);
    }

    // 4. 예산 조건
    if (
        profile.budget &&
        profile.budget !== "all" &&
        Number(profile.budget) > 0
    ) {
        maxPoints += 1;

        if (
            recipe.price <=
            Number(profile.budget)
        ) {
            parts.push("설정 예산 이내 +1점");
        }
    }

    // 5. 기존 추천 알고리즘 점수 사용
    const points = score(recipe, profile);

    if (maxPoints === 0) {
        return "음식 취향을 설정하면 추천 이유가 표시됩니다.";
    }

    // 6. 추천 점수와 상세 이유 표시
    const explanation = parts.length
        ? parts.join(" · ")
        : "일치하는 선호 조건 없음";

    const hybrid = hybridScore(recipe, profile);
    const historyNote = hybrid.history == null ? '' :
      ` | 📚 내 평가 반영: 종합 ${hybrid.total.toFixed(1)}/10점 ` +
      `(평가 유사도 ${hybrid.history.toFixed(1)}/10점)`;
    return `⭐ 취향 일치 ${points}/${maxPoints}점 | ${explanation}${historyNote}`;
}
  // STEP 227: PostgreSQL의 개별 판매 메뉴에 대한 취향 점수.
  // Menu API에는 매운맛 정보가 없으므로 조합 추천의 매운맛 +2점을 적용하지 않는다.
  // 판매 여부나 알레르기 안전성을 판정하는 함수가 아니다.
  function normalizeMenuCategory(value) {
    const category = text(value);
    if (['카페', '카페·디저트', '카페디저트', '커피', '음료', '디저트'].some(x => category === text(x))) {
      return '카페·디저트';
    }
    if (['편의점', '편의점간편식', '간편식'].some(x => category === text(x))) {
      return '편의점 간편식';
    }
    return String(value ?? '').trim();
  }

  function scoreCatalogMenu(menu, profile={}) {
    let points = 0;
    const foodTypes = Array.isArray(profile.foodTypes) ? profile.foodTypes : [];
    const brands = Array.isArray(profile.brands) ? profile.brands : [];
    const category = text(normalizeMenuCategory(menu.category));
    if (category && foodTypes.some(v => text(normalizeMenuCategory(v)) === category)) points += 4;
    if (brands.some(v => text(v) === text(menu.brand))) points += 3;
    const budget = Number(profile.budget);
    const price = menu.price == null || menu.price === '' ? NaN : Number(menu.price);
    if (profile.budget !== 'all' && budget > 0 && Number.isFinite(price) && price > 0 && price <= budget) {
      points += 1;
    }
    return points;
  }

  function reasonCatalogMenu(menu, profile={}) {
    const parts = [];
    const foodTypes = Array.isArray(profile.foodTypes) ? profile.foodTypes : [];
    const brands = Array.isArray(profile.brands) ? profile.brands : [];
    const category = text(normalizeMenuCategory(menu.category));
    let maximum = 0;
    if (foodTypes.length) {
      maximum += 4;
      if (category && foodTypes.some(v => text(normalizeMenuCategory(v)) === category)) {
        parts.push('음식 종류 +4점');
      }
    }
    if (brands.length) {
      maximum += 3;
      if (brands.some(v => text(v) === text(menu.brand))) parts.push('선호 브랜드 +3점');
    }
    const budget = Number(profile.budget);
    const price = menu.price == null || menu.price === '' ? NaN : Number(menu.price);
    if (profile.budget !== 'all' && budget > 0) {
      maximum += 1;
      if (Number.isFinite(price) && price > 0 && price <= budget) parts.push('예산 이내 +1점');
    }
    if (!maximum) return '취향을 등록하면 실제 메뉴 추천 이유가 표시됩니다.';
    return `취향 일치 ${scoreCatalogMenu(menu,profile)}/${maximum}점 · ` +
      (parts.length ? parts.join(' · ') : '일치하는 선호 조건 없음') +
      ' · 매운맛 정보 없음';
  }

  return {score,conflicts,overBudget,rank,flavorTags,flavorMatches,reason,historyScore,hybridScore,normalizeMenuCategory,scoreCatalogMenu,reasonCatalogMenu};
});
