import { describe, expect, it } from "vitest";
import type { HomeAssistant } from "../src/types";
import { actionPayload, classifyThreshold, entityValue, resolveTheme, sparklinePath } from "../src/utils";

const hass: HomeAssistant = {
  states: {
    "sensor.temp": { entity_id: "sensor.temp", state: "21.45", last_changed: "2026-01-01T00:00:00Z", attributes: { unit_of_measurement: "°C" } },
    "sensor.missing": { entity_id: "sensor.missing", state: "unavailable", last_changed: "2026-01-01T00:00:00Z", attributes: {} },
    "sun.sun": { entity_id: "sun.sun", state: "below_horizon", last_changed: "2026-01-01T00:00:00Z", attributes: { next_rising: "2026-01-01T08:00:00Z" } },
  },
  callService: async () => undefined,
};

describe("dashboard utilities", () => {
  it("formats entity values and unavailable fallbacks", () => {
    expect(entityValue(hass, "sensor.temp")).toBe("21.5 °C");
    expect(entityValue(hass, { entity: "sensor.missing", unavailable: "No reading" })).toBe("No reading");
  });
  it("classifies warning and critical thresholds", () => {
    const range = { warning_above: 60, critical_above: 75, warning_below: 35, critical_below: 25 };
    expect(classifyThreshold(55, range)).toBe("normal");
    expect(classifyThreshold(68, range)).toBe("warning");
    expect(classifyThreshold(80, range)).toBe("critical");
  });
  it("uses sun state unless a manual theme is selected", () => {
    expect(resolveTheme(hass, { sun_entity: "sun.sun" }, null, Date.parse("2026-01-01T02:00:00Z"))).toBe("night");
    expect(resolveTheme(hass, { sun_entity: "sun.sun" }, "day")).toBe("day");
  });
  it("keeps service targets separate from service data", () => {
    expect(actionPayload({ label: "Lock", domain: "lock", service: "lock", target: { entity_id: "lock.front" }, confirm: true })).toEqual(["lock", "lock", {}, { entity_id: "lock.front" }]);
  });
  it("creates a finite sparkline for flat values", () => {
    expect(sparklinePath([2, 2, 2])).toMatch(/^M0\.0,/);
    expect(sparklinePath([2, 2, 2])).not.toContain("NaN");
  });
});
