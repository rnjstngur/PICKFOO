// PICKFOO 추천 점수 시각화

(function () {

    function initScoreBars() {

        const grid = document.getElementById("recipeGrid");

        if (!grid) {
            console.error("recipeGrid를 찾을 수 없습니다.");
            return;
        }

        function showScoreBars() {

            const reasons = grid.querySelectorAll(
                ".recipe-card .reason"
            );

            reasons.forEach(function (reason) {

                // 이미 막대그래프를 만들었다면 건너뛰기
                if (reason.dataset.scoreBarAdded === "1") {
                    return;
                }

                const text = reason.textContent;

                // 추천 점수 추출
                // 예: 취향 일치 7/10점
                const scoreText = text.split("취향 일치 ")[1];

                if (!scoreText) {
                    return;
                }

                const fraction = scoreText.split("점")[0];
                const numbers = fraction.split("/");

                if (numbers.length !== 2) {
                    return;
                }

                const points = Number(numbers[0].trim());
                const maxPoints = Number(numbers[1].trim());

                if (
                    !Number.isFinite(points) ||
                    !Number.isFinite(maxPoints) ||
                    maxPoints <= 0 ||
                    points < 0 ||
                    points > maxPoints
                ) {
                    return;
                }

                const percentage = (points / maxPoints) * 100;

                // 점수 박스 생성
                const scoreBox = document.createElement("div");
                scoreBox.className = "taste-score";

                // 점수 제목
                const label = document.createElement("div");
                label.className = "taste-score-label";

                const title = document.createElement("strong");
                title.textContent = "❤️ 취향 규칙 일치도";

                const scoreValue = document.createElement("span");
                scoreValue.textContent = points + "/" + maxPoints + "점";

                label.appendChild(title);
                label.appendChild(scoreValue);

                // 막대그래프 배경
                const track = document.createElement("div");
                track.className = "taste-score-track";

                // 주황색 막대
                const fill = document.createElement("div");
                fill.className = "taste-score-fill";
                fill.style.width = percentage + "%";

                track.appendChild(fill);

                scoreBox.appendChild(label);
                scoreBox.appendChild(track);

                // 추천 이유 위에 막대 삽입
                reason.before(scoreBox);

                // 중복 생성 방지
                reason.dataset.scoreBarAdded = "1";

            });
        }

        // 추천 목록이 변경될 때 자동 갱신
        const observer = new MutationObserver(showScoreBars);

        observer.observe(grid, {
            childList: true,
            subtree: true
        });

        showScoreBars();

        console.log("PICKFOO 점수 막대 준비 완료");
    }

    // HTML 로딩 후 실행
    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initScoreBars
        );

    } else {

        initScoreBars();

    }

})();