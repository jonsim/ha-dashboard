import { css, unsafeCSS } from "lit";
import dmSansRegular from "@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2?inline";
import dmSansMedium from "@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff2?inline";
import dmSansSemiBold from "@fontsource/dm-sans/files/dm-sans-latin-600-normal.woff2?inline";
import lektonRegular from "@fontsource/lekton/files/lekton-latin-400-normal.woff2?inline";
import lektonBold from "@fontsource/lekton/files/lekton-latin-700-normal.woff2?inline";

export const fontFaces = css`
  @font-face { font-family: "DM Sans Local"; src: url(${unsafeCSS(dmSansRegular)}) format("woff2"); font-weight: 400; font-display: swap; }
  @font-face { font-family: "DM Sans Local"; src: url(${unsafeCSS(dmSansMedium)}) format("woff2"); font-weight: 500; font-display: swap; }
  @font-face { font-family: "DM Sans Local"; src: url(${unsafeCSS(dmSansSemiBold)}) format("woff2"); font-weight: 600; font-display: swap; }
  @font-face { font-family: "Lekton Local"; src: url(${unsafeCSS(lektonRegular)}) format("woff2"); font-weight: 400; font-display: swap; }
  @font-face { font-family: "Lekton Local"; src: url(${unsafeCSS(lektonBold)}) format("woff2"); font-weight: 700; font-display: swap; }
`;

export const cardStyles = css`
  ${fontFaces}
  :host {
    display: block;
    min-width: 0;
    color: var(--jd-ink, #171918);
    font-family: var(--jd-font, "DM Sans Local", sans-serif);
  }
  * { box-sizing: border-box; }
  button, a { font: inherit; }
  button:focus-visible, [tabindex]:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--jd-accent, #b96746) 70%, transparent);
    outline-offset: 3px;
  }
  .card {
    height: 100%;
    min-height: 9.5rem;
    overflow: hidden;
    border: 1px solid var(--jd-line, #d8ddd8);
    border-radius: var(--jd-radius, 8px);
    background: var(--jd-paper, #fff);
    color: var(--jd-ink, #171918);
    transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
  }
  .card.interactive { cursor: pointer; }
  .card.interactive:hover {
    border-color: var(--jd-accent, #b96746);
    box-shadow: var(--jd-shadow, 0 18px 44px rgba(20, 23, 22, .08));
  }
  .card.interactive:active { transform: translateY(1px); }
  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem 1.35rem 0;
  }
  .eyebrow, .meta {
    margin: 0;
    color: var(--jd-muted, #866);
    font: 700 .75rem/1.2 var(--jd-mono, "Lekton Local", monospace);
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  h2, h3, p { margin: 0; }
  h2 {
    margin-top: .35rem;
    font-size: clamp(1.3rem, 1.5vw, 1.75rem);
    line-height: 1;
    letter-spacing: -.045em;
    font-weight: 500;
  }
  .body { padding: 1.15rem 1.35rem 1.35rem; }
  .foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .8rem;
    padding: .8rem 1.35rem;
    border-top: 1px solid var(--jd-line, #d8ddd8);
    color: var(--jd-muted-dark, #755);
    font-size: .85rem;
  }
  .value {
    font-size: clamp(2.4rem, 4vw, 4.6rem);
    line-height: .88;
    letter-spacing: -.07em;
    font-weight: 500;
  }
  .unit { font-size: .4em; letter-spacing: -.02em; color: var(--jd-muted-dark, #755); }
  .muted { color: var(--jd-muted-dark, #755); }
  .status-dot {
    width: .55rem;
    height: .55rem;
    border-radius: 50%;
    background: var(--jd-success, #4d8f68);
    flex: 0 0 auto;
  }
  .status-dot.warning { background: var(--jd-warning, #c17a28); }
  .status-dot.critical { background: var(--jd-critical, #b4473c); }
  .empty { color: var(--jd-muted, #866); font-size: .95rem; line-height: 1.5; }
  .arrow { color: var(--jd-accent, #b96746); font-size: 1.2rem; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition-duration: .01ms !important; animation-duration: .01ms !important; }
  }
`;

export const shellTokens = css`
  ${fontFaces}
  :host {
    --jd-bg: #f7f8f6;
    --jd-paper: #ffffff;
    --jd-ink: #171918;
    --jd-muted: #876b6b;
    --jd-muted-dark: #735858;
    --jd-line: #d8ddd8;
    --jd-accent: #b96746;
    --jd-accent-soft: #f2e2db;
    --jd-success: #3f7f5a;
    --jd-warning: #b76d21;
    --jd-critical: #ad3f36;
    --jd-radius: 8px;
    --jd-shadow: 0 18px 44px rgba(20, 23, 22, .09);
    --jd-font: "DM Sans Local", sans-serif;
    --jd-mono: "Lekton Local", monospace;
    display: block;
    min-height: 100%;
    color: var(--jd-ink);
    font-family: var(--jd-font);
  }
  :host([data-theme="night"]) {
    --jd-bg: #141210;
    --jd-paper: #1c1916;
    --jd-ink: #f4f0ea;
    --jd-muted: #a58e84;
    --jd-muted-dark: #c2afa4;
    --jd-line: #39312b;
    --jd-accent: #d6845f;
    --jd-accent-soft: #3a251c;
    --jd-success: #74a985;
    --jd-warning: #dda453;
    --jd-critical: #df776a;
    --jd-shadow: 0 20px 50px rgba(0, 0, 0, .25);
  }
`;
