import { alertManager } from "./alertManager.js";
import { ConsoleChannel } from "./channels/consoleChannel.js";
import { LogChannel } from "./channels/logChannel.js";
import { WebhookChannel } from "./channels/webhookChannel.js";
import { EmailChannel } from "./channels/emailChannel.js";
import settings from "../config/settings.js";

// Initialize channels based on settings
if (settings.alerts.channels.console) {
  alertManager.registerChannel("console", new ConsoleChannel());
}

if (settings.alerts.channels.log) {
  alertManager.registerChannel("log", new LogChannel());
}

// Register webhook if configured
if (settings.alerts.channels.webhook && process.env.WEBHOOK_URL) {
  const webhookOptions = {
    timeout: Number(process.env.WEBHOOK_TIMEOUT) || 5000,
    retries: Number(process.env.WEBHOOK_RETRIES) || 3,
  };
  alertManager.registerChannel(
    "webhook",
    new WebhookChannel(process.env.WEBHOOK_URL, webhookOptions)
  );
}

// Register email if configured
if (settings.alerts.channels.email && process.env.EMAIL_RECIPIENTS) {
  const emailConfig = {
    from: process.env.EMAIL_FROM || "noreply@ultraviewer-monitor.com",
    recipients: process.env.EMAIL_RECIPIENTS.split(",").map((email) =>
      email.trim()
    ),
  };
  alertManager.registerChannel("email", new EmailChannel(emailConfig));
}

export { alertManager };
export * from "./alertTypes.js";
