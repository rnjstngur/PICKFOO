// PICKFOO Django 서버 주소
const LOGIN_API_BASE = window.PICKFOO_API_BASE;

// 쿠키에서 CSRF 토큰 읽기
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

// 로그인 결과 메시지 표시
function showMessage(text, isError = true) {
    const element = document.getElementById("formMessage");

    element.textContent = text;

    element.className =
        "form-message " + (isError ? "error" : "success");
}

// Django CSRF 토큰 가져오기
async function getCsrfToken() {
    const response = await fetch(
        LOGIN_API_BASE + "/api/accounts/csrf/",
        {
            method: "GET",
            credentials: "include"
        }
    );

    if (!response.ok) {
        throw new Error("CSRF 토큰 요청에 실패했습니다.");
    }

    const token = getCookie("csrftoken");

    if (!token) {
        throw new Error("CSRF 토큰을 확인할 수 없습니다.");
    }

    return token;
}

// 로그인 처리
document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");

    if (!loginForm) return;

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        // 사용자가 입력한 정보
        const email = document
            .getElementById("email")
            .value.trim().toLowerCase();

        const password = document
            .getElementById("password")
            .value;

        const button = loginForm.querySelector(
            "button[type=submit]"
        );

        button.disabled = true;

        try {

            // 1. CSRF 토큰 요청
            const csrfToken = await getCsrfToken();

            // 2. Django 로그인 API 호출
            const response = await fetch(
                LOGIN_API_BASE + "/api/accounts/login/",
                {
                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfToken
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            // 3. 서버 응답 확인
            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "로그인에 실패했습니다."
                );
            }

            // 4. 로그인 성공
            showMessage(
                result.user.nickname + "님, 로그인에 성공했습니다!",
                false
            );

            console.log("PICKFOO 로그인 성공:", result.user);

            // 서버 세션이 생성된 상태 → 취향을 아직 저장하지 않았으면 취향 설정, 저장했으면 메인으로 이동
            let nextPage = "index.html";
            try {
                const prefResponse = await fetch(
                    LOGIN_API_BASE + "/api/accounts/preferences/",
                    { method: "GET", credentials: "include", cache: "no-store" }
                );
                if (prefResponse.ok) {
                    const prefResult = await prefResponse.json();
                    if (!prefResult.preferences) nextPage = "preferences.html";
                }
            } catch (prefError) {
                console.warn("취향 확인 실패, 메인으로 이동합니다.", prefError);
            }
            setTimeout(() => { window.location.href = nextPage; }, 700);

        } catch (error) {

            console.error("로그인 오류:", error);

            showMessage(error.message);

        } finally {

            button.disabled = false;

        }

    });

});