import { LitElement } from "lit";
import type { CSSResultGroup } from "lit";
import type { BaseCardConfig, DashboardDetail, HomeAssistant } from "../types";
import { cardStyles } from "../styles";
import { dispatchDetail } from "../utils";

export abstract class DashboardCard<T extends BaseCardConfig = BaseCardConfig> extends LitElement {
  static styles: CSSResultGroup = cardStyles;

  hass?: HomeAssistant;
  protected config?: T;
  protected configError = "";

  static properties = {
    hass: { attribute: false },
    configError: { state: true },
  };

  setConfig(config: T): void {
    this.configError = "";
    try {
      this.validateConfig(config);
      this.config = config;
    } catch (error) {
      this.config = config;
      this.configError = error instanceof Error ? error.message : "Invalid card configuration";
    }
    this.requestUpdate();
  }

  protected validateConfig(config: T): void {
    if (!config || typeof config !== "object") throw new Error("Card configuration is required");
  }

  protected openDetail(detail: DashboardDetail): void {
    dispatchDetail(this, detail);
  }

  getCardSize(): number {
    return 3;
  }
}
