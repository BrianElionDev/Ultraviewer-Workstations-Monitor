import "dotenv/config";
import settings from "../config/settings.js";
import { supabase } from "../db/supabase.js";
import { checkUltraViewer } from "./checkProcess.js";
import { checkNetwork } from "./checkNetwork.js";
import { checkSpeed } from "./checkSpeed.js";
import { getHostInfo, logInfo, logError } from "./utils.js";
import { alertManager } from "../notifications/index.js";

const { desktopName, os } = getHostInfo();

let cycle = 0;
// Store last known speed test values to persist between cycles
let lastSpeedTest = { download: null, upload: null, ping: null };
let lastSpeedTestTime = null;

// Track previous state for alerting
let previousState = {
  ultraviewer: null,
  network: null,
  speed: { download: null, upload: null, ping: null },
};

async function oneCycle() {
  cycle++;

  // 1) Process + basic network
  const [uvRunning, net] = await Promise.all([
    checkUltraViewer(),
    checkNetwork("8.8.8.8"),
  ]);

  // 2) Speed test occasionally (heavier)
  let spd = { ...lastSpeedTest }; // Start with last known values
  if (cycle === 1 || cycle % settings.speedTestEveryNCycles === 0) {
    console.log(`Running speed test on cycle ${cycle}...`);
    const newSpeedTest = await checkSpeed();
    console.log(`Speed test completed:`, newSpeedTest);

    // Update last known values only if we got new data
    if (
      newSpeedTest.download !== null ||
      newSpeedTest.upload !== null ||
      newSpeedTest.ping !== null
    ) {
      lastSpeedTest = { ...newSpeedTest };
      lastSpeedTestTime = new Date().toISOString();
      spd = { ...newSpeedTest };
    }
  }

  // Prefer ping from speed test if available, fallback to network ping
  // spd.ping = ping from speed test, net.time = ping to 8.8.8.8
  const pingMs = spd.ping ?? net.time;

  // Check for state changes and trigger alerts
  await checkAndTriggerAlerts(uvRunning, net.alive, spd, pingMs);

  const payload = {
    hostname: desktopName,
    os,
    updated_at: new Date().toISOString(),
    is_ultraviewer_on: uvRunning,
    is_online: net.alive,
    ping_ms: pingMs ?? null,
    download_mbps: spd.download ?? null,
    upload_mbps: spd.upload ?? null,
    speed_test_at: lastSpeedTestTime,
  };

  // 🔑 Upsert instead of insert
  const { error } = await supabase
    .from("workstations")
    .upsert(payload, { onConflict: ["hostname"] });

  if (error) {
    logError(`[Supabase upsert error] ${error.message}`);
  } else {
    logInfo(
      `[${new Date().toLocaleTimeString()}] Updated: ` +
        JSON.stringify({
          hostname: desktopName,
          is_ultraviewer_on: uvRunning,
          is_online: net.alive,
          ping_ms: pingMs ?? null,
          download_mbps: spd.download ?? null,
          upload_mbps: spd.upload ?? null,
          speed_test_at: lastSpeedTestTime
            ? new Date(lastSpeedTestTime).toLocaleTimeString()
            : null,
        })
    );
  }

  // Update previous state for next cycle
  previousState = {
    ultraviewer: uvRunning,
    network: net.alive,
    speed: { ...spd },
  };
}

async function checkAndTriggerAlerts(
  uvRunning,
  networkAlive,
  speedData,
  pingMs
) {
  // UltraViewer status alerts
  if (previousState.ultraviewer === null) {
    // Initial status on startup (configurable)
    if (settings.alerts.startupStatus) {
      if (uvRunning) {
        await alertManager.alertUltraViewerUp(desktopName);
      } else {
        await alertManager.alertUltraViewerDown(desktopName);
      }
    }
  } else {
    // State change
    if (!previousState.ultraviewer && uvRunning) {
      await alertManager.alertUltraViewerUp(desktopName);
    }
    // Periodic reminder while down (rate-limited by cooldown)
    if (settings.alerts.reminders && !uvRunning) {
      await alertManager.alertUltraViewerDown(desktopName);
    }
  }

  // Network status alerts
  if (previousState.network === null) {
    // Initial status on startup (configurable)
    if (settings.alerts.startupStatus) {
      if (!networkAlive) {
        await alertManager.alertNetworkDown(desktopName);
      }
      // Don't send "restored" on startup - only on actual state changes
    }
  } else {
    // State change
    if (!previousState.network && networkAlive) {
      await alertManager.alertNetworkUp(desktopName);
    }
    // Periodic reminder while down (rate-limited by cooldown)
    if (settings.alerts.reminders && !networkAlive) {
      await alertManager.alertNetworkDown(desktopName);
    }
  }

  // Speed threshold checks (only when we have new speed data)
  if (
    speedData.download !== null &&
    speedData.download < settings.thresholds.minDownloadMbps
  ) {
    await alertManager.alertSpeedThreshold(
      desktopName,
      "download",
      speedData.download,
      settings.thresholds.minDownloadMbps
    );
  }

  if (
    settings.uploadCheckEnabled &&
    speedData.upload !== null &&
    speedData.upload < settings.thresholds.minUploadMbps
  ) {
    await alertManager.alertSpeedThreshold(
      desktopName,
      "upload",
      speedData.upload,
      settings.thresholds.minUploadMbps
    );
  }

  // Ping threshold check
  if (pingMs !== null && pingMs > settings.thresholds.maxPingMs) {
    await alertManager.alertPingThreshold(
      desktopName,
      pingMs,
      settings.thresholds.maxPingMs
    );
  }

  // Sustained slow-network warning (severity-based policy)
  if (
    speedData.download !== null &&
    speedData.download < settings.alerts.slowNetWarningMbps
  ) {
    // piggyback on speed threshold alert message/severity
    await alertManager.triggerAlert(
      "SUSTAINED_SLOW_NETWORK",
      "medium",
      { hostname: desktopName, download: speedData.download },
      `${desktopName}: Internet speed low (${speedData.download} Mbps)`
    );
  }
}

(async function start() {
  logInfo(
    `Agent started on ${desktopName} (${os}). Interval: ${
      settings.checkIntervalMs / 1000
    }s`
  );
  await oneCycle();
  setInterval(oneCycle, settings.checkIntervalMs);
})();
