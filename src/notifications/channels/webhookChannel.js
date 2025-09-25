import { logError } from "../../agent/utils.js";

export class WebhookChannel {
  constructor(webhookUrl, options = {}) {
    this.webhookUrl = webhookUrl;
    this.timeout = options.timeout || 5000;
    this.retries = options.retries || 3;
  }

  async send(alert) {
    if (!this.webhookUrl) {
      throw new Error("Webhook URL not configured");
    }

    const payload = {
      timestamp: new Date(alert.timestamp).toISOString(),
      type: alert.type,
      severity: alert.severity,
      hostname: alert.hostname,
      message: alert.message,
      data: alert.data,
    };

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(this.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "UltraViewer-Monitor/1.0",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return;
      } catch (error) {
        if (attempt === this.retries) {
          logError(
            `Webhook failed after ${this.retries} attempts: ${error.message}`
          );
          throw error;
        }

        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }
}
