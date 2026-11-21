"""
Arbeitsprogramm – Streamlit-App
Start lokal:  streamlit run Amin213.py
"""
import json
from datetime import datetime
from pathlib import Path

import streamlit as st

# =====================================================================
# MENÜ-KONFIGURATION
# Neue Menüs / Untermenüs einfach hier eintragen.
#   "title"    – angezeigter Text
#   "icon"     – Emoji
#   "page"     – Name einer Seitenfunktion unten (optional, sonst Platzhalter)
#   "children" – Untermenüs (Liste mit gleichem Aufbau)
# =====================================================================
APP_NAME = "Arbeitsprogramm"

MENU = [
    {"title": "Dashboard", "icon": "📊", "page": "dashboard"},
    # ---- Beispiel: wird ersetzt, sobald die echten Menüs feststehen ----
    {
        "title": "Beispielmenü",
        "icon": "📁",
        "children": [
            {"title": "Unterpunkt 1", "icon": "📄"},
            {"title": "Unterpunkt 2", "icon": "📄"},
        ],
    },
    {"title": "Einstellungen", "icon": "⚙️", "page": "settings"},
]

# =====================================================================
# DATENSPEICHER (JSON-Datei neben der App)
# =====================================================================
DATA_FILE = Path(__file__).with_name("daten.json")


def load_data() -> dict:
    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {"tasks": [], "notes": ""}


def save_data(data: dict) -> None:
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


# =====================================================================
# SEITEN
# =====================================================================
def page_dashboard(item, path):
    data = load_data()
    tasks = data.setdefault("tasks", [])

    st.title("📊 Dashboard")
    wochentage = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
    now = datetime.now()
    st.caption(f"{wochentage[now.weekday()]}, {now:%d.%m.%Y}")

    sections = [m for m in MENU if m.get("page") != "dashboard"]
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Offene Aufgaben", sum(not t["done"] for t in tasks))
    c2.metric("Erledigt", sum(t["done"] for t in tasks))
    c3.metric("Menübereiche", len(sections))
    c4.metric("Notizen", len([l for l in data.get("notes", "").splitlines() if l.strip()]))

    left, right = st.columns(2)

    with left:
        with st.container(border=True):
            st.subheader("Aufgaben")
            with st.form("new_task", clear_on_submit=True):
                a, b = st.columns([4, 1])
                text = a.text_input("Neue Aufgabe", label_visibility="collapsed",
                                    placeholder="Neue Aufgabe…")
                if b.form_submit_button("Hinzufügen", use_container_width=True) and text.strip():
                    tasks.insert(0, {"text": text.strip(), "done": False})
                    save_data(data)
                    st.rerun()

            if not tasks:
                st.caption("Keine Aufgaben – alles erledigt.")
            for i, t in enumerate(tasks):
                a, b = st.columns([6, 1])
                done = a.checkbox(t["text"], value=t["done"], key=f"task_{i}_{t['text']}")
                if done != t["done"]:
                    t["done"] = done
                    save_data(data)
                    st.rerun()
                if b.button("✕", key=f"del_{i}_{t['text']}", help="Löschen"):
                    tasks.pop(i)
                    save_data(data)
                    st.rerun()

    with right:
        with st.container(border=True):
            st.subheader("Schnellzugriff")
            cols = st.columns(2)
            for i, m in enumerate(sections):
                if cols[i % 2].button(f"{m.get('icon', '')} {m['title']}",
                                      key=f"quick_{i}", use_container_width=True):
                    go([m["title"]])
            st.subheader("Notizen")
            notes = st.text_area("Notizen", value=data.get("notes", ""), height=160,
                                 label_visibility="collapsed", placeholder="Notizen für heute…")
            if notes != data.get("notes", ""):
                data["notes"] = notes
                save_data(data)
                st.rerun()


def page_settings(item, path):
    st.title("⚙️ Einstellungen")
    with st.container(border=True):
        st.subheader("Daten")
        data = load_data()
        st.download_button(
            "Daten exportieren",
            json.dumps(data, ensure_ascii=False, indent=2),
            file_name=f"arbeitsprogramm-{datetime.now():%Y-%m-%d}.json",
            mime="application/json",
        )
        up = st.file_uploader("Daten importieren", type="json")
        if up is not None and st.button("Import übernehmen"):
            save_data(json.load(up))
            st.success("Import abgeschlossen.")
        st.divider()
        if st.checkbox("Ich möchte wirklich alle Daten löschen"):
            if st.button("Alles löschen", type="primary"):
                save_data({"tasks": [], "notes": ""})
                st.success("Gelöscht.")


def page_placeholder(item, path):
    st.title(f"{item.get('icon', '')} {item['title']}")
    children = item.get("children", [])
    if children:
        cols = st.columns(3)
        for i, c in enumerate(children):
            if cols[i % 3].button(f"{c.get('icon', '')} {c['title']}",
                                  key=f"child_{i}", use_container_width=True):
                go(path + [c["title"]])
    else:
        with st.container(border=True):
            st.info("Diese Seite ist noch leer. Inhalt und Funktionen folgen.")


PAGES = {"dashboard": page_dashboard, "settings": page_settings}

# =====================================================================
# APP-KERN: Navigation (normalerweise nicht anfassen)
# =====================================================================
st.set_page_config(page_title=APP_NAME, page_icon="📊", layout="wide")

if "path" not in st.session_state:
    st.session_state.path = [MENU[0]["title"]]


def go(path):
    st.session_state.path = path
    st.rerun()


def find(path):
    items, item, trail = MENU, None, []
    for title in path:
        item = next((i for i in items if i["title"] == title), None)
        if item is None:
            return None, []
        trail.append(item)
        items = item.get("children", [])
    return item, trail


def render_menu(items, parent=()):
    current = st.session_state.path
    for i, item in enumerate(items):
        path = [*parent, item["title"]]
        label = f"{item.get('icon', '')} {item['title']}".strip()
        key = "nav_" + "/".join(path)
        if item.get("children"):
            is_open = current[: len(path)] == path
            with st.expander(label, expanded=is_open):
                if st.button("Übersicht", key=key, use_container_width=True,
                             type="primary" if current == path else "secondary"):
                    go(path)
                render_menu(item["children"], path)
        else:
            if st.button(label, key=key, use_container_width=True,
                         type="primary" if current == path else "secondary"):
                go(path)


with st.sidebar:
    st.markdown(f"## {APP_NAME}")
    render_menu(MENU)
    st.divider()
    st.caption(datetime.now().strftime("%H:%M Uhr"))

item, trail = find(st.session_state.path)
if item is None:
    st.session_state.path = [MENU[0]["title"]]
    item, trail = find(st.session_state.path)

if len(trail) > 1:
    st.caption(" / ".join(t["title"] for t in trail))

PAGES.get(item.get("page"), page_placeholder)(item, st.session_state.path)
