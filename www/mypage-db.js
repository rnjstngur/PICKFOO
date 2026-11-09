// PICKFOO 마이페이지 DB 연결

const API_BASE = window.PICKFOO_API_BASE;

// HTML 요소 찾기
function el(id) {
    return document.getElementById(id);
}

// 쿠키 읽기
function getCookie(name) {
    const cookies = document.cookie.split(";");

    for (const cookie of cookies) {
        const [key, ...value] = cookie.trim().split("=");

        if (key === name) {
            return decodeURIComponent(value.join("="));
        }
    }

    return null;
}

// 회원 정보 화면에 표시
function renderUser(user) {

    const nickname = user.nickname || "회원";

    el("greetingName").textContent = nickname;

    el("profileNickname").textContent = nickname;

    el("profileEmail").textContent = user.email;

    el("avatarInitial").textContent =
        Array.from(nickname)[0] || "P";
}

// 음식 취향 항목 생성
function addTasteRow(container, label, values) {

    const row = document.createElement("div");
    row.className = "taste-row";

    const title = document.createElement("strong");
    title.textContent = label;

    const content = document.createElement("div");

    if (!Array.isArray(values) || values.length === 0) {

        const empty = document.createElement("span");

        empty.className = "muted";
        empty.textContent = "선택 없음";

        content.appendChild(empty);

    } else {

        values.forEach(value => {

            const chip = document.createElement("span");

            chip.className = "taste-chip";
            chip.textContent = String(value);

            content.appendChild(chip);
        });
    }

    row.appendChild(title);
    row.appendChild(content);

    container.appendChild(row);
}

// DB 음식 취향 화면에 표시
function renderPreferences(p) {

    const container = el("tasteSummary");

    container.replaceChildren();

    // 매운맛 표시 변환
    const spicyMap = {
        "0": "맵지 않음",
        "1": "약간 매움",
        "2": "매움",
        "all": "상관없음"
    };

    const spicy =
        spicyMap[p.spicy] || p.spicy || "상관없음";

    // 예산 표시 변환
    let budget = "제한 없음";

    if (p.budget && p.budget !== "all") {

        const amount = Number(p.budget);

        budget = Number.isFinite(amount)
            ? amount.toLocaleString("ko-KR") + "원 이하"
            : p.budget;
    }

    // 각 항목 출력
    addTasteRow(
        container,
        "좋아하는 음식",
        p.food_types || []
    );

    addTasteRow(
        container,
        "선호 브랜드",
        p.brands || []
    );

    addTasteRow(
        container,
        "선호하는 맛",
        p.flavors || []
    );

    addTasteRow(
        container,
        "매운맛",
        [spicy]
    );

    addTasteRow(
        container,
        "한 끼 예산",
        [budget]
    );

    addTasteRow(
        container,
        "제외 재료",
        p.excluded_ingredients || []
    );

    addTasteRow(
        container,
        "알레르기 정보",
        p.allergies || []
    );
}

// Django 로그인 정보 불러오기
async function loadMyPage() {

    // 1. 로그인한 사용자 조회
    const userResponse = await fetch(
        API_BASE + "/api/accounts/me/",
        {
            credentials: "include"
        }
    );

    // 로그인하지 않은 경우
    if (userResponse.status === 401) {

        alert("로그인이 필요합니다.");

        location.href = "login.html";

        return;
    }

    if (!userResponse.ok) {
        throw new Error("회원 정보를 불러올 수 없습니다.");
    }

    const userResult = await userResponse.json();

    // 2. 회원 정보 표시
    renderUser(userResult.user);

    // 3. 음식 취향 조회
    const prefResponse = await fetch(
        API_BASE + "/api/accounts/preferences/",
        {
            credentials: "include"
        }
    );

    if (!prefResponse.ok) {
        throw new Error("음식 취향을 불러올 수 없습니다.");
    }

    const prefResult = await prefResponse.json();

    // 4. 음식 취향 표시
    renderPreferences(prefResult.preferences || {});
}

// 로그아웃 처리
async function logoutUser() {

    // CSRF 쿠키 준비
    const csrfResponse = await fetch(
        API_BASE + "/api/accounts/csrf/",
        {
            credentials: "include"
        }
    );

    if (!csrfResponse.ok) {
        throw new Error("CSRF 토큰 요청에 실패했습니다.");
    }

    const csrfToken = getCookie("csrftoken");

    if (!csrfToken) {
        throw new Error("CSRF 토큰을 찾을 수 없습니다.");
    }

    // Django 로그아웃
    const response = await fetch(
        API_BASE + "/api/accounts/logout/",
        {
            method: "POST",
            credentials: "include",
            headers: {
                "X-CSRFToken": csrfToken
            }
        }
    );

    if (!response.ok) {
        throw new Error("로그아웃에 실패했습니다.");
    }

    // 기존 시연용 로그인 정보 정리
    localStorage.removeItem("pickfoo_current_user");

    alert("로그아웃되었습니다.");

    location.href = "index.html";
}

// 페이지 로딩
document.addEventListener("DOMContentLoaded", () => {

    // 마이페이지 정보 불러오기
    loadMyPage().catch(error => {

        console.error(error);

        el("tasteSummary").textContent =
            "서버 연결 상태를 확인해 주세요.";
    });

    // 로그아웃 버튼
    el("logoutButton").addEventListener("click", async () => {

        try {
            await logoutUser();
        } catch (error) {

            console.error(error);
            alert(error.message);
        }
    });

    // 닉네임 수정은 추후 DB API 연결
    el("editNickname").addEventListener("click", () => {

        alert("닉네임 수정 기능은 서버 연동 후 이용할 수 있습니다.");
    });
});