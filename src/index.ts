import "./dashboard-view";
import "./detail-modal";
import "./cards/weather-card";
import "./cards/presence-card";
import "./cards/alerts-card";
import "./cards/agenda-card";
import "./cards/energy-card";
import "./cards/rooms-card";

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}

window.customCards = window.customCards ?? [];

const cards = [
  ["jonsim-weather-card", "Jonsim Weather", "Weather now, rain context and compact forecast"],
  ["jonsim-presence-card", "Jonsim Presence", "Household presence at a glance"],
  ["jonsim-alerts-card", "Jonsim Alerts", "Only surfaces states that need attention"],
  ["jonsim-agenda-card", "Jonsim Agenda", "Upcoming household events and collections"],
  ["jonsim-energy-card", "Jonsim Energy", "Live power, daily use and recent trend"],
  ["jonsim-rooms-card", "Jonsim Rooms", "Room comfort, activity and exceptions"],
] as const;

for (const [type, name, description] of cards) {
  if (!window.customCards.some(card => card.type === type)) {
    window.customCards.push({ type, name, description, preview: true });
  }
}

console.info("%c JONSIM HOME %c 0.1.0 ", "background:#171918;color:#f7f8f6;padding:4px 8px", "background:#b96746;color:white;padding:4px 8px");
