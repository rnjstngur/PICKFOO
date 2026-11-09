function currentUser() {
  try { return JSON.parse(localStorage.getItem("pickfoo_current_user") || "null"); } catch { return null; }
}
function allUsers() {
  try { return JSON.parse(localStorage.getItem("pickfoo_users") || "[]"); } catch { return []; }
}
function updateUser(updated) {
  const users = allUsers().map(user => user.email === updated.email ? {...user,...updated} : user);
  localStorage.setItem("pickfoo_users", JSON.stringify(users));
  localStorage.setItem("pickfoo_current_user", JSON.stringify(updated));
}
function checkedValues(group) {
  return [...document.querySelectorAll(`[data-group="${group}"] input:checked`)].map(input => input.value);
}
function setCheckedValues(group, values = []) {
  document.querySelectorAll(`[data-group="${group}"] input`).forEach(input => input.checked = values.includes(input.value));
}
document.addEventListener("DOMContentLoaded", () => {
  const user = currentUser();
  const form = document.getElementById("preferencesForm");
  if (!user) {
    alert("음식 취향을 저장하려면 먼저 로그인해 주세요.");
    location.href = "login.html";
    return;
  }
  const first = new URLSearchParams(location.search).get("first") === "1";
  document.getElementById("pageTitle").textContent = first ? "가입을 환영해요! 어떤 음식을 좋아하세요?" : "내 음식 취향 수정하기";
  const p = user.preferences || {};
  setCheckedValues("foodTypes", p.foodTypes);
  setCheckedValues("brands", p.brands);
  setCheckedValues("flavors", p.flavors);
  if (p.spicy) { const el = document.querySelector(`input[name="spicy"][value="${CSS.escape(p.spicy)}"]`); if (el) el.checked = true; }
  if (p.budget) { const el = document.querySelector(`input[name="budget"][value="${CSS.escape(p.budget)}"]`); if (el) el.checked = true; }
  document.getElementById("excludedIngredients").value = (p.excludedIngredients || []).join(", ");
  document.getElementById("allergies").value = (p.allergies || []).join(", ");

  form.addEventListener("submit", event => {
    event.preventDefault();
    user.preferences = {
      foodTypes: checkedValues("foodTypes"),
      brands: checkedValues("brands"),
      flavors: checkedValues("flavors"),
      spicy: document.querySelector('input[name="spicy"]:checked')?.value || "all",
      budget: document.querySelector('input[name="budget"]:checked')?.value || "all",
      excludedIngredients: document.getElementById("excludedIngredients").value.split(",").map(x => x.trim()).filter(Boolean),
      allergies: document.getElementById("allergies").value.split(",").map(x => x.trim()).filter(Boolean)
    };
    updateUser(user);
    const msg = document.getElementById("formMessage");
    msg.textContent = "음식 취향을 저장했어요. 잠시 후 마이페이지로 이동합니다.";
    msg.className = "form-message success";
    setTimeout(() => location.href = "mypage.html", 900);
  });
});
