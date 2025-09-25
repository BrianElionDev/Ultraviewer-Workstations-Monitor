import { ALERT_SEVERITY } from "../alertTypes.js";

export class ConsoleChannel {
  async send(alert) {
    const timestamp = new Date(alert.timestamp).toISOString();
    const severityColor = this.getSeverityColor(alert.severity);
    const friendlyType = this.getFriendlyType(alert.type);

    console.log(`\n🚨 ALERT [${timestamp}]`);
    console.log(`Event: ${friendlyType}`);
    console.log(
      `Severity: ${severityColor}${alert.severity.toUpperCase()}\x1b[0m`
    );
    console.log(`Host: ${alert.hostname}`);
    console.log(`Message: ${alert.message}`);

    if (alert.data && Object.keys(alert.data).length > 1) {
      console.log(`Data:`, alert.data);
    }
    console.log("─".repeat(50));
  }

  getSeverityColor(severity) {
    const colors = {
      [ALERT_SEVERITY.LOW]: "\x1b[32m", // Green
      [ALERT_SEVERITY.MEDIUM]: "\x1b[33m", // Yellow
      [ALERT_SEVERITY.HIGH]: "\x1b[35m", // Magenta
      [ALERT_SEVERITY.CRITICAL]: "\x1b[31m", // Red
    };
    return colors[severity] || "\x1b[37m"; // White default
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
