import { css, html, nothing, svg } from "lit";
import { DashboardCard } from "./base-card";
import type { DashboardDetail, EnergyCardConfig } from "../types";
import { asEntityRef, entityLabel, entityValue, numericState, sparklinePath, stateFor } from "../utils";

export class JonsimEnergyCard extends DashboardCard<EnergyCardConfig> {
  protected validateConfig(config: EnergyCardConfig): void {
    super.validateConfig(config);
    if (!config.power) throw new Error("Energy card requires a power entity");
  }

  render() {
    if (this.configError) return html`<div class="card"><div class="body empty">${this.configError}</div></div>`;
    if (!this.config || !this.hass) return nothing;
    const power = stateFor(this.hass, this.config.power);
    if (!power) return nothing;
    const history = this.config.history ?? [1.4, 1.2, 1.8, 1.5, 2.1, 1.9, 2.3, 2.0, 2.4, 2.2, 2.37];
    const peak = this.config.peak ? numericState(stateFor(this.hass, this.config.peak)) : undefined;
    const current = numericState(power);
    const peakPercent = peak && current !== undefined ? Math.min(100, Math.round((current / peak) * 100)) : undefined;
    const detail: DashboardDetail = {
      title: this.config.title ?? "Energy",
      subtitle: "Live household demand",
      icon: "ϟ",
      fields: [
        { label: entityLabel(this.hass, this.config.power), value: entityValue(this.hass, this.config.power) },
        ...(this.config.today ? [{ label: entityLabel(this.hass, this.config.today), value: entityValue(this.hass, this.config.today) }] : []),
        ...(this.config.cost ? [{ label: entityLabel(this.hass, this.config.cost), value: entityValue(this.hass, this.config.cost) }] : []),
      ],
      history: [{ entity: asEntityRef(this.config.power), label: "Demand · 24 hours" }],
    };
    return html`
      <article class="card interactive" tabindex="0" role="button" @click=${() => this.openDetail(detail)}>
        <header class="card-header"><div><p class="eyebrow">${this.config.eyebrow ?? "Live demand"}</p><h2>${this.config.title ?? "Energy"}</h2></div><span class="bolt">ϟ</span></header>
        <div class="body energy-body">
          <div><div class="value">${entityValue(this.hass, this.config.power)}</div>${peakPercent !== undefined ? html`<p class="muted">${peakPercent}% of configured peak</p>` : nothing}</div>
          <svg class="spark" viewBox="0 0 320 80" role="img" aria-label="Recent power trend"><path d=${sparklinePath(history)}></path></svg>
        </div>
        <div class="foot"><span>${this.config.today ? `${entityValue(this.hass, this.config.today)} today` : "Live household total"}</span><span>${this.config.cost ? entityValue(this.hass, this.config.cost) : "View history →"}</span></div>
      </article>`;
  }

  static styles = [DashboardCard.styles, css`
    .bolt{color:var(--jd-accent);font-size:2rem;line-height:1}.energy-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(10rem,.8fr);align-items:end;gap:1rem}.energy-body .value{font-size:clamp(2rem,3vw,3.5rem)}.energy-body p{margin-top:.5rem;font-size:.85rem}.spark{width:100%;height:5rem;overflow:visible}.spark path{fill:none;stroke:var(--jd-accent);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
    @media(max-width:560px){.energy-body{grid-template-columns:1fr}.spark{height:3.5rem}}
  `];
}

customElements.define("jonsim-energy-card", JonsimEnergyCard);
