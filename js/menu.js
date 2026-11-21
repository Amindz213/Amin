/*
 * MENÜ-KONFIGURATION
 * ------------------
 * Hier werden alle Menüs und Untermenüs definiert.
 * Neue Menüpunkte einfach in diese Liste eintragen.
 *
 *   id       – eindeutiger Name (wird in der Adresse verwendet, z. B. #/kunden/liste)
 *   title    – angezeigter Text
 *   icon     – ein Zeichen/Emoji für die Seitenleiste
 *   page     – Name der Seite aus js/pages.js (optional; ohne "page" wird ein Platzhalter angezeigt)
 *   children – Untermenüs (beliebig tief verschachtelbar)
 */
const APP_NAME = "Arbeitsprogramm";

const MENU = [
  { id: "dashboard", title: "Dashboard", icon: "▦", page: "dashboard" },

  // ---- Beispiel: Wird ersetzt, sobald die echten Menüs feststehen ----
  {
    id: "beispiel",
    title: "Beispielmenü",
    icon: "◆",
    children: [
      { id: "unterpunkt-1", title: "Unterpunkt 1" },
      { id: "unterpunkt-2", title: "Unterpunkt 2" },
    ],
  },

  { id: "einstellungen", title: "Einstellungen", icon: "⚙", page: "settings" },
];
