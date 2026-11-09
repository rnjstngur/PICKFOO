function getUser() {
  try { return JSON.parse(localStorage.getItem("pickfoo_current_user") || "null"); } catch { return null; }
}
function getAllUsers() {
  try { return JSON.parse(localStorage.getItem("pickfoo_users") || "[]"); } catch { return []; }
}
function esc(s) { return String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();
  if (!user) { alert("마이페이지를 보려면 로그인해 주세요."); location.href = "login.html"; return; }
  document.getElementById("greetingName").textContent = user.nickname || "회원";
  document.getElementById("profileNickname").textContent = user.nickname || "PICKFOO 사용자";
  document.getElementById("profileEmail").textContent = user.email;
  document.getElementById("avatarInitial").textContent = (user.nickname || "P").charAt(0).toUpperCase();

  const p = user.preferences || {};
  const entries = [
    ["좋아하는 음식", p.foodTypes],
    ["선호 브랜드", p.brands],
    ["선호하는 맛", p.flavors],
    ["매운맛", [({"0":"맵지 않음","1":"약간 매움","2":"매움","all":"상관없음"})[p.spicy || "all"]]],
    ["한 끼 예산", [p.budget === "all" ? "제한 없음" : `${Number(p.budget || 5000).toLocaleString("ko-KR")}원 이하`]],
    ["제외 재료", p.excludedIngredients],
    ["알레르기 정보", p.allergies]
  ];
  document.getElementById("tasteSummary").innerHTML = entries.map(([label,values]) => `<div class="taste-row"><strong>${esc(label)}</strong><div>${values?.length ? values.map(v=>`<span class="taste-chip">${esc(v)}</span>`).join("") : '<span class="muted">선택 없음</span>'}</div></div>`).join("");

  const savedIds = JSON.parse(localStorage.getItem(`pickfoo_saved_${user.email}`) || "[]");
  const savedPanel = document.querySelector(".saved-panel");
  if (savedIds.length) {
    const names = savedIds.map(id => `조합 #${id}`).join(", ");
    savedPanel.querySelector("p.muted").textContent = `저장한 조합 ${savedIds.length}개: ${names}`;
  }

  document.getElementById("logoutButton").addEventListener("click", () => {
    localStorage.removeItem("pickfoo_current_user");
    location.href = "index.html";
  });
  document.getElementById("editNickname").addEventListener("click", () => {
    const next = prompt("새 닉네임을 입력해 주세요.", user.nickname || "");
    if (next === null) return;
    const nickname = next.trim();
    if (!nickname || nickname.length > 24) return alert("닉네임은 1~24자로 입력해 주세요.");
    user.nickname = nickname;
    localStorage.setItem("pickfoo_users", JSON.stringify(getAllUsers().map(item => item.email === user.email ? {...item,...user} : item)));
    localStorage.setItem("pickfoo_current_user", JSON.stringify(user));
    location.reload();
  });
});
