// PICKFOO Django API 서버 주소
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

// 화면에 메시지 표시
function showMessage(text, isError = true) {
    const element = document.getElementById("formMessage");

    element.textContent = text;

    element.className =
        "form-message " + (isError ? "error" : "success");
}

// Django에서 CSRF 쿠키 받기
async function getCsrfToken() {
    const response = await fetch(
        API_BASE + "/api/accounts/csrf/",
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
        throw new Error("CSRF 쿠키를 확인할 수 없습니다.");
    }

    return token;
}

// 회원가입 처리
document.addEventListener("DOMContentLoaded", function () {

    const signupForm = document.getElementById("signupForm");

    signupForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        // 입력값 가져오기
        const nickname = document.getElementById("nickname").value.trim();

        const email = document.getElementById("email").value.trim().toLowerCase();

        const password = document.getElementById("password").value;

        const passwordConfirm =
            document.getElementById("passwordConfirm").value;

        // 비밀번호 확인
        if (password !== passwordConfirm) {
            showMessage("비밀번호가 일치하지 않습니다.");
            return;
        }

        if (password.length < 8) {
            showMessage("비밀번호는 8자 이상이어야 합니다.");
            return;
        }

        const button = signupForm.querySelector("button[type=submit]");

        button.disabled = true;

        try {

            // CSRF 토큰 가져오기
            const csrfToken = await getCsrfToken();

            // Django 회원가입 API 호출
            const response = await fetch(
                API_BASE + "/api/accounts/signup/",
                {
                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfToken
                    },

                    body: JSON.stringify({
                        nickname: nickname,
                        email: email,
                        password: password
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "회원가입에 실패했습니다."
                );
            }

            // 회원가입 성공
            showMessage(
                "회원가입이 완료되었습니다! DB에 회원 정보가 저장되었습니다.",
                false
            );

            console.log("회원가입 성공:", result.user);

            signupForm.reset();

        } catch (error) {

            console.error("회원가입 오류:", error);

            showMessage(error.message);

        } finally {

            button.disabled = false;

        }

    });

});