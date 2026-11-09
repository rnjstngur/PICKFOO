// PICKFOO 음식 취향 DB 연결

const API_BASE = window.PICKFOO_API_BASE;

// CSRF 쿠키 읽기
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

// 안내 메시지
function showMessage(text, isError = true) {
    const msg = document.getElementById("formMessage");

    msg.textContent = text;
    msg.className = "form-message " +
        (isError ? "error" : "success");
}

// 선택한 체크박스 값 가져오기
function checkedValues(group) {
    return [
        ...document.querySelectorAll(
            `[data-group="${group}"] input:checked`
        )
    ].map(input => input.value);
}

// 저장된 체크박스 값 표시
function setCheckedValues(group, values = []) {
    document.querySelectorAll(
        `[data-group="${group}"] input`
    ).forEach(input => {
        input.checked = values.includes(input.value);
    });
}

// 라디오 버튼 선택
function setRadioValue(name, value) {
    document.querySelectorAll(
        `input[name="${name}"]`
    ).forEach(input => {
        input.checked = input.value === value;
    });
}

// 쉼표로 구분된 재료 목록
function parseList(value) {
    return value.split(",")
        .map(item => item.trim())
        .filter(Boolean);
}

// DB에서 가져온 음식 취향 표시
function renderPreferences(p) {

    setCheckedValues("foodTypes", p.food_types || []);
    setCheckedValues("brands", p.brands || []);
    setCheckedValues("flavors", p.flavors || []);

    // 기존 테스트 데이터와 화면 선택값 호환
    const spicyMap = {
        "맵지 않음": "0",
        "약간 매움": "1",
        "매움": "2"
    };

    const spicy = spicyMap[p.spicy] || p.spicy || "all";

    setRadioValue("spicy", spicy);
    setRadioValue("budget", p.budget || "all");

    document.getElementById("excludedIngredients").value =
        (p.excluded_ingredients || []).join(", ");

    document.getElementById("allergies").value =
        (p.allergies || []).join(", ");
}

// 음식 취향 DB에서 불러오기
async function loadPreferences() {

    const response = await fetch(
        API_BASE + "/api/accounts/preferences/",
        {
            method: "GET",
            credentials: "include"
        }
    );

    if (response.status === 401) {
        throw new Error("먼저 로그인해 주세요.");
    }

    if (!response.ok) {
        throw new Error("음식 취향을 불러오지 못했습니다.");
    }

    const result = await response.json();

    if (result.preferences) {
        renderPreferences(result.preferences);
    }
}

// CSRF 토큰 준비
async function getCsrfToken() {

    const response = await fetch(
        API_BASE + "/api/accounts/csrf/",
        {
            credentials: "include"
        }
    );

    if (!response.ok) {
        throw new Error("CSRF 토큰 요청 실패");
    }

    const token = getCookie("csrftoken");

    if (!token) {
        throw new Error("CSRF 토큰을 찾을 수 없습니다.");
    }

    return token;
}

// 페이지 실행
document.addEventListener("DOMContentLoaded", async () => {

    const form = document.getElementById("preferencesForm");
    const button = form.querySelector('button[type="submit"]');

    // 1. 기존 음식 취향 불러오기
    try {
        await loadPreferences();
    } catch (error) {
        showMessage(error.message);
    }

    // 2. 음식 취향 저장
    form.addEventListener("submit", async (event) => {

        event.preventDefault();
        button.disabled = true;

        const data = {
            food_types: checkedValues("foodTypes"),
            brands: checkedValues("brands"),
            flavors: checkedValues("flavors"),

            spicy:
                document.querySelector(
                    'input[name="spicy"]:checked'
                )?.value || "all",

            budget:
                document.querySelector(
                    'input[name="budget"]:checked'
                )?.value || "all",

            excluded_ingredients: parseList(
                document.getElementById(
                    "excludedIngredients"
                ).value
            ),

            allergies: parseList(
                document.getElementById(
                    "allergies"
                ).value
            )
        };

        try {

            const csrfToken = await getCsrfToken();

            const response = await fetch(
                API_BASE + "/api/accounts/preferences/",
                {
                    method: "POST",
                    credentials: "include",

                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfToken
                    },

                    body: JSON.stringify(data)
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "저장에 실패했습니다."
                );
            }

            showMessage(
                "음식 취향이 데이터베이스에 저장되었습니다!",
                false
            );

        } catch (error) {
            showMessage(error.message);
        } finally {
            button.disabled = false;
        }

    });

});