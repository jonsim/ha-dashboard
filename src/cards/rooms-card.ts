import { css, html, nothing } from "lit";
import { DashboardCard } from "./base-card";
import type { AttentionTone, DashboardDetail, RoomConfig, RoomsCardConfig } from "../types";
import { asEntityRef, classifyThreshold, entityValue, isOn, numericState, stateFor, strongestTone } from "../utils";

interface RoomState { room: RoomConfig; tone: AttentionTone; temperature?: number; humidity?: number; active: string[]; }

export class JonsimRoomsCard extends DashboardCard<RoomsCardConfig> {
  protected validateConfig(config: RoomsCardConfig): void {
    super.validateConfig(config);
    if (!Array.isArray(config.rooms) || !config.rooms.length) throw new Error("Rooms card requires at least one room");
    for (const room of config.rooms) if (!room.name || !room.temperature) throw new Error("Every room requires a name and temperature entity");
  }

  private roomState(room: RoomConfig): RoomState {
    const temperature = numericState(stateFor(this.hass, room.temperature));
    const humidity = room.humidity ? numericState(stateFor(this.hass, room.humidity)) : undefined;
    const tone = strongestTone(classifyThreshold(temperature, room.temperature_thresholds), classifyThreshold(humidity, room.humidity_thresholds));
    const active = [
      room.light && isOn(stateFor(this.hass, room.light)) ? "light on" : "",
      room.climate && isOn(stateFor(this.hass, room.climate)) ? stateFor(this.hass, room.climate)?.state ?? "climate on" : "",
      room.opening && isOn(stateFor(this.hass, room.opening)) ? "open" : "",
    ].filter(Boolean) as string[];
    return { room, tone, temperature, humidity, active };
  }

  private detail(item: RoomState): DashboardDetail {
    const { room, tone } = item;
    return {
      title: room.name,
      subtitle: tone === "normal" ? "Comfort is within range" : tone === "critical" ? "Needs attention now" : "Outside preferred range",
      icon: room.icon ?? "⌂",
      fields: [
        { label: "Temperature", value: entityValue(this.hass, room.temperature), tone: classifyThreshold(item.temperature, room.temperature_thresholds) },
        ...(room.humidity ? [{ label: "Humidity", value: entityValue(this.hass, room.humidity), tone: classifyThreshold(item.humidity, room.humidity_thresholds) }] : []),
        ...(room.light ? [{ label: "Lights", value: stateFor(this.hass, room.light)?.state ?? "Unavailable" }] : []),
        ...(room.climate ? [{ label: "Climate", value: stateFor(this.hass, room.climate)?.state ?? "Unavailable" }] : []),
        ...(room.opening ? [{ label: "Window / door", value: stateFor(this.hass, room.opening)?.state ?? "Unavailable" }] : []),
      ],
      history: [
        { entity: asEntityRef(room.temperature), label: "Temperature · 24 hours" },
        ...(room.humidity ? [{ entity: asEntityRef(room.humidity), label: "Humidity · 24 hours" }] : []),
      ],
      actions: room.actions,
    };
  }

  render() {
    if (this.configError) return html`<div class="card"><div class="body empty">${this.configError}</div></div>`;
    if (!this.config || !this.hass) return nothing;
    const roomStates = this.config.rooms.map(room => this.roomState(room));
    const exceptional = roomStates.filter(room => room.tone !== "normal" || room.active.includes("open"));
    const source = this.config.mode === "exceptions" ? (exceptional.length ? exceptional : roomStates.slice(0, 3)) : roomStates;
    const items = source.slice(0, this.config.max_items ?? source.length);
    const warnings = roomStates.filter(item => item.tone !== "normal").length;
    return html`
      <article class="card rooms-card ${this.config.mode === "grid" ? "full-grid" : ""}">
        <header class="card-header"><div><p class="eyebrow">${this.config.eyebrow ?? (this.config.mode === "grid" ? "Whole home" : "Room watch")}</p><h2>${this.config.title ?? "Rooms"}</h2></div><span class="meta">${warnings ? `${warnings} to check` : `${roomStates.length} comfortable`}</span></header>
        <div class="body room-grid">
          ${items.map(item => html`
            <button class="room ${item.tone}" type="button" @click=${() => this.openDetail(this.detail(item))} aria-label="Open ${item.room.name} details">
              <span class="room-icon">${item.room.icon ?? "⌂"}</span>
              <span class="room-copy"><b>${item.room.name}</b><small>${item.active.length ? item.active.join(" · ") : "Settled"}</small></span>
              <span class="metrics"><strong>${entityValue(this.hass, item.room.temperature)}</strong>${item.room.humidity ? html`<small>${entityValue(this.hass, item.room.humidity)}</small>` : nothing}</span>
            </button>
          `)}
        </div>
        ${this.config.mode === "exceptions" ? html`<div class="foot"><span>${exceptional.length ? "Only exceptions shown" : "No room exceptions"}</span><span>Open a room →</span></div>` : nothing}
      </article>`;
  }

  static styles = [DashboardCard.styles, css`
    .rooms-card{min-height:100%}.room-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem}.full-grid .room-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:.75rem}.room{appearance:none;width:100%;min-height:4.7rem;padding:.8rem .85rem;border:1px solid var(--jd-line);border-radius:6px;background:var(--jd-bg);color:var(--jd-ink);display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:.75rem;align-items:center;text-align:left;cursor:pointer;transition:border-color 160ms ease,background 160ms ease}.room:hover{border-color:var(--jd-accent);background:var(--jd-paper)}.room.warning{border-color:var(--jd-warning);box-shadow:inset 3px 0 var(--jd-warning)}.room.critical{border-color:var(--jd-critical);box-shadow:inset 3px 0 var(--jd-critical)}.room-icon{font-size:1.25rem;color:var(--jd-accent)}.room-copy,.metrics{min-width:0}.room-copy b,.room-copy small,.metrics strong,.metrics small{display:block}.room-copy b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.95rem}.room-copy small,.metrics small{margin-top:.15rem;color:var(--jd-muted);font-size:.75rem;text-transform:capitalize}.metrics{text-align:right}.metrics strong{font-size:1rem;font-weight:500}
    @media(max-width:1100px){.full-grid .room-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:760px){.room-grid,.full-grid .room-grid{grid-template-columns:1fr}}
  `];
}

customElements.define("jonsim-rooms-card", JonsimRoomsCard);
