import { ALERT_TYPES, ALERT_SEVERITY } from "./alertTypes.js";
import { logInfo, logError } from "../agent/utils.js";
import settings from "../config/settings.js";

class AlertManager {
  constructor() {
    this.alertHistory = new Map();
    this.cooldownMs = settings.alerts.cooldownMs;
    this.channels = new Map();
  }

  registerChannel(name, channel) {
    this.channels.set(name, channel);
  }

  async triggerAlert(type, severity, data, message) {
    if (!settings.alertsEnabled) {
      return;
    }

    const alertKey = `${type}_${data.hostname || "unknown"}`;
    const now = Date.now();
    const lastAlert = this.alertHistory.get(alertKey);

    // Check cooldown
    if (lastAlert && now - lastAlert.timestamp < this.cooldownMs) {
      return;
    }

    const alert = {
      type,
      severity,
      timestamp: now,
      data,
      message,
      hostname: data.hostname || "unknown",
    };

    // Store in history
    this.alertHistory.set(alertKey, alert);

    // Send to all registered channels
    for (const [channelName, channel] of this.channels) {
      try {
        await channel.send(alert);
        logInfo(`Alert sent via ${channelName}: ${type} - ${message}`);
      } catch (error) {
        logError(`Failed to send alert via ${channelName}: ${error.message}`);
      }
    }
  }

  // Convenience methods for common alerts
  async alertUltraViewerDown(hostname) {
    await this.triggerAlert(
      ALERT_TYPES.ULTRAVIEWER_DOWN,
      ALERT_SEVERITY.HIGH,
      { hostname },
      `UltraViewer is not running on ${hostname}`
    );
  }

  async alertUltraViewerUp(hostname) {
    await this.triggerAlert(
      ALERT_TYPES.ULTRAVIEWER_UP,
      ALERT_SEVERITY.LOW,
      { hostname },
      `UltraViewer is now running on ${hostname}`
    );
  }

  async alertNetworkDown(hostname) {
    await this.triggerAlert(
      ALERT_TYPES.NETWORK_DOWN,
      ALERT_SEVERITY.CRITICAL,
      { hostname },
      `Network connectivity lost on ${hostname}`
    );
  }

  async alertNetworkUp(hostname) {
    await this.triggerAlert(
      ALERT_TYPES.NETWORK_UP,
      ALERT_SEVERITY.LOW,
      { hostname },
      `Network connectivity restored on ${hostname}`
    );
  }

  async alertSpeedThreshold(hostname, metric, value, threshold) {
    await this.triggerAlert(
      ALERT_TYPES.SPEED_THRESHOLD_BREACH,
      ALERT_SEVERITY.MEDIUM,
      { hostname, metric, value, threshold },
      `${hostname}: ${metric} ${value}Mbps below threshold ${threshold}Mbps`
    );
  }

  async alertPingThreshold(hostname, ping, threshold) {
    await this.triggerAlert(
      ALERT_TYPES.PING_THRESHOLD_BREACH,
      ALERT_SEVERITY.MEDIUM,
      { hostname, ping, threshold },
      `${hostname}: Ping ${ping}ms exceeds threshold ${threshold}ms`
    );
  }

  async alertWorkstationOffline(hostname, lastSeen) {
    await this.triggerAlert(
      ALERT_TYPES.WORKSTATION_OFFLINE,
      ALERT_SEVERITY.HIGH,
      { hostname, lastSeen },
      `Workstation ${hostname} has been offline since ${lastSeen}`
    );
  }
}

export const alertManager = new AlertManager();
