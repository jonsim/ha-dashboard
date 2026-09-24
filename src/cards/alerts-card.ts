import { css, html, nothing } from "lit";
import { DashboardCard } from "./base-card";
import type { AlertsCardConfig, DashboardDetail } from "../types";
import { asEntityRef, entityLabel, stateFor } from "../utils";

export class JonsimAlertsCard extends DashboardCard<AlertsCardConfig> {
  protected validateConfig(config: AlertsCardConfig): void {
    super.validateConfig(config);
    if (!Array.isArray(config.alerts)) throw new Error("Alerts card requires an alerts array");
  }

  private activeAlerts() {
    return this.config!.alerts.filter(alert => {
      const state = stateFor(this.hass, alert.entity);
      return state && (alert.active_states ?? ["on", "open", "problem", "detected"]).includes(state.state);
    });
  }

  render() {
    if (this.configError) return html`<div class="card"><div class="body empty">${this.configError}</div></div>`;
    if (!this.config || !this.hass) return nothing;
    const active = this.activeAlerts();
    const detail: DashboardDetail = {
      title: active.length ? `${active.length} item${active.length === 1 ? "" : "s"} need attention` : "Everything looks good",
      icon: active.length ? "!" : "✓",
      fields: active.length ? active.map(alert => ({
        label: alert.label ?? entityLabel(this.hass, alert.entity),
        value: alert.detail ?? stateFor(this.hass, alert.entity)!.state.replaceAll("_", " "),
        tone: alert.severity ?? "warning",
      })) : [{ label: "Home status", value: this.config.clear_label ?? "No active alerts" }],
    };
    return html`
      <article class="card interactive ${active.some(a => a.severity === "critical") ? "critical" : active.length ? "warning" : ""}" tabindex="0" role="button" @click=${() => this.openDetail(detail)}>
        <header class="card-header"><div><p class="eyebrow">${this.config.eyebrow ?? "House status"}</p><h2>${active.length ? `${active.length} ${active.length === 1 ? "alert" : "alerts"}` : "All settled"}</h2></div><span class="signal">${active.length ? "!" : "✓"}</span></header>
        <div class="body alert-list">
          ${active.length ? active.slice(0, 3).map(alert => html`<div><span class="status-dot ${alert.severity ?? "warning"}"></span><b>${alert.label ?? entityLabel(this.hass, alert.entity)}</b><small>${alert.detail ?? stateFor(this.hass, alert.entity)?.state}</small></div>`) : html`<p class="empty">${this.config.clear_label ?? "Doors secure · no leaks · alarm ready"}</p>`}
        </div>
      </article>`;
  }

  static styles = [DashboardCard.styles, css`
    .card.warning{border-color:var(--jd-warning)}.card.critical{border-color:var(--jd-critical);box-shadow:0 0 0 1px color-mix(in srgb,var(--jd-critical) 35%,transparent)}.signal{display:grid;place-items:center;width:2.5rem;height:2.5rem;border-radius:50%;background:var(--jd-accent-soft);color:var(--jd-accent);font-weight:700}.alert-list{display:grid;gap:.6rem}.alert-list>div{display:grid;grid-template-columns:auto 1fr;gap:.2rem .65rem;align-items:center}.alert-list small{grid-column:2;color:var(--jd-muted);text-transform:capitalize}
  `];
}

customElements.define("jonsim-alerts-card", JonsimAlertsCard);
