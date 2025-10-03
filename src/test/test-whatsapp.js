import { configDotenv } from "dotenv";
import { alertManager } from "../notifications/index.js";
import { ALERT_TYPES, ALERT_SEVERITY } from "../notifications/alertTypes.js";
import { WhatsAppChannel } from "../notifications/channels/whatsappChannel.js";

configDotenv();

async function testWhatsAppAlert() {
  console.log("Testing WhatsApp alert...");
  const whatsappChannel = new WhatsAppChannel();

  if (!whatsappChannel.isConfigured()) {
    console.warn(
      "⚠️ WhatsApp channel not configured. Please set WHAPI_CLOUD_API_URL, WHAPI_CLOUD_API_KEY, and WHAPI_CLOUD_API_CHANNEL environment variables."
    );
    return;
  }

  // Test different alert types
  const testAlerts = [
    {
      type: ALERT_TYPES.ULTRAVIEWER_DOWN,
      severity: ALERT_SEVERITY.HIGH,
      data: { hostname: "test-workstation-01" },
      message: "UltraViewer is not running on test-workstation-01",
    },
    {
      type: ALERT_TYPES.NETWORK_DOWN,
      severity: ALERT_SEVERITY.CRITICAL,
      data: { hostname: "test-workstation-02" },
      message: "Network connectivity lost on test-workstation-02",
    },
    {
      type: ALERT_TYPES.SPEED_THRESHOLD_BREACH,
      severity: ALERT_SEVERITY.MEDIUM,
      data: {
        hostname: "test-workstation-03",
        metric: "download",
        value: 15,
        threshold: 25,
      },
      message: "test-workstation-03: download 15Mbps below threshold 25Mbps",
    },
  ];

  for (const alert of testAlerts) {
    console.log(`\nSending test alert: ${alert.type}`);
    try {
      await alertManager.triggerAlert(
        alert.type,
        alert.severity,
        alert.data,
        alert.message
      );

      alert.timestamp = Date.now();
      alert.hostname = alert.data.hostname;
      await whatsappChannel.send(alert);
      console.log("✅ Alert sent successfully");
    } catch (error) {
      console.error("❌ Failed to send alert:", error.message);
    }

    // Wait 2 seconds between alerts
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("\nTest completed!");
}

// Run the test
testWhatsAppAlert().catch(console.error);
