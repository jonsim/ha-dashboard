import { LitElement, css, html } from "lit";
import "./index";
import type { BaseCardConfig, DashboardViewConfig, HomeAssistant } from "./types";
import type { JonsimDashboardView } from "./dashboard-view";
import { demoHass, demoRooms } from "./demo/fixtures";

interface ConfigurableCard extends HTMLElement { hass?: HomeAssistant; setConfig(config: BaseCardConfig): void; }

const navigation = [
  { label: "Home", icon: "⌂", path: "#home", enabled: true },
  { label: "Climate", icon: "≈", path: "#climate", enabled: true },
  { label: "Devices", icon: "◇", path: "#devices", enabled: false },
  { label: "Automations", icon: "↻", path: "#automations", enabled: false },
];

const makeCard = (tag: string, config: Record<string, unknown>): ConfigurableCard => {
  const card = document.createElement(tag) as ConfigurableCard;
  card.setConfig(config as unknown as BaseCardConfig);
  card.hass = demoHass;
  return card;
};

const homeCards = [
  makeCard("jonsim-weather-card", {
    type: "custom:jonsim-weather-card", title: "Soft rain", eyebrow: "Outside now", entity: "weather.home",
    apparent_temperature: "sensor.feels_like", rain_until: "sensor.rain_outlook",
    forecast: [
      { label: "Thu", condition: "rainy", low: 11, high: 17, rain: 2.1 },
      { label: "Fri", condition: "cloudy", low: 12, high: 18 },
      { label: "Sat", condition: "sunny", low: 10, high: 19 },
      { label: "Sun", condition: "cloudy", low: 12, high: 18 },
    ],
  }),
  makeCard("jonsim-presence-card", { type: "custom:jonsim-presence-card", title: "Who's home", people: ["person.jon", "person.alex"] }),
  makeCard("jonsim-alerts-card", {
    type: "custom:jonsim-alerts-card", alerts: [
      { entity: "binary_sensor.front_door", label: "Front door open", severity: "critical" },
      { entity: "binary_sensor.kitchen_leak", label: "Kitchen leak", severity: "critical" },
      { entity: "binary_sensor.study_window", label: "Study window", detail: "Open for 1 hour", severity: "warning" },
    ],
  }),
  makeCard("jonsim-agenda-card", { type: "custom:jonsim-agenda-card", title: "Coming up", entities: ["sensor.next_collection", "calendar.family", "sensor.parcel"] }),
  makeCard("jonsim-energy-card", {
    type: "custom:jonsim-energy-card", power: "sensor.house_power", today: "sensor.energy_today", cost: "sensor.energy_cost_today", peak: "sensor.monthly_peak",
    history: [1.1, 1.3, 1.15, 1.9, 1.6, 2.1, 1.8, 2.5, 2.3, 2.6, 2.37],
  }),
  makeCard("jonsim-rooms-card", { type: "custom:jonsim-rooms-card", title: "Rooms", mode: "exceptions", max_items: 4, rooms: demoRooms }),
];

const climateCards = [
  makeCard("jonsim-rooms-card", { type: "custom:jonsim-rooms-card", title: "Room climate", eyebrow: "Temperature · humidity · activity", mode: "grid", rooms: demoRooms }),
];

export class JonsimDemoApp extends LitElement {
  private active: "home" | "climate" = window.location.hash === "#climate" ? "climate" : "home";

  static properties = { active: { state: true } };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("hashchange", this.hashChanged);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("hashchange", this.hashChanged);
  }

  private hashChanged = (): void => {
    this.active = window.location.hash === "#climate" ? "climate" : "home";
  };

  protected updated(): void {
    const view = this.renderRoot.querySelector<JonsimDashboardView>("jonsim-dashboard-view");
    if (!view) return;
    const config: DashboardViewConfig = {
      type: "custom:jonsim-dashboard-view",
      title: this.active === "home" ? "Home" : "Climate",
      active_path: `#${this.active}`,
      navigation,
      theme: { sun_entity: "sun.sun", default_mode: "day" },
    };
    view.setConfig(config);
    view.hass = demoHass;
    view.cards = this.active === "home" ? homeCards : climateCards;
    view.requestUpdate();
  }

  render() { return html`<jonsim-dashboard-view></jonsim-dashboard-view>`; }

  static styles = css`:host{display:block;min-height:100vh}`;
}

customElements.define("jonsim-demo-app", JonsimDemoApp);
