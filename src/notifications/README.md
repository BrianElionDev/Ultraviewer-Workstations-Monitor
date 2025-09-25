# Alert Module

The alert module provides comprehensive alerting capabilities for the UltraViewer monitoring system.

## Structure

```
src/notifications/
├── index.js              # Main entry point, initializes channels
├── alertManager.js       # Core alert management logic
├── alertTypes.js         # Alert type definitions and constants
├── channels/             # Alert delivery channels
│   ├── consoleChannel.js # Console output alerts
│   ├── logChannel.js     # Log file alerts
│   ├── webhookChannel.js # HTTP webhook alerts
│   └── emailChannel.js   # Email alerts
└── README.md            # This file
```

## Alert Types

- `ULTRAVIEWER_DOWN` - UltraViewer process stopped
- `ULTRAVIEWER_UP` - UltraViewer process started
- `NETWORK_DOWN` - Network connectivity lost
- `NETWORK_UP` - Network connectivity restored
- `SPEED_THRESHOLD_BREACH` - Speed below configured threshold
- `PING_THRESHOLD_BREACH` - Ping exceeds configured threshold
- `WORKSTATION_OFFLINE` - Workstation hasn't reported in

## Alert Severities

- `LOW` - Informational (UltraViewer up, network restored)
- `MEDIUM` - Performance issues (speed/ping thresholds)
- `HIGH` - Service issues (UltraViewer down)
- `CRITICAL` - System issues (network down)

## Configuration

### Environment Variables

```bash
# Enable/disable alerts
ALERTS_ENABLED=true

# Alert cooldown (milliseconds)
ALERT_COOLDOWN_MS=300000

# Channel toggles
ALERT_CONSOLE=true
ALERT_LOG=true
ALERT_WEBHOOK=false
ALERT_EMAIL=false

# Webhook configuration
WEBHOOK_URL=https://hooks.slack.com/services/...
WEBHOOK_TIMEOUT=5000
WEBHOOK_RETRIES=3

# Email configuration
EMAIL_RECIPIENTS=admin@company.com,ops@company.com
EMAIL_FROM=noreply@company.com
EMAIL_SERVICE_URL=https://api.emailservice.com/send
```

### Settings Integration

The alert system integrates with the main settings configuration:

```javascript
// src/config/settings.js
alerts: {
  cooldownMs: 5 * 60 * 1000, // 5 minutes
  channels: {
    console: true,
    log: true,
    webhook: false,
    email: false
  }
}
```

## Usage

```javascript
import { alertManager } from "./notifications/index.js";

// Trigger a custom alert
await alertManager.triggerAlert(
  "CUSTOM_ALERT",
  "HIGH",
  { hostname: "workstation-01" },
  "Custom alert message"
);

// Use convenience methods
await alertManager.alertUltraViewerDown("workstation-01");
await alertManager.alertNetworkDown("workstation-01");
await alertManager.alertSpeedThreshold("workstation-01", "download", 15, 25);
```

## Alert Cooldown

Alerts have a cooldown period to prevent spam. The same alert type for the same hostname won't be sent again until the cooldown period expires.

## Channel Failures

If a channel fails to send an alert, it's logged as an error but doesn't prevent other channels from attempting to send the alert.

## Extending the System

### Adding New Alert Types

1. Add the new type to `alertTypes.js`
2. Add a convenience method to `alertManager.js` if needed
3. Update the monitoring logic to trigger the new alert

### Adding New Channels

1. Create a new channel class in `channels/`
2. Implement the `send(alert)` method
3. Register the channel in `index.js`
4. Add configuration options to settings

### Example Custom Channel

```javascript
export class SlackChannel {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  async send(alert) {
    const payload = {
      text: `🚨 ${alert.message}`,
      attachments: [
        {
          color: this.getColor(alert.severity),
          fields: [
            { title: "Type", value: alert.type, short: true },
            { title: "Hostname", value: alert.hostname, short: true },
            { title: "Severity", value: alert.severity, short: true },
          ],
        },
      ],
    };

    await fetch(this.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  getColor(severity) {
    const colors = {
      low: "good",
      medium: "warning",
      high: "danger",
      critical: "danger",
    };
    return colors[severity] || "good";
  }
}
```
