import type {
  AttentionTone,
  DashboardAction,
  EntityRef,
  HassEntity,
  HomeAssistant,
  ThemeConfig,
  ThemeMode,
  ThresholdRange,
} from "./types";

export const asEntityRef = (value: EntityRef | string): EntityRef =>
  typeof value === "string" ? { entity: value } : value;

export const stateFor = (hass: HomeAssistant | undefined, ref: EntityRef | string): HassEntity | undefined =>
  hass?.states[asEntityRef(ref).entity];

export const isUnavailable = (state?: HassEntity): boolean =>
  !state || state.state === "unknown" || state.state === "unavailable";

export const numericState = (state?: HassEntity): number | undefined => {
  if (isUnavailable(state)) return undefined;
  const value = Number.parseFloat(state!.state);
  return Number.isFinite(value) ? value : undefined;
};

export const entityLabel = (hass: HomeAssistant | undefined, refValue: EntityRef | string): string => {
  const ref = asEntityRef(refValue);
  const state = stateFor(hass, ref);
  if (ref.label) return ref.label;
  if (state && hass?.formatEntityName) return hass.formatEntityName(state);
  const friendlyName = state?.attributes.friendly_name;
  if (typeof friendlyName === "string") return friendlyName;
  return ref.entity.split(".").at(-1)?.replaceAll("_", " ") ?? ref.entity;
};

const formatNumber = (value: number, maximumFractionDigits = 1): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);

export const entityValue = (hass: HomeAssistant | undefined, refValue: EntityRef | string): string => {
  const ref = asEntityRef(refValue);
  const state = stateFor(hass, ref);
  if (isUnavailable(state)) return ref.unavailable ?? "Unavailable";
  const raw = state!.state;
  const numeric = numericState(state);
  const unit = ref.unit ?? (typeof state!.attributes.unit_of_measurement === "string" ? state!.attributes.unit_of_measurement : "");
  const format = ref.format ?? "auto";
  if (numeric !== undefined && ["number", "temperature", "percentage", "power", "energy", "currency", "auto"].includes(format)) {
    return `${formatNumber(numeric)}${unit ? ` ${unit}` : ""}`;
  }
  return raw.replaceAll("_", " ");
};

export const isOn = (state?: HassEntity): boolean =>
  !!state && ["on", "open", "opening", "home", "playing", "heat", "cool", "heating"].includes(state.state);

export const classifyThreshold = (value: number | undefined, range?: ThresholdRange): AttentionTone => {
  if (value === undefined || !range) return "normal";
  if ((range.critical_below !== undefined && value < range.critical_below) ||
      (range.critical_above !== undefined && value > range.critical_above)) return "critical";
  if ((range.warning_below !== undefined && value < range.warning_below) ||
      (range.warning_above !== undefined && value > range.warning_above)) return "warning";
  return "normal";
};

export const strongestTone = (...tones: AttentionTone[]): AttentionTone =>
  tones.includes("critical") ? "critical" : tones.includes("warning") ? "warning" : "normal";

export const relativeTime = (dateValue: string, now = Date.now()): string => {
  const timestamp = new Date(dateValue).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const minutes = Math.round((timestamp - now) / 60_000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 36) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
};

export const greetingFor = (date = new Date()): string => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export const resolveTheme = (
  hass: HomeAssistant | undefined,
  config: ThemeConfig | undefined,
  manual: ThemeMode | null,
  now = Date.now(),
): ThemeMode => {
  if (manual) return manual;
  const sun = hass?.states[config?.sun_entity ?? "sun.sun"];
  if (!sun) return config?.default_mode ?? "day";

  const dawnOffset = (config?.dawn_offset_minutes ?? 0) * 60_000;
  const duskOffset = (config?.dusk_offset_minutes ?? 0) * 60_000;
  const nextRising = typeof sun.attributes.next_rising === "string" ? new Date(sun.attributes.next_rising).getTime() : Number.NaN;
  const nextSetting = typeof sun.attributes.next_setting === "string" ? new Date(sun.attributes.next_setting).getTime() : Number.NaN;

  if (sun.state === "below_horizon") {
    if (dawnOffset < 0 && Number.isFinite(nextRising) && now >= nextRising + dawnOffset) return "day";
    return "night";
  }
  if (duskOffset < 0 && Number.isFinite(nextSetting) && now >= nextSetting + duskOffset) return "night";
  return "day";
};

export const actionPayload = (action: DashboardAction): [string, string, Record<string, unknown>, Record<string, unknown>?] => [
  action.domain,
  action.service,
  action.data ?? {},
  action.target,
];

export const sparklinePath = (values: number[], width = 320, height = 80): string => {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / spread) * (height - 8) - 4;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
};

export const dispatchDetail = (element: HTMLElement, detail: unknown): void => {
  element.dispatchEvent(new CustomEvent("jonsim-open-detail", {
    detail,
    bubbles: true,
    composed: true,
  }));
};
