import { css, html, nothing } from "lit";
import { DashboardCard } from "./base-card";
import type { DashboardDetail, WeatherCardConfig } from "../types";
import { asEntityRef, entityLabel, entityValue, stateFor } from "../utils";

const weatherSymbol = (condition: string): string => {
  const normalized = condition.toLowerCase();
  if (normalized.includes("rain") || normalized.includes("pour")) return "☂";
  if (normalized.includes("sun") || normalized.includes("clear")) return "☼";
  if (normalized.includes("snow")) return "✣";
  if (normalized.includes("storm") || normalized.includes("lightning")) return "ϟ";
  return "☁";
};

export class JonsimWeatherCard extends DashboardCard<WeatherCardConfig> {
  protected validateConfig(config: WeatherCardConfig): void {
    super.validateConfig(config);
    if (!config.entity) throw new Error("Weather card requires an entity");
  }

  private detail(): DashboardDetail {
    const config = this.config!;
    const weather = stateFor(this.hass, config.entity);
    return {
      title: config.title ?? "Weather",
      subtitle: weather?.state.replaceAll("_", " ") ?? "Weather unavailable",
      icon: weatherSymbol(weather?.state ?? "cloudy"),
      fields: [
        { label: "Temperature", value: entityValue(this.hass, config.entity) },
        ...(config.apparent_temperature ? [{ label: "Feels like", value: entityValue(this.hass, config.apparent_temperature) }] : []),
        ...(config.rain_until ? [{ label: entityLabel(this.hass, config.rain_until), value: entityValue(this.hass, config.rain_until) }] : []),
      ],
      history: [{ entity: asEntityRef(config.entity), label: "Temperature · 24 hours" }],
      actions: config.detail?.actions,
    };
  }

  render() {
    if (this.configError) return html`<div class="card"><div class="body empty">${this.configError}</div></div>`;
    if (!this.config || !this.hass) return nothing;
    const weather = stateFor(this.hass, this.config.entity);
    if (!weather) return nothing;
    const forecast = this.config.forecast?.slice(0, 4) ?? [];
    const condition = weather.state.replaceAll("_", " ");
    const temperature = typeof weather.attributes.temperature === "number"
      ? `${weather.attributes.temperature} ${String(weather.attributes.temperature_unit ?? weather.attributes.unit_of_measurement ?? "°C")}`
      : entityValue(this.hass, this.config.entity);
    return html`
      <article class="card interactive" tabindex="0" role="button" aria-label="Open weather details"
        @click=${() => this.openDetail(this.detail())}
        @keydown=${(event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") this.openDetail(this.detail()); }}>
        <header class="card-header">
          <div><p class="eyebrow">${this.config.eyebrow ?? "Outside now"}</p><h2>${this.config.title ?? "Weather"}</h2></div>
          <span class="arrow" aria-hidden="true">↗</span>
        </header>
        <div class="body weather-main">
          <div class="symbol" aria-hidden="true">${weatherSymbol(condition)}</div>
          <div><div class="value">${temperature}</div><p class="condition">${condition}</p></div>
        </div>
        ${this.config.rain_until ? html`<div class="rain-line"><span>↘</span><span>${entityValue(this.hass, this.config.rain_until)}</span></div>` : nothing}
        ${forecast.length ? html`
          <div class="forecast">
            ${forecast.map(day => html`<div><span class="meta">${day.label}</span><b>${weatherSymbol(day.condition)}</b><span>${day.high}°</span><small>${day.low}°</small></div>`)}
          </div>` : nothing}
      </article>
    `;
  }

  static styles = [DashboardCard.styles, css`
    .card{display:flex;flex-direction:column}.weather-main{display:flex;align-items:center;gap:1.1rem;padding-top:.9rem}.symbol{font-size:3.2rem;line-height:1;color:var(--jd-accent)}
    .condition{margin-top:.5rem;text-transform:capitalize;color:var(--jd-muted-dark);font-size:.95rem}.rain-line{margin:0 1.35rem 1rem;padding:.65rem .8rem;border-left:2px solid var(--jd-accent);background:var(--jd-accent-soft);display:flex;gap:.55rem;font-size:.88rem}
    .forecast{margin-top:auto;border-top:1px solid var(--jd-line);display:grid;grid-template-columns:repeat(4,1fr);padding:.85rem 1.1rem}.forecast div{display:grid;grid-template-columns:1fr auto;align-items:center;gap:.2rem .4rem;padding:0 .35rem;border-right:1px solid var(--jd-line)}.forecast div:last-child{border:0}.forecast b{grid-row:1/3;grid-column:2;font-size:1.2rem;color:var(--jd-accent)}.forecast small{color:var(--jd-muted)}
  `];
}

customElements.define("jonsim-weather-card", JonsimWeatherCard);
