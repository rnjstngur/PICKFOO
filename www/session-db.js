// PICKFOO 로그인 상태 및 로그아웃 관리
(() => {
    const API_BASE = window.PICKFOO_API_BASE;

    let currentUser = null;

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

    // 마이페이지에 로그인 정보 표시
    function renderUser(user) {
        const name = document.getElementById("profileName");
        const nickname = document.getElementById("profileNickname");
        const loginLink = document.getElementById("profileLoginLink");
        const logoutBtn = document.getElementById("profileLogoutBtn");
        const notice = document.getElementById("profileAuthNotice");

        if (!name || !loginLink || !logoutBtn || !notice) {
            return;
        }

        if (user) {
            name.textContent = user.nickname || user.email;

            if (nickname) {
                nickname.value = user.nickname || "";
            }

            loginLink.style.display = "none";
            logoutBtn.style.display = "block";

            notice.textContent = "로그인 계정: " + user.email;

        } else {
            name.textContent = "게스트";

            if (nickname) {
                nickname.value = "";
            }

            loginLink.style.display = "block";
            logoutBtn.style.display = "none";

            notice.textContent = "로그인이 필요합니다.";
        }
    }

    // Django에서 현재 로그인한 사용자 조회
    async function checkLogin() {
        try {
            const response = await fetch(
                API_BASE + "/api/accounts/me/",
                {
                    credentials: "include"
                }
            );

            if (response.status === 401) {
                currentUser = null;
            } else if (response.ok) {
                const result = await response.json();
                currentUser = result.user;
            } else {
                throw new Error("로그인 상태를 확인할 수 없습니다.");
            }

            renderUser(currentUser);

        } catch (error) {
            console.error("로그인 상태 확인 오류:", error);

            const notice = document.getElementById("profileAuthNotice");

            if (notice) {
                notice.textContent = "서버 연결 상태를 확인해 주세요.";
            }
        }
    }

    // 로그아웃 처리
    async function logoutUser() {
        try {
            // CSRF 쿠키 준비
            const csrfResponse = await fetch(
                API_BASE + "/api/accounts/csrf/",
                {
                    credentials: "include"
                }
            );

            if (!csrfResponse.ok) {
                throw new Error("CSRF 토큰 요청 실패");
            }

            const csrfToken = getCookie("csrftoken");

            if (!csrfToken) {
                throw new Error("CSRF 토큰을 찾을 수 없습니다.");
            }

            // Django 로그아웃 요청
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

            // 기존 시연용 로그인 정보도 정리
            localStorage.removeItem("pickfoo_current_user");

            currentUser = null;
            renderUser(null);

            alert("로그아웃되었습니다.");

        } catch (error) {
            console.error(error);
            alert("로그아웃 중 오류가 발생했습니다.");
        }
    }

    // 기존 app.js의 로그아웃 처리와 충돌하지 않도록 연결
    document.addEventListener("click", (event) => {
        const target = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        if (target.closest("#profileLogoutBtn")) {
            event.preventDefault();
            event.stopImmediatePropagation();

            logoutUser();
            return;
        }

        // 마이페이지를 열 때 DB 로그인 상태 다시 확인
        if (target.closest(
            '#navMy, #myPageBtn, [data-view="myPageView"]'
        )) {
            setTimeout(checkLogin, 0);
        }
    }, true);

    // 페이지가 열리면 로그인 상태 확인
    checkLogin();
})();