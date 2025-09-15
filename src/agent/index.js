import "dotenv/config";
import settings from "../config/settings.js";
import { supabase } from "../db/supabase.js";
import { checkUltraViewer } from "./checkProcess.js";
import { checkNetwork } from "./checkNetwork.js";
import { checkSpeed } from "./checkSpeed.js";
import { getHostInfo, logInfo, logError } from "./utils.js";

const { desktopName, os } = getHostInfo();

let cycle = 0;
// Store last known speed test values to persist between cycles
let lastSpeedTest = { download: null, upload: null, ping: null };
let lastSpeedTestTime = null;

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
