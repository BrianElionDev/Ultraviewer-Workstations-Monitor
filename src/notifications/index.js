import { alertManager } from "./alertManager.js";
import { ConsoleChannel } from "./channels/consoleChannel.js";
import { LogChannel } from "./channels/logChannel.js";
import settings from "../config/settings.js";

// Initialize channels based on settings
if (settings.alerts.channels.console) {
  alertManager.registerChannel("console", new ConsoleChannel());
}

if (settings.alerts.channels.log) {
  alertManager.registerChannel("log", new LogChannel());
}

export { alertManager };
export * from "./alertTypes.js";
