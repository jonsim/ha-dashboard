// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import "../src/index";
import type { HomeAssistant } from "../src/types";

const hass: HomeAssistant = {
  states: { "person.one": { entity_id: "person.one", state: "home", last_changed: new Date().toISOString(), attributes: { friendly_name: "A very long household member name" } } },
  callService: async () => undefined,
};

describe("custom cards", () => {
  it("renders presence with a detail affordance", async () => {
    const card = document.createElement("jonsim-presence-card") as HTMLElement & { hass: HomeAssistant; setConfig(config: unknown): void; updateComplete: Promise<boolean> };
    card.hass = hass;
    card.setConfig({ type: "custom:jonsim-presence-card", people: ["person.one"] });
    document.body.append(card);
    await card.updateComplete;
    expect(card.shadowRoot?.textContent).toContain("Everyone is home");
    expect(card.shadowRoot?.querySelector('[role="button"]')).not.toBeNull();
    card.remove();
  });
  it("renders a concise configuration error", async () => {
    const card = document.createElement("jonsim-rooms-card") as HTMLElement & { hass: HomeAssistant; setConfig(config: unknown): void; updateComplete: Promise<boolean> };
    card.hass = hass;
    card.setConfig({ type: "custom:jonsim-rooms-card", rooms: [] });
    document.body.append(card);
    await card.updateComplete;
    expect(card.shadowRoot?.textContent).toContain("requires at least one room");
    card.remove();
  });
});
