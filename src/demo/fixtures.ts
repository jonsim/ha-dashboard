import type { HassEntity, HomeAssistant } from "../types";

const now = new Date();
const isoAgo = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

const entity = (entity_id: string, state: string, attributes: Record<string, unknown> = {}, minutesAgo = 20): HassEntity => ({
  entity_id,
  state,
  attributes,
  last_changed: isoAgo(minutesAgo),
  last_updated: isoAgo(Math.min(minutesAgo, 3)),
});

const states = [
  entity("sun.sun", "above_horizon", { next_setting: new Date(now.getTime() + 4 * 60 * 60_000).toISOString(), next_rising: new Date(now.getTime() + 16 * 60 * 60_000).toISOString() }),
  entity("weather.home", "rainy", { friendly_name: "Home weather", temperature: 16, unit_of_measurement: "°C", humidity: 78 }),
  entity("sensor.feels_like", "14.8", { friendly_name: "Feels like", unit_of_measurement: "°C" }),
  entity("sensor.rain_outlook", "Dry after 19:20", { friendly_name: "Rain outlook" }),
  entity("person.jon", "home", { friendly_name: "Jon" }, 46),
  entity("person.alex", "home", { friendly_name: "Alex" }, 92),
  entity("binary_sensor.front_door", "off", { friendly_name: "Front door" }, 82),
  entity("binary_sensor.kitchen_leak", "off", { friendly_name: "Kitchen leak" }, 420),
  entity("binary_sensor.study_window", "on", { friendly_name: "Study window" }, 67),
  entity("sensor.next_collection", "Recycling · Thursday", { friendly_name: "Bins" }, 1_440),
  entity("calendar.family", "Dentist · 16:30", { friendly_name: "Family calendar" }, 180),
  entity("sensor.parcel", "Arriving 18:10–19:10", { friendly_name: "Parcel" }, 30),
  entity("sensor.house_power", "2.37", { friendly_name: "Live power", unit_of_measurement: "kW" }),
  entity("sensor.energy_today", "21.1", { friendly_name: "Energy today", unit_of_measurement: "kWh" }),
  entity("sensor.energy_cost_today", "6.78", { friendly_name: "Cost today", unit_of_measurement: "£" }),
  entity("sensor.monthly_peak", "4.8", { friendly_name: "Monthly peak", unit_of_measurement: "kW" }),
  entity("sensor.hall_temperature", "21.2", { friendly_name: "Hall temperature", unit_of_measurement: "°C" }),
  entity("sensor.hall_humidity", "58", { friendly_name: "Hall humidity", unit_of_measurement: "%" }),
  entity("light.hall", "off", { friendly_name: "Hall lights" }),
  entity("sensor.living_temperature", "21.1", { friendly_name: "Living room temperature", unit_of_measurement: "°C" }),
  entity("sensor.living_humidity", "63", { friendly_name: "Living room humidity", unit_of_measurement: "%" }),
  entity("light.living_room", "on", { friendly_name: "Living room lights" }),
  entity("climate.living_room", "heat", { friendly_name: "Living room heating" }),
  entity("sensor.kitchen_temperature", "20.9", { friendly_name: "Kitchen temperature", unit_of_measurement: "°C" }),
  entity("sensor.kitchen_humidity", "61", { friendly_name: "Kitchen humidity", unit_of_measurement: "%" }),
  entity("light.kitchen", "on", { friendly_name: "Kitchen lights" }),
  entity("sensor.study_temperature", "21.7", { friendly_name: "Study temperature", unit_of_measurement: "°C" }),
  entity("sensor.study_humidity", "57", { friendly_name: "Study humidity", unit_of_measurement: "%" }),
  entity("light.study", "on", { friendly_name: "Study lights" }),
  entity("sensor.bedroom_temperature", "21.3", { friendly_name: "Bedroom temperature", unit_of_measurement: "°C" }),
  entity("sensor.bedroom_humidity", "66", { friendly_name: "Bedroom humidity", unit_of_measurement: "%" }),
  entity("light.bedroom", "off", { friendly_name: "Bedroom lights" }),
  entity("sensor.utility_temperature", "18.1", { friendly_name: "Utility temperature", unit_of_measurement: "°C" }),
  entity("sensor.utility_humidity", "74", { friendly_name: "Utility humidity", unit_of_measurement: "%" }),
  entity("light.utility", "off", { friendly_name: "Utility lights" }),
];

export const demoHass: HomeAssistant = {
  states: Object.fromEntries(states.map(item => [item.entity_id, item])),
  locale: { language: "en-GB" },
  config: { time_zone: "Europe/London", unit_system: { temperature: "°C" } },
  formatEntityName: state => String(state.attributes.friendly_name ?? state.entity_id),
  callService: async (domain, service, data, target) => {
    await new Promise(resolve => window.setTimeout(resolve, 650));
    console.info("Demo service call", { domain, service, data, target });
  },
  callApi: async <T>(_method: string, path: string): Promise<T> => {
    await new Promise(resolve => window.setTimeout(resolve, 350));
    const query = path.split("?")[1] ?? "";
    const ids = (new URLSearchParams(query).get("filter_entity_id") ?? "").split(",").filter(Boolean);
    const series = ids.map((id, seriesIndex) => Array.from({ length: 25 }, (_, index) => entity(
      id,
      (20 + seriesIndex * 18 + Math.sin(index / 2.8) * 1.4 + index * .035).toFixed(1),
      {},
      (24 - index) * 60,
    )));
    return series as T;
  },
};

export const demoRooms = [
  { name: "Hall", icon: "⌂", temperature: "sensor.hall_temperature", humidity: "sensor.hall_humidity", light: "light.hall" },
  { name: "Living room", icon: "◇", temperature: "sensor.living_temperature", humidity: "sensor.living_humidity", light: "light.living_room", climate: "climate.living_room" },
  { name: "Kitchen", icon: "◫", temperature: "sensor.kitchen_temperature", humidity: "sensor.kitchen_humidity", light: "light.kitchen" },
  { name: "Study", icon: "□", temperature: "sensor.study_temperature", humidity: "sensor.study_humidity", light: "light.study", opening: "binary_sensor.study_window" },
  { name: "Bedroom", icon: "▱", temperature: "sensor.bedroom_temperature", humidity: "sensor.bedroom_humidity", light: "light.bedroom" },
  { name: "Utility", icon: "○", temperature: "sensor.utility_temperature", humidity: "sensor.utility_humidity", light: "light.utility" },
].map(room => ({
  ...room,
  temperature_thresholds: { warning_below: 17, critical_below: 14, warning_above: 24, critical_above: 28 },
  humidity_thresholds: { warning_below: 35, critical_below: 25, warning_above: 65, critical_above: 75 },
  actions: [
    { label: "Toggle lights", icon: "✦", domain: "light", service: "toggle", target: { entity_id: room.light } },
  ],
}));
