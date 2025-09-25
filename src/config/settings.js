export default {
  checkIntervalMs: 2 * 60 * 1000, // 2 minutes (optimized for team monitoring)
  speedTestEveryNCycles: 5, // 5 cycles = 10 minutes (reduced frequency)

  //thresholds (fallbacks;env overrides)
  thresholds: {
    minDownloadMbps: Number(process.env.MIN_DOWNLOAD_MBPS) || 25,
    minUploadMbps: Number(process.env.MIN_UPLOAD_MBPS) || 10,
    maxPingMs: Number(process.env.MAX_PING_MS) || 150,
  },
  //notification settings
  alertsEnabled:
    String(process.env.ALERTS_ENABLED || "false").toLowerCase() === "true",

  // metric checks
  uploadCheckEnabled:
    String(process.env.UPLOAD_CHECK_ENABLED || "false").toLowerCase() ===
    "true",

  // alerts config used by notification system
  alerts: {
    cooldownMs: Number(process.env.ALERT_COOLDOWN_MS) || 5 * 60 * 1000,
    startupStatus:
      String(process.env.ALERT_STARTUP_STATUS || "true").toLowerCase() ===
      "true",
    reminders:
      String(process.env.ALERT_REMINDERS || "true").toLowerCase() === "true",
    slowNetWarningMbps: Number(process.env.SLOW_NET_WARNING_MBPS) || 2,
    slowNetPersistMs: Number(process.env.SLOW_NET_PERSIST_MS) || 10 * 60 * 1000,
    channels: {
      console:
        String(process.env.ALERT_CONSOLE || "true").toLowerCase() === "true",
      log: String(process.env.ALERT_LOG || "true").toLowerCase() === "true",
      webhook:
        String(process.env.ALERT_WEBHOOK || "false").toLowerCase() === "true",
      email:
        String(process.env.ALERT_EMAIL || "false").toLowerCase() === "true",
    },
  },

  //dashboard
  dashboard: {
    refreshMs: 10_000, //10 seconds
    recentLimit: 200, //rows to fetch from db
  },
};
