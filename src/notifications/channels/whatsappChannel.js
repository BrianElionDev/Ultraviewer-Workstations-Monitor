import { configDotenv } from "dotenv";
import { WhatsAppGroupMessenger } from "./whatsappGroupMessenger.js";

configDotenv();

export class WhatsAppChannel {
  constructor() {
    this.apiUrl = process.env.WHAPI_CLOUD_API_URL;
    this.apiKey = process.env.WHAPI_CLOUD_API_KEY;
    this.channel = process.env.WHAPI_CLOUD_API_CHANNEL;
    this.groupMessenger = new WhatsAppGroupMessenger(
      this.apiUrl,
      this.apiKey,
      this.channel
    );
  }

  async send(alert) {
    if (!this.isConfigured()) {
      console.warn("WhatsApp channel not configured - skipping message");
      return;
    }

    const message = this.formatMessage(alert);
    return await this.groupMessenger.sendGroupMessage(message);
  }

  isConfigured() {
    return this.groupMessenger.isConfigured();
  }

  formatMessage(alert) {
    const timestamp = new Date(alert.timestamp).toISOString();
    const friendlyType = this.getFriendlyType(alert.type);
    const emoji = this.getSeverityEmoji(alert.severity);

    let message = `${emoji} *${friendlyType}*\n`;
    message += `Host: ${alert.hostname}\n`;
    message += `Severity: ${alert.severity.toUpperCase()}\n`;
    message += `Message: ${alert.message}\n`;
    message += `Time: ${timestamp}`;

    if (alert.data && Object.keys(alert.data).length > 1) {
      message += `\nData: ${JSON.stringify(alert.data, null, 2)}`;
    }

    return message;
  }

  getSeverityEmoji(severity) {
    const emojis = {
      low: "🟢",
      medium: "🟡",
      high: "🟠",
      critical: "🔴",
    };
    return emojis[severity] || "⚪";
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
