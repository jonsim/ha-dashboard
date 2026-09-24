import { css, html, nothing } from "lit";
import { DashboardCard } from "./base-card";
import type { DashboardDetail, PresenceCardConfig } from "../types";
import { entityLabel, isOn, relativeTime, stateFor } from "../utils";

export class JonsimPresenceCard extends DashboardCard<PresenceCardConfig> {
  protected validateConfig(config: PresenceCardConfig): void {
    super.validateConfig(config);
    if (!Array.isArray(config.people) || !config.people.length) throw new Error("Presence card requires at least one person");
  }

  private detail(): DashboardDetail {
    const people = this.config!.people.map(ref => {
      const state = stateFor(this.hass, ref);
      return {
        label: entityLabel(this.hass, ref),
        value: state ? `${state.state === "home" ? "Home" : state.state.replaceAll("_", " ")} · ${relativeTime(state.last_changed)}` : "Unavailable",
      };
    });
    return { title: this.config!.title ?? "Who's home", subtitle: "Household presence", icon: "⌂", fields: people };
  }

  render() {
    if (this.configError) return html`<div class="card"><div class="body empty">${this.configError}</div></div>`;
    if (!this.config || !this.hass) return nothing;
    const people = this.config.people.map(ref => ({ ref, state: stateFor(this.hass, ref) })).filter(item => item.state);
    if (!people.length) return nothing;
    const homeCount = people.filter(item => isOn(item.state)).length;
    return html`
      <article class="card interactive" tabindex="0" role="button" @click=${() => this.openDetail(this.detail())}
        @keydown=${(e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") this.openDetail(this.detail()); }}>
        <header class="card-header"><div><p class="eyebrow">${this.config.eyebrow ?? "Presence"}</p><h2>${homeCount === people.length ? "Everyone is home" : `${homeCount} of ${people.length} home`}</h2></div><span class="arrow">↗</span></header>
        <div class="body people">
          ${people.map(({ ref, state }, index) => html`
            <div class="person"><span class="avatar">${entityLabel(this.hass, ref).slice(0, 1)}</span><div><b>${entityLabel(this.hass, ref)}</b><small>${state!.state === "home" ? "At home" : state!.state.replaceAll("_", " ")}</small></div><span class="status-dot ${state!.state === "home" ? "" : "warning"}"></span></div>
          `)}
        </div>
      </article>`;
  }

  static styles = [DashboardCard.styles, css`
    .people{display:grid;gap:.15rem}.person{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.8rem;padding:.7rem 0;border-bottom:1px solid var(--jd-line)}.person:last-child{border:0}.avatar{display:grid;place-items:center;width:2.35rem;height:2.35rem;border:1px solid var(--jd-line);border-radius:50%;background:var(--jd-bg);color:var(--jd-accent);font-weight:600}.person b,.person small{display:block}.person b{font-size:.95rem}.person small{margin-top:.15rem;color:var(--jd-muted);font-size:.8rem;text-transform:capitalize}
  `];
}

customElements.define("jonsim-presence-card", JonsimPresenceCard);
