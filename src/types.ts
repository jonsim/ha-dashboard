export interface HassEntity {
  entity_id: string;
  state: string;
  last_changed: string;
  last_updated?: string;
  attributes: Record<string, unknown>;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  locale?: { language?: string };
  config?: { time_zone?: string; unit_system?: { temperature?: string } };
  callService: (
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: Record<string, unknown>,
  ) => Promise<unknown>;
  callApi?: <T>(method: string, path: string, data?: unknown) => Promise<T>;
  formatEntityName?: (state: HassEntity) => string;
}

export type ValueFormat = "auto" | "number" | "temperature" | "percentage" | "power" | "energy" | "currency";

export interface EntityRef {
  entity: string;
  label?: string;
  icon?: string;
  format?: ValueFormat;
  unit?: string;
  unavailable?: string;
}

export interface ThresholdRange {
  warning_below?: number;
  critical_below?: number;
  warning_above?: number;
  critical_above?: number;
  unit?: string;
}

export interface DashboardAction {
  label: string;
  icon?: string;
  domain: string;
  service: string;
  target?: Record<string, unknown>;
  data?: Record<string, unknown>;
  confirm?: boolean;
  confirm_text?: string;
}

export interface ModalSection {
  title?: string;
  entities?: EntityRef[];
  history?: EntityRef[];
  actions?: DashboardAction[];
}

export interface NavigationItem {
  label: string;
  icon?: string;
  path: string;
  enabled?: boolean;
}

export interface ThemeConfig {
  sun_entity?: string;
  dawn_offset_minutes?: number;
  dusk_offset_minutes?: number;
  default_mode?: "day" | "night";
}

export interface DashboardViewConfig {
  type: string;
  title?: string;
  eyebrow?: string;
  navigation?: NavigationItem[];
  theme?: ThemeConfig;
  active_path?: string;
}

export interface BaseCardConfig {
  type: string;
  title?: string;
  eyebrow?: string;
  class?: string;
  detail?: ModalSection;
}

export interface WeatherCardConfig extends BaseCardConfig {
  entity: EntityRef | string;
  apparent_temperature?: EntityRef | string;
  rain_until?: EntityRef | string;
  forecast?: Array<{
    label: string;
    condition: string;
    low: number;
    high: number;
    rain?: number;
  }>;
}

export interface PresenceCardConfig extends BaseCardConfig {
  people: Array<EntityRef | string>;
}

export interface AlertItemConfig {
  entity: EntityRef | string;
  active_states?: string[];
  label?: string;
  detail?: string;
  severity?: "warning" | "critical";
}

export interface AlertsCardConfig extends BaseCardConfig {
  alerts: AlertItemConfig[];
  clear_label?: string;
}

export interface AgendaCardConfig extends BaseCardConfig {
  entities: Array<EntityRef | string>;
}

export interface EnergyCardConfig extends BaseCardConfig {
  power: EntityRef | string;
  today?: EntityRef | string;
  cost?: EntityRef | string;
  peak?: EntityRef | string;
  history?: number[];
}

export interface RoomConfig {
  name: string;
  icon?: string;
  temperature: EntityRef | string;
  humidity?: EntityRef | string;
  light?: EntityRef | string;
  climate?: EntityRef | string;
  opening?: EntityRef | string;
  temperature_thresholds?: ThresholdRange;
  humidity_thresholds?: ThresholdRange;
  actions?: DashboardAction[];
}

export interface RoomsCardConfig extends BaseCardConfig {
  rooms: RoomConfig[];
  mode?: "grid" | "exceptions";
  max_items?: number;
}

export interface DetailField {
  label: string;
  value: string;
  tone?: "normal" | "warning" | "critical";
}

export interface DetailHistorySeries {
  entity: EntityRef;
  label: string;
}

export interface DashboardDetail {
  title: string;
  subtitle?: string;
  icon?: string;
  fields: DetailField[];
  history?: DetailHistorySeries[];
  actions?: DashboardAction[];
}

export interface OpenDetailEvent extends CustomEvent<DashboardDetail> {}

export type ThemeMode = "day" | "night";
export type AttentionTone = "normal" | "warning" | "critical";
