/* App-Kern: Navigation, Routing, Theme. Normalerweise nicht anfassen. */
(function () {
  const nav = document.getElementById("nav");
  const content = document.getElementById("content");
  const crumb = document.getElementById("breadcrumb");
  const sidebar = document.getElementById("sidebar");

  document.getElementById("appName").textContent = APP_NAME;
  document.title = APP_NAME;

  // ---- Theme ----
  const root = document.documentElement;
  const savedTheme = Store.get("theme", null);
  if (savedTheme) root.dataset.theme = savedTheme;
  document.getElementById("themeToggle").onclick = () => {
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    Store.set("theme", root.dataset.theme);
  };

  // ---- Uhr ----
  const clock = document.getElementById("clock");
  const tick = () => (clock.textContent = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }));
  tick(); setInterval(tick, 15000);

  // ---- Menü rendern ----
  const open = new Set(Store.get("openMenus", []));
  function renderMenu(items, parentPath = []) {
    const ul = document.createElement("ul");
    for (const item of items) {
      const path = [...parentPath, item.id];
      const key = path.join("/");
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#/" + key;
      a.dataset.path = key;
      a.innerHTML = `<span class="nav-icon">${item.icon || ""}</span><span class="nav-text"></span>`;
      a.querySelector(".nav-text").textContent = item.title;
      li.appendChild(a);
      if (item.children?.length) {
        li.classList.add("has-children");
        if (open.has(key)) li.classList.add("open");
        const caret = document.createElement("button");
        caret.type = "button";
        caret.className = "caret";
        caret.setAttribute("aria-label", "Untermenü umschalten");
        caret.textContent = "▸";
        caret.onclick = (e) => {
          e.preventDefault();
          li.classList.toggle("open");
          li.classList.contains("open") ? open.add(key) : open.delete(key);
          Store.set("openMenus", [...open]);
        };
        a.appendChild(caret);
        li.appendChild(renderMenu(item.children, path));
      }
      ul.appendChild(li);
    }
    return ul;
  }
  nav.appendChild(renderMenu(MENU));

  // ---- Routing ----
  function resolve(parts) {
    let items = MENU, item = null;
    const trail = [];
    for (const p of parts) {
      item = (items || []).find((i) => i.id === p);
      if (!item) return null;
      trail.push(item);
      items = item.children;
    }
    return { item, trail };
  }

  function route() {
    let parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    if (!parts.length) parts = [MENU[0].id];
    let r = resolve(parts);
    if (!r) { location.hash = "#/" + MENU[0].id; return; }

    // Aktiven Eintrag markieren und Eltern aufklappen
    const key = parts.join("/");
    nav.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.dataset.path === key));
    parts.slice(0, -1).forEach((_, i) => {
      const a = nav.querySelector(`a[data-path="${parts.slice(0, i + 1).join("/")}"]`);
      a?.parentElement.classList.add("open");
    });

    crumb.innerHTML = r.trail.map((t, i) =>
      `<a href="#/${parts.slice(0, i + 1).join("/")}">${esc(t.title)}</a>`).join('<span class="sep">/</span>');

    const page = PAGES[r.item.page] || PAGES.placeholder;
    content.innerHTML = "";
    page(content, { item: r.item, path: parts });
    document.title = `${r.item.title} – ${APP_NAME}`;
    sidebar.classList.remove("show");
  }

  window.addEventListener("hashchange", route);
  document.getElementById("menuToggle").onclick = () => sidebar.classList.toggle("show");
  route();
})();
