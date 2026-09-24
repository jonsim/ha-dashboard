import { css, html, nothing } from "lit";
import { DashboardCard } from "./base-card";
import type { AgendaCardConfig, DashboardDetail } from "../types";
import { entityLabel, entityValue, relativeTime, stateFor } from "../utils";

export class JonsimAgendaCard extends DashboardCard<AgendaCardConfig> {
  protected validateConfig(config: AgendaCardConfig): void {
    super.validateConfig(config);
    if (!Array.isArray(config.entities) || !config.entities.length) throw new Error("Agenda card requires entities");
  }

  render() {
    if (this.configError) return html`<div class="card"><div class="body empty">${this.configError}</div></div>`;
    if (!this.config || !this.hass) return nothing;
    const items = this.config.entities.map(ref => ({ ref, state: stateFor(this.hass, ref) })).filter(item => item.state);
    if (!items.length) return nothing;
    const detail: DashboardDetail = {
      title: this.config.title ?? "Coming up",
      icon: "□",
      fields: items.map(({ ref, state }) => ({ label: entityLabel(this.hass, ref), value: `${entityValue(this.hass, ref)} · ${relativeTime(state!.last_changed)}` })),
    };
    return html`
      <article class="card interactive" tabindex="0" role="button" @click=${() => this.openDetail(detail)}>
        <header class="card-header"><div><p class="eyebrow">${this.config.eyebrow ?? "Next up"}</p><h2>${this.config.title ?? "Household"}</h2></div><span class="arrow">↗</span></header>
        <div class="body agenda">
          ${items.slice(0, 3).map(({ ref, state }, index) => html`
            <div class="agenda-item"><span class="date-box"><b>${index === 0 ? "NEXT" : `+${index}`}</b></span><div><strong>${entityLabel(this.hass, ref)}</strong><small>${entityValue(this.hass, ref)}</small></div><span class="when">${relativeTime(state!.last_changed)}</span></div>
          `)}
        </div>
      </article>`;
  }

  static styles = [DashboardCard.styles, css`
    .agenda{display:grid;gap:.2rem}.agenda-item{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.8rem;padding:.7rem 0;border-bottom:1px solid var(--jd-line)}.agenda-item:last-child{border:0}.date-box{display:grid;place-items:center;width:2.7rem;height:2.4rem;border:1px solid var(--jd-line);border-top:3px solid var(--jd-accent);font:700 .68rem var(--jd-mono);color:var(--jd-accent)}.agenda strong,.agenda small{display:block}.agenda strong{font-size:.95rem}.agenda small{margin-top:.18rem;color:var(--jd-muted);font-size:.82rem}.when{font:400 .78rem var(--jd-mono);color:var(--jd-muted-dark)}
  `];
}

customElements.define("jonsim-agenda-card", JonsimAgendaCard);
