import { logInfo, logError } from "../../agent/utils.js";

export class LogChannel {
  async send(alert) {
    const timestamp = new Date(alert.timestamp).toISOString();
    const friendlyType = this.getFriendlyType(alert.type);
    const logMessage = `ALERT [${friendlyType}] [${alert.severity}] ${alert.hostname}: ${alert.message} ${timestamp}`;

    if (alert.severity === "critical" || alert.severity === "high") {
      logError(logMessage);
    } else {
      logInfo(logMessage);
    }
  }

  getFriendlyType(type) {
    const map = {
      ultraviewer_down: "UltraViewer stopped",
      ultraviewer_up: "UltraViewer started",
      network_down: "Network down",
      network_up: "Network restored",
      speed_threshold_breach: "Internet speed below threshold",
      ping_threshold_breach: "High latency (ping over threshold)",
      workstation_offline: "Workstation offline",
    };
    return map[type] || type;
  }
}
