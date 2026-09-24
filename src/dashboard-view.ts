import { LitElement, css, html, nothing } from "lit";
import type { DashboardViewConfig, HomeAssistant, NavigationItem, OpenDetailEvent, ThemeMode } from "./types";
import { greetingFor, resolveTheme } from "./utils";
import { shellTokens } from "./styles";
import type { JonsimDetailModal } from "./detail-modal";
import "./detail-modal";

const THEME_STORAGE_KEY = "jonsim-dashboard-theme";

export class JonsimDashboardView extends LitElement {
  hass?: HomeAssistant;
  cards: HTMLElement[] = [];
  lovelace?: unknown;
  index?: number;
  private config?: DashboardViewConfig;
  private now = new Date();
  private manualTheme: ThemeMode | null = null;
  private timer?: number;

  static properties = {
    hass: { attribute: false },
    cards: { attribute: false },
    lovelace: { attribute: false },
    index: { attribute: false },
    now: { state: true },
    manualTheme: { state: true },
  };

  constructor() {
    super();
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    this.manualTheme = stored === "day" || stored === "night" ? stored : null;
  }

  setConfig(config: DashboardViewConfig): void {
    if (!config || typeof config !== "object") throw new Error("Dashboard view configuration is required");
    this.config = config;
    this.requestUpdate();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.timer = window.setInterval(() => { this.now = new Date(); }, 30_000);
    this.addEventListener("jonsim-open-detail", this.openDetail as EventListener);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.timer) window.clearInterval(this.timer);
    this.removeEventListener("jonsim-open-detail", this.openDetail as EventListener);
  }

  protected updated(): void {
    for (const card of this.cards) (card as HTMLElement & { hass?: HomeAssistant }).hass = this.hass;
  }

  private openDetail = (event: OpenDetailEvent): void => {
    event.stopPropagation();
    const modal = this.renderRoot.querySelector<JonsimDetailModal>("jonsim-detail-modal");
    modal!.hass = this.hass;
    modal!.open(event.detail, event.composedPath()[0] as HTMLElement);
  };

  private theme(): ThemeMode {
    return resolveTheme(this.hass, this.config?.theme, this.manualTheme, this.now.getTime());
  }

  private cycleTheme(): void {
    const current = this.theme();
    if (this.manualTheme === null) this.manualTheme = current === "day" ? "night" : "day";
    else if (this.manualTheme === "night") this.manualTheme = "day";
    else this.manualTheme = null;
    if (this.manualTheme) localStorage.setItem(THEME_STORAGE_KEY, this.manualTheme);
    else localStorage.removeItem(THEME_STORAGE_KEY);
  }

  private cardClass(card: HTMLElement): string {
    return card.localName.replace("jonsim-", "").replace("-card", "");
  }

  private navigation(): NavigationItem[] {
    return (this.config?.navigation ?? []).filter(item => item.enabled !== false);
  }

  render() {
    const theme = this.theme();
    this.dataset.theme = theme;
    const navigation = this.navigation();
    const date = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(this.now);
    const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }).format(this.now);
    const activePath = this.config?.active_path ?? window.location.pathname;
    return html`
      <main class="dashboard">
        <header class="masthead">
          <div class="brand"><span class="brand-mark">J</span><span>home</span></div>
          <div class="greeting"><p>${date}</p><h1>${greetingFor(this.now)}<span>.</span></h1></div>
          <div class="clock"><span>${time}</span><button type="button" @click=${this.cycleTheme} aria-label="Change colour theme" title="Theme: ${this.manualTheme ?? "automatic"}">${theme === "day" ? "☼" : "◐"}<small>${this.manualTheme ?? "auto"}</small></button></div>
        </header>
        <div class="accent-rule" aria-hidden="true"></div>
        <section class="card-grid" aria-label=${this.config?.title ?? "Dashboard"}>
          ${this.cards.length ? this.cards.map(card => html`<div class="card-slot ${this.cardClass(card)}">${card}</div>`) : html`<div class="empty-view">No cards are configured for this view.</div>`}
        </section>
        ${navigation.length ? html`
          <nav aria-label="Dashboard sections">
            ${navigation.map(item => html`<a class=${activePath.includes(item.path) ? "active" : ""} href=${item.path}><span>${item.icon ?? "·"}</span>${item.label}</a>`)}
          </nav>` : nothing}
      </main>
      <jonsim-detail-modal .hass=${this.hass}></jonsim-detail-modal>
    `;
  }

  static styles = [shellTokens, css`
    *{box-sizing:border-box}.dashboard{min-height:100vh;padding:clamp(1.2rem,2vw,2rem) clamp(1.4rem,3vw,3.4rem) 6.2rem;background:var(--jd-bg);color:var(--jd-ink);transition:background-color 240ms ease,color 240ms ease}.masthead{display:grid;grid-template-columns:1fr minmax(24rem,1.4fr) 1fr;align-items:end;gap:2rem;max-width:118rem;margin:0 auto}.brand{align-self:start;display:flex;align-items:center;gap:.7rem;font-weight:600;font-size:1.15rem;letter-spacing:-.03em}.brand-mark{display:grid;place-items:center;width:2.2rem;height:2.2rem;border-radius:50%;background:var(--jd-ink);color:var(--jd-bg);font:700 1rem var(--jd-mono)}.greeting p{margin:0 0 .5rem;color:var(--jd-muted);font:700 .76rem var(--jd-mono);text-transform:uppercase;letter-spacing:.12em}.greeting h1{margin:0;font-size:clamp(2.9rem,4.6vw,5.3rem);line-height:.88;letter-spacing:-.075em;font-weight:500;white-space:nowrap}.greeting h1 span{color:var(--jd-accent)}.clock{display:flex;justify-content:flex-end;align-items:center;gap:1.2rem}.clock>span{font-size:clamp(2rem,3vw,3.6rem);line-height:.9;letter-spacing:-.06em;font-weight:500}.clock button{display:grid;place-items:center;width:3.2rem;height:3.2rem;border:1px solid var(--jd-line);border-radius:50%;background:var(--jd-paper);color:var(--jd-ink);cursor:pointer;font-size:1.1rem}.clock button small{font:400 .55rem var(--jd-mono);color:var(--jd-muted);text-transform:uppercase}.accent-rule{height:1px;max-width:118rem;margin:1.5rem auto 1.3rem;background:var(--jd-line);position:relative}.accent-rule::before{content:"";position:absolute;left:0;top:-1px;width:4.5rem;height:3px;border-radius:2px;background:var(--jd-accent)}.card-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-auto-flow:dense;gap:clamp(.65rem,1vw,1rem);max-width:118rem;margin:0 auto}.card-slot{min-width:0}.card-slot>jonsim-weather-card,.card-slot>jonsim-presence-card,.card-slot>jonsim-alerts-card,.card-slot>jonsim-agenda-card,.card-slot>jonsim-energy-card,.card-slot>jonsim-rooms-card{height:100%}.card-slot.weather{grid-column:span 5;grid-row:span 2}.card-slot.presence{grid-column:span 3}.card-slot.alerts{grid-column:span 4}.card-slot.agenda{grid-column:span 3}.card-slot.energy{grid-column:span 4}.card-slot.rooms{grid-column:1/-1}.empty-view{grid-column:1/-1;padding:4rem;border:1px dashed var(--jd-line);color:var(--jd-muted);text-align:center}nav{position:fixed;z-index:10;left:50%;bottom:1rem;transform:translateX(-50%);display:flex;gap:.25rem;padding:.35rem;border:1px solid var(--jd-line);border-radius:9px;background:color-mix(in srgb,var(--jd-paper) 91%,transparent);box-shadow:0 12px 38px rgba(20,23,22,.15);backdrop-filter:blur(14px)}nav a{min-width:7rem;min-height:3.1rem;padding:.55rem .9rem;border-radius:6px;color:var(--jd-muted-dark);display:flex;align-items:center;justify-content:center;gap:.55rem;text-decoration:none;font-size:.88rem;font-weight:500}nav a span{color:var(--jd-accent)}nav a.active{background:var(--jd-ink);color:var(--jd-bg)}nav a.active span{color:inherit}
    @media(max-width:1400px){.dashboard{padding-left:1.5rem;padding-right:1.5rem}.masthead{grid-template-columns:.65fr 1.2fr .8fr}.greeting h1{font-size:3.2rem}.card-slot.weather{grid-column:span 5}.card-slot.presence{grid-column:span 3}.card-slot.alerts{grid-column:span 4}}
    @media(max-width:900px){.masthead{grid-template-columns:1fr auto}.greeting{grid-column:1/-1;grid-row:2}.brand{grid-row:1}.clock{grid-row:1}.greeting h1{white-space:normal}.card-slot.weather,.card-slot.presence,.card-slot.alerts,.card-slot.agenda,.card-slot.energy{grid-column:span 6;grid-row:auto}.card-slot.rooms{grid-column:1/-1}}
    @media(max-width:620px){.dashboard{padding:1rem 1rem 6rem}.clock>span{font-size:1.8rem}.greeting h1{font-size:2.7rem}.card-slot.weather,.card-slot.presence,.card-slot.alerts,.card-slot.agenda,.card-slot.energy,.card-slot.rooms{grid-column:1/-1}nav{width:calc(100% - 1rem);bottom:.5rem;overflow-x:auto}nav a{min-width:5.4rem;padding:.45rem .65rem;flex:1}}
  `];
}

customElements.define("jonsim-dashboard-view", JonsimDashboardView);
