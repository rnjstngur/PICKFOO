// PICKFOO 메인 화면 > 마이페이지의 음식 취향 카드
// 기존 회원가입/로그인/세션 코드는 변경하지 않습니다.
(() => {
  "use strict";

  const API_BASE = window.PICKFOO_API_BASE;
  const MY_PAGE = "myPageView";
  const PROFILE_PANEL = "profileDbPanel";
  let requestNumber = 0;

  const byId = id => document.getElementById(id);

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = String(text);
    return el;
  }

  function textList(value) {
    if (!Array.isArray(value)) return [];
    return value.map(item => String(item).trim()).filter(Boolean);
  }

  function spicyLabel(value) {
    const labels = {
      "all": "상관없음",
      "0": "안 매운 맛",
      "1": "약간 매운 맛",
      "2": "매운 맛",
      "3": "아주 매운 맛",
      "맵지 않음": "안 매운 맛",
      "약간 매움": "약간 매운 맛",
      "매움": "매운 맛"
    };
    const raw = String(value ?? "all").trim();
    return labels[raw] || raw || "상관없음";
  }

  function budgetLabel(value) {
    const raw = String(value ?? "all").trim();
    if (!raw || raw === "all" || raw === "전체" || raw === "제한 없음") return "제한 없음";
    const numeric = raw.replace(/[\s,원]/g, "");
    if (/^\d+$/.test(numeric)) return `${Number(numeric).toLocaleString("ko-KR")}원 이하`;
    return raw;
  }

  function sectionLabel(title, icon) {
    const row = make("div", "pf-taste-heading");
    row.append(make("span", "pf-taste-icon", icon), make("h4", "", title));
    return row;
  }

  function tagGroup(title, icon, values, kind = "") {
    const group = make("div", `pf-taste-group ${kind}`.trim());
    group.append(sectionLabel(title, icon));
    const tags = make("div", "pf-taste-tags");
    const list = textList(values);
    if (list.length) {
      for (const value of list) tags.append(make("span", "pf-taste-tag", value));
    } else {
      tags.append(make("span", "pf-taste-empty", "아직 선택하지 않았어요"));
    }
    group.append(tags);
    return group;
  }

  function statCard(title, icon, value, accent = false) {
    const card = make("div", `pf-taste-stat${accent ? " accent" : ""}`);
    card.append(make("span", "pf-taste-stat-label", `${icon} ${title}`));
    card.append(make("strong", "pf-taste-stat-value", value));
    return card;
  }

  function createButton(text, href, className) {
    const link = make("a", className, text);
    link.href = href;
    return link;
  }

  function renderNotice(panel, title, body, actionLabel = "", href = "") {
    panel.replaceChildren();
    const box = make("div", "pf-taste-empty-state");
    box.append(make("strong", "", title), make("p", "", body));
    if (actionLabel && href) box.append(createButton(actionLabel, href, "pf-taste-action"));
    panel.append(box);
  }

  function renderPreferences(panel, preferences) {
    panel.replaceChildren();
    const p = preferences || {};

    const header = make("div", "pf-taste-header");
    const heading = make("div", "pf-taste-header-copy");
    heading.append(make("div", "pf-taste-eyebrow", "MY TASTE PROFILE"));
    heading.append(make("h3", "pf-taste-title", "❤️ 내 음식 취향"));
    heading.append(make("p", "pf-taste-subtitle", "나에게 맞는 메뉴를 찾기 위해 저장한 취향이에요."));
    header.append(heading, make("span", "pf-taste-status", "● 저장됨"));
    panel.append(header);

    if (!preferences) {
      panel.append(make("p", "pf-taste-empty", "아직 저장된 음식 취향이 없어요."));
    } else {
      const groups = make("div", "pf-taste-groups");
      groups.append(
        tagGroup("좋아하는 음식", "🍱", p.food_types),
        tagGroup("선호 브랜드", "🏪", p.brands),
        tagGroup("좋아하는 맛", "😋", p.flavors)
      );
      panel.append(groups);

      const summary = make("div", "pf-taste-summary");
      summary.append(
        statCard("매운맛", "🌶️", spicyLabel(p.spicy), true),
        statCard("한 끼 예산", "💰", budgetLabel(p.budget))
      );
      panel.append(summary);

      const excluded = textList(p.excluded_ingredients);
      const allergies = textList(p.allergies);
      if (excluded.length || allergies.length) {
        const extras = make("div", "pf-taste-extras");
        if (excluded.length) extras.append(tagGroup("제외할 재료", "🚫", excluded, "pf-taste-group-excluded"));
        if (allergies.length) extras.append(tagGroup("알레르기 유발 재료", "⚠️", allergies, "pf-taste-group-allergy"));
        panel.append(extras);
      }
    }

    const footer = make("div", "pf-taste-footer");
    footer.append(createButton("내 음식 취향 수정하기  →", "preferences.html", "pf-taste-action"));
    panel.append(footer);
  }

  async function loadProfile() {
    const panel = byId(PROFILE_PANEL);
    if (!panel) return;
    const currentRequest = ++requestNumber;
    panel.setAttribute("aria-busy", "true");
    renderNotice(panel, "음식 취향 불러오는 중", "잠시만 기다려 주세요.");

    try {
      const userResponse = await fetch(`${API_BASE}/api/accounts/me/`, {
        method: "GET",
        credentials: "include"
      });
      if (currentRequest !== requestNumber) return;
      if (userResponse.status === 401) {
        renderNotice(panel, "로그인이 필요해요", "로그인하면 내 음식 취향을 확인할 수 있어요.", "로그인하기 →", "login.html");
        return;
      }
      if (!userResponse.ok) throw new Error("로그인 상태를 확인하지 못했어요.");

      const prefResponse = await fetch(`${API_BASE}/api/accounts/preferences/`, {
        method: "GET",
        credentials: "include"
      });
      if (currentRequest !== requestNumber) return;
      if (!prefResponse.ok) throw new Error("음식 취향을 불러오지 못했어요.");
      const result = await prefResponse.json();
      renderPreferences(panel, result.preferences);
    } catch (error) {
      if (currentRequest === requestNumber) {
        console.error("PICKFOO 음식 취향 조회 오류:", error);
        renderNotice(panel, "서버 연결을 확인해 주세요", "Django 서버가 실행 중인지 확인한 후 다시 시도해 주세요.");
        const retry = make("button", "pf-taste-retry", "다시 불러오기");
        retry.type = "button";
        retry.addEventListener("click", loadProfile);
        panel.append(retry);
      }
    } finally {
      if (currentRequest === requestNumber) panel.removeAttribute("aria-busy");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const oldForm = byId("profileForm");
    const page = byId(MY_PAGE);
    if (!page || !oldForm) return;

    // 이전 localStorage 기반 취향 폼은 남겨 두되 화면에서는 숨깁니다.
    oldForm.hidden = true;
    oldForm.style.display = "none";

    let panel = byId(PROFILE_PANEL);
    if (!panel) {
      panel = make("section", "pf-taste-panel");
      panel.id = PROFILE_PANEL;
      panel.setAttribute("aria-label", "데이터베이스에 저장된 내 음식 취향");
      panel.setAttribute("aria-live", "polite");
      oldForm.insertAdjacentElement("afterend", panel);
    }

    // 페이지에 처음 진입했을 때 + '마이' 탭을 다시 열었을 때 갱신
    ["navMy", "myPageBtn"].forEach(id => {
      const trigger = byId(id);
      if (trigger) trigger.addEventListener("click", loadProfile);
    });
    page.querySelectorAll('[data-view="myPageView"]').forEach(trigger => {
      trigger.addEventListener("click", loadProfile);
    });

    loadProfile();
  });
})();
