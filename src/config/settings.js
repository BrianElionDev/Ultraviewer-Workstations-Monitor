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

  //dashboard
  dashboard: {
    refreshMs: 10_000, //10 seconds
    recentLimit: 200, //rows to fetch from db
  },
};
