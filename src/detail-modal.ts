import { LitElement, css, html, nothing } from "lit";
import type { DashboardAction, DashboardDetail, HassEntity, HomeAssistant } from "./types";
import { actionPayload, numericState, sparklinePath } from "./utils";
import { fontFaces } from "./styles";

type ActionStatus = "idle" | "pending" | "success" | "error";

export class JonsimDetailModal extends LitElement {
  hass?: HomeAssistant;
  detail?: DashboardDetail;
  private history = new Map<string, number[]>();
  private historyError = false;
  private pendingConfirmation?: DashboardAction;
  private actionStatus: ActionStatus = "idle";
  private returnFocus?: HTMLElement;

  static properties = {
    hass: { attribute: false },
    detail: { attribute: false },
    history: { state: true },
    historyError: { state: true },
    pendingConfirmation: { state: true },
    actionStatus: { state: true },
  };

  open(detail: DashboardDetail, source?: HTMLElement): void {
    this.returnFocus = source ?? (document.activeElement instanceof HTMLElement ? document.activeElement : undefined);
    this.detail = detail;
    this.history = new Map();
    this.historyError = false;
    this.pendingConfirmation = undefined;
    this.actionStatus = "idle";
    this.requestUpdate();
    void this.updateComplete.then(() => {
      const dialog = this.renderRoot.querySelector("dialog");
      if (dialog && !dialog.open) dialog.showModal();
      void this.loadHistory();
    });
  }

  close(): void {
    this.renderRoot.querySelector("dialog")?.close();
  }

  private handleClosed(): void {
    this.detail = undefined;
    this.pendingConfirmation = undefined;
    this.returnFocus?.focus();
  }

  private handleBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  private async loadHistory(): Promise<void> {
    if (!this.hass?.callApi || !this.detail?.history?.length) return;
    const start = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const ids = this.detail.history.map(series => series.entity.entity).join(",");
    try {
      const response = await this.hass.callApi<HassEntity[][]>("GET", `history/period/${encodeURIComponent(start)}?filter_entity_id=${encodeURIComponent(ids)}&minimal_response&no_attributes`);
      const next = new Map<string, number[]>();
      for (const states of response) {
        const id = states[0]?.entity_id;
        if (!id) continue;
        next.set(id, states.map(numericState).filter((value): value is number => value !== undefined));
      }
      this.history = next;
    } catch {
      this.historyError = true;
    }
  }

  private requestAction(action: DashboardAction): void {
    if (action.confirm) {
      this.pendingConfirmation = action;
      return;
    }
    void this.runAction(action);
  }

  private async runAction(action: DashboardAction): Promise<void> {
    if (!this.hass) return;
    this.pendingConfirmation = undefined;
    this.actionStatus = "pending";
    try {
      const [domain, service, data, target] = actionPayload(action);
      await Promise.race([
        this.hass.callService(domain, service, data, target),
        new Promise((_, reject) => window.setTimeout(() => reject(new Error("Action timed out")), 8_000)),
      ]);
      this.actionStatus = "success";
      window.setTimeout(() => { this.actionStatus = "idle"; }, 1_600);
    } catch {
      this.actionStatus = "error";
    }
  }

  render() {
    return html`
      <dialog @click=${this.handleBackdrop} @close=${this.handleClosed} aria-labelledby="detail-title">
        ${this.detail ? html`
          <article class="sheet">
            <header>
              <div class="heading"><span class="icon">${this.detail.icon ?? "⌂"}</span><div><p>Live details</p><h2 id="detail-title">${this.detail.title}</h2>${this.detail.subtitle ? html`<span>${this.detail.subtitle}</span>` : nothing}</div></div>
              <button class="close" type="button" @click=${this.close} aria-label="Close details">×</button>
            </header>
            <div class="content">
              <section class="fields" aria-label="Current values">
                ${this.detail.fields.map(field => html`<div class=${field.tone ?? "normal"}><span>${field.label}</span><strong>${field.value}</strong></div>`)}
              </section>
              ${this.detail.history?.length ? html`
                <section class="history" aria-label="History">
                  ${this.detail.history.map(series => {
                    const values = this.history.get(series.entity.entity) ?? [];
                    return html`<div class="series"><div><span>${series.label}</span>${values.length ? html`<small>${Math.min(...values).toFixed(1)} — ${Math.max(...values).toFixed(1)}</small>` : nothing}</div>
                      ${values.length > 1 ? html`<svg viewBox="0 0 500 110" role="img" aria-label=${series.label}><path d=${sparklinePath(values, 500, 110)}></path></svg>` : html`<div class="history-empty">${this.historyError ? "History could not be loaded" : "Loading history…"}</div>`}
                    </div>`;
                  })}
                </section>` : nothing}
              ${this.detail.actions?.length ? html`
                <section class="actions" aria-label="Controls">
                  ${this.detail.actions.map(action => html`<button type="button" ?disabled=${this.actionStatus === "pending"} @click=${() => this.requestAction(action)}><span>${action.icon ?? "→"}</span>${action.label}</button>`)}
                </section>` : nothing}
              ${this.pendingConfirmation ? html`
                <section class="confirm" role="alertdialog" aria-label="Confirm action">
                  <div><strong>Confirm ${this.pendingConfirmation.label.toLowerCase()}</strong><p>${this.pendingConfirmation.confirm_text ?? "This changes a security-sensitive device."}</p></div>
                  <button type="button" class="quiet" @click=${() => { this.pendingConfirmation = undefined; }}>Cancel</button>
                  <button type="button" class="danger" @click=${() => void this.runAction(this.pendingConfirmation!)}>Confirm</button>
                </section>` : nothing}
              ${this.actionStatus === "success" ? html`<p class="notice success" role="status">Action completed</p>` : nothing}
              ${this.actionStatus === "error" ? html`<p class="notice error" role="alert">The action could not be completed. Try again.</p>` : nothing}
            </div>
          </article>` : nothing}
      </dialog>`;
  }

  static styles = css`
    ${fontFaces}
    *{box-sizing:border-box}dialog{width:min(48rem,calc(100vw - 2rem));max-height:min(88vh,54rem);padding:0;border:1px solid var(--jd-line);border-radius:10px;background:var(--jd-paper);color:var(--jd-ink);box-shadow:0 30px 100px rgba(0,0,0,.35);font-family:var(--jd-font)}dialog::backdrop{background:rgba(13,11,10,.62);backdrop-filter:blur(8px)}.sheet>header{display:flex;justify-content:space-between;gap:1rem;padding:1.4rem 1.5rem;border-bottom:1px solid var(--jd-line)}.heading{display:flex;gap:1rem;align-items:flex-start}.heading .icon{display:grid;place-items:center;width:3rem;height:3rem;border-radius:50%;background:var(--jd-accent-soft);color:var(--jd-accent);font-size:1.25rem}.heading p{margin:0 0 .3rem;color:var(--jd-muted);font:700 .72rem var(--jd-mono);letter-spacing:.12em;text-transform:uppercase}.heading h2{margin:0;font-size:2rem;line-height:1;letter-spacing:-.05em;font-weight:500}.heading div>span{display:block;margin-top:.45rem;color:var(--jd-muted-dark);font-size:.9rem}.close{width:2.75rem;height:2.75rem;border:1px solid var(--jd-line);border-radius:50%;background:transparent;color:var(--jd-ink);font-size:1.6rem;cursor:pointer}.content{display:grid;gap:1.1rem;padding:1.4rem 1.5rem 1.6rem}.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border:1px solid var(--jd-line);border-radius:7px}.fields div{display:flex;justify-content:space-between;gap:1rem;padding:1rem;border-bottom:1px solid var(--jd-line)}.fields div:nth-last-child(-n+2){border-bottom:0}.fields div:nth-child(odd){border-right:1px solid var(--jd-line)}.fields span{color:var(--jd-muted-dark)}.fields strong{font-weight:500;text-transform:capitalize}.fields .warning strong{color:var(--jd-warning)}.fields .critical strong{color:var(--jd-critical)}.history{display:grid;gap:.8rem}.series{padding:1rem;border:1px solid var(--jd-line);border-radius:7px;background:var(--jd-bg)}.series>div:first-child{display:flex;justify-content:space-between;gap:1rem}.series span{font-weight:500}.series small{font-family:var(--jd-mono);color:var(--jd-muted)}.series svg{width:100%;height:7rem;margin-top:.7rem;overflow:visible}.series path{fill:none;stroke:var(--jd-accent);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.history-empty{display:grid;place-items:center;height:5rem;color:var(--jd-muted);font-size:.85rem}.actions{display:flex;flex-wrap:wrap;gap:.6rem;padding-top:.2rem}.actions button,.confirm button{min-height:2.8rem;padding:.65rem 1rem;border:1px solid var(--jd-line);border-radius:6px;background:var(--jd-bg);color:var(--jd-ink);font:500 .9rem var(--jd-font);cursor:pointer}.actions button span{margin-right:.5rem;color:var(--jd-accent)}button:focus-visible{outline:3px solid color-mix(in srgb,var(--jd-accent) 70%,transparent);outline-offset:2px}.confirm{display:grid;grid-template-columns:1fr auto auto;gap:.7rem;align-items:center;padding:1rem;border:1px solid var(--jd-warning);border-radius:7px;background:color-mix(in srgb,var(--jd-warning) 8%,var(--jd-paper))}.confirm p{margin:.25rem 0 0;color:var(--jd-muted-dark);font-size:.84rem}.confirm .danger{border-color:var(--jd-critical);background:var(--jd-critical);color:white}.notice{margin:0;padding:.8rem 1rem;border-radius:6px}.notice.success{background:color-mix(in srgb,var(--jd-success) 15%,transparent);color:var(--jd-success)}.notice.error{background:color-mix(in srgb,var(--jd-critical) 15%,transparent);color:var(--jd-critical)}
    @media(max-width:600px){dialog{width:100vw;max-width:none;max-height:92vh;margin:auto 0 0;border-radius:10px 10px 0 0}.fields{grid-template-columns:1fr}.fields div,.fields div:nth-child(odd),.fields div:nth-last-child(-n+2){border-right:0;border-bottom:1px solid var(--jd-line)}.fields div:last-child{border-bottom:0}.confirm{grid-template-columns:1fr 1fr}.confirm div{grid-column:1/-1}}
  `;
}

customElements.define("jonsim-detail-modal", JonsimDetailModal);
