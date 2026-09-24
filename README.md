# Jonsim Home Assistant dashboard

A purpose-built wall dashboard for Home Assistant. It combines the editorial typography and restrained rust accent of `reference_style.html` with information-dense cards that surface the state, trend, and reason behind each reading.

## Included

- Home overview for weather, presence, alerts, agenda, energy, and room exceptions.
- Climate view with ordered rooms, per-room thresholds, activity indicators, history, and explicit controls.
- Automatic day/night styling from `sun.sun`, plus a browser-local manual override.
- An accessible custom detail sheet; Bubble Card is not required.
- A local fixture preview kept out of the Home Assistant bundle.
- Version-controlled Home Assistant dashboard, resource, and theme examples.

## Develop and verify

Requires Node.js 22+ and pnpm.

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
```

The development preview uses realistic fixture entities. Production output is:

- `dist/ha-dashboard.js` — the single Home Assistant resource module.
- `dist/demo/` — a standalone preview; Home Assistant does not need it.

## Install in Home Assistant

1. Build and copy `dist/ha-dashboard.js` to `/config/www/ha-dashboard/ha-dashboard.js`.
2. Copy `home-assistant/lovelace-dashboard.yaml` to `/config/lovelace-dashboard.yaml`.
3. Copy `home-assistant/themes/jonsim-dashboard.yaml` to `/config/themes/jonsim-dashboard.yaml`.
4. Merge `home-assistant/configuration.example.yaml` into `/config/configuration.yaml`.
5. Replace sample entity IDs in `lovelace-dashboard.yaml` with entities from your instance.
6. Restart Home Assistant after the configuration change. For later JavaScript updates, replace the bundle, increment its `?v=` query, and use **Reload resources**.

Sample IDs are confined to YAML and the local demo. No household entity IDs are compiled into `ha-dashboard.js`.

## Configuration contract

Cards validate required properties and omit themselves if their configured live entity does not exist. Entity references accept a simple ID or an object:

```yaml
entity: sensor.hall_temperature
# or
entity:
  entity: sensor.hall_temperature
  label: Hall
  format: temperature
  unavailable: No reading
```

Room thresholds and controls are configured per room. Controls are explicit: tapping a card opens details rather than changing state. Add `confirm: true` and `confirm_text` to security-sensitive actions.

## Real-device checks

Before mounting the display, verify the dashboard at 1920×1080 and 1366×768, exercise every service action, and leave it running overnight while watching Chromium memory usage. Raspberry Pi kiosk setup and the household's underlying automations remain separate deployment work.
