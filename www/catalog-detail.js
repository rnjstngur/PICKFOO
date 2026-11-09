// PICKFOO 음식 조합 상세 화면에 DB 메뉴 정보 표시

(function () {

    const detail = document.getElementById("detailContent");

    if (!detail) {
        console.warn("PICKFOO 상세 화면을 찾지 못했습니다.");
        return;
    }

    function showDbMenuDetail() {

        // 현재 상세 화면의 음식 조합 이름
        const title = detail.querySelector(".detail-title");

        if (!title) return;

        // 중복 생성 방지
        if (detail.querySelector(".catalog-reference")) {
            return;
        }

        const recipeName = title.textContent.trim();

        // 기존 음식 조합과 연결된 DB 메뉴 후보 찾기
        const links =
            window.PICKFOO_RECIPE_MENU_CANDIDATES || [];

        const link = links.find(function (item) {
            return (
                item.recipeName === recipeName &&
                item.dbMenuId != null
            );
        });

        if (!link) return;

        // PostgreSQL에서 불러온 메뉴 정보 찾기
        const menus = window.PICKFOO_DB_MENUS || [];

        const menu = menus.find(function (item) {
            return String(item.id) === String(link.dbMenuId);
        });

        if (!menu) return;

        // DB 메뉴 정보 박스 생성
        const section = document.createElement("div");
        section.className = "detail-section catalog-reference";

        const heading = document.createElement("h3");
        heading.textContent = "🏪 참고할 수 있는 실제 DB 메뉴";

        section.appendChild(heading);

        // 브랜드 및 메뉴 이름
        const name = document.createElement("p");
        name.textContent = menu.brand + " · " + menu.name;

        section.appendChild(name);

        // 가격 정보
        const price = document.createElement("p");

        price.textContent =
            "💰 가격: " +
            (
                menu.price == null
                    ? "미확인"
                    : Number(menu.price).toLocaleString() + "원"
            );

        section.appendChild(price);

        // 재료 정보
        const ingredients = document.createElement("p");

        ingredients.textContent =
            "🥬 등록된 주요 재료: " +
            (
                menu.ingredients && menu.ingredients.length
                    ? menu.ingredients.join(", ")
                    : "정보 없음"
            );

        section.appendChild(ingredients);

        // 제외 재료가 발견된 경우 경고
        if (menu.excluded) {

            const warning = document.createElement("p");

            warning.style.color = "#d93030";
            warning.style.fontWeight = "bold";

            warning.textContent =
                "⛔ 내 제외 재료 발견: " +
                (menu.matched_ingredients || []).join(", ");

            section.appendChild(warning);
        }

        // 정보 출처
        if (
            menu.source_url &&
            /^https?:\/\//i.test(menu.source_url)
        ) {

            const source = document.createElement("a");

            source.href = menu.source_url;
            source.target = "_blank";
            source.rel = "noopener noreferrer";

            source.textContent = "🔗 메뉴 정보 출처 확인";

            section.appendChild(source);
        }

        // 안내 문구
        const notice = document.createElement("p");

        notice.className = "notice";

        notice.textContent =
            "이 메뉴는 음식 조합의 참고 후보입니다. " +
            "조합과 동일한 상품이라는 의미는 아니며, " +
            "전체 원재료와 현재 판매 여부는 확인되지 않았습니다.";

        section.appendChild(notice);

        // 기존 필요한 재료 영역 바로 아래에 표시
        const ingredientSection = detail
            .querySelector(".ingredient-list")
            ?.closest(".detail-section");

        if (ingredientSection) {
            ingredientSection.after(section);
        } else {
            detail.appendChild(section);
        }

        console.log(
            "✅ PICKFOO 상세 화면 DB 메뉴 연결 성공:",
            menu.name
        );
    }

    // 상세 화면이 새로 열리면 자동 표시
    const observer = new MutationObserver(showDbMenuDetail);

    observer.observe(detail, {
        childList: true
    });

    // DB 메뉴를 불러온 뒤에도 화면 갱신
    document.addEventListener(
        "pickfoo:catalog-ready",
        showDbMenuDetail
    );

    showDbMenuDetail();

})();