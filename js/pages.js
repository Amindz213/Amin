/*
 * SEITEN
 * ------
 * Jede Seite ist eine Funktion, die HTML zurückgibt (oder ein DOM-Element befüllt).
 * Im Menü (js/menu.js) wird eine Seite über "page: <name>" zugeordnet.
 */

const Store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem("app:" + key);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("app:" + key, JSON.stringify(value)); } catch {}
  },
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const PAGES = {
  dashboard(el, ctx) {
    const today = new Date().toLocaleDateString("de-DE", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const sections = MENU.filter((m) => m.id !== "dashboard");

    el.innerHTML = `
      <div class="page-head">
        <h1>Dashboard</h1>
        <p class="muted">${esc(today)}</p>
      </div>

      <section class="grid kpis">
        ${[["Offene Aufgaben", "tasksOpen"], ["Erledigt", "tasksDone"],
           ["Menübereiche", "sections"], ["Notizen", "notes"]]
          .map(([label, key]) => `
            <div class="card kpi">
              <div class="kpi-label">${label}</div>
              <div class="kpi-value" data-kpi="${key}">–</div>
            </div>`).join("")}
      </section>

      <section class="grid two">
        <div class="card">
          <h2>Aufgaben</h2>
          <form id="taskForm" class="row">
            <input id="taskInput" placeholder="Neue Aufgabe…" autocomplete="off">
            <button class="btn" type="submit">Hinzufügen</button>
          </form>
          <ul id="taskList" class="list"></ul>
        </div>

        <div class="card">
          <h2>Schnellzugriff</h2>
          <div class="quick">
            ${sections.map((m) => `
              <a class="quick-item" href="#/${m.id}">
                <span class="quick-icon">${m.icon || "•"}</span>
                <span>${esc(m.title)}</span>
              </a>`).join("")}
          </div>
          <h2 style="margin-top:1.5rem">Notizen</h2>
          <textarea id="notes" rows="6" placeholder="Notizen für heute…"></textarea>
        </div>
      </section>`;

    const tasks = Store.get("tasks", []);
    const list = el.querySelector("#taskList");
    const notes = el.querySelector("#notes");

    const refresh = () => {
      Store.set("tasks", tasks);
      list.innerHTML = tasks.length
        ? tasks.map((t, i) => `
            <li class="${t.done ? "done" : ""}">
              <label><input type="checkbox" data-i="${i}" ${t.done ? "checked" : ""}> ${esc(t.text)}</label>
              <button class="btn-icon" data-del="${i}" title="Löschen">✕</button>
            </li>`).join("")
        : `<li class="empty">Keine Aufgaben – alles erledigt.</li>`;
      const kpi = (k, v) => (el.querySelector(`[data-kpi="${k}"]`).textContent = v);
      kpi("tasksOpen", tasks.filter((t) => !t.done).length);
      kpi("tasksDone", tasks.filter((t) => t.done).length);
      kpi("sections", sections.length);
      kpi("notes", notes.value.trim() ? notes.value.trim().split("\n").length : 0);
    };

    el.querySelector("#taskForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = el.querySelector("#taskInput");
      if (!input.value.trim()) return;
      tasks.unshift({ text: input.value.trim(), done: false });
      input.value = "";
      refresh();
    });
    list.addEventListener("click", (e) => {
      if (e.target.dataset.del !== undefined) { tasks.splice(+e.target.dataset.del, 1); refresh(); }
    });
    list.addEventListener("change", (e) => {
      if (e.target.dataset.i !== undefined) { tasks[+e.target.dataset.i].done = e.target.checked; refresh(); }
    });
    notes.value = Store.get("notes", "");
    notes.addEventListener("input", () => { Store.set("notes", notes.value); refresh(); });
    refresh();
  },

  settings(el) {
    el.innerHTML = `
      <div class="page-head"><h1>Einstellungen</h1></div>
      <div class="card">
        <h2>Daten</h2>
        <p class="muted">Alle Daten werden lokal in diesem Browser gespeichert.</p>
        <div class="row">
          <button class="btn" id="export" type="button">Daten exportieren</button>
          <label class="btn btn-secondary">Daten importieren
            <input type="file" id="import" accept="application/json" hidden>
          </label>
          <button class="btn btn-danger" id="reset" type="button">Alles löschen</button>
        </div>
      </div>`;

    const keys = () => Object.keys(localStorage).filter((k) => k.startsWith("app:"));
    el.querySelector("#export").onclick = () => {
      const data = Object.fromEntries(keys().map((k) => [k, localStorage.getItem(k)]));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      a.download = `arbeitsprogramm-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    };
    el.querySelector("#import").onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const data = JSON.parse(await file.text());
      Object.entries(data).forEach(([k, v]) => k.startsWith("app:") && localStorage.setItem(k, v));
      alert("Import abgeschlossen.");
    };
    el.querySelector("#reset").onclick = () => {
      if (confirm("Wirklich alle Daten löschen?")) { keys().forEach((k) => localStorage.removeItem(k)); alert("Gelöscht."); }
    };
  },

  // Platzhalter für Menüpunkte ohne eigene Seite
  placeholder(el, ctx) {
    const kids = ctx.item.children || [];
    el.innerHTML = `
      <div class="page-head"><h1>${esc(ctx.item.title)}</h1></div>
      ${kids.length ? `
        <div class="quick">
          ${kids.map((c) => `
            <a class="quick-item" href="#/${ctx.path.join("/")}/${c.id}">
              <span class="quick-icon">${c.icon || "›"}</span><span>${esc(c.title)}</span>
            </a>`).join("")}
        </div>` : `
        <div class="card empty-state">
          <p>Diese Seite ist noch leer.</p>
          <p class="muted">Inhalt und Funktionen folgen.</p>
        </div>`}`;
  },
};
